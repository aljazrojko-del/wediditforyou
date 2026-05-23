// Pull businesses from Google Places, filter for those without a website,
// and upsert into Supabase.
//
// Usage (after `npm run leads -- --niche "plumber" --city "Phoenix, AZ"`):
//   --niche        required, e.g. "plumber"
//   --city         required, e.g. "Phoenix, AZ"
//   --pages        optional, max pages to fetch (default 3, max 60 results)
//   --min-rating   optional, drop businesses below this rating (e.g. 4.0)
//   --min-reviews  optional, drop businesses with fewer reviews (e.g. 5)
//   --dry          optional flag, preview without writing to DB
//   --mock         optional flag, use built-in fixtures instead of calling the API
//                  (requires --dry — never write fake data to the real DB)
//   --usage        print current month's API spend and exit

import "./load-env";
import { searchAllPages, type PlaceResult } from "./places";
import { makeClient, upsertLeads, type LeadRow } from "./db";
import { summary as usageSummary } from "./usage";

type Args = {
  niche: string;
  city: string;
  pages: number;
  dry: boolean;
  mock: boolean;
  minRating: number | null;
  minReviews: number | null;
};

function parseArgs(argv: string[]): Args {
  const out: Record<string, string | boolean> = {
    pages: "3",
    dry: false,
    mock: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    if (key === "dry" || key === "mock") {
      out[key] = true;
    } else {
      out[key] = argv[++i];
    }
  }
  if (typeof out.niche !== "string" || typeof out.city !== "string") {
    throw new Error('Required: --niche "<niche>" --city "<city>"');
  }
  const minRating = out["min-rating"] ? parseFloat(out["min-rating"] as string) : null;
  const minReviews = out["min-reviews"] ? parseInt(out["min-reviews"] as string, 10) : null;
  return {
    niche: out.niche,
    city: out.city,
    pages: Math.max(1, Math.min(3, parseInt(out.pages as string, 10) || 3)),
    dry: Boolean(out.dry),
    mock: Boolean(out.mock),
    minRating: minRating !== null && !isNaN(minRating) ? minRating : null,
    minReviews: minReviews !== null && !isNaN(minReviews) ? minReviews : null,
  };
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

async function main() {
  // Standalone flag: print usage summary and exit. No other args required.
  if (process.argv.includes("--usage")) {
    console.log(usageSummary());
    return;
  }

  const args = parseArgs(process.argv.slice(2));
  const query = `${args.niche} in ${args.city}`;

  const all: PlaceResult[] = [];

  if (args.mock) {
    if (!args.dry) {
      throw new Error("--mock requires --dry (don't write fake data to the real DB).");
    }
    console.log(`[search] (mock) "${query}"`);
    const { MOCK_PLACES } = await import("./mock-data");
    all.push(...MOCK_PLACES);
  } else {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GOOGLE_PLACES_API_KEY in environment.");
    }
    console.log(`[search] "${query}" (max ${args.pages} pages)`);
    for await (const place of searchAllPages(apiKey, query, args.pages)) {
      all.push(place);
    }
  }

  const noSite = all.filter((p) => !p.websiteUri);
  const qualified = noSite.filter((p) => {
    if (args.minRating !== null && (p.rating ?? 0) < args.minRating) return false;
    if (args.minReviews !== null && (p.userRatingCount ?? 0) < args.minReviews) return false;
    return true;
  });

  const filterDesc: string[] = [];
  if (args.minRating !== null) filterDesc.push(`rating ≥${args.minRating}`);
  if (args.minReviews !== null) filterDesc.push(`reviews ≥${args.minReviews}`);
  const filterStr = filterDesc.length ? ` (${filterDesc.join(", ")})` : "";

  console.log(
    `[result] ${all.length} found · ${noSite.length} without website · ${qualified.length} qualified${filterStr}`,
  );

  if (qualified.length === 0) {
    console.log("[done] nothing to insert");
    return;
  }

  const rows = qualified.map((p) => placeToRow(p, args.niche, args.city));

  if (args.dry) {
    console.log("[dry] preview of leads to insert:");
    for (const r of rows.slice(0, 10)) {
      const stars = r.rating != null ? `${r.rating}★ (${r.rating_count})` : "no reviews";
      console.log(`  - ${r.name} · ${stars} · ${r.phone ?? "no phone"} · ${r.address}`);
    }
    if (rows.length > 10) console.log(`  ... and ${rows.length - 10} more`);
    if (!args.mock) console.log(usageSummary());
    return;
  }

  const supabase = makeClient();
  const { inserted, skipped } = await upsertLeads(supabase, rows);
  console.log(`[supabase] inserted ${inserted} · skipped ${skipped} (existing)`);

  // Show the running spend after a real (non-mock) run.
  if (!args.mock) console.log(usageSummary());

  // Auto-generate per-lead sites for any new leads missing a site_url.
  if (inserted > 0) {
    const { generateAll } = await import("./generate-sites");
    await generateAll({ limit: inserted });

    // Then enrich those leads — owner name, Facebook URL, candidate email.
    const { enrichAll } = await import("./enrich-leads");
    await enrichAll({ limit: inserted });
  }
}

main().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});
