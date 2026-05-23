import "./load-env";
import { WdifyOpsClient } from "../lib/wdify-ops-client";

const HOST = "https://wediditforyou-dashboard-lemon.vercel.app";

async function main() {
  const client = new WdifyOpsClient({
    username: process.env.WDIFY_OPS_USERNAME!,
    password: process.env.WDIFY_OPS_PASSWORD!,
  });
  await client.login();
  const token = (client as unknown as { token: string }).token;

  const count = async (search: string) => {
    const res = await fetch(
      `${HOST}/command-api/api/v1/leads?search=${encodeURIComponent(search)}&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return ((await res.json()) as { total: number }).total;
  };

  // Focus niches
  const queries = [
    "mobile mechanic",
    "mobile auto",
    "auto mechanic",
    "mobile dog groomer",
    "dog groomer",
    "mobile groomer",
    "pet grooming",
    "tutor",
    "tutoring",
    "math tutor",
    "music teacher",
    // Adjacent niches that ARE well-represented
    "plumber",
    "plumbing",
    "electrician",
    "hvac",
    "roofing",
    "painting",
    "pressure washing",
    "landscaping",
    "lawn care",
  ];

  console.log("Total leads per search:\n");
  for (const q of queries) {
    const total = await count(q);
    console.log(`  ${total.toString().padStart(5)}  "${q}"`);
  }

  // Check if there's a way to combine filters
  console.log("\nCombined filter test (search + status):");
  const r = await fetch(
    `${HOST}/command-api/api/v1/leads?search=plumber&status=NEW&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const j = (await r.json()) as { total: number };
  console.log(`  search=plumber & status=NEW → ${j.total} leads`);

  // Check leads with owner_email actually populated
  console.log("\nSample 50 leads with search=plumber — how many have owner_email?");
  const r2 = await fetch(
    `${HOST}/command-api/api/v1/leads?search=plumber&limit=50`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const j2 = (await r2.json()) as { items: { owner_email: string | null; contact_email: string | null; contact_phone: string | null }[] };
  const withOwnerEmail = j2.items.filter((l) => l.owner_email).length;
  const withContactEmail = j2.items.filter((l) => l.contact_email && l.contact_email !== "user@domain.com").length;
  const withPhone = j2.items.filter((l) => l.contact_phone).length;
  console.log(`  with owner_email:    ${withOwnerEmail}/50`);
  console.log(`  with contact_email:  ${withContactEmail}/50 (excluding placeholder)`);
  console.log(`  with contact_phone:  ${withPhone}/50`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
