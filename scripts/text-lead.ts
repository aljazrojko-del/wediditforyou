// Text a specific lead the preview site URL via OpenPhone (Quo) SMS.
//
// Usage:
//   npm run text-lead -- --slug benitez-mobile-truck-repair-lubbock-tx --dry
//   npm run text-lead -- --slug X                # SEND (real SMS)
//   npm run text-lead -- --phone "+18065551234"  # ad-hoc to any number
//
// Defaults to --dry. Pass --send to actually send.

import "./load-env";
import { makeClient } from "./db";
import { OpenPhoneClient, normalizeE164 } from "../lib/openphone-client";

type Args = { slug?: string; phone?: string; send: boolean };

function parseArgs(argv: string[]): Args {
  const out: Args = { send: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slug") out.slug = argv[++i];
    else if (a === "--phone") out.phone = argv[++i];
    else if (a === "--send") out.send = true;
    else if (a === "--dry") out.send = false;
  }
  return out;
}

// SMS body that pairs with the polite cold-email template. Keep it short
// (under ~320 chars to fit in 2 SMS segments and avoid carrier truncation).
function smsBody(opts: { firstName: string; siteUrl: string }): string {
  return `Hi ${opts.firstName}, Alex from We Did It For You. Saw you don't have a website yet, so I built you a free preview:

${opts.siteUrl}

If you like it, let me know and we can hop on a quick call. — Alex`;
}

function pickFirstName(businessName: string): string {
  const first = businessName.replace(/['']s\b/, "").split(/\s+/)[0];
  return first && /^[A-Za-z]/.test(first) ? first : "there";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const apiKey = process.env.OPENPHONE_API_KEY;
  const fromNumber = process.env.OPENPHONE_PHONE_NUMBER;
  if (!apiKey || !fromNumber) {
    throw new Error("Missing OPENPHONE_API_KEY or OPENPHONE_PHONE_NUMBER in env.");
  }

  const op = new OpenPhoneClient({ apiKey, fromNumber });

  let toPhone: string | null = null;
  let firstName = "there";
  let siteUrl = "";
  let leadName = "(ad-hoc)";

  if (args.slug) {
    const supabase = makeClient();
    const { data, error } = await supabase
      .from("leads")
      .select("name, phone, site_url, slug")
      .eq("slug", args.slug)
      .maybeSingle<{ name: string; phone: string | null; site_url: string | null; slug: string }>();
    if (error || !data) throw new Error(`Lead not found for slug "${args.slug}": ${error?.message ?? "no row"}`);
    if (!data.phone) throw new Error(`Lead ${data.name} has no phone number — can't SMS.`);
    if (!data.site_url) throw new Error(`Lead ${data.name} has no site_url — run generate-sites first.`);
    toPhone = normalizeE164(data.phone);
    firstName = pickFirstName(data.name);
    siteUrl = data.site_url;
    leadName = data.name;
  } else if (args.phone) {
    toPhone = normalizeE164(args.phone);
    siteUrl = "https://wedidit4you.com";
    firstName = "there";
  } else {
    throw new Error("Pass either --slug <slug> or --phone <+1...>");
  }

  if (!toPhone) throw new Error("Could not normalize phone number to E.164.");

  const body = smsBody({ firstName, siteUrl });

  console.log("─".repeat(60));
  console.log(`LEAD:    ${leadName}`);
  console.log(`FROM:    ${fromNumber} (Quo / OpenPhone)`);
  console.log(`TO:      ${toPhone}`);
  console.log("─".repeat(60));
  console.log(body);
  console.log("─".repeat(60));

  if (!args.send) {
    console.log("\n[dry-run] No SMS sent. Re-run with --send to actually transmit.");
    return;
  }

  console.log("\n[send] Calling OpenPhone API...");
  const result = await op.sendSms(toPhone, body);
  if (result.ok) {
    console.log(`✓ Sent · messageId=${result.messageId}`);
  } else {
    console.error(`✗ FAILED (${result.status ?? "?"}): ${result.error}`);
    if (result.status === 403 || (result.error?.includes("A2P") ?? false)) {
      console.error("\n⚠️  This is likely the A2P 10DLC compliance block.");
      console.error("    Open OpenPhone → Settings → Messaging Compliance, register a campaign.");
      console.error("    Approval takes 1-5 days. After that, retry.");
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[error]", (err as Error).message);
  process.exit(1);
});
