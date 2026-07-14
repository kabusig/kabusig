// LINEログイン開始: 認可URLへリダイレクト(CSRF対策のstateをCookieに保存)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  // コールバックはLINEに登録した公開URLと完全一致させる必要があるため、
  // request.url由来のorigin(Vercel内部URLになることがある)ではなくAPP_URLを使う
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
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
