// Cron-friendly bulk lead puller. Mirrors what /api/admin/pull-leads does
// for the browser, but iterates over a configured niche×city matrix without
// any auth flow — meant to be called from the weekly Vercel cron.
//
// Safety:
//   - Hard cap on new leads per run (env: LEAD_PULL_CAP, default 80)
//   - 1 page per combo per run (~20 candidates each)
//   - Min rating + min reviews filter applied per combo
//   - Combos with >= 50 existing leads in DB are skipped (saturated)
//
// Cost rough math (Google Places API, mid-2026 pricing):
//   ~$0.032 per text search + ~$0.017 per details lookup
//   5 combos × 1 page × ~20 places each ≈ $2.50/run
//   Run weekly → ~$10/mo

import type { SupabaseClient } from "@supabase/supabase-js";
import { searchAllPages, type PlaceResult } from "@/scripts/places";
import { upsertLeads, type LeadRow } from "@/scripts/db";

type Combo = {
  niche: string;
  city: string;
  minRating?: number;
  minReviews?: number;
};

// Locked focus niches × highest-priority US service-business markets.
// Edit this list to expand. Stays under env-var indirection on purpose so
// the cron behavior is auditable from git history.
const DEFAULT_COMBOS: Combo[] = [
  { niche: "mobile mechanic", city: "Houston, TX",     minRating: 4.0, minReviews: 10 },
  { niche: "mobile mechanic", city: "Phoenix, AZ",     minRating: 4.0, minReviews: 10 },
  { niche: "mobile mechanic", city: "San Antonio, TX", minRating: 4.0, minReviews: 10 },
  { niche: "mobile mechanic", city: "Dallas, TX",      minRating: 4.0, minReviews: 10 },
  { niche: "mobile dog groomer", city: "Houston, TX",  minRating: 4.0, minReviews: 5  },
  { niche: "mobile dog groomer", city: "Austin, TX",   minRating: 4.0, minReviews: 5  },
  { niche: "tutor", city: "Houston, TX",               minRating: 4.5, minReviews: 5  },
  { niche: "tutor", city: "Phoenix, AZ",               minRating: 4.5, minReviews: 5  },
];

const SATURATION_THRESHOLD = 50;

export type PullResult = {
  totalNew: number;
  totalCandidates: number;
  capHit: boolean;
  cap: number;
  perCombo: Array<{
    niche: string;
    city: string;
    candidates: number;
    accepted: number;
    inserted: number;
    skipReason?: string;
  }>;
  errors: string[];
};

function passesFilter(p: PlaceResult, combo: Combo): boolean {
  // Skip places that already have a website — they're not our target
  if (p.websiteUri) return false;
  if (combo.minRating != null && (p.rating ?? 0) < combo.minRating) return false;
  if (combo.minReviews != null && (p.userRatingCount ?? 0) < combo.minReviews) return false;
  return true;
}

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

async function countLeadsForCombo(
  supabase: SupabaseClient,
  niche: string,
  city: string,
): Promise<number> {
  const { count } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("niche", niche)
    .eq("city", city);
  return count ?? 0;
}

export async function pullLeadsForConfiguredCombos(
  supabase: SupabaseClient,
  opts?: { cap?: number; combos?: Combo[] },
): Promise<PullResult> {
  const cap = opts?.cap ?? Number(process.env.LEAD_PULL_CAP ?? 80);
  const combos = opts?.combos ?? DEFAULT_COMBOS;

  const result: PullResult = {
    totalNew: 0,
    totalCandidates: 0,
    capHit: false,
    cap,
    perCombo: [],
    errors: [],
  };

  for (const combo of combos) {
    if (result.totalNew >= cap) {
      result.capHit = true;
      result.perCombo.push({
        niche: combo.niche,
        city: combo.city,
        candidates: 0,
        accepted: 0,
        inserted: 0,
        skipReason: "global cap hit",
      });
      continue;
    }

    try {
      const existing = await countLeadsForCombo(supabase, combo.niche, combo.city);
      if (existing >= SATURATION_THRESHOLD) {
        result.perCombo.push({
          niche: combo.niche,
          city: combo.city,
          candidates: 0,
          accepted: 0,
          inserted: 0,
          skipReason: `saturated (${existing} existing leads)`,
        });
        continue;
      }

      const places: PlaceResult[] = [];
      for await (const p of searchAllPages(combo.niche, combo.city, 1)) {
        places.push(p);
      }
      result.totalCandidates += places.length;

      const accepted = places.filter((p) => passesFilter(p, combo));
      if (accepted.length === 0) {
        result.perCombo.push({
          niche: combo.niche,
          city: combo.city,
          candidates: places.length,
          accepted: 0,
          inserted: 0,
        });
        continue;
      }

      const room = cap - result.totalNew;
      const toInsert = accepted.slice(0, room);
      const rows = toInsert.map((p) => placeToRow(p, combo.niche, combo.city));
      const upsertRes = await upsertLeads(supabase, rows);
      result.totalNew += upsertRes.inserted;

      result.perCombo.push({
        niche: combo.niche,
        city: combo.city,
        candidates: places.length,
        accepted: accepted.length,
        inserted: upsertRes.inserted,
      });
    } catch (err) {
      result.errors.push(
        `${combo.niche} / ${combo.city}: ${err instanceof Error ? err.message : String(err)}`,
      );
      result.perCombo.push({
        niche: combo.niche,
        city: combo.city,
        candidates: 0,
        accepted: 0,
        inserted: 0,
        skipReason: "errored",
      });
    }
  }

  return result;
}
