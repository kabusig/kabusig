// LINEログインコールバック: code→トークン→プロフィール取得→line_user_id 保存
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // 認可時と同じredirect_uriが必要。同じくホスト名から組み立てる
  const host = request.headers.get("host") || "kabusig.com";
  const isLocal = /localhost|127\.0\.0\.1/.test(host);
  const origin = `${isLocal ? "http" : "https"}://${host}`;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("line_state")?.value;

  // どのパスで終わっても state Cookie を破棄する(再利用防止)
  const done = (path: string) => {
    const r = NextResponse.redirect(`${origin}${path}`);
    r.cookies.delete("line_state");
    return r;
  };

  if (!code || !state || state !== savedState) {
    return done("/account?line=error");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return done("/login");

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
    return done("/account?line=error");
  }
  const { access_token } = await tokenRes.json();

  // LINEユーザーID取得
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!profileRes.ok) {
    return done("/account?line=error");
  }
  const { userId: lineUserId } = await profileRes.json();
  // 200 でも userId が取れない場合(仕様変更・スコープ不足等)は失敗として扱う
  if (!lineUserId) {
    return done("/account?line=error");
  }

  const admin = createAdminClient();
  const { error: linkErr } = await admin
    .from("profiles")
    .update({ line_user_id: lineUserId })
    .eq("id", user.id);
  // 他アカウントで連携済み(line_user_id の unique 制約違反)等は失敗として扱う
  if (linkErr) {
    return done("/account?line=error");
  }

  return done("/account?line=linked");
}
