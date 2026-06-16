// Generate a per-lead Stripe payment URL Mia can text/email to the prospect
// once they say "yes, charge me". The lead's slug is encoded as
// `client_reference_id` so the Stripe webhook can match the payment back to
// the right Supabase row automatically.
//
// Auth: Bearer <OUTREACH_AUTH_TOKEN> (same token used by /api/outreach/send-link)
//
// Body:
//   {
//     "tier": "starter-full" | "starter-split" | "premium-full" | "premium-split",
//     "lead_slug": "carlos-mendez-houston-tx",   // becomes client_reference_id
//     "customer_email"?: "carlos@example.com",   // pre-fills checkout email
//     "lead_id"?: "uuid",                         // optional, for logging only
//     "source"?: "mia"                            // optional, identifies caller
//   }
//
// Response:
//   { ok: true, url: "https://buy.stripe.com/...", tier, lead_slug }
//   { ok: false, error: "<reason>" }

import { NextResponse } from "next/server";
import { buildBuyLink, type Tier } from "@/lib/buy-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TIERS: Tier[] = [
  "starter-full",
  "starter-split",
  "premium-full",
  "premium-split",
];

type RequestBody = {
  tier?: string;
  lead_slug?: string;
  customer_email?: string;
  lead_id?: string;
  source?: string;
};

function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "unauthorized" },
    { status: 401 },
  );
}

function bad(status: number, error: string, extras?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(extras ?? {}) }, { status });
}

export async function POST(req: Request) {
  const expected = process.env.OUTREACH_AUTH_TOKEN;
  if (!expected) return bad(500, "endpoint_misconfigured_no_auth_token");

  const got = req.headers.get("authorization") ?? "";
  const presented = got.startsWith("Bearer ") ? got.slice(7) : "";
  if (presented !== expected) return unauthorized();

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return bad(400, "invalid_json");
  }

  if (!body.tier || !VALID_TIERS.includes(body.tier as Tier)) {
    return bad(400, "invalid_tier", {
      hint: `tier must be one of ${VALID_TIERS.join(", ")}`,
    });
  }
  if (!body.lead_slug || typeof body.lead_slug !== "string") {
    return bad(400, "missing_lead_slug");
  }

  const url = buildBuyLink(body.tier as Tier, {
    slug: body.lead_slug,
    email: body.customer_email ?? null,
  });

  if (!url) {
    return bad(500, "payment_link_not_configured", {
      hint: `Set the env var for this tier (e.g. STRIPE_${body.tier.toUpperCase().replace("-", "_")}_PAYMENT_LINK or legacy STRIPE_PAYMENT_LINK / STRIPE_SPLIT_PAYMENT_LINK)`,
    });
  }

  return NextResponse.json({
    ok: true,
    url,
    tier: body.tier,
    lead_slug: body.lead_slug,
    source: body.source ?? null,
  });
}

export function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "method_not_allowed",
      hint: "Use POST with Authorization: Bearer <OUTREACH_AUTH_TOKEN>",
    },
    { status: 405 },
  );
}
