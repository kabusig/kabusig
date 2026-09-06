"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ANNUAL_FEE_YEN, BANK_TRANSFER_ENABLED } from "@/lib/constants";

// 年会費(銀行振込)の申込を記録。運営者が入金を名義で照合して確認する。
export async function applyBankTransfer(formData: FormData) {
  if (!BANK_TRANSFER_ENABLED) return;
  const transferName = String(formData.get("transfer_name") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!transferName) redirect("/subscribe?err=name");

  // 既に確認待ちの申込があれば重複作成しない
  const { data: existing } = await supabase
    .from("membership_orders")
    .select("id")
    .eq("user_id", user!.id)
    .eq("status", "pending")
    .limit(1);
  if (!existing || existing.length === 0) {
    await supabase.from("membership_orders").insert({
      user_id: user!.id,
      transfer_name: transferName,
      amount: ANNUAL_FEE_YEN,
      status: "pending",
    });
  }
  revalidatePath("/subscribe");
  redirect("/subscribe?applied=1");
}
