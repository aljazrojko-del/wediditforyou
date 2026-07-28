// POST /api/customer/generate-logos
// Body: { token }
//
// Triggers OpenAI logo generation for the customer's business. Gated to
// Premium tier only (Starter doesn't include logo design). Idempotent:
// returns existing options if already generated, unless force=true.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateLogoSet, type GeneratedLogo } from "@/lib/openai-logo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  let body: { token?: string; force?: boolean };
  try {
    body = (await req.json()) as { token?: string; force?: boolean };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  const sb = supabase();
  const { data: lead, error } = await sb
    .from("leads")
    .select("id, name, niche, tier, logo_options")
    .eq("customer_admin_token", token)
    .maybeSingle<{
      id: string;
      name: string;
      niche: string;
      tier: string | null;
      logo_options: GeneratedLogo[] | null;
    }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!lead) return NextResponse.json({ error: "invalid link" }, { status: 404 });
  if (lead.tier !== "premium")
    return NextResponse.json(
      { error: "Logo generation is a Premium feature." },
      { status: 403 },
    );

  // Idempotent: skip if already generated, unless forced.
  if (!body.force && lead.logo_options && lead.logo_options.length > 0) {
    return NextResponse.json({ ok: true, logos: lead.logo_options, regenerated: false });
  }

  const { logos, errors } = await generateLogoSet({
    leadId: lead.id,
    businessName: lead.name,
    niche: lead.niche,
  });

  if (logos.length === 0) {
    return NextResponse.json(
      { error: "Could not generate any logos", details: errors },
      { status: 500 },
    );
  }

  await sb
    .from("leads")
    .update({
      logo_options: logos,
      logo_generated_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  return NextResponse.json({
    ok: true,
    logos,
    regenerated: true,
    warnings: errors.length > 0 ? errors : undefined,
  });
}
