// NameSilo DNS management via API. Used to add DKIM/SPF/DMARC TXT records
// to domains we manage on NameSilo (currently: wediditforyou-biz.com).
//
// NameSilo's API quirks:
//   - Auth: API key as query param (not header)
//   - All requests are GET (yes, even for state changes)
//   - Default response is XML; we request JSON via type=json
//   - The host field is JUST the subdomain (no trailing domain)
//     e.g. for google._domainkey.wediditforyou-biz.com, rrhost=google._domainkey
//   - TTL minimum is 3600 (1 hour)
//
// Usage:
//   npx tsx scripts/namesilo-dns.ts records <domain>
//   npx tsx scripts/namesilo-dns.ts add <domain> <type> <host> <value> [ttl]
//   npx tsx scripts/namesilo-dns.ts delete <domain> <record-id>

import "./load-env";

const NS_BASE = "https://www.namesilo.com/api";

function key(): string {
  const k = process.env.NAMESILO_API_KEY;
  if (!k) throw new Error("NAMESILO_API_KEY not set");
  return k;
}

type DnsRecord = {
  record_id: string;
  type: string;
  host: string;
  value: string;
  ttl: string;
  distance: string;
};

async function callApi<T>(
  endpoint: string,
  params: Record<string, string>,
): Promise<T> {
  const qs = new URLSearchParams({
    version: "1",
    type: "json",
    key: key(),
    ...params,
  });
  const res = await fetch(`${NS_BASE}/${endpoint}?${qs.toString()}`);
  const text = await res.text();
  let data: { reply?: { code?: string; detail?: string } & Record<string, unknown> };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from NameSilo: ${text.slice(0, 200)}`);
  }
  const code = data.reply?.code;
  // NameSilo uses code=300 for success, anything else is an error.
  // Cast covers the case where the API ever returns the code as a number.
  if (String(code) !== "300") {
    throw new Error(
      `NameSilo ${endpoint} failed: code=${code} · ${data.reply?.detail ?? JSON.stringify(data.reply)}`,
    );
  }
  return data.reply as T;
}

async function listRecords(domain: string): Promise<DnsRecord[]> {
  const reply = await callApi<{ resource_record?: DnsRecord | DnsRecord[] }>(
    "dnsListRecords",
    { domain },
  );
  const rr = reply.resource_record;
  if (!rr) return [];
  // NameSilo returns a single object for one record, array for multiple
  return Array.isArray(rr) ? rr : [rr];
}

async function addRecord(
  domain: string,
  type: string,
  host: string,
  value: string,
  ttl = 3600,
): Promise<{ ok: boolean; record_id?: string; error?: string }> {
  try {
    const reply = await callApi<{ record_id?: string }>("dnsAddRecord", {
      domain,
      rrtype: type,
      rrhost: host,
      rrvalue: value,
      rrttl: String(ttl),
    });
    return { ok: true, record_id: reply.record_id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function deleteRecord(
  domain: string,
  recordId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await callApi("dnsDeleteRecord", { domain, rrid: recordId });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function main() {
  const cmd = process.argv[2];

  if (cmd === "records") {
    const domain = process.argv[3];
    const filter = process.argv[4];
    if (!domain) throw new Error("Usage: records <domain> [filter]");
    const records = await listRecords(domain);
    const filtered = filter
      ? records.filter((r) => r.host.includes(filter) || r.type === filter)
      : records;
    console.log(`${filtered.length} of ${records.length} record(s) on ${domain}:`);
    for (const r of filtered) {
      console.log(`  id=${r.record_id}`);
      console.log(`  [${r.type}] ${r.host}`);
      console.log(`    ${r.value.slice(0, 200)}`);
      console.log("");
    }
    return;
  }

  if (cmd === "add") {
    const domain = process.argv[3];
    const type = process.argv[4];
    const host = process.argv[5];
    const value = process.argv[6];
    const ttl = process.argv[7] ? parseInt(process.argv[7], 10) : 3600;
    if (!domain || !type || !host || !value)
      throw new Error("Usage: add <domain> <type> <host> <value> [ttl]");

    console.log(`Adding to ${domain}: [${type}] ${host} → ${value.slice(0, 60)}${value.length > 60 ? "..." : ""}`);
    const result = await addRecord(domain, type, host, value, ttl);
    if (result.ok) console.log(`✓ added (id=${result.record_id})`);
    else console.error(`✗ ${result.error}`);
    return;
  }

  if (cmd === "delete") {
    const domain = process.argv[3];
    const recordId = process.argv[4];
    if (!domain || !recordId) throw new Error("Usage: delete <domain> <record-id>");
    const result = await deleteRecord(domain, recordId);
    if (result.ok) console.log(`✓ deleted ${recordId}`);
    else console.error(`✗ ${result.error}`);
    return;
  }

  console.log("Commands:");
  console.log("  records <domain> [filter]              — list DNS records");
  console.log("  add <domain> <type> <host> <value>     — add a DNS record");
  console.log("  delete <domain> <record-id>            — delete a DNS record");
}

main().catch((err) => {
  console.error("[error]", (err as Error).message);
  process.exit(1);
});
