// Bridge Supabase leads ↔ agency dashboard (wdify-ops).
//
// Two modes:
//
//   PUSH (default):
//     Finds Supabase leads with site_url IS NOT NULL and dashboard_id IS NULL,
//     creates them in the dashboard, stores the returned dashboard_id back.
//
//   SYNC (--sync):
//     For every Supabase lead with dashboard_id, fetches the current dashboard
//     state and updates dashboard_status + dashboard_synced_at in Supabase.
//
// Usage:
//   npm run bridge-to-dashboard                                  # push new leads
//   npm run bridge-to-dashboard -- --sync                        # pull statuses back
//   npm run bridge-to-dashboard -- --niche "mobile mechanic"     # filter
//   npm run bridge-to-dashboard -- --city "Houston, TX"          # filter
//   npm run bridge-to-dashboard -- --limit 5                     # cap batch size
//   npm run bridge-to-dashboard -- --dry                         # preview only
//   npm run bridge-to-dashboard -- --backfill                    # push every site,
//                                                                # match by slug if
//                                                                # already in dashboard
//
// Idempotent: a lead that already has dashboard_id is skipped on push.

import "./load-env";
import { fileURLToPath } from "node:url";
import { makeClient } from "./db";
import {
  WdifyOpsClient,
  type DashboardLead,
} from "../lib/wdify-ops-client";

type Mode = "push" | "sync";

type Opts = {
  mode: Mode;
  niche?: string;
  city?: string;
  limit: number;
  dry: boolean;
  backfill: boolean;
};

type SupabaseLead = {
  id: string;
  name: string;
  city: string;
  niche: string;
  phone: string | null;
  address: string | null;
  rating: number | null;
  rating_count: number | null;
  slug: string;
  site_url: string | null;
  headline: string | null;
  has_website: boolean;
  email: string | null;
  owner_first_name: string | null;
  dashboard_id: number | null;
  dashboard_status: string | null;
};

function buildTags(lead: SupabaseLead): string[] {
  const tags = [
    "source:wedidit4you_bridge",
    "client:wedidit4you",
    `industry:${lead.niche}`,
    `loc:${lead.city}`,
    `slug:${lead.slug}`,
    "has_ai_site",
  ];
  if (!lead.has_website) tags.push("no_website");
  return tags;
}

