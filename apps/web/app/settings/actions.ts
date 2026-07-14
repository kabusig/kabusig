"use server";

import { createClient } from "@/lib/supabase/server";

// 通知シグナルのON/OFFを保存(ページ全体の再描画はしない=即応)
export async function setSignalEnabled(signalType: string, enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !signalType) return;
  await supabase.from("notification_settings").upsert({
    user_id: user.id,
    signal_type: signalType,
    enabled,
  });
}
