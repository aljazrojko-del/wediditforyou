// GET/POST /api/admin/next-leads?n=200
//
// Atomically claims the next N clean, uncalled leads for a Max calling batch:
// runs the filtered selection (right niches, no website, junk/school/chain names
// excluded, deduped by phone, best-rated first, excludes anyone already dialed)
// via the claim_next_leads() Postgres function, which ALSO marks them
// call_placed_at=now so they can never be re-dialed. Returns {count, leads:[{id,
// name, city, phone}]}. Replaces hand-built lead lists for fire scripts.
//
// Auth: OUTREACH_AUTH_TOKEN (Bearer header or ?key=).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: Request) {
  const outreach = process.env.OUTREACH_AUTH_TOKEN;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!outreach || !supaUrl || !supaKey) {
    return NextResponse.json({ error: "missing env vars" }, { status: 500 });
  }
  const u = new URL(req.url);
  const auth = req.headers.get("authorization") ?? "";
  const key = u.searchParams.get("key") ?? "";
  if (auth !== `Bearer ${outreach}` && key !== outreach) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const n = Math.min(Math.max(parseInt(u.searchParams.get("n") ?? "100", 10) || 100, 1), 500);

  const sb = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("claim_next_leads", { n });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const leads = (data as Array<{ id: string; name: string; city: string; phone: string }>) ?? [];
  return NextResponse.json({ count: leads.length, leads });
}

export async function GET(req: Request) { return handle(req); }
export async function POST(req: Request) { return handle(req); }
