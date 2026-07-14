// LINEログインコールバック: code→トークン→プロフィール取得→line_user_id 保存
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // 認可時と同じredirect_uriが必要。同じくホスト名から組み立てる
  const host = request.headers.get("host") || "kabusig.com";
  const origin = `${host.includes("localhost") ? "http" : "https"}://${host}`;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("line_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${origin}/account?line=error`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  // アクセストークン取得
  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/api/line/callback`,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/account?line=error`);
  }
  const { access_token } = await tokenRes.json();

  // LINEユーザーID取得
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!profileRes.ok) {
    return NextResponse.redirect(`${origin}/account?line=error`);
  }
  const { userId: lineUserId } = await profileRes.json();

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ line_user_id: lineUserId })
    .eq("id", user.id);

  const res = NextResponse.redirect(`${origin}/account?line=linked`);
  res.cookies.delete("line_state");
  return res;
}
