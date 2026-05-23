// Run the enrichment waterfall against leads that don't have an email yet.
//
// Usage:
//   npm run enrich-leads               # process up to 20 leads missing email
//   npm run enrich-leads -- --limit 5  # custom batch size
//   npm run enrich-leads -- --force    # re-enrich even if email already set
//   npm run enrich-leads -- --slug X   # enrich one specific lead by slug

import "./load-env";
import { fileURLToPath } from "node:url";
import { makeClient } from "./db";
import { enrichLead, type EnrichmentResult } from "../lib/enrich";

type Opts = { force?: boolean; limit?: number; slug?: string };

export async function enrichAll(opts: Opts = {}) {
  const force = Boolean(opts.force);
  const limit = opts.limit ?? 20;
  const supabase = makeClient();

  let query = supabase
    .from("leads")
    .select("id, name, city, niche, phone")
    .eq("has_website", false)
    .limit(limit);
  if (opts.slug) query = query.eq("slug", opts.slug);
  else if (!force) query = query.is("email", null);

  const { data: rows, error } = await query;
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  if (!rows || rows.length === 0) {
    console.log("[enrich-leads] nothing to do");
    return { ok: 0, skipped: 0, failed: 0 };
  }

  console.log(`[enrich-leads] processing ${rows.length} lead(s)`);
  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const result: EnrichmentResult = await enrichLead({
        business_name: row.name,
        city: row.city,
        niche: row.niche,
        phone: row.phone,
      });

      const update: Record<string, unknown> = {
        owner_first_name: result.owner_first_name ?? null,
        owner_last_name: result.owner_last_name ?? null,
        owner_title: result.owner_title ?? null,
        email: result.email ?? null,
        email_status: result.email_status ?? "unknown",
        company_domain: result.company_domain ?? null,
        facebook_url: result.facebook_url ?? null,
        enrichment_data: result.raw,
        enriched_at: new Date().toISOString(),
      };

      const { error: upErr } = await supabase.from("leads").update(update).eq("id", row.id);
      if (upErr) throw new Error(upErr.message);

      const summary = result.email
        ? `${result.email} (${result.email_status})`
        : result.company_domain
          ? `domain=${result.company_domain}, no email found`
          : "no domain, no email";
      console.log(`  ✓ ${row.name} → ${summary}`);
      if (result.email) ok++;
      else skipped++;
    } catch (e) {
      console.error(`  ✗ ${row.name}: ${(e as Error).message}`);
      failed++;
    }
  }

  console.log(`[done] ${ok} enriched · ${skipped} skipped (no email found) · ${failed} failed`);
  return { ok, skipped, failed };
}

function parseArgs(argv: string[]): Opts {
  const out: Opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") out.force = true;
    else if (a === "--limit") out.limit = parseInt(argv[++i], 10) || undefined;
    else if (a === "--slug") out.slug = argv[++i];
  }
  return out;
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (isMain) {
  enrichAll(parseArgs(process.argv.slice(2))).catch((err) => {
    console.error("[error]", err.message);
    process.exit(1);
  });
}
