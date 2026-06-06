// POST /api/admin/pull-leads — trigger Google Places pull from the browser.
// Auto-chains generate-sites + enrich-leads for newly inserted leads.
//
// Body: { niche, city, pages?, minRating?, minReviews? }

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { searchAllPages, type PlaceResult } from "@/scripts/places";
import { makeClient, upsertLeads, type LeadRow } from "@/scripts/db";
import { generateAll } from "@/scripts/generate-sites";
import { enrichAll } from "@/scripts/enrich-leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  niche?: string;
  city?: string;
  pages?: number;
  minRating?: number | null;
  minReviews?: number | null;
};

function placeToRow(p: PlaceResult, niche: string, city: string): LeadRow {
  return {
    place_id: p.id,
    name: p.displayName?.text?.trim() || "(unnamed)",
    address: p.formattedAddress ?? null,
    phone: p.nationalPhoneNumber ?? null,
    rating: p.rating ?? null,
    rating_count: p.userRatingCount ?? null,
    types: p.types ?? null,
    niche,
    city,
    has_website: Boolean(p.websiteUri),
    website_url: p.websiteUri ?? null,
  };
}

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const niche = (body.niche ?? "").trim();
  const city = (body.city ?? "").trim();
  const pages = Math.max(1, Math.min(3, Number(body.pages) || 3));
  const minRating = body.minRating != null ? Number(body.minRating) : null;
  const minReviews = body.minReviews != null ? Number(body.minReviews) : null;

  if (!niche || !city) {
    return NextResponse.json({ error: "niche and city are required" }, { status: 400 });
  }
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY not configured" },
      { status: 500 },
    );
  }

  const query = `${niche} in ${city}`;
  const all: PlaceResult[] = [];
  for await (const place of searchAllPages(
    process.env.GOOGLE_PLACES_API_KEY,
    query,
    pages,
  )) {
    all.push(place);
  }

  const noSite = all.filter((p) => !p.websiteUri);
  const qualified = noSite.filter((p) => {
    if (minRating !== null && (p.rating ?? 0) < minRating) return false;
    if (minReviews !== null && (p.userRatingCount ?? 0) < minReviews) return false;
    return true;
  });

  if (qualified.length === 0) {
    return NextResponse.json({
      found: all.length,
      noSite: noSite.length,
      qualified: 0,
      inserted: 0,
      skipped: 0,
      generated: 0,
      enriched: 0,
    });
  }

  const rows = qualified.map((p) => placeToRow(p, niche, city));
  const supabase = makeClient();
  const { inserted, skipped } = await upsertLeads(supabase, rows);

  let generated = 0;
  let enriched = 0;
  if (inserted > 0) {
    try {
      const g = await generateAll({ limit: inserted });
      generated = g.ok;
    } catch (e) {
      console.error("[pull-leads] generate failed:", (e as Error).message);
    }
    try {
      const e2 = await enrichAll({ limit: inserted });
      enriched = e2.ok;
    } catch (e) {
      console.error("[pull-leads] enrich failed:", (e as Error).message);
    }
  }

  return NextResponse.json({
    found: all.length,
    noSite: noSite.length,
    qualified: qualified.length,
    inserted,
    skipped,
    generated,
    enriched,
  });
}
