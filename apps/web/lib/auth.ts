// 認証・会員状態のヘルパー。
// Supabase 未設定時は「開発モード」: ログイン済み有料会員として扱う
// (ローカル開発でも全ページが動くようにするため)。
import { createClient, supabaseConfigured } from "./supabase/server";

export type Viewer = {
  devMode: boolean;
  loggedIn: boolean;
  paid: boolean;
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
      userId: null,
      email: null,
      lineLinked: false,
    };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, line_user_id")
    .eq("id", user.id)
    .single();
  return {
    devMode: false,
    loggedIn: true,
    paid: profile?.plan === "paid",
    userId: user.id,
    email: user.email ?? null,
    lineLinked: Boolean(profile?.line_user_id),
  };
}
