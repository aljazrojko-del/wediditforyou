// Point all 5 SignalWire numbers at the /api/twiml/sip-forward route so
// incoming calls ring Zoiper on Alex's phone instead of burning international
// minutes to the Slovenian mobile.
//
// Run with:
//   npx tsx scripts/setup-sip-forwarding.ts            # dry-run, shows changes
//   npx tsx scripts/setup-sip-forwarding.ts --apply    # actually mutates
//   npx tsx scripts/setup-sip-forwarding.ts --revert   # restores INBOUND_FORWARD_TO route
//
// Env required (in .env.local):
//   SIGNALWIRE_PROJECT_ID
//   SIGNALWIRE_TOKEN
//   SIGNALWIRE_SPACE_URL
//   SITE_ORIGIN              — e.g. https://wedidit4you.com (where the TwiML route lives)
//   SIP_FORWARD_USERNAME     — e.g. "alex" (whatever you set in SignalWire console)
//   SIP_FORWARD_DOMAIN       — e.g. "yourspace.sip.signalwire.com"
//   SIGNALWIRE_PHONE_HOUSTON, SIGNALWIRE_PHONE_PHOENIX, etc. — the 5 numbers

import "dotenv/config";

const PROJECT = process.env.SIGNALWIRE_PROJECT_ID ?? "";
const TOKEN = process.env.SIGNALWIRE_TOKEN ?? "";
const SPACE = process.env.SIGNALWIRE_SPACE_URL ?? "";
const ORIGIN = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";
const SIP_USER = process.env.SIP_FORWARD_USERNAME ?? "";
const SIP_DOMAIN = process.env.SIP_FORWARD_DOMAIN ?? "";

const PHONE_ENV_KEYS = [
  "SIGNALWIRE_PHONE_HOUSTON",
  "SIGNALWIRE_PHONE_PHOENIX",
  "SIGNALWIRE_PHONE_DALLAS",
  "SIGNALWIRE_PHONE_NASHVILLE",
  "SIGNALWIRE_PHONE_CHICAGO",
];

const SIP_FORWARD_URL = `${ORIGIN}/api/twiml/sip-forward`;
const NUMBER_FORWARD_URL = `${ORIGIN}/api/twiml/inbound`; // existing route for revert

function exitWithMissing(label: string) {
  console.error(`Missing ${label} in .env.local — aborting.`);
  process.exit(1);
}

if (!PROJECT) exitWithMissing("SIGNALWIRE_PROJECT_ID");
if (!TOKEN) exitWithMissing("SIGNALWIRE_TOKEN");
if (!SPACE) exitWithMissing("SIGNALWIRE_SPACE_URL");

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const revert = args.has("--revert");
const targetUrl = revert ? NUMBER_FORWARD_URL : SIP_FORWARD_URL;
const modeLabel = revert ? "REVERT to number forwarding" : "SIP forwarding (Zoiper)";

if (!revert && (!SIP_USER || !SIP_DOMAIN)) {
  exitWithMissing("SIP_FORWARD_USERNAME and SIP_FORWARD_DOMAIN (needed unless --revert)");
}

const authHeader =
  "Basic " + Buffer.from(`${PROJECT}:${TOKEN}`).toString("base64");
const baseUrl = `https://${SPACE}/api/laml/2010-04-01/Accounts/${PROJECT}`;

type IncomingNumber = {
  sid: string;
  phone_number: string;
  friendly_name?: string;
  voice_url?: string;
  voice_method?: string;
};

