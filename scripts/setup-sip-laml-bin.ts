// Pure-SignalWire SIP routing — no Vercel/webhook involved.
//
// 1. Creates (or reuses) a LaML Bin in SignalWire containing the SIP-dial XML.
// 2. Points each phone number's VoiceUrl at that bin.
// 3. Result: incoming call → SignalWire serves the bin → Dial SIP → Zoiper rings.
//
// Run:
//   node --env-file=.env.local --import tsx scripts/setup-sip-laml-bin.ts            # dry-run
//   node --env-file=.env.local --import tsx scripts/setup-sip-laml-bin.ts --apply    # mutate
//
// Env required (in .env.local):
//   SIGNALWIRE_PROJECT_ID
//   SIGNALWIRE_TOKEN
//   SIGNALWIRE_SPACE_URL
//   SIP_FORWARD_USERNAME    — e.g. alex-mobile
//   SIP_FORWARD_DOMAIN      — e.g. wedidit4you-bc852a90e7c6.sip.signalwire.com
//   SIGNALWIRE_PHONE_*      — the 5 numbers

const PROJECT = process.env.SIGNALWIRE_PROJECT_ID ?? "";
const TOKEN = process.env.SIGNALWIRE_TOKEN ?? "";
const SPACE = process.env.SIGNALWIRE_SPACE_URL ?? "";
const SIP_USER = process.env.SIP_FORWARD_USERNAME ?? "";
const SIP_DOMAIN = process.env.SIP_FORWARD_DOMAIN ?? "";

const PHONE_ENV_KEYS = [
  "SIGNALWIRE_PHONE_HOUSTON",
  "SIGNALWIRE_PHONE_PHOENIX",
  "SIGNALWIRE_PHONE_DALLAS",
  "SIGNALWIRE_PHONE_NASHVILLE",
  "SIGNALWIRE_PHONE_CHICAGO",
];

const BIN_NAME = "sip-forward-alex-mobile";

function missing(label: string): never {
  console.error(`Missing ${label} in .env.local — aborting.`);
  process.exit(1);
}

if (!PROJECT) missing("SIGNALWIRE_PROJECT_ID");
if (!TOKEN) missing("SIGNALWIRE_TOKEN");
if (!SPACE) missing("SIGNALWIRE_SPACE_URL");
if (!SIP_USER) missing("SIP_FORWARD_USERNAME");
if (!SIP_DOMAIN) missing("SIP_FORWARD_DOMAIN");

const apply = process.argv.includes("--apply");

const auth =
  "Basic " + Buffer.from(`${PROJECT}:${TOKEN}`).toString("base64");
const base = `https://${SPACE}/api/laml/2010-04-01/Accounts/${PROJECT}`;

const SIP_URI = `sip:${SIP_USER}@${SIP_DOMAIN}`;

const BIN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="25" answerOnBridge="true">
    <Sip>${SIP_URI}</Sip>
  </Dial>
  <Say voice="alice">Sorry, we missed your call. Please try again or text this number. Goodbye.</Say>
  <Hangup/>
</Response>`;

type Bin = {
  sid: string;
  name: string;
  contents: string;
  request_url: string;
  date_created: string;
};
type IncomingNumber = {
  sid: string;
  phone_number: string;
  friendly_name?: string;
  voice_url?: string;
  voice_method?: string;
};

async function listBins(): Promise<Bin[]> {
  const res = await fetch(`${base}/LamlBins.json?PageSize=100`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`List LaML Bins failed: ${res.status} ${await res.text()}`);
  }
  const data: { laml_bins?: Bin[] } = await res.json();
  return data.laml_bins ?? [];
}

async function deleteBin(sid: string): Promise<void> {
  const res = await fetch(`${base}/LamlBins/${sid}.json`, {
    method: "DELETE",
    headers: { Authorization: auth },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete bin ${sid} failed: ${res.status} ${await res.text()}`);
  }
}

