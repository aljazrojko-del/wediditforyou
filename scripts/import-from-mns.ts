// Import HOT leads from the MNS Agency CRM into Supabase.
//
// "Hot" = has phone (so Brooke can call) AND fire_tier in {A, B}.
//
// Filters to the 3 locked focus niches (mobile mechanic, mobile dog groomer,
// tutor). Skips anything outside that. Auto-runs generate-sites at the end.
//
// Usage:
//   npm run import-from-mns           # real import
//   npm run import-from-mns -- --dry  # preview, no DB writes
//   npm run import-from-mns -- --hot-only false  # also import cold leads

import "./load-env";
import { WdifyOpsClient } from "../lib/wdify-ops-client";
import { makeClient } from "./db";
import { generateAll } from "./generate-sites";

const HOST = "https://wediditforyou-dashboard-lemon.vercel.app";

// Map MNS search-term → our internal niche label (matches normalizeNiche in utils.ts)
const NICHE_SEARCHES: { query: string; niche: string }[] = [
  { query: "mobile mechanic", niche: "mobile mechanic" },
  { query: "mobile auto",     niche: "mobile mechanic" },
  { query: "auto mechanic",   niche: "mobile mechanic" },
  { query: "mobile dog groomer", niche: "mobile dog groomer" },
  { query: "dog groomer",     niche: "mobile dog groomer" },
  { query: "pet grooming",    niche: "mobile dog groomer" },
  { query: "tutor",           niche: "tutor" },
  { query: "tutoring",        niche: "tutor" },
];

type MnsLead = {
  id: number;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  status: string;
  notes: string | null;
  tags: string[];
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  fire_score: number | null;
  fire_tier: string | null;
};

function parseArgs(argv: string[]): { dry: boolean; hotOnly: boolean } {
  return {
    dry: argv.includes("--dry"),
    hotOnly: !argv.includes("--hot-only=false") && !argv.includes("--no-hot"),
  };
}

function isHot(l: MnsLead): boolean {
  if (!l.contact_phone) return false;
  return l.fire_tier === "A" || l.fire_tier === "B";
}

// Extract city from MNS tags (loc:Houston TX → Houston, TX) or fall back to notes
function extractCity(l: MnsLead): string {
  const locTag = l.tags.find((t) => t.startsWith("loc:"));
  if (locTag) {
    const raw = locTag.slice("loc:".length).trim();
    // Skip overly-broad locs like "usa" or "texas"
    if (/^[a-z\s]+$/.test(raw) && raw.length < 8) return raw;
    return raw;
  }
  // Parse from notes — pattern often: "...City, ST 12345"
  if (l.notes) {
    const m = l.notes.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s+([A-Z]{2})\s+\d{5}/);
    if (m) return `${m[1]}, ${m[2]}`;
  }
  return "USA";
}

// Filter out placeholder emails MNS uses before enrichment runs
function realEmail(email: string | null): string | null {
  if (!email) return null;
  if (email === "user@domain.com") return null;
  if (email.toLowerCase().startsWith("noreply@")) return null;
  return email;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`MNS → Supabase import · dry=${args.dry} · hotOnly=${args.hotOnly}\n`);

  // 1. Login to MNS
  const mns = new WdifyOpsClient({
    username: process.env.WDIFY_OPS_USERNAME!,
    password: process.env.WDIFY_OPS_PASSWORD!,
  });
  await mns.login();
  const token = (mns as unknown as { token: string }).token;

  // 2. Pull leads per niche search, dedupe by MNS id
  const seen = new Map<number, { lead: MnsLead; niche: string }>();

  for (const { query, niche } of NICHE_SEARCHES) {
    const res = await fetch(
      `${HOST}/command-api/api/v1/leads?search=${encodeURIComponent(query)}&limit=200`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      console.error(`  ✗ ${query}: ${res.status}`);
      continue;
    }
    const data = (await res.json()) as { items: MnsLead[]; total: number };
    let added = 0;
    for (const lead of data.items) {
      if (!seen.has(lead.id)) {
        seen.set(lead.id, { lead, niche });
        added++;
      }
    }
    console.log(`  ${query.padEnd(22)} ${data.total} total · ${added} new`);
  }

  const allLeads = [...seen.values()];
  const hotLeads = args.hotOnly ? allLeads.filter((x) => isHot(x.lead)) : allLeads;
  console.log(`\n${allLeads.length} unique leads · ${hotLeads.length} match hot criteria`);

  if (hotLeads.length === 0) {
    console.log("\nNothing to import.");
    return;
  }

  // 3. Sort hot leads by fire_score desc for the call list
  hotLeads.sort((a, b) => (b.lead.fire_score ?? 0) - (a.lead.fire_score ?? 0));

  // 4. Map to Supabase row shape
  const rows = hotLeads.map(({ lead, niche }) => ({
    place_id: `mns-${lead.id}`,
    name: lead.company_name,
    address: null,
    phone: lead.contact_phone,
    rating: null,
    rating_count: null,
    types: null,
    niche,
    city: extractCity(lead),
    source: "mns_crm",
    status: "new",
    has_website: Boolean(lead.website),
    website_url: lead.website,
    owner_email: realEmail(lead.owner_email) ?? realEmail(lead.contact_email),
    owner_phone: lead.owner_phone,
    owner_name: lead.owner_name ?? lead.contact_name,
    fire_score: lead.fire_score,
    fire_tier: lead.fire_tier,
  }));

  // 5. Dry-run preview
  if (args.dry) {
    console.log("\n[dry] Top 20 hot leads — what would be inserted:\n");
    for (const r of rows.slice(0, 20)) {
      console.log(
        `  ${r.fire_tier ?? "-"} · ${r.fire_score ?? 0} · ${r.name}`,
      );
      console.log(`     phone: ${r.phone ?? "—"} · email: ${r.owner_email ?? "—"}`);
      console.log(`     niche: ${r.niche} · city: ${r.city}`);
      console.log();
    }
    if (rows.length > 20) console.log(`  ... and ${rows.length - 20} more`);
    return;
  }

  // 6. Real insert
  const supabase = makeClient();
  const { data: inserted, error } = await supabase
    .from("leads")
    .upsert(rows, { onConflict: "place_id", ignoreDuplicates: true })
    .select("id, place_id, name");

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
  const insertedCount = inserted?.length ?? 0;
  console.log(`\n[supabase] inserted ${insertedCount} new · skipped ${rows.length - insertedCount} (already in DB)`);

  // 7. Print the top-of-list call sheet
  console.log("\n═══ HOTTEST LEADS — call these first (top 20) ═══\n");
  for (const r of rows.slice(0, 20)) {
    console.log(
      `  ${r.fire_tier ?? "-"} · ${(r.fire_score ?? 0).toString().padStart(2)} · ${r.name.padEnd(40)} · ${r.phone ?? "—"}`,
    );
  }

  // 8. Auto-generate sites for the new imports
  if (insertedCount > 0) {
    console.log(`\n[generate-sites] building sites for ${insertedCount} new lead(s)...`);
    await generateAll({ limit: insertedCount });
  }
}

main().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});
