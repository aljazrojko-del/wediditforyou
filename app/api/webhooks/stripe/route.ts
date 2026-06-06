// POST /api/webhooks/stripe — Stripe sends payment events here.
//
// Handles:
//   checkout.session.completed       → insert payment row + onboarding_state + tag lead
//   payment_intent.succeeded         → mark payment as succeeded (idempotent)
//   charge.refunded                  → mark payment refunded + bump onboarding stage
//
// Setup:
//   1. In Stripe dashboard → Webhooks → Add endpoint
//      URL: https://wedidit4you.com/api/webhooks/stripe
//      Events: checkout.session.completed, payment_intent.succeeded, charge.refunded
//   2. Copy the signing secret and set STRIPE_WEBHOOK_SECRET on Vercel
//   3. Set STRIPE_SECRET_KEY on Vercel (sk_live_... or sk_test_... for dev)
//
// IMPORTANT: This route MUST receive the raw request body for signature verification.
// Next.js route handlers give us that via `await req.text()` — do NOT call .json().

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import {
  getStripe,
  findLeadByPaymentContext,
  thirtyDayDeadline,
  packageFromAmount,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function handleCheckoutCompleted(
  event: Stripe.CheckoutSessionCompletedEvent,
): Promise<{ ok: boolean; notes?: string }> {
  const session = event.data.object;
  const supabase = getSupabase();

  const email =
    session.customer_details?.email ??
    session.customer_email ??
    null;
  const phone = session.customer_details?.phone ?? null;
  const customerName = session.customer_details?.name ?? null;
  const clientRef = session.client_reference_id ?? null;
  const amount = session.amount_total ?? null;
  const currency = (session.currency ?? "usd").toLowerCase();
  const pkg = packageFromAmount(amount);
  const isRecurring = session.mode === "subscription";

  const lead = await findLeadByPaymentContext(supabase, {
    clientReferenceId: clientRef,
    email,
    phone,
  });

  const paidAtIso = new Date().toISOString();

  // 1. Insert payment row (idempotent via unique stripe_session_id)
  const paymentInsert = await supabase
    .from("payments")
    .upsert(
      {
        lead_id: lead?.id ?? null,
        stripe_session_id: session.id,
        stripe_payment_intent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        stripe_customer_id:
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null,
        amount_total: amount,
        currency,
        status: "succeeded",
        package_type: pkg,
        is_recurring: isRecurring,
        customer_email: email,
        customer_name: customerName,
        paid_at: paidAtIso,
        raw: session as unknown as Record<string, unknown>,
      },
      { onConflict: "stripe_session_id" },
    )
    .select("id")
    .maybeSingle<{ id: string }>();

  if (paymentInsert.error) {
    return { ok: false, notes: `payment upsert: ${paymentInsert.error.message}` };
  }
  const paymentId = paymentInsert.data?.id ?? null;

  // 2. If we matched a lead, mark them paid + tier and start onboarding
  if (lead?.id) {
    const tier = pkg === "premium" ? "premium" : pkg === "starter" ? "starter" : null;

    // Generate a one-time admin token if the lead doesn't already have one.
    // This token gates /my-site/{token} where the customer can request
    // self-serve content changes.
    const { data: existing } = await supabase
      .from("leads")
      .select("customer_admin_token")
      .eq("id", lead.id)
      .maybeSingle<{ customer_admin_token: string | null }>();

    const adminToken = existing?.customer_admin_token ?? randomUUID();

    await supabase
      .from("leads")
      .update({
        tier,
        payment_status: "paid",
        paid_at: paidAtIso,
        customer_admin_token: adminToken,
      })
      .eq("id", lead.id);

    // Idempotent: one onboarding row per lead. Upsert by lead_id.
    await supabase.from("onboarding_state").upsert(
      {
        lead_id: lead.id,
        payment_id: paymentId,
        stage: "awaiting_domain",
        thirty_day_deadline: thirtyDayDeadline(paidAtIso),
      },
      { onConflict: "lead_id" },
    );
  }

  return { ok: true, notes: lead ? `matched lead ${lead.slug ?? lead.id}` : "no lead match" };
}

async function handlePaymentIntentSucceeded(
  event: Stripe.PaymentIntentSucceededEvent,
): Promise<{ ok: boolean; notes?: string }> {
  const supabase = getSupabase();
  const pi = event.data.object;
  // Best-effort flip to succeeded; many sessions already do this via checkout.session.completed.
  const { error } = await supabase
    .from("payments")
    .update({ status: "succeeded" })
    .eq("stripe_payment_intent", pi.id);
  if (error) return { ok: false, notes: error.message };
  return { ok: true };
}

async function handleChargeRefunded(
  event: Stripe.ChargeRefundedEvent,
): Promise<{ ok: boolean; notes?: string }> {
  const supabase = getSupabase();
  const charge = event.data.object;
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi) return { ok: true, notes: "no payment_intent on charge" };

  const refundedAtIso = new Date().toISOString();
  const isPartial = (charge.amount_refunded ?? 0) < (charge.amount ?? 0);

  // Lookup the payment + linked lead before flipping it.
  const { data: pmt } = await supabase
    .from("payments")
    .select("id, lead_id")
    .eq("stripe_payment_intent", pi)
    .maybeSingle<{ id: string; lead_id: string | null }>();

  await supabase
    .from("payments")
    .update({
      status: isPartial ? "partially_refunded" : "refunded",
      refunded_at: refundedAtIso,
    })
    .eq("stripe_payment_intent", pi);

  if (pmt?.lead_id) {
    await supabase
      .from("leads")
      .update({ payment_status: "refunded" })
      .eq("id", pmt.lead_id);

    await supabase
      .from("onboarding_state")
      .update({
        stage: "refunded",
        refund_completed_at: refundedAtIso,
      })
      .eq("lead_id", pmt.lead_id);
  }

  return { ok: true };
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set");
    return new Response("misconfigured", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const raw = await req.text();

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    console.error("[stripe-webhook] signature verification failed:", (e as Error).message);
    return new Response("bad signature", { status: 400 });
  }

  console.log("[stripe-webhook]", event.type, event.id);

  try {
    let result: { ok: boolean; notes?: string } = { ok: true };
    switch (event.type) {
      case "checkout.session.completed":
        result = await handleCheckoutCompleted(event);
        break;
      case "payment_intent.succeeded":
        result = await handlePaymentIntentSucceeded(event);
        break;
      case "charge.refunded":
        result = await handleChargeRefunded(event);
        break;
      default:
        // Unhandled events return 200 so Stripe stops retrying.
        result = { ok: true, notes: `unhandled event type: ${event.type}` };
    }
    return Response.json({ received: true, ...result });
  } catch (e) {
    console.error("[stripe-webhook] handler crashed:", (e as Error).message);
    // Return 500 so Stripe retries with exponential backoff.
    return new Response((e as Error).message, { status: 500 });
  }
}
