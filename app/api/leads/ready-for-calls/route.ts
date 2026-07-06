// GET /api/leads/ready-for-calls
// Body:  none
// Auth:  Authorization: Bearer <OUTREACH_AUTH_TOKEN>
//
// Returns every lead that Mia is safe to dial today: site-less businesses
// (has_website=false), with a phone, a niche template, and a preview site
// already generated (site_url is not null). This is the "ready pool" the
// agency's `site_urls.json` should reflect. Their 2026-07-05 launch-gate
// report showed only 1 site there — this endpoint exposes the actual
// 1,000+ our Supabase has built.
//
// Response shape (JSON):
// {
//   "count": 1148,
//   "leads": [
//     {
//       "place_id": "mns-xxxxx",   // agency join key
//       "id": "<uuid>",             // our internal PK
//       "name": "Elite Mobile Tire & Brake",
//       "niche": "mobile mechanic",
//       "city": "Lubbock, TX",
//       "phone": "+18062810513",
//       "slug": "elite-mobile-tire-brake-lubbock-tx",
//       "site_url": "https://sites.wedidit4you.com/elite-mobile-tire-brake-lubbock-tx",
//       "rating": 4.8,
//       "rating_count": 67,
//       "created_at": "2026-06-21T…"
//     },
//     ...
//   ]
// }
//
// Filters (query params):
//   ?niche=mobile+mechanic        limit to one niche (spaces = %20 or +)
//   ?city=Lubbock                 substring match against leads.city
//   ?limit=100                    default 500, hard-cap 2000
//   ?after=<iso-timestamp>        only leads with created_at > after
//                                 (for incremental sync — poll for new leads)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const HARD_LIMIT = 2000;
const DEFAULT_LIMIT = 500;

function unauthed(): NextResponse {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  const expected = process.env.OUTREACH_AUTH_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "OUTREACH_AUTH_TOKEN not configured" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) return unauthed();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "supabase env missing" }, { status: 500 });
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const params = new URL(req.url).searchParams;
  const niche = params.get("niche");
  const city = params.get("city");
  const after = params.get("after");
  const rawLimit = parseInt(params.get("limit") ?? "", 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, HARD_LIMIT)
    : DEFAULT_LIMIT;

  let q = supabase
    .from("leads")
    .select(
      "id, place_id, name, niche, city, phone, slug, site_url, rating, rating_count, created_at",
    )
    .eq("has_website", false)
    .not("site_url", "is", null)
    .not("phone", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (niche) q = q.eq("niche", niche);
  if (city) q = q.ilike("city", `%${city}%`);
  if (after) q = q.gt("created_at", after);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data?.length ?? 0, leads: data ?? [] });
}
