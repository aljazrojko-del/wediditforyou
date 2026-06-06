// One-time setup: point all SignalWire numbers at our public TwiML endpoints.
//
// Voice URL  → https://wedidit4you.com/api/twiml/inbound  (rings Alex's phone)
// SMS URL    → https://wedidit4you.com/api/twiml/sms      (logs + auto-reply)
// Labels each number with its city for sanity.
//
// Usage:
//   npm run configure-signalwire-numbers
//   npm run configure-signalwire-numbers -- --dry        (preview only)
//   npm run configure-signalwire-numbers -- --greet      (add greeting before connect)

import "./load-env";
import { fileURLToPath } from "node:url";

const SITE_BASE = process.env.SITE_BASE ?? "https://wedidit4you.com";

type Opts = { dry: boolean; greet: boolean };

const CITY_LABELS: Array<{ envKey: string; city: string }> = [
  { envKey: "SIGNALWIRE_PHONE_HOUSTON",   city: "Houston" },
  { envKey: "SIGNALWIRE_PHONE_PHOENIX",   city: "Phoenix" },
  { envKey: "SIGNALWIRE_PHONE_DALLAS",    city: "Dallas" },
  { envKey: "SIGNALWIRE_PHONE_NASHVILLE", city: "Nashville" },
  { envKey: "SIGNALWIRE_PHONE_CHICAGO",   city: "Chicago" },
];

async function listNumbers(): Promise<Array<{ sid: string; phone_number: string; friendly_name: string }>> {
  const pid = process.env.SIGNALWIRE_PROJECT_ID!;
  const tok = process.env.SIGNALWIRE_TOKEN!;
  const space = process.env.SIGNALWIRE_SPACE_URL!;
  const auth = "Basic " + Buffer.from(`${pid}:${tok}`).toString("base64");
  const r = await fetch(`https://${space}/api/laml/2010-04-01/Accounts/${pid}/IncomingPhoneNumbers.json`, {
    headers: { Authorization: auth },
  });
  if (!r.ok) throw new Error(`listNumbers → ${r.status}`);
  const data = (await r.json()) as { incoming_phone_numbers: Array<{ sid: string; phone_number: string; friendly_name: string }> };
  return data.incoming_phone_numbers ?? [];
}

async function updateNumber(
  sid: string,
  patch: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const pid = process.env.SIGNALWIRE_PROJECT_ID!;
  const tok = process.env.SIGNALWIRE_TOKEN!;
  const space = process.env.SIGNALWIRE_SPACE_URL!;
  const auth = "Basic " + Buffer.from(`${pid}:${tok}`).toString("base64");

  const form = new URLSearchParams(patch);
  const r = await fetch(`https://${space}/api/laml/2010-04-01/Accounts/${pid}/IncomingPhoneNumbers/${sid}.json`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!r.ok) return { ok: false, error: `${r.status}: ${await r.text()}` };
  return { ok: true };
}

async function main(opts: Opts) {
  const numbers = await listNumbers();
  console.log(`Found ${numbers.length} number(s) on the account.\n`);

  const voiceUrl = `${SITE_BASE}/api/twiml/inbound${opts.greet ? "?greet=1" : ""}`;
  const smsUrl = `${SITE_BASE}/api/webhooks/signalwire/sms`;

  for (const num of numbers) {
    // Figure out which city this number belongs to from env mapping.
    let city = "Unknown";
    for (const c of CITY_LABELS) {
      if (process.env[c.envKey] && process.env[c.envKey]!.replace(/[^0-9+]/g, "") === num.phone_number.replace(/[^0-9+]/g, "")) {
        city = c.city;
        break;
      }
    }

    const label = `${city} — wedidit4you`;
    const patch: Record<string, string> = {
      FriendlyName: label,
      VoiceUrl: voiceUrl,
      VoiceMethod: "POST",
      SmsUrl: smsUrl,
      SmsMethod: "POST",
    };

    console.log(`${num.phone_number}  →  label='${label}'`);
    console.log(`  VoiceUrl=${voiceUrl}`);
    console.log(`  SmsUrl=${smsUrl}`);
    if (opts.dry) {
      console.log("  [dry] not updated");
      continue;
    }
    const res = await updateNumber(num.sid, patch);
    if (res.ok) console.log("  ✓ updated");
    else console.error("  ✗ " + res.error);
  }

  console.log("\nDone.");
  console.log(opts.dry ? "" : `\nTest: call any of the 4 numbers from your phone. They will ring ${process.env.INBOUND_FORWARD_TO ?? "+38640878551"}.`);
}

function parseArgs(argv: string[]): Opts {
  const out: Opts = { dry: false, greet: false };
  for (const a of argv) {
    if (a === "--dry") out.dry = true;
    if (a === "--greet") out.greet = true;
  }
  return out;
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (isMain) {
  main(parseArgs(process.argv.slice(2))).catch((err) => {
    console.error("[error]", (err as Error).message);
    process.exit(1);
  });
}
