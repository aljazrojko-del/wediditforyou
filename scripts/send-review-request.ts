// Auto-review SMS — sends a Google review request to paying customers after
// a job is marked complete. Premium tier component #6 — compounds local SEO
// ranking by driving review velocity.
//
// Trigger logic:
//   - lead.tier = 'premium'  AND
//   - lead.payment_status = 'paid'  AND
//   - lead.google_review_url IS NOT NULL  AND
//   - lead.last_job_completed_at >= 1 hour ago  AND
//   - lead.review_request_sent_at IS NULL  (idempotent — only one ask per job)
//
// Usage:
//   npm run send-review-request                          # send to all qualifying
//   npm run send-review-request -- --dry                 # preview drafts
//   npm run send-review-request -- --slug X              # send to one specific client
//   npm run send-review-request -- --since-hours 2       # delay window (default 1)
//
// Requires: A2P 10DLC approval on Quo (otherwise SMS returns 403).
// Once A2P clears, schedule this as a cron every 30 min.

import "./load-env";
import { fileURLToPath } from "node:url";
import { makeClient } from "./db";
import { OpenPhoneClient, normalizeE164 } from "../lib/openphone-client";

type Opts = {
  slug?: string;
  sinceHours: number;
  dry: boolean;
  limit: number;
};

type CustomerLead = {
  id: string;
  name: string;
  phone: string | null;
  owner_first_name: string | null;
  google_review_url: string | null;
  last_job_completed_at: string | null;
  tier: string | null;
  payment_status: string | null;
  review_request_sent_at: string | null;
};

function pickFirstName(lead: CustomerLead): string {
  const candidate = (lead.owner_first_name ?? "").trim();
  if (candidate && /^[A-Z][a-z]+$/.test(candidate)) return candidate;
  return "there";
}

function reviewSms(opts: {
  customerFirst: string;
  businessName: string;
  reviewUrl: string;
}): string {
  return `Hi ${opts.customerFirst}! Thanks for choosing ${opts.businessName} today. If you have 30 seconds, would you mind leaving a quick Google review? ${opts.reviewUrl} — means a lot. (Reply STOP to opt out.)`;
}

export async function sendAll(opts: Opts) {
  const apiKey = process.env.OPENPHONE_API_KEY;
  const fromNumber = process.env.OPENPHONE_PHONE_NUMBER;
  if (!apiKey || !fromNumber) {
    throw new Error("Missing OPENPHONE_API_KEY or OPENPHONE_PHONE_NUMBER in env.");
  }

  const supabase = makeClient();
  const op = new OpenPhoneClient({ apiKey, fromNumber });

  const sinceCutoff = new Date(Date.now() - opts.sinceHours * 3600_000).toISOString();

  let query = supabase
    .from("leads")
    .select(
      "id, name, phone, owner_first_name, google_review_url, last_job_completed_at, tier, payment_status, review_request_sent_at",
    )
    .eq("tier", "premium")
    .eq("payment_status", "paid")
    .not("phone", "is", null)
    .not("google_review_url", "is", null)
    .is("review_request_sent_at", null)
    .lt("last_job_completed_at", sinceCutoff)
    .not("last_job_completed_at", "is", null)
    .limit(opts.limit);
  if (opts.slug) query = query.eq("slug", opts.slug);

  const { data: rows, error } = await query;
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  const leads = (rows ?? []) as CustomerLead[];

  if (leads.length === 0) {
    console.log("[review-request] nothing to send");
    return { ok: 0, skipped: 0, failed: 0 };
  }

  console.log(
    `[review-request] ${opts.dry ? "DRY-RUN " : ""}${leads.length} review request(s) ready`,
  );

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const lead of leads) {
    if (!lead.phone || /555-0\d{3}/.test(lead.phone)) {
      console.warn(`  - skip ${lead.name}: missing or test phone`);
      skipped++;
      continue;
    }
    const to = normalizeE164(lead.phone);
    if (!to) {
      console.warn(`  - skip ${lead.name}: phone "${lead.phone}" not normalizable`);
      skipped++;
      continue;
    }
    if (!lead.google_review_url) {
      console.warn(`  - skip ${lead.name}: no google_review_url`);
      skipped++;
      continue;
    }

    const body = reviewSms({
      customerFirst: pickFirstName(lead),
      businessName: lead.name,
      reviewUrl: lead.google_review_url,
    });

    console.log("────────────────────────────────");
    console.log(`To:   ${to} (${lead.name})`);
    console.log(`Body: ${body}`);
    console.log(`Len:  ${body.length} chars`);

    if (opts.dry) {
      console.log("[dry] not sent");
      continue;
    }

    const result = await op.sendSms(to, body);
    if (result.ok) {
      const { error: upErr } = await supabase
        .from("leads")
        .update({
          review_request_sent_at: new Date().toISOString(),
          review_request_message_id: result.messageId,
        })
        .eq("id", lead.id);
      if (upErr) console.warn(`  (DB update failed: ${upErr.message})`);
      console.log(`  ✓ sent · messageId=${result.messageId}`);
      ok++;
    } else {
      console.error(`  ✗ failed: ${result.error}`);
      if (result.status === 403 || result.error?.includes("A2P")) {
        console.error("    ⚠️  A2P 10DLC compliance block. Register at Quo Trust Center.");
      }
      failed++;
    }
  }

  console.log(`[done] ${ok} sent · ${skipped} skipped · ${failed} failed`);
  return { ok, skipped, failed };
}

function parseArgs(argv: string[]): Opts {
  const out: Opts = { sinceHours: 1, dry: false, limit: 50 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry") out.dry = true;
    else if (a === "--slug") out.slug = argv[++i];
    else if (a === "--since-hours") out.sinceHours = parseFloat(argv[++i]) || 1;
    else if (a === "--limit") out.limit = parseInt(argv[++i], 10) || out.limit;
  }
  return out;
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (isMain) {
  sendAll(parseArgs(process.argv.slice(2))).catch((err) => {
    console.error("[error]", (err as Error).message);
    process.exit(1);
  });
}