async function listIncomingNumbers(): Promise<IncomingNumber[]> {
  const res = await fetch(`${baseUrl}/IncomingPhoneNumbers.json?PageSize=100`, {
    headers: { Authorization: authHeader, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`SignalWire list failed: ${res.status} ${await res.text()}`);
  }
  const data: { incoming_phone_numbers: IncomingNumber[] } = await res.json();
  return data.incoming_phone_numbers ?? [];
}

async function updateNumber(sid: string, voiceUrl: string): Promise<IncomingNumber> {
  const body = new URLSearchParams({
    VoiceUrl: voiceUrl,
    VoiceMethod: "POST",
  });
  const res = await fetch(`${baseUrl}/IncomingPhoneNumbers/${sid}.json`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(
      `SignalWire update ${sid} failed: ${res.status} ${await res.text()}`,
    );
  }
  return res.json();
}

function normalize(e164: string): string {
  return e164.replace(/[^\d+]/g, "");
}

async function main() {
  console.log(`Mode: ${modeLabel}`);
  console.log(`Target voice URL: ${targetUrl}`);
  if (!apply) console.log(`(dry run — pass --apply to mutate)`);
  console.log();

  // 1. Get the list of all our numbers from env
  const targetNumbers = PHONE_ENV_KEYS
    .map((k) => ({ key: k, e164: process.env[k] }))
    .filter((x): x is { key: string; e164: string } => Boolean(x.e164))
    .map((x) => ({ key: x.key, e164: normalize(x.e164) }));

  if (targetNumbers.length === 0) {
    console.error("No SIGNALWIRE_PHONE_* env vars set. Nothing to do.");
    process.exit(1);
  }

  // 2. Fetch all numbers from SignalWire and match by phone number
  const allNumbers = await listIncomingNumbers();
  const bySid = new Map<string, IncomingNumber>();
  for (const n of allNumbers) bySid.set(normalize(n.phone_number), n);

  // 3. Plan + execute
  const plan: Array<{
    key: string;
    e164: string;
    sid: string;
    from: string;
    to: string;
    skipped?: string;
  }> = [];

  for (const t of targetNumbers) {
    const match = bySid.get(t.e164);
    if (!match) {
      plan.push({
        key: t.key,
        e164: t.e164,
        sid: "(not found)",
        from: "",
        to: targetUrl,
        skipped: "number not in this SignalWire account",
      });
      continue;
    }
    const currentUrl = match.voice_url ?? "(none)";
    if (currentUrl === targetUrl) {
      plan.push({
        key: t.key,
        e164: t.e164,
        sid: match.sid,
        from: currentUrl,
        to: targetUrl,
        skipped: "already configured",
      });
      continue;
    }
    plan.push({
      key: t.key,
      e164: t.e164,
      sid: match.sid,
      from: currentUrl,
      to: targetUrl,
    });
  }

  console.log("Plan:");
  for (const p of plan) {
    const marker = p.skipped ? "·" : "→";
    console.log(`  ${marker} ${p.key.padEnd(26)} ${p.e164.padEnd(14)} ${p.sid}`);
    if (p.skipped) console.log(`     skipped: ${p.skipped}`);
    else console.log(`     from: ${p.from}\n     to:   ${p.to}`);
  }
  console.log();

  if (!apply) {
    console.log("Dry run complete. Re-run with --apply to mutate.");
    return;
  }

  const changes = plan.filter((p) => !p.skipped);
  if (changes.length === 0) {
    console.log("Nothing to apply. All numbers already at target URL.");
    return;
  }

  console.log("Applying...");
  for (const p of changes) {
    try {
      await updateNumber(p.sid, p.to);
      console.log(`  ✓ ${p.key} → updated`);
    } catch (err) {
      console.error(`  ✗ ${p.key} → ${(err as Error).message}`);
    }
  }
  console.log();
  console.log(`Done. ${changes.length} number(s) updated.`);
  console.log();
  console.log("Next: install Zoiper on your phone and register with:");
  console.log(`  Username: ${SIP_USER || "(set SIP_FORWARD_USERNAME)"}`);
  console.log(`  Domain:   ${SIP_DOMAIN || "(set SIP_FORWARD_DOMAIN)"}`);
  console.log(`  Password: (the one you set in SignalWire console — never logged here)`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
