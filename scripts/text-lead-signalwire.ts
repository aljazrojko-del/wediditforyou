// Text a Supabase lead via SignalWire with automatic city-routing.
// Picks the right local-area-code number based on the lead's city, so the
// recipient sees a local number — much higher reply rates than out-of-state.
//
// Houston, TX  → +1 713 ...
// Phoenix, AZ  → +1 602 ...
// Dallas, TX   → +1 469 ...
// Nashville, TN→ +1 615 ...
// Chicago, IL  → +1 464 ...
// anywhere else→ fallback to Houston number
//
// Usage:
//   npm run text-lead-sw -- --slug aaron-mobile-mechanic-houston-tx        (dry by default)
//   npm run text-lead-sw -- --slug X --send                                 (real)
//   npm run text-lead-sw -- --phone +13463499635 --message "test"           (ad-hoc, no Supabase)
//
// Required env: SIGNALWIRE_PROJECT_ID, SIGNALWIRE_TOKEN, SIGNALWIRE_SPACE_URL,
//               SIGNALWIRE_PHONE_HOUSTON (+ optional city-specific numbers).

import "./load-env";
import { fileURLToPath } from "node:url";
import { makeClient } from "./db";
import { SignalWireClient } from "../lib/signalwire-client";

type Args = {
  slug?: string;
  phone?: string;
  message?: string;
  send: boolean;
};

function parseArgs(argv: string[]): Args {
  const out: Args = { send: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slug") out.slug = argv[++i];
    else if (a === "--phone") out.phone = argv[++i];
    else if (a === "--message") out.message = argv[++i];
    else if (a === "--send") out.send = true;
    else if (a === "--dry") out.send = false;
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

const NOT_A_NAME =
  /^(the|best|premier|elite|royal|gold|silver|new|old|first|big|little|mobile|local|bayou|city|greenline|riverside|sunrise|sunset|north|south|east|west|main|grand|pro|professional|auto|limousine|express|premium|quick|fast|reliable|trustworthy|guaranteed|certified|texas|houston|dallas|austin|chicago|atlanta|phoenix|lubbock|miami|seattle|denver|orlando|tampa|nashville|raleigh|brooklyn|manhattan|midtown|downtown|america|american)$/i;

function pickFirstName(lead: { name: string; owner_first_name: string | null }): string {
  const candidate = (lead.owner_first_name ?? "").trim()
    || lead.name.replace(/[''']s\b/, "").split(/\s+/)[0];
  if (!candidate || !/^[A-Z][a-z]+$/.test(candidate)) return "there";
  if (NOT_A_NAME.test(candidate)) return "there";
  return candidate;
}

function smsBody(firstName: string, siteUrl: string): string {
  return `Hi ${firstName}, Alex from We Did It For You. Saw you don't have a website yet, so I built you a free preview:

${siteUrl}

If you like it, let me know and we can hop on a quick call. — Alex`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const client = new SignalWireClient();

  let to: string | null = null;
  let city: string | null = null;
  let body = "";
  let leadName = "(ad-hoc)";

  if (args.slug) {
    const supabase = makeClient();
    const { data, error } = await supabase
      .from("leads")
      .select("name, phone, site_url, slug, city, owner_first_name")
      .eq("slug", args.slug)
      .maybeSingle<{
        name: string;
        phone: string | null;
        site_url: string | null;
        slug: string;
        city: string;
        owner_first_name: string | null;
      }>();
    if (error || !data) throw new Error(`Lead not found for slug "${args.slug}"`);
    if (!data.phone) throw new Error(`${data.name} has no phone`);
    if (!data.site_url) throw new Error(`${data.name} has no site_url — run generate-sites first`);
    to = normalizeE164(data.phone);
    city = data.city;
    leadName = data.name;
    body = smsBody(pickFirstName(data), data.site_url);
  } else if (args.phone) {
    to = normalizeE164(args.phone);
    city = "Houston";
    body = args.message ?? "Test SMS from We Did It For You via SignalWire.";
  } else {
    throw new Error("Pass --slug <slug> or --phone <+E164>");
  }

  if (!to) throw new Error("Could not normalize phone to E.164");

  const from = client.pickFromNumber(city);
  if (!from) throw new Error("No SignalWire from-number configured for that city.");

  console.log("─".repeat(60));
  console.log(`Lead:    ${leadName}`);
  console.log(`City:    ${city}`);
  console.log(`From:    ${from}  (SignalWire local)`);
  console.log(`To:      ${to}`);
  console.log("─".repeat(60));
  console.log(body);
  console.log("─".repeat(60));
  console.log(`Length:  ${body.length} chars · ${Math.ceil(body.length / 153)} SMS segment(s)`);

  if (!args.send) {
    console.log("\n[dry-run] Not sent. Re-run with --send to actually transmit.");
    return;
  }

  console.log("\n[send] Calling SignalWire API…");
  const result = await client.sendSms({ from, to, body });
  if (result.ok) {
    console.log(`✓ Sent · sid=${result.sid}`);
    // Optionally write back to Supabase
    if (args.slug) {
      const supabase = makeClient();
      const { error: upErr } = await supabase
        .from("leads")
        .update({
          sms_sent_at: new Date().toISOString(),
          sms_message_id: result.sid,
          sms_body: body,
        })
        .eq("slug", args.slug);
      if (upErr) console.warn(`(DB update failed: ${upErr.message})`);
    }
  } else {
    console.error(`✗ FAILED: ${result.error}`);
    process.exit(1);
  }
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (isMain) {
  main().catch((err) => {
    console.error("[error]", (err as Error).message);
    process.exit(1);
  });
}
