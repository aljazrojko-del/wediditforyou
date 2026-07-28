// GET /api/admin/callable-leads?limit=25&niche=mobile%20mechanic
// Returns leads that are worth auto-dialing with Alex: have a phone, no
// website, not already called. Used by the AI Call Launcher's Auto mode.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/outreach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const url = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 25));
  const niche = url.searchParams.get("niche")?.trim() || null;

  const supabase = getServiceClient();
  let q = supabase
    .from("leads")
    .select("id, name, phone, city, niche, rating")
    .not("phone", "is", null)
    .eq("has_website", false)
    .is("call_placed_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (niche) q = q.eq("niche", niche);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: data?.length ?? 0, leads: data ?? [] });
}
