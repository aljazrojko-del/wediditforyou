// POST /api/admin/leads/[slug]/call — fire a Mia (AI) specbuild call to the
// lead by forwarding to Luka's /api/test-call endpoint on the Mia VPS.
//
// This replaced the legacy robocall (SignalWire TwiML "Say" broadcast) —
// clicking Call in /admin now dials the prospect with the real AI voice
// pipeline running the current specbuild brain, not a TTS voicemail.
//
// Guardrail: two-tap confirmation is enforced on the button UI, so a single
// stray click can't fire this.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/outreach";
import { normalizeE164 } from "@/lib/outreach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MIA_TEST_CALL_URL =
  process.env.MIA_TEST_CALL_URL ??
  "https://wdify.82-25-92-135.sslip.io/api/test-call";

// Try to derive a spoken first name from the business name when we don't have
// an owner_first_name from enrichment (e.g. "Aaron's Mobile Mechanic" → "Aaron").
// Mia's script uses {first_name} as the salutation on the name-check.
function bestFirstName(
  ownerFirstName: string | null,
  businessName: string,
): string {
  if (ownerFirstName && ownerFirstName.trim().length > 0) return ownerFirstName.trim();
  const stripped = businessName.replace(/[''']s\b/g, "").trim();
  const firstToken = stripped.split(/\s+/)[0];
  return firstToken || "there";
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const token = process.env.OUTREACH_AUTH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "server_misconfig: OUTREACH_AUTH_TOKEN missing" },
      { status: 500 },
    );
  }

  const { slug } = await ctx.params;
  const supabase = getServiceClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select("id, name, slug, city, phone, site_url, owner_first_name")
    .eq("slug", slug)
    .maybeSingle<{
      id: string;
      name: string;
      slug: string;
      city: string;
      phone: string | null;
      site_url: string | null;
      owner_first_name: string | null;
    }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });

  const to = lead.phone ? normalizeE164(lead.phone) : null;
  if (!to) {
    return NextResponse.json(
      { error: "lead has no valid phone" },
      { status: 400 },
    );
  }

  const firstName = bestFirstName(lead.owner_first_name, lead.name);

  const payload = {
    phone: to,
    name: firstName,
    company: lead.name,
    lead_id: lead.id,
    site_url: lead.site_url ?? "",
    stage: "specbuild",
  };

  let miaResp: Response;
  try {
    miaResp = await fetch(MIA_TEST_CALL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return NextResponse.json(
      { error: `mia_reach_failed: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  const respText = await miaResp.text();
  let respJson: unknown = null;
  try {
    respJson = JSON.parse(respText);
  } catch {
    // non-JSON body → keep raw for debugging
  }

  if (!miaResp.ok) {
    return NextResponse.json(
      {
        error: "mia_test_call_failed",
        status: miaResp.status,
        detail: respJson ?? respText.slice(0, 500),
      },
      { status: 502 },
    );
  }

  // Record the dial attempt on the lead so it shows in the Activity panel and
  // the UI's "Call placed" flag flips. Real call_sid will land later via the
  // brooke webhook when Luka's post-call handler fires.
  try {
    await supabase
      .from("leads")
      .update({
        call_placed_at: new Date().toISOString(),
        call_status: "queued",
      })
      .eq("id", lead.id);
  } catch (e) {
    console.error("[leads/call] activity update failed:", (e as Error).message);
  }

  return NextResponse.json({
    ok: true,
    routed_to: "mia",
    payload,
    mia_response: respJson ?? respText.slice(0, 200),
  });
}
