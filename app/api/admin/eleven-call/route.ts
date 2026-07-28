// POST /api/admin/eleven-call — admin-authed trigger for an ElevenLabs (Alex)
// outbound call via the SignalWire SIP trunk. Phone-first like /admin/mia-call:
// works for any number; when the phone matches a lead we pass real context to
// the agent as dynamic variables (first_name, business_name, rating, area).
//
// NOTE: the outbound call routes through the SignalWire SIP trunk. Until that
// trunk's ingress is finished, ElevenLabs returns success:false with a SIP
// error — this endpoint surfaces that verbatim so the UI can show it.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceClient, normalizeE164 } from "@/lib/outreach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Not secret — specific to our ElevenLabs agent + SIP trunk number.
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID ?? "agent_0101kymwezq6eg4v91cnf5ed5j3p";
const PHONE_NUMBER_ID =
  process.env.ELEVENLABS_SIP_PHONE_NUMBER_ID ?? "phnum_7901kyn1h7gdebf9vzkymdebe12x";

type Body = {
  phone?: string;
  first_name?: string;
  company?: string;
  lead_id?: string;
};

function lastTen(phone: string): string {
  return (phone ?? "").replace(/[^0-9]/g, "").slice(-10);
}

function firstNameFrom(
  ownerFirstName: string | null | undefined,
  businessName: string | null | undefined,
  hint: string | null | undefined,
): string {
  if (hint && hint.trim()) return hint.trim();
  if (ownerFirstName && ownerFirstName.trim()) return ownerFirstName.trim();
  if (businessName) {
    const first = businessName.replace(/['’]s\b/g, "").trim().split(/\s+/)[0];
    if (first) return first;
  }
  return "there";
}

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "server_misconfig: ELEVENLABS_API_KEY missing" },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const to = normalizeE164((body.phone ?? "").trim());
  if (!to) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });

  // Best-effort lead match by last-10 digits for personalization.
  const supabase = getServiceClient();
  const target10 = lastTen(to);
  let lead: {
    id: string;
    name: string;
    city: string | null;
    owner_first_name: string | null;
    rating: number | null;
  } | null = null;

  if (target10.length === 10) {
    const { data: rows } = await supabase
      .from("leads")
      .select("id, name, city, phone, owner_first_name, rating")
      .not("phone", "is", null)
      .limit(2000);
    if (rows) {
      lead =
        (rows as Array<{
          id: string;
          name: string;
          city: string | null;
          phone: string | null;
          owner_first_name: string | null;
          rating: number | null;
        }>).find((r) => r.phone && lastTen(r.phone) === target10) ?? null;
    }
  }

  const firstName = firstNameFrom(
    lead?.owner_first_name ?? null,
    lead?.name ?? body.company ?? null,
    body.first_name ?? null,
  );
  const businessName = body.company ?? lead?.name ?? "your business";
  const area = lead?.city ?? "your area";
  const rating = lead?.rating != null ? String(lead.rating) : "5.0";

  let elevenResp: Response;
  try {
    elevenResp = await fetch(
      "https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call",
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: AGENT_ID,
          agent_phone_number_id: PHONE_NUMBER_ID,
          to_number: to,
          conversation_initiation_client_data: {
            dynamic_variables: {
              first_name: firstName,
              business_name: businessName,
              rating,
              area,
            },
          },
        }),
      },
    );
  } catch (e) {
    return NextResponse.json(
      { error: `elevenlabs_unreachable: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  const text = await elevenResp.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* keep raw */
  }

  const success = !!(json && json.success === true);

  // Mark the matched lead as call-attempted (non-blocking).
  if (lead?.id) {
    try {
      await supabase
        .from("leads")
        .update({
          call_placed_at: new Date().toISOString(),
          call_status: success ? "queued" : "failed",
        })
        .eq("id", lead.id);
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({
    ok: success,
    routed_to: "elevenlabs",
    matched_lead: lead ? { id: lead.id, name: lead.name } : null,
    to,
    eleven: json ?? text.slice(0, 300),
  });
}
