// POST /api/customer/approve
// Body: { token }
//
// Customer self-service approval. Flips onboarding stage to 'approved',
// stamps customer_approved + customer_approved_at, fires a Telegram ping
// to the operator. Idempotent — re-calling on an already-approved row is
// a 200 no-op.
//
// Reaches across the state machine: a customer can approve from any of
// domain_registered / site_deployed / awaiting_approval. We skip the
// intermediate stages because the customer IS the approver — there's no
// human admin review step in this product.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Stages a customer can transition out of via Approve. After approval,
// the 30-day cron picks up the row and progresses it to closed_won.
const APPROVABLE_FROM = new Set([
  "domain_registered",
  "site_deployed",
  "awaiting_approval",
]);

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = (await req.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  const sb = supabase();

  const { data: lead } = await sb
    .from("leads")
    .select("id, name, city, tier")
    .eq("customer_admin_token", token)
    .maybeSingle<{ id: string; name: string; city: string; tier: string | null }>();
  if (!lead) return NextResponse.json({ error: "invalid link" }, { status: 404 });

  const { data: onboarding } = await sb
    .from("onboarding_state")
    .select("id, stage, customer_approved, domain_registered, thirty_day_deadline")
    .eq("lead_id", lead.id)
    .maybeSingle<{
      id: string;
      stage: string;
      customer_approved: boolean;
      domain_registered: string | null;
      thirty_day_deadline: string | null;
    }>();
  if (!onboarding) {
    return NextResponse.json({ error: "no onboarding state" }, { status: 400 });
  }

  // Idempotent: already approved → just echo current state.
  if (onboarding.customer_approved || onboarding.stage === "approved") {
    return NextResponse.json({
      ok: true,
      stage: "approved",
      alreadyApproved: true,
      thirtyDayDeadline: onboarding.thirty_day_deadline,
    });
  }

  if (!APPROVABLE_FROM.has(onboarding.stage)) {
    return NextResponse.json(
      {
        error: `Cannot approve from stage '${onboarding.stage}'. Enter your domain first or contact support.`,
      },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await sb
    .from("onboarding_state")
    .update({
      stage: "approved",
      customer_approved: true,
      customer_approved_at: now,
      site_deployed_at: now,
    })
    .eq("id", onboarding.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Fire-and-forget Telegram notification so Aljaz sees approvals in real time.
  const tierLabel = lead.tier === "premium" ? "Premium" : "Starter";
  const domain = onboarding.domain_registered ?? "(no domain registered yet)";
  void notifyTelegram(
    `Customer APPROVED their site\n${lead.name} (${lead.city}) · ${tierLabel}\nDomain: ${domain}\n\n30-day window ends: ${onboarding.thirty_day_deadline ?? "n/a"}`,
  );

  return NextResponse.json({
    ok: true,
    stage: "approved",
    alreadyApproved: false,
    thirtyDayDeadline: onboarding.thirty_day_deadline,
  });
}
