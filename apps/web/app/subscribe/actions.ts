"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ANNUAL_FEE_YEN, BANK_TRANSFER_ENABLED } from "@/lib/constants";

// 紛らわしい文字(0/O,1/I,L)を除いた識別コード(6桁)
function genPayCode(): string {
  const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += a[Math.floor(Math.random() * a.length)];
  return c;
}

// 会員申込:
// - 初回は「1週間の即時お試し」を付与(1人1回のみ、trial_used で制御)
// - 2回目以降はお試しなし。入金確認後に運営者が有効化する。
// - 付与・trial_used 更新は service role で行う(利用者クライアントでは plan を変えられない)
export async function startMembership(formData: FormData) {
  if (!BANK_TRANSFER_ENABLED) return;
  const name = String(formData.get("transfer_name") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // 既に確認待ちの申込があれば重複作成しない
  const { data: pending } = await admin
    .from("membership_orders")
    .select("id")
    .eq("user_id", user!.id)
    .eq("status", "pending")
    .limit(1);
  if (pending && pending.length > 0) {
    redirect("/subscribe");
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("trial_used, line_user_id")
    .eq("id", user!.id)
    .single();
  const trialUsed = Boolean(profile?.trial_used);
  const lineLinked = Boolean(profile?.line_user_id);

  // pending 内で pay_code が一意になるよう、衝突(23505)時はコードを振り直して再試行
  let inserted = false;
  for (let i = 0; i < 6; i++) {
    const { error } = await admin.from("membership_orders").insert({
      user_id: user!.id,
      transfer_name: name || null,
      amount: ANNUAL_FEE_YEN,
      status: "pending",
      pay_code: genPayCode(),
    });
    if (!error) {
      inserted = true;
      break;
    }
    if (error.code !== "23505") break; // 一意制約違反以外は再試行しない
  }
  if (!inserted) redirect("/subscribe?err=retry");

  // 初回かつLINE連携済みのときだけ、その場で1週間有効にする(不正防止)
  if (!trialUsed && lineLinked) {
    const until = new Date(Date.now() + 7 * 86400000)
      .toISOString()
      .slice(0, 10);
    await admin
      .from("profiles")
      .update({ plan: "paid", paid_until: until, trial_used: true })
      .eq("id", user!.id);
  }

  revalidatePath("/subscribe");
  revalidatePath("/account");
  redirect("/subscribe?applied=1");
}
