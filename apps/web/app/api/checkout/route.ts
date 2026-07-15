// Stripe Checkout セッション作成(サブスクリプション)
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID_MONTHLY) {
    return NextResponse.redirect(
      `${origin}/subscribe?error=stripe_not_configured`, 303);
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, 303);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        { price: process.env.STRIPE_PRICE_ID_MONTHLY, quantity: 1 },
      ],
      customer: profile?.stripe_customer_id || undefined,
      customer_email: profile?.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${origin}/account?subscribed=1`,
      cancel_url: `${origin}/subscribe`,
      locale: "ja",
    });
    return NextResponse.redirect(session.url!, 303);
  } catch (e) {
    // 500 の白画面ではなく、原因を確認画面に表示する
    const msg = e instanceof Error ? e.message : "決済の開始に失敗しました";
    console.error("[checkout] stripe error:", msg, e);
    return NextResponse.redirect(
      `${origin}/subscribe?error=${encodeURIComponent(msg)}`,
      303
    );
  }
}
