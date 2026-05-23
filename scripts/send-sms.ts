// Batch SMS sender — text MULTIPLE leads at once via Quo (OpenPhone).
// Complements text-lead.ts (single-lead version). Same SMS body shape.
//
// Defaults to DRY-RUN. Pass --send to actually transmit.
//
// Usage:
//   npm run send-sms -- --niche "mobile mechanic" --city "Houston, TX"   # dry-run all matches
//   npm run send-sms -- --niche "mobile mechanic" --city "Houston, TX" --send  # SEND
//   npm run send-sms -- --limit 3 --send                                 # send to next 3 unsent
//   npm run send-sms -- --force                                          # re-send to already-texted
//
// Skips: leads with no phone, fictional 555 numbers, leads already texted (unless --force).
// Logs: sms_sent_at, sms_message_id, sms_body per lead.

import "./load-env";
import { fileURLToPath } from "node:url";
import { makeClient } from "./db";
import { OpenPhoneClient } from "../lib/openphone-client";

type Opts = {
  niche?: string;
  city?: string;
  slug?: string;
  limit?: number;
  send: boolean;
  force?: boolean;
};

type LeadRow = {
  id: string;
  name: string;
  city: string;
  niche: string;
  phone: string | null;
  site_url: string | null;
  slug: string | null;
  owner_first_name: string | null;
};

// Words that look like names but are generic business / city / descriptor
// terms — never address a prospect as "Houston" or "Auto" or "Mobile".
const NOT_A_NAME =
  /^(the|best|premier|elite|royal|gold|silver|new|old|first|big|little|mobile|local|bayou|city|greenline|riverside|sunrise|sunset|north|south|east|west|main|grand|pro|professional|auto|limousine|express|premium|quick|fast|reliable|trustworthy|guaranteed|certified|texas|houston|dallas|austin|chicago|atlanta|phoenix|lubbock|miami|seattle|denver|orlando|tampa|nashville|raleigh|brooklyn|manhattan|midtown|downtown|america|american)$/i;

function pickFirstName(lead: LeadRow): string {
  // Prefer enriched owner name, fall back to first word of business name.
  // Apply the denylist to BOTH — enrichment sometimes mistakes "Auto" / "Houston"
  // for first names if the business name leads with them.
  const candidate =
    lead.owner_first_name?.trim() ||
    lead.name.replace(/[''']s\b/, "").split(/\s+/)[0];
  if (!candidate) return "there";
  if (!/^[A-Z][a-z]+$/.test(candidate)) return "there";
  if (NOT_A_NAME.test(candidate)) return "there";
  return candidate;
}

function smsBody(firstName: string, siteUrl: string): string {
  return `Hi ${firstName}, Alex from We Did It For You. Saw you don't have a website yet, so I built you a free preview:

${siteUrl}

If you like it, let me know and we can hop on a quick call. — Alex`;
}

export async function sendAll(opts: Opts) {
  const apiKey = process.env.OPENPHONE_API_KEY;
  const fromNumber = process.env.OPENPHONE_PHONE_NUMBER;
  if (!apiKey || !fromNumber) {
    throw new Error("Missing OPENPHONE_API_KEY or OPENPHONE_PHONE_NUMBER in env.");
  }
  const op = new OpenPhoneClient({ apiKey, fromNumber });

  const supabase = makeClient();
  let query = supabase
    .from("leads")
    .select("id, name, city, niche, phone, site_url, slug, owner_first_name")
    .not("phone", "is", null)
    .not("site_url", "is", null)
    .limit(opts.limit ?? 10);
  if (opts.slug) query = query.eq("slug", opts.slug);
  else if (!opts.force) query = query.is("sms_sent_at", null);
  if (opts.niche) query = query.eq("niche", opts.niche);
  if (opts.city) query = query.eq("city", opts.city);

  const { data: rows, error } = await query;
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  if (!rows || rows.length === 0) {
    console.log("[send-sms] nothing to do");
    return { ok: 0, skipped: 0, failed: 0 };
  }

  console.log(
    `[send-sms] ${opts.send ? "SENDING" : "DRY-RUN"} ${rows.length} SMS from ${fromNumber}`,
  );

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows as LeadRow[]) {
    if (!row.phone) {
      console.warn(`  - skip ${row.name}: no phone`);
      skipped++;
      continue;
    }
    if (/555-0\d\d\d/.test(row.phone)) {
      console.warn(`  - skip ${row.name}: 555 fiction prefix (test data)`);
      skipped++;
      continue;
    }
    const firstName = pickFirstName(row);
    const body = smsBody(firstName, row.site_url!);

    console.log("─".repeat(60));
    console.log(`Lead:  ${row.name} · ${row.city}`);
    console.log(`To:    ${row.phone}`);
    console.log(`Body:  ${body.replace(/\n/g, " ↵ ")}`);
    console.log(`Len:   ${body.length} chars${body.length > 160 ? " (2 SMS segments)" : ""}`);

    if (!opts.send) {
      console.log(`[dry] not sent`);
      continue;
    }

    const result = await op.sendSms(row.phone, body);
    if (result.ok) {
      console.log(`  ✓ sent · messageId=${result.messageId}`);
      const { error: upErr } = await supabase
        .from("leads")
        .update({
          sms_sent_at: new Date().toISOString(),
          sms_message_id: result.messageId,
          sms_body: body,
        })
        .eq("id", row.id);
      if (upErr) console.warn(`    (Supabase log failed: ${upErr.message})`);
      ok++;
    } else {
      console.error(`  ✗ failed (${result.status ?? "?"}): ${result.error}`);
      if (result.status === 403 || (result.error?.includes("A2P") ?? false)) {
        console.error(
          `\n⚠️  A2P 10DLC compliance block. Register a campaign at OpenPhone → Settings → Messaging Compliance. Approval takes 1-5 days.`,
        );
        return { ok, skipped, failed: failed + 1 };
      }
      failed++;
    }
  }

  console.log("");
  console.log(`[done] ${ok} sent · ${skipped} skipped · ${failed} failed`);
  return { ok, skipped, failed };
}

function parseArgs(argv: string[]): Opts {
  const out: Opts = { send: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--send") out.send = true;
    else if (a === "--dry") out.send = false;
    else if (a === "--force") out.force = true;
    else if (a === "--niche") out.niche = argv[++i];
    else if (a === "--city") out.city = argv[++i];
    else if (a === "--slug") out.slug = argv[++i];
    else if (a === "--limit") out.limit = parseInt(argv[++i], 10) || undefined;
  }
  return out;
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (isMain) {
  sendAll(parseArgs(process.argv.slice(2))).catch((err) => {
    console.error("[error]", err.message);
    process.exit(1);
  });
}
