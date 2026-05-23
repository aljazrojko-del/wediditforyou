// Backfill or refresh per-lead generated sites.
//
// Usage:
//   npm run generate-sites               # generate for any lead missing site_url
//   npm run generate-sites -- --force    # regenerate even if site_url already set
//   npm run generate-sites -- --limit 20 # cap the batch size

import "./load-env";
import { fileURLToPath } from "node:url";
import { makeClient } from "./db";
import { generateSiteData } from "../lib/generate-site";
import { normalizeNiche } from "../app/sites/_templates/utils";

const SITE_ORIGIN = process.env.SITE_ORIGIN ?? "https://sites.wedidit4you.com";

export type GenerateOpts = { force?: boolean; limit?: number };
export type GenerateResult = { ok: number; skipped: number; failed: number };

export async function generateAll(opts: GenerateOpts = {}): Promise<GenerateResult> {
  const force = Boolean(opts.force);
  const limit = opts.limit ?? 100;
  const supabase = makeClient();

  let query = supabase
    .from("leads")
    .select("id, name, niche, city, phone, address, rating, rating_count, site_url")
    .eq("has_website", false)
    .limit(limit);
  if (!force) query = query.is("site_url", null);

  const { data: rows, error } = await query;
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  if (!rows || rows.length === 0) {
    console.log("[generate-sites] nothing to do");
    return { ok: 0, skipped: 0, failed: 0 };
  }

  console.log(`[generate-sites] processing ${rows.length} lead(s)`);
  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const niche = normalizeNiche(row.niche);
    if (!niche) {
      console.warn(`  - skip ${row.name}: unsupported niche "${row.niche}"`);
      skipped++;
      continue;
    }
    try {
      const site = await generateSiteData({
        name: row.name,
        niche,
        city: row.city,
        phone: row.phone,
        address: row.address,
        rating: row.rating,
        rating_count: row.rating_count,
      });
      const url = `${SITE_ORIGIN}/${site.slug}`;
      const { error: upErr } = await supabase
        .from("leads")
        .update({
          slug: site.slug,
          site_url: url,
          headline: site.headline,
          subheadline: site.subheadline,
          services: site.services,
          reviews: site.reviews,
          about_text: site.about,
          generated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (upErr) throw new Error(upErr.message);
      console.log(`  ✓ ${row.name} → ${url}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${row.name}: ${(e as Error).message}`);
      failed++;
    }
  }

  console.log(`[done] ${ok} generated · ${skipped} skipped · ${failed} failed`);
  return { ok, skipped, failed };
}

function parseArgs(argv: string[]): GenerateOpts {
  const out: GenerateOpts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") out.force = true;
    else if (a === "--limit") out.limit = parseInt(argv[++i], 10) || undefined;
  }
  return out;
}

// CLI entry — only runs when this file is executed directly.
const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (isMain) {
  generateAll(parseArgs(process.argv.slice(2))).catch((err) => {
    console.error("[error]", err.message);
    process.exit(1);
  });
}
