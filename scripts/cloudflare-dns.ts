// Cloudflare DNS management via API. Used to add DKIM/SPF/DMARC TXT records
// to domains we manage on Cloudflare (getmysite-now.com, wdify-outreach.com).
//
// Usage:
//   npx tsx scripts/cloudflare-dns.ts list
//   npx tsx scripts/cloudflare-dns.ts add <domain> <type> <name> <value> [ttl]
//   npx tsx scripts/cloudflare-dns.ts records <domain>

import "./load-env";

const CF_BASE = "https://api.cloudflare.com/client/v4";

function auth() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN not set");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

type Zone = { id: string; name: string; status: string };

async function listZones(): Promise<Zone[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const url = accountId
    ? `${CF_BASE}/zones?account.id=${accountId}&per_page=50`
    : `${CF_BASE}/zones?per_page=50`;
  const res = await fetch(url, { headers: auth() });
  const data = await res.json();
  if (!data.success)
    throw new Error(`list zones failed: ${JSON.stringify(data.errors)}`);
  return data.result as Zone[];
}

async function findZone(domain: string): Promise<Zone | null> {
  const zones = await listZones();
  return zones.find((z) => z.name === domain.toLowerCase()) ?? null;
}

async function listRecords(zoneId: string): Promise<Array<{ id: string; name: string; type: string; content: string }>> {
  const res = await fetch(`${CF_BASE}/zones/${zoneId}/dns_records?per_page=200`, {
    headers: auth(),
  });
  const data = await res.json();
  if (!data.success)
    throw new Error(`list records failed: ${JSON.stringify(data.errors)}`);
  return data.result;
}

async function createRecord(
  zoneId: string,
  patch: { type: string; name: string; content: string; ttl?: number },
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const res = await fetch(`${CF_BASE}/zones/${zoneId}/dns_records`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ ttl: 600, ...patch }),
  });
  const data = await res.json();
  if (!data.success)
    return { ok: false, error: JSON.stringify(data.errors) };
  return { ok: true, id: data.result.id };
}

async function deleteRecord(
  zoneId: string,
  recordId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${CF_BASE}/zones/${zoneId}/dns_records/${recordId}`, {
    method: "DELETE",
    headers: auth(),
  });
  const data = await res.json();
  if (!data.success)
    return { ok: false, error: JSON.stringify(data.errors) };
  return { ok: true };
}

async function main() {
  const cmd = process.argv[2];

  if (cmd === "list") {
    const zones = await listZones();
    console.log(`${zones.length} zone(s):`);
    for (const z of zones) console.log(`  ${z.name.padEnd(30)} ${z.status} id=${z.id}`);
    return;
  }

  if (cmd === "records") {
    const domain = process.argv[3];
    const filter = process.argv[4];
    if (!domain) throw new Error("Usage: records <domain> [name-filter]");
    const zone = await findZone(domain);
    if (!zone) throw new Error(`Zone "${domain}" not found`);
    const records = await listRecords(zone.id);
    const filtered = filter
      ? records.filter((r) => r.name.includes(filter) || r.type === filter)
      : records;
    console.log(`${filtered.length} of ${records.length} record(s) on ${domain}:`);
    for (const r of filtered) {
      console.log(`  id=${r.id}`);
      console.log(`  [${r.type}] ${r.name}`);
      console.log(`    ${r.content.slice(0, 200)}`);
      console.log("");
    }
    return;
  }

  if (cmd === "delete") {
    const domain = process.argv[3];
    const recordId = process.argv[4];
    if (!domain || !recordId)
      throw new Error("Usage: delete <domain> <record-id>");
    const zone = await findZone(domain);
    if (!zone) throw new Error(`Zone "${domain}" not found`);
    const result = await deleteRecord(zone.id, recordId);
    if (result.ok) console.log(`✓ deleted ${recordId}`);
    else console.error(`✗ ${result.error}`);
    return;
  }

  if (cmd === "add") {
    const domain = process.argv[3];
    const type = process.argv[4];
    const name = process.argv[5];
    const value = process.argv[6];
    const ttl = process.argv[7] ? parseInt(process.argv[7], 10) : 600;
    if (!domain || !type || !name || !value)
      throw new Error("Usage: add <domain> <type> <name> <value> [ttl]");

    const zone = await findZone(domain);
    if (!zone) throw new Error(`Zone "${domain}" not found`);
    console.log(`Zone: ${zone.name} (${zone.id})`);

    // Cloudflare wants the full FQDN as the name. If the name doesn't include
    // the domain, append it.
    const fullName = name.endsWith(domain) ? name : `${name}.${domain}`;
    console.log(`Adding: [${type}] ${fullName} → ${value.slice(0, 60)}${value.length > 60 ? "..." : ""}`);

    const result = await createRecord(zone.id, {
      type,
      name: fullName,
      content: value,
      ttl,
    });
    if (result.ok) console.log(`✓ added (id=${result.id})`);
    else console.error(`✗ ${result.error}`);
    return;
  }

  console.log("Commands:");
  console.log("  list                                 — list zones");
  console.log("  records <domain>                     — list DNS records on a domain");
  console.log("  add <domain> <type> <name> <value>   — add a DNS record");
}

main().catch((err) => {
  console.error("[error]", (err as Error).message);
  process.exit(1);
});
