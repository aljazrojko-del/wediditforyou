// One-time setup: add DMARC TXT records to all sending domains via Porkbun API.
// Idempotent — checks for existing _dmarc record first, skips if already present.
//
// Usage:
//   npx tsx scripts/setup-dmarc.ts
//   npx tsx scripts/setup-dmarc.ts --dry      (preview only, no writes)

import "./load-env";

const PB_BASE = "https://api.porkbun.com/api/json/v3";

const DOMAINS = [
  "getmysite-now.com",
  "wdify-outreach.com",
  "wediditforyou-biz.com",
  "wedidit4you-mail.com",
  "wdify-sites.com",
];

const DMARC_VALUE = "v=DMARC1; p=none; rua=mailto:info@wedidit4you.com;";

type PbAuth = { apikey: string; secretapikey: string };

function auth(): PbAuth {
  const apikey = process.env.PORKBUN_API_KEY;
  const secretapikey = process.env.PORKBUN_SECRET_KEY;
  if (!apikey || !secretapikey) throw new Error("PORKBUN env not set");
  return { apikey, secretapikey };
}

type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: string;
};

async function retrieve(domain: string): Promise<{
  ok: boolean;
  records?: DnsRecord[];
  error?: string;
}> {
  try {
    const res = await fetch(`${PB_BASE}/dns/retrieve/${domain}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auth()),
    });
    const data = (await res.json()) as {
      status: string;
      records?: DnsRecord[];
      message?: string;
    };
    if (data.status !== "SUCCESS")
      return { ok: false, error: data.message ?? "retrieve failed" };
    return { ok: true, records: data.records ?? [] };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function create(
  domain: string,
  patch: { type: string; name: string; content: string; ttl: string },
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(`${PB_BASE}/dns/create/${domain}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...auth(), ...patch }),
    });
    const data = (await res.json()) as {
      status: string;
      id?: string;
      message?: string;
    };
    if (data.status !== "SUCCESS")
      return { ok: false, error: data.message ?? "create failed" };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function main() {
  const dry = process.argv.includes("--dry");
  console.log(`DMARC setup — ${DOMAINS.length} domain(s) · ${dry ? "DRY-RUN" : "LIVE"}`);
  console.log(`Record: ${DMARC_VALUE}`);
  console.log("─".repeat(60));

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const domain of DOMAINS) {
    const dmarcHost = `_dmarc.${domain}`;
    process.stdout.write(`${domain.padEnd(28)} `);

    const existing = await retrieve(domain);
    if (!existing.ok) {
      console.log(`✗ retrieve failed: ${existing.error}`);
      failed++;
      continue;
    }

    const hasDmarc = (existing.records ?? []).some(
      (r) => r.type === "TXT" && r.name === dmarcHost,
    );
    if (hasDmarc) {
      console.log("• already set, skipping");
      skipped++;
      continue;
    }

    if (dry) {
      console.log("[dry] would add TXT _dmarc");
      continue;
    }

    const result = await create(domain, {
      type: "TXT",
      name: "_dmarc",
      content: DMARC_VALUE,
      ttl: "600",
    });
    if (result.ok) {
      console.log(`✓ added (id=${result.id})`);
      added++;
    } else {
      console.log(`✗ ${result.error}`);
      failed++;
    }
    // Be polite to the API
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("─".repeat(60));
  console.log(`Done. ${added} added · ${skipped} already set · ${failed} failed`);
}

main().catch((err) => {
  console.error("[error]", (err as Error).message);
  process.exit(1);
});
