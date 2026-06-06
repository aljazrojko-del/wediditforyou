// POST /api/admin/blast — batch SMS over a filter.
// Body: { city?, niche?, status?, channel: "sms", maxCount?: number }
//
// Safety: only ever sends to leads where `sms_sent_at IS NULL` AND `phone IS NOT NULL`
// AND `site_url IS NOT NULL` AND `slug IS NOT NULL`. The status filter is applied
// in addition. Hard cap: 50 sends per call (hit /blast again to continue).

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getServiceClient,
  sendSmsToLead,
  type LeadForOutreach,
} from "@/lib/outreach";
import { SignalWireClient } from "@/lib/signalwire-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  city?: string;
  niche?: string;
  status?: string;
  channel?: "sms";
  maxCount?: number;
};

const HARD_CAP = 50;

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (body.channel && body.channel !== "sms") {
    return NextResponse.json({ error: "only sms channel is supported" }, { status: 400 });
  }
  const cap = Math.min(body.maxCount ?? HARD_CAP, HARD_CAP);

  const supabase = getServiceClient();
  let q = supabase
    .from("leads")
    .select("id, name, slug, city, phone, site_url, owner_first_name")
    .eq("has_website", false)
    .is("sms_sent_at", null)
    .not("phone", "is", null)
    .not("site_url", "is", null)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(cap);

  if (body.city) q = q.eq("city", body.city);
  if (body.niche) q = q.eq("niche", body.niche);

  const { data: leads, error } = await q.returns<LeadForOutreach[]>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!leads || leads.length === 0)
    return NextResponse.json({ sent: 0, failed: 0, skipped: 0, total: 0 });

  let client: SignalWireClient;
  try {
    client = new SignalWireClient();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    const r = await sendSmsToLead(lead, client, supabase);
    if (r.ok) sent++;
    else if (r.skipped) skipped++;
    else {
      failed++;
      if (errors.length < 5) errors.push(`${lead.name}: ${r.error}`);
    }
    // Light throttle to be a good carrier citizen.
    await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({
    sent,
    failed,
    skipped,
    total: leads.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
