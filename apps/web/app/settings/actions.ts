"use server";

import { createClient } from "@/lib/supabase/server";

export type SignalMode = "off" | "watch" | "all";

// シグナルの通知範囲を保存(ページ全体の再描画はしない=即応)
// off=通知しない / watch=監視銘柄のみ / all=全銘柄
export async function setSignalMode(signalType: string, mode: SignalMode) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !signalType) return;
  await supabase.from("notification_settings").upsert({
    user_id: user.id,
    signal_type: signalType,
    enabled: mode !== "off",
    all_stocks: mode === "all",
  });
}
