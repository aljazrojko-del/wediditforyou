// Dumps all TXT records on a given Porkbun-managed domain so we can see
// which DKIM selectors are configured (or missing).

import "./load-env";

const PB_BASE = "https://api.porkbun.com/api/json/v3";

async function main() {
  const domain = process.argv[2];
  if (!domain) {
    console.error("Usage: tsx scripts/check-dkim.ts <domain>");
    process.exit(1);
  }
  const apikey = process.env.PORKBUN_API_KEY;
  const secretapikey = process.env.PORKBUN_SECRET_KEY;
  if (!apikey || !secretapikey) {
    console.error("PORKBUN env not set");
    process.exit(1);
  }

  const res = await fetch(`${PB_BASE}/dns/retrieve/${domain}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey, secretapikey }),
  });
  const data = (await res.json()) as {
    status: string;
    records?: Array<{ id: string; name: string; type: string; content: string }>;
    message?: string;
  };
  if (data.status !== "SUCCESS") {
    console.error("API error:", data.message);
    process.exit(1);
  }

  const records = data.records ?? [];
  console.log(`\n${records.length} record(s) on ${domain}:\n`);

  const interesting = records.filter(
    (r) =>
      r.type === "TXT" ||
      r.type === "MX" ||
      r.name.includes("_domainkey") ||
      r.name === domain ||
      r.name.startsWith("_dmarc"),
  );

  for (const r of interesting) {
    const content =
      r.content.length > 80 ? r.content.slice(0, 77) + "..." : r.content;
    console.log(`  [${r.type.padEnd(5)}] ${r.name.padEnd(40)} → ${content}`);
  }

  console.log("\nLooking for common DKIM selectors:");
  const selectors = [
    "default",
    "google",
    "smartlead",
    "s1",
    "s2",
    "k1",
    "k2",
    "mail",
    "selector1",
    "selector2",
  ];
  for (const s of selectors) {
    const fullName = `${s}._domainkey.${domain}`;
    const found = records.find(
      (r) =>
        r.name === fullName || r.name === `${s}._domainkey` || r.name.includes(s),
    );
    console.log(`  ${s.padEnd(12)} → ${found ? "✓ FOUND" : "✗ missing"}`);
  }
}

main().catch((err) => {
  console.error("[error]", (err as Error).message);
  process.exit(1);
});