async function createBin(name: string, contents: string): Promise<Bin> {
  const body = new URLSearchParams({ Name: name, Contents: contents });
  const res = await fetch(`${base}/LamlBins.json`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Create LaML Bin failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function updateBin(sid: string, contents: string): Promise<Bin> {
  const body = new URLSearchParams({ Contents: contents });
  const res = await fetch(`${base}/LamlBins/${sid}.json`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Update LaML Bin ${sid} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function listIncomingNumbers(): Promise<IncomingNumber[]> {
  const res = await fetch(`${base}/IncomingPhoneNumbers.json?PageSize=100`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`List numbers failed: ${res.status} ${await res.text()}`);
  }
  const data: { incoming_phone_numbers: IncomingNumber[] } = await res.json();
  return data.incoming_phone_numbers ?? [];
}

async function updateNumberVoiceUrl(sid: string, voiceUrl: string): Promise<void> {
  const body = new URLSearchParams({ VoiceUrl: voiceUrl, VoiceMethod: "POST" });
  const res = await fetch(`${base}/IncomingPhoneNumbers/${sid}.json`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Update number ${sid} failed: ${res.status} ${await res.text()}`);
  }
}

function normalize(e164: string): string {
  return e164.replace(/[^\d+]/g, "");
}

async function main() {
  console.log(`SIP target: ${SIP_URI}`);
  console.log(`Mode: ${apply ? "APPLY (will mutate)" : "DRY RUN"}`);
  console.log();

  // 1. Find or create the LaML Bin
  console.log("Step 1: ensure LaML Bin exists...");
  const bins = await listBins();
  const matchingBins = bins
    .filter((b) => b.name === BIN_NAME)
    .sort((a, b) => b.date_created.localeCompare(a.date_created));

  let bin: Bin | undefined = matchingBins[0];

  // Clean up duplicates from previous failed runs
  if (matchingBins.length > 1) {
    const orphans = matchingBins.slice(1);
    console.log(`  Found ${matchingBins.length} bins named "${BIN_NAME}" — deleting ${orphans.length} orphan(s)`);
    if (apply) {
      for (const o of orphans) {
        await deleteBin(o.sid);
        console.log(`  ✗ deleted orphan ${o.sid}`);
      }
    }
  }

  if (!bin) {
    console.log(`  Bin "${BIN_NAME}" not found.`);
    if (apply) {
      bin = await createBin(BIN_NAME, BIN_XML);
      console.log(`  ✓ Created bin ${bin.sid}`);
    } else {
      console.log(`  Would create with XML:\n${BIN_XML}\n`);
      console.log("\n(Dry-run can't continue without an existing bin. Re-run with --apply.)");
      return;
    }
  } else {
    console.log(`  Found existing bin ${bin.sid}`);
    if (bin.contents?.trim() !== BIN_XML.trim()) {
      console.log(`  Contents differ — would update.`);
      if (apply) {
        bin = await updateBin(bin.sid, BIN_XML);
        console.log(`  ✓ Updated bin contents`);
      }
    } else {
      console.log(`  Contents already current.`);
    }
  }

  // request_url is the public-facing URL SignalWire serves the bin from.
  // Use this for the phone number's VoiceUrl — NOT the API URL.
  const binUrl = bin.request_url;
  if (!binUrl) {
    throw new Error(`Bin response missing request_url field: ${JSON.stringify(bin)}`);
  }
  console.log(`  Bin URL: ${binUrl}\n`);

  // 2. Plan + apply per-number routing
  console.log("Step 2: point phone numbers at the bin...");
  const targets = PHONE_ENV_KEYS
    .map((k) => ({ key: k, e164: process.env[k] }))
    .filter((x): x is { key: string; e164: string } => Boolean(x.e164))
    .map((x) => ({ key: x.key, e164: normalize(x.e164) }));

  const allNumbers = await listIncomingNumbers();
  const byE164 = new Map<string, IncomingNumber>();
  for (const n of allNumbers) byE164.set(normalize(n.phone_number), n);

  let updated = 0;
  let alreadyOk = 0;
  let missingFromAccount = 0;

  for (const t of targets) {
    const match = byE164.get(t.e164);
    if (!match) {
      console.log(`  · ${t.key.padEnd(26)} ${t.e164.padEnd(14)} not in this SignalWire account`);
      missingFromAccount++;
      continue;
    }
    const current = match.voice_url ?? "(none)";
    if (current === binUrl) {
      console.log(`  · ${t.key.padEnd(26)} ${t.e164.padEnd(14)} already → bin`);
      alreadyOk++;
      continue;
    }
    console.log(`  → ${t.key.padEnd(26)} ${t.e164.padEnd(14)}`);
    console.log(`     from: ${current}`);
    console.log(`     to:   ${binUrl}`);
    if (apply) {
      await updateNumberVoiceUrl(match.sid, binUrl);
      updated++;
    }
  }

  console.log();
  if (apply) {
    console.log(`Done. ${updated} updated · ${alreadyOk} already correct · ${missingFromAccount} missing from account.`);
    console.log();
    console.log("Test now: call any of your SignalWire numbers from your Slovenian mobile.");
    console.log("Zoiper should ring within 2 seconds.");
  } else {
    console.log("Dry run complete. Re-run with --apply to mutate.");
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

export {};
