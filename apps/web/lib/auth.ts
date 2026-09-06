// 認証・会員状態のヘルパー。
// Supabase 未設定時は「開発モード」: ログイン済み有料会員として扱う
// (ローカル開発でも全ページが動くようにするため)。
import { createClient, supabaseConfigured } from "./supabase/server";

export type Viewer = {
  devMode: boolean;
  loggedIn: boolean;
  paid: boolean;
  paidUntil: string | null;
  userId: string | null;
  email: string | null;
  lineLinked: boolean;
};

export async function getViewer(): Promise<Viewer> {
  if (!supabaseConfigured()) {
    return {
      devMode: true,
      loggedIn: true,
      paid: true,
      paidUntil: null,
      userId: "dev-user",
      email: "dev@example.com",
      lineLinked: false,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      devMode: false,
      loggedIn: false,
      paid: false,
      paidUntil: null,
      userId: null,
      email: null,
      lineLinked: false,
    };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, line_user_id, paid_until")
    .eq("id", user.id)
    .single();
  const paidUntil = (profile?.paid_until as string | null) ?? null;
  // 年会費(期限あり)にも対応: plan=paid かつ 期限未設定 or 期限が今日以降なら有効
  const today = new Date().toISOString().slice(0, 10);
  const paid = profile?.plan === "paid" && (!paidUntil || paidUntil >= today);
  return {
    devMode: false,
    loggedIn: true,
    paid,
    paidUntil,
    userId: user.id,
    email: user.email ?? null,
    lineLinked: Boolean(profile?.line_user_id),
  };
}
