// LINEログイン開始: 認可URLへリダイレクト(CSRF対策のstateをCookieに保存)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  // コールバックはLINE登録の公開URLと完全一致が必要。実際のアクセス先ホスト名
  // (kabusig.com)から組み立てる(Vercel内部URLや環境変数のズレを避ける)
  const host = request.headers.get("host") || "kabusig.com";
  const base = `${host.includes("localhost") ? "http" : "https"}://${host}`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${base}/login`);

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
    redirect_uri: `${base}/api/line/callback`,
    state,
    scope: "profile openid",
  });
  const res = NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params}`
  );
  res.cookies.set("line_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
  });
  return res;
}
