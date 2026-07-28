// POST /api/admin/mia-call — admin-authed proxy that dials a phone number
// via Luka's Mia AI (/api/test-call). Sibling to the /admin/leads/[slug]/call
// endpoint but phone-first: it works for any number even if the number isn't
// tied to a lead in our pool. When the phone MATCHES a lead we auto-fill
// company/site_url/lead_id from that row so Mia's script has real context.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceClient, normalizeE164 } from "@/lib/outreach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MIA_TEST_CALL_URL =
  process.env.MIA_TEST_CALL_URL ??
  "https://wdify.82-25-92-135.sslip.io/api/test-call";

type Body = {
  phone?: string;
  first_name?: string;
  company?: string;
  site_url?: string;
  stage?: string;
};

function bestFirstName(
  ownerFirstName: string | null | undefined,
  businessName: string | null | undefined,
  hint: string | null | undefined,
): string {
  if (hint && hint.trim().length > 0) return hint.trim();
  if (ownerFirstName && ownerFirstName.trim().length > 0) return ownerFirstName.trim();
  if (businessName) {
    const stripped = businessName.replace(/[''']s\b/g, "").trim();
    const firstToken = stripped.split(/\s+/)[0];
    if (firstToken) return firstToken;
  }
  return "there";
}

// Match the lead by phone the same way the SMS webhook does — last 10 digits
// (US local). Stored phones can be in E.164 or Places-style formatting.
function lastTen(phone: string): string {
  return (phone ?? "").replace(/[^0-9]/g, "").slice(-10);
}

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const token = process.env.OUTREACH_AUTH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "server_misconfig: OUTREACH_AUTH_TOKEN missing" },
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

  const supabase = getServiceClient();
  const targetLast10 = lastTen(to);

  let lead: {
    id: string;
    name: string;
    slug: string | null;
    city: string;
    phone: string | null;
    site_url: string | null;
    owner_first_name: string | null;
  } | null = null;

  if (targetLast10.length === 10) {
    const { data: rows } = await supabase
      .from("leads")
      .select("id, name, slug, city, phone, site_url, owner_first_name")
      .not("phone", "is", null)
      .limit(2000);
    if (rows) {
      lead =
        (rows as Array<{
          id: string;
          name: string;
          slug: string | null;
          city: string;
          phone: string | null;
          site_url: string | null;
          owner_first_name: string | null;
        }>).find((r) => r.phone && lastTen(r.phone) === targetLast10) ?? null;
    }
  }

  const firstName = bestFirstName(
    lead?.owner_first_name ?? null,
    lead?.name ?? body.company ?? null,
    body.first_name ?? null,
  );

  const payload = {
    phone: to,
    name: firstName,
    company: body.company ?? lead?.name ?? "",
    lead_id: lead?.id ?? null,
    site_url: body.site_url ?? lead?.site_url ?? "",
    stage: body.stage ?? "specbuild",
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
    // non-JSON body — keep raw for debugging
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

  // Best-effort activity update on the matched lead so it flips to
  // "call_placed" without waiting for the brooke webhook.
  if (lead?.id) {
    try {
      await supabase
        .from("leads")
        .update({
          call_placed_at: new Date().toISOString(),
          call_status: "queued",
        })
        .eq("id", lead.id);
    } catch (e) {
      console.error("[admin/mia-call] lead update:", (e as Error).message);
    }
  }

  return NextResponse.json({
    ok: true,
    routed_to: "mia",
    matched_lead: lead
      ? { id: lead.id, name: lead.name, slug: lead.slug }
      : null,
    payload,
    mia_response: respJson ?? respText.slice(0, 200),
  });
}
