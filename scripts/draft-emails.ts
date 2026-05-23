// Generate ready-to-send cold-outreach emails for any lead that has a site_url.
// Output is plain text, copy-paste ready into Gmail (one email per lead block).
//
// Usage:
//   npm run draft-emails               # all leads with site_url
//   npm run draft-emails -- --limit 1  # just one (for preview)
//   npm run draft-emails -- --city "Lubbock, TX"   # filter by city
//   npm run draft-emails -- --niche "mobile mechanic"  # filter by niche

import "./load-env";
import { makeClient } from "./db";

// Adjust as real founding clients pay. Today: 2 demo builds shown publicly = "2 of 10".
const SPOTS_TAKEN = 2;
const SPOTS_TOTAL = 10;

// Polite cold-email template (matches scripts/outreach-templates.md #1).
const TEMPLATE = `Hello {first_name},

We came across your business and noticed you don't have a website yet — would you like one?

We took your public Google business data and built you a preview, free of charge. You can see it here:

{site_url}

If you like what you see, we can either jump on a quick 15-minute call to walk through any changes you'd want, or you can simply reply to this email with edits, photos to add, or anything you'd like adjusted.

This preview is completely free. If you decide you want it live, we'll register your domain and prepare the final website within 24 hours. The price is $297 one-time — we're running a founding-client offer for our first 10 paying customers ({N} of {TOTAL} spots still open). After that, the price goes back to $497.

Why we're doing this: most {niche_plural} without a website lose roughly {volume_loss} — around {money_loss}/month — to competitors who show up on Google when customers search. The website fixes that. And if you don't get a single customer inquiry from it in the first 30 days, we'll refund your $297 and you can keep the site.

No pressure, no deposit, no commitment. Just take a look and let me know what you think.

— Alex
wedidit4you.com`;

// Per-niche economic pain anchoring. Adjust based on real numbers as you close clients.
type NicheEconomics = { plural: string; volumeLoss: string; moneyLoss: string };
const ECONOMICS: Record<string, NicheEconomics> = {
  "mobile mechanic":  { plural: "mobile mechanics",   volumeLoss: "3-5 jobs a week",       moneyLoss: "$1,200" },
  "plumber":          { plural: "plumbers",           volumeLoss: "3-5 jobs a week",       moneyLoss: "$1,500" },
  "mobile dog groomer": { plural: "mobile groomers",  volumeLoss: "3-5 appointments a week", moneyLoss: "$1,000" },
  "tutor":            { plural: "tutors",             volumeLoss: "2-3 students a month",  moneyLoss: "$800" },
  "hair stylist":     { plural: "hair stylists",      volumeLoss: "5-8 walk-ins a week",   moneyLoss: "$1,500" },
  "landscaper":       { plural: "landscapers",        volumeLoss: "2-4 jobs a week",       moneyLoss: "$1,500" },
  "barber":           { plural: "barbers",            volumeLoss: "5-8 walk-ins a week",   moneyLoss: "$1,200" },
};
const DEFAULT_ECONOMICS: NicheEconomics = {
  plural: "small businesses",
  volumeLoss: "3-5 customers a week",
  moneyLoss: "$1,000",
};

type Args = { limit: number; city: string | null; niche: string | null };

function parseArgs(argv: string[]): Args {
  const out: Args = { limit: 100, city: null, niche: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--limit") out.limit = parseInt(argv[++i], 10) || 100;
    else if (a === "--city") out.city = argv[++i] ?? null;
    else if (a === "--niche") out.niche = argv[++i] ?? null;
  }
  return out;
}

function pickOpener(businessName: string): string {
  // No owner first_name in the DB yet — use the business's first word as a friendly opener.
  // Most "Joe's Plumbing" or "Marquez Auto" reads naturally as "Joe," or "Marquez,".
  // Owners scan it and self-correct mentally; not a deal-breaker for first 10.
  const first = businessName.replace(/['']s\b/, "").split(/\s+/)[0];
  return first && /^[A-Za-z]/.test(first) ? first : "Hey";
}

function nicheToHuman(rawNiche: string): string {
  return rawNiche.trim().toLowerCase();
}

function pickSubject(business: string): string {
  // Three subject lines worth testing — rotate or pick the first by default.
  const opts = [
    `We built you a preview website — would you like a look?`,
    `A free website preview for ${business}`,
    `Built a preview for ${business} — yours to keep`,
  ];
  return opts[0];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabase = makeClient();

  let query = supabase
    .from("leads")
    .select("id, name, niche, city, phone, address, site_url, headline, created_at")
    .not("site_url", "is", null)
    .eq("has_website", false)
    .order("created_at", { ascending: false })
    .limit(args.limit);

  if (args.city) query = query.eq("city", args.city);
  if (args.niche) query = query.eq("niche", args.niche);

  const { data: rows, error } = await query;
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  if (!rows || rows.length === 0) {
    console.log("No leads with site_url found.");
    console.log("Run `npm run generate-sites` first to populate site_url on existing leads,");
    console.log("or `npm run leads -- --niche X --city Y` to scrape + generate fresh.");
    return;
  }

  const remaining = SPOTS_TOTAL - SPOTS_TAKEN;

  console.log(`Drafting ${rows.length} email(s) — founding price slot ${SPOTS_TAKEN} of ${SPOTS_TOTAL} (${remaining} remaining)\n`);

  for (const r of rows) {
    const firstName = pickOpener(r.name);
    const niche = nicheToHuman(r.niche);
    const econ = ECONOMICS[niche] ?? DEFAULT_ECONOMICS;
    const subject = pickSubject(r.name);
    const body = TEMPLATE
      .replace(/{first_name}/g, firstName)
      .replace(/{site_url}/g, r.site_url ?? "")
      .replace(/{niche}/g, niche)
      .replace(/{niche_plural}/g, econ.plural)
      .replace(/{volume_loss}/g, econ.volumeLoss)
      .replace(/{money_loss}/g, econ.moneyLoss)
      .replace(/{N}/g, String(remaining))
      .replace(/{TOTAL}/g, String(SPOTS_TOTAL));

    console.log("═".repeat(72));
    console.log(`LEAD:    ${r.name}`);
    console.log(`CITY:    ${r.city}`);
    console.log(`PHONE:   ${r.phone ?? "(no phone in DB)"}`);
    console.log(`ADDRESS: ${r.address ?? "(no address)"}`);
    console.log(`SITE:    ${r.site_url}`);
    console.log(`HEADLINE: "${r.headline ?? "(no AI headline)"}"`);
    console.log("─".repeat(72));
    console.log(`FROM:    info@wedidit4you.com`);
    console.log(`TO:      <enrich first — see /scripts/enrich-leads.ts>`);
    console.log(`SUBJECT: ${subject}`);
    console.log();
    console.log(body);
    console.log();
  }

  console.log("═".repeat(72));
  console.log("Copy-paste each block into Gmail. Replace TO: with the owner's email");
  console.log("(or call the phone number above and use the call script).");
}

main().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});
