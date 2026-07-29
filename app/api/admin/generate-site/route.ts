// POST /api/admin/generate-site   Body: { lead_id }
//
// On-demand single-lead site generation. The Max cold-call bridge calls this
// the moment a prospect says YES to the link but has no site yet — so we only
// spend generation cost on leads who actually want it (most won't).
//
// Sites render dynamically from the DB, so once generateAll writes slug +
// site_url the URL is live immediately (no deploy). Returns the live URL.
//
// Auth: same OUTREACH_AUTH_TOKEN the bridge already uses for booking.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateAll } from "@/scripts/generate-sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const expected = process.env.OUTREACH_AUTH_TOKEN;
  const auth = req.headers.get("authorization") ?? "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey) {
    return NextResponse.json({ error: "server_misconfig" }, { status: 500 });
  }

  let body: { lead_id?: string };
  try {
    body = (await req.json()) as { lead_id?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const leadId = body.lead_id;
  if (!leadId) {
    return NextResponse.json({ error: "lead_id required" }, { status: 400 });
  }

  const sb = createClient(supaUrl, supaKey, { auth: { persistSession: false } });

  // Already has a site? Return it — no need to regenerate (idempotent + cheap).
  const { data: existing } = await sb
    .from("leads")
    .select("site_url, slug")
    .eq("id", leadId)
    .maybeSingle<{ site_url: string | null; slug: string | null }>();
  if (existing?.site_url) {
    return NextResponse.json({ url: existing.site_url, slug: existing.slug, generated: false });
  }

  // Generate now (writes slug + site_url + content to the lead row).
  try {
    await generateAll({ id: leadId });
  } catch (e) {
    return NextResponse.json(
      { error: `generation failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  const { data: after } = await sb
    .from("leads")
    .select("site_url, slug")
    .eq("id", leadId)
    .maybeSingle<{ site_url: string | null; slug: string | null }>();
  if (!after?.site_url) {
    return NextResponse.json({ error: "generation produced no site_url" }, { status: 500 });
  }
  return NextResponse.json({ url: after.site_url, slug: after.slug, generated: true });
}
