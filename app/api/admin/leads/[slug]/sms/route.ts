// POST /api/admin/leads/[slug]/sms — fire one personalized cold SMS via SignalWire.

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
export const maxDuration = 30;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { slug } = await ctx.params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("leads")
    .select("id, name, slug, city, phone, site_url, owner_first_name")
    .eq("slug", slug)
    .maybeSingle<LeadForOutreach>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "lead not found" }, { status: 404 });

  let client: SignalWireClient;
  try {
    client = new SignalWireClient();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const result = await sendSmsToLead(data, client, supabase);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? result.skipped ?? "send failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, sid: result.sid });
}
