// Place an outbound call to a Supabase lead via SignalWire, using the right
// local-area-code number based on the lead's city.
//
// Houston, TX  → +1 713 ...
// Phoenix, AZ  → +1 602 ...
// Dallas, TX   → +1 469 ...
// Nashville, TN→ +1 615 ...
// anywhere else→ fallback to Houston number
//
// Usage:
//   npm run call -- --slug aaron-mobile-mechanic-houston-tx
//   npm run call -- --to +38640878551 --twiml-message "test from Alex"   (ad-hoc)
//   npm run call -- --slug aaron-mobile-mechanic-houston-tx --dry        (preview)
//
// The TwiML is hosted at /api/twiml/call/{slug} on the deployed site, so
// SignalWire fetches it when the recipient picks up.

import "./load-env";
import { fileURLToPath } from "node:url";
import { makeClient } from "./db";
import { SignalWireClient } from "../lib/signalwire-client";

const SITE_BASE = process.env.SITE_BASE ?? "https://wedidit4you.com";

type Opts = {
  slug?: string;
  to?: string;
  twimlMessage?: string;
  dry: boolean;
};

function parseArgs(argv: string[]): Opts {
  const out: Opts = { dry: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slug") out.slug = argv[++i];
    else if (a === "--to") out.to = argv[++i];
    else if (a === "--twiml-message") out.twimlMessage = argv[++i];
    else if (a === "--dry") out.dry = true;
  }
  return out;
}

function normalizeE164(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/[^0-9]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (/^\+[1-9]\d{7,14}$/.test(input.trim())) return input.trim();
  return null;
}

async function main(opts: Opts) {
  const client = new SignalWireClient();

  let to: string | null = null;
  let city: string | null = null;
  let businessName: string | null = null;
  let twimlUrl: string | null = null;

  if (opts.slug) {
    const supabase = makeClient();
    const { data, error } = await supabase
      .from("leads")
      .select("name, city, phone, site_url, slug")
      .eq("slug", opts.slug)
      .maybeSingle<{ name: string; city: string; phone: string | null; site_url: string | null; slug: string }>();
    if (error || !data) throw new Error(`Lead not found for slug "${opts.slug}"`);
    if (!data.phone) throw new Error(`Lead ${data.name} has no phone`);
    to = normalizeE164(data.phone);
    city = data.city;
    businessName = data.name;
    twimlUrl = `${SITE_BASE}/api/twiml/call/${opts.slug}`;
  } else if (opts.to) {
    to = normalizeE164(opts.to);
    city = "Houston"; // fall back to Houston number for ad-hoc tests
    businessName = "(ad-hoc test)";
    if (opts.twimlMessage) {
      twimlUrl = `https://twimlets.com/message?Message=${encodeURIComponent(opts.twimlMessage)}`;
    } else {
      twimlUrl = `https://twimlets.com/message?Message=${encodeURIComponent("This is a test call from We Did It For You. Goodbye.")}`;
    }
  } else {
    throw new Error("Pass --slug <slug> or --to <+E164>");
  }

  if (!to) throw new Error("Could not normalize 'to' phone number to E.164");

  const from = client.pickFromNumber(city);
  if (!from) throw new Error("No SignalWire from-number configured. Set SIGNALWIRE_PHONE_HOUSTON or matching city env var.");

  console.log("─".repeat(60));
  console.log(`Lead:      ${businessName}`);
  console.log(`City:      ${city}`);
  console.log(`From:      ${from}  (SignalWire local)`);
  console.log(`To:        ${to}`);
  console.log(`TwiML URL: ${twimlUrl}`);
  console.log("─".repeat(60));

  if (opts.dry) {
    console.log("\n[dry] No call placed. Re-run without --dry to actually dial.");
    return;
  }

  console.log("\n[call] Dialing…");
  const result = await client.makeCall({ from, to, twimlUrl });
  if (result.ok) {
    console.log(`✓ Call placed · sid=${result.sid} · status=${result.status}`);
    console.log("  The recipient will hear the TwiML message when they answer.");
  } else {
    console.error(`✗ FAILED: ${result.error}`);
    process.exit(1);
  }
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (isMain) {
  main(parseArgs(process.argv.slice(2))).catch((err) => {
    console.error("[error]", (err as Error).message);
    process.exit(1);
  });
}
