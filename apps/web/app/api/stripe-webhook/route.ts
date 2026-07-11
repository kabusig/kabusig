// Stripe Webhook: 課金状態を profiles.plan に反映
// 対象イベント: checkout.session.completed / customer.subscription.updated / deleted
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id;
      if (userId) {
        await admin
          .from("profiles")
          .update({
            plan: "paid",
            stripe_customer_id: String(session.customer ?? ""),
            stripe_subscription_id: String(session.subscription ?? ""),
          })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const userId = sub.metadata?.user_id;
      if (userId) {
        const active = sub.status === "active" || sub.status === "trialing";
        await admin
          .from("profiles")
          .update({ plan: active ? "paid" : "free" })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const userId = sub.metadata?.user_id;
      if (userId) {
        await admin.from("profiles").update({ plan: "free" }).eq("id", userId);
      }
      break;
    }
  }
  return NextResponse.json({ received: true });
}