function buildNotes(lead: SupabaseLead): string {
  const rating = lead.rating ? `${lead.rating}/${lead.rating_count}` : "no rating";
  return [
    `${lead.niche} · ${lead.city}`,
    `Rating ${rating} · ${lead.address ?? "no address"}`,
    `AI-built site: ${lead.site_url}`,
    lead.headline ? `Headline: "${lead.headline}"` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function pushLead(
  client: WdifyOpsClient,
  lead: SupabaseLead,
  dry: boolean,
): Promise<DashboardLead | null> {
  const body: Partial<DashboardLead> = {
    company_name: lead.name,
    contact_name: lead.owner_first_name,
    contact_email: lead.email,
    contact_phone: lead.phone,
    website: null,
    status: "NEW",
    notes: buildNotes(lead),
    tags: buildTags(lead),
  };
  if (dry) {
    console.log(`  [dry] would POST: ${JSON.stringify(body).slice(0, 120)}…`);
    return null;
  }
  return await client.createLead(body);
}

// Generic words that match many businesses — bad signal for finding a unique lead.
const GENERIC_WORDS =
  /^(the|and|mobile|auto|service|services|repair|repairs|inc|llc|co|corp|company|business|local|new|old|big|little|grand|main|pro|professional|express|premium|quick|fast|reliable|reliable|certified|houston|dallas|austin|chicago|atlanta|phoenix|lubbock|miami|seattle|denver|orlando|tampa|nashville|raleigh|brooklyn|manhattan|midtown|downtown)$/i;

async function findExistingByName(
  client: WdifyOpsClient,
  lead: { name: string; phone: string | null },
): Promise<DashboardLead | null> {
  const wantedName = lead.name.toLowerCase().trim();

  // Strategy 1: search by phone (most unique identifier).
  if (lead.phone) {
    try {
      const list = await client.listLeads({ search: lead.phone, limit: 5 });
      const match = list.items.find(
        (l) => l.contact_phone && normalizePhone(l.contact_phone) === normalizePhone(lead.phone!),
      );
      if (match) return match;
    } catch {
      // ignore
    }
  }

  // Strategy 2: search by the longest distinctive word (>4 chars, not in NOT_A_NAME).
  const distinctive = lead.name
    .split(/\s+/)
    .filter((w) => w.length > 4 && !GENERIC_WORDS.test(w))
    .sort((a, b) => b.length - a.length)[0];
  if (distinctive) {
    try {
      const list = await client.listLeads({ search: distinctive, limit: 50 });
      const match = list.items.find(
        (l) => l.company_name?.toLowerCase().trim() === wantedName,
      );
      if (match) return match;
    } catch {
      // ignore
    }
  }

  // Strategy 3: last-ditch — search by first word, exact-match filter.
  const firstWord = lead.name.split(/\s+/)[0];
  if (firstWord) {
    try {
      const list = await client.listLeads({ search: firstWord, limit: 100 });
      const match = list.items.find(
        (l) => l.company_name?.toLowerCase().trim() === wantedName,
      );
      if (match) return match;
    } catch {
      // ignore
    }
  }

  return null;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "").replace(/^1/, "");
}

async function runPush(opts: Opts) {
  const username = process.env.WDIFY_OPS_USERNAME;
  const password = process.env.WDIFY_OPS_PASSWORD;
  if (!username || !password) {
    throw new Error("Missing WDIFY_OPS_USERNAME / WDIFY_OPS_PASSWORD in env.");
  }

  const supabase = makeClient();
  const client = new WdifyOpsClient({ username, password });

  let query = supabase
    .from("leads")
    .select(
      "id, name, city, niche, phone, address, rating, rating_count, slug, site_url, headline, has_website, email, owner_first_name, dashboard_id, dashboard_status",
    )
    .not("site_url", "is", null)
    .limit(opts.limit);
  if (!opts.backfill) query = query.is("dashboard_id", null);
  if (opts.niche) query = query.eq("niche", opts.niche);
  if (opts.city) query = query.eq("city", opts.city);

  const { data: rows, error } = await query;
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  const leads = (rows ?? []) as SupabaseLead[];

  if (leads.length === 0) {
    console.log("[bridge:push] nothing to push");
    return;
  }

  console.log(
    `[bridge:push] ${opts.dry ? "DRY-RUN " : ""}${leads.length} lead(s) → dashboard${opts.backfill ? " (backfill mode)" : ""}`,
  );

  let pushed = 0;
  let matched = 0;
  let skipped = 0;
  let failed = 0;

  for (const lead of leads) {
    if (lead.phone && /555-0\d{3}/.test(lead.phone)) {
      console.warn(`  - skip ${lead.name}: 555 test phone`);
      skipped++;
      continue;
    }

    try {
      if (opts.backfill && !lead.dashboard_id) {
        // Try to find an existing dashboard lead matching this company name.
        const existing = await findExistingByName(client, {
          name: lead.name,
          phone: lead.phone,
        });
        if (existing) {
          console.log(
            `  ↻ ${lead.name} already in dashboard as id ${existing.id} (status=${existing.status})`,
          );
          if (!opts.dry) {
            await supabase
              .from("leads")
              .update({
                dashboard_id: existing.id,
                dashboard_status: existing.status,
                dashboard_pushed_at: new Date().toISOString(),
                dashboard_synced_at: new Date().toISOString(),
              })
              .eq("id", lead.id);
          }
          matched++;
          continue;
        }
      }

      const created = await pushLead(client, lead, opts.dry);
      if (!opts.dry && created) {
        const { error: upErr } = await supabase
          .from("leads")
          .update({
            dashboard_id: created.id,
            dashboard_status: created.status,
            dashboard_pushed_at: new Date().toISOString(),
            dashboard_synced_at: new Date().toISOString(),
          })
          .eq("id", lead.id);
        if (upErr) throw new Error(`DB update failed: ${upErr.message}`);
        console.log(`  ✓ ${lead.name} → dashboard id ${created.id} (${created.status})`);
        pushed++;
      } else if (opts.dry) {
        pushed++;
      }
    } catch (e) {
      console.error(`  ✗ ${lead.name}: ${(e as Error).message}`);
      failed++;
    }
  }

  console.log(
    `[done] ${pushed} pushed · ${matched} matched (already in dashboard) · ${skipped} skipped · ${failed} failed`,
  );
}

async function runSync(opts: Opts) {
  const username = process.env.WDIFY_OPS_USERNAME;
  const password = process.env.WDIFY_OPS_PASSWORD;
  if (!username || !password) {
    throw new Error("Missing WDIFY_OPS_USERNAME / WDIFY_OPS_PASSWORD in env.");
  }

  const supabase = makeClient();
  const client = new WdifyOpsClient({ username, password });

  let query = supabase
    .from("leads")
    .select("id, name, dashboard_id, dashboard_status")
    .not("dashboard_id", "is", null)
    .limit(opts.limit);
  if (opts.niche) query = query.eq("niche", opts.niche);
  if (opts.city) query = query.eq("city", opts.city);

  const { data: rows, error } = await query;
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  if (!rows || rows.length === 0) {
    console.log("[bridge:sync] no leads with dashboard_id to sync");
    return;
  }

  console.log(`[bridge:sync] syncing ${rows.length} lead(s) status from dashboard`);

  let synced = 0;
  let changed = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const remote = await client.getLead(row.dashboard_id as number);
      const newStatus = remote.status;
      const changedNow = newStatus !== row.dashboard_status;
      if (opts.dry) {
        console.log(
          `  [dry] ${row.name}: ${row.dashboard_status} → ${newStatus}${changedNow ? " (would update)" : " (no change)"}`,
        );
      } else {
        await supabase
          .from("leads")
          .update({
            dashboard_status: newStatus,
            dashboard_synced_at: new Date().toISOString(),
          })
          .eq("id", row.id as string);
        if (changedNow) {
          console.log(`  ↻ ${row.name}: ${row.dashboard_status ?? "?"} → ${newStatus}`);
          changed++;
        }
      }
      synced++;
    } catch (e) {
      console.error(`  ✗ ${row.name} (id ${row.dashboard_id}): ${(e as Error).message}`);
      failed++;
    }
  }

  console.log(`[done] ${synced} synced · ${changed} status changes · ${failed} failed`);
}

function parseArgs(argv: string[]): Opts {
  const out: Opts = { mode: "push", limit: 50, dry: false, backfill: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sync") out.mode = "sync";
    else if (a === "--push") out.mode = "push";
    else if (a === "--dry") out.dry = true;
    else if (a === "--backfill") out.backfill = true;
    else if (a === "--niche") out.niche = argv[++i];
    else if (a === "--city") out.city = argv[++i];
    else if (a === "--limit") out.limit = parseInt(argv[++i], 10) || out.limit;
  }
  return out;
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (isMain) {
  const opts = parseArgs(process.argv.slice(2));
  const run = opts.mode === "sync" ? runSync : runPush;
  run(opts).catch((err) => {
    console.error("[error]", (err as Error).message);
    process.exit(1);
  });
}
