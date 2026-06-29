// Lightweight analytics endpoint for customer sites. The SiteTracker client
// component (rendered on every /sites/{slug} page) POSTs here on page view and
// on taps of tel: / booking links. We resolve the slug -> lead and append a row
// to site_events. Powers the customer's Call & Booking Tracker.
//
// Public + unauthenticated by design (it runs on public customer sites). Worst
// case is inflated counts from bots; acceptable for a directional tracker. Never
// throws — analytics must never break a customer's live site.

import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = new Set(["visit", "call_click", "booking_click"]);

export async function POST(req: Request) {
  try {
    const { slug, type } = (await req.json()) as { slug?: string; type?: string };
    if (!slug || !type || !VALID_TYPES.has(type)) {
      return new Response(null, { status: 204 });
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return new Response(null, { status: 204 });

    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("slug", slug)
      .maybeSingle<{ id: string }>();

    if (lead?.id) {
      await supabase.from("site_events").insert({ lead_id: lead.id, type });
    }
  } catch (e) {
    console.error("[api/track] error:", (e as Error).message);
  }
  return new Response(null, { status: 204 });
}
