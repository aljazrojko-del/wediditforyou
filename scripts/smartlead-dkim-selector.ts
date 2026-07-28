// Sets the custom DKIM selector on a Smartlead email account.
//
// Smartlead's API:
//   GET  /api/v1/email-accounts/?api_key={KEY}     — list all email accounts
//   POST /api/v1/email-accounts/{id}/save?api_key={KEY}  — update an account
//   POST /api/v1/email-accounts/{id}?api_key={KEY}        — (alternate)
//
// The DKIM-selector field name varies — we try common ones and surface errors.

import "./load-env";

const BASE = "https://server.smartlead.ai/api/v1";

async function listAccounts(): Promise<unknown[]> {
  const key = process.env.SMARTLEAD_API_KEY;
  if (!key) throw new Error("SMARTLEAD_API_KEY not set");
  const res = await fetch(`${BASE}/email-accounts/?api_key=${key}&offset=0&limit=200`);
  const text = await res.text();
  if (!res.ok) throw new Error(`list failed ${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response: ${text.slice(0, 200)}`);
  }
}

async function tryUpdate(
  accountId: string | number,
  body: Record<string, unknown>,
  path: string,
): Promise<{ ok: boolean; status: number; text: string }> {
  const key = process.env.SMARTLEAD_API_KEY;
  const res = await fetch(`${BASE}${path.replace("{id}", String(accountId))}?api_key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function main() {
  const targetEmail = process.argv[2] ?? "brooke@wedidit4you-mail.com";
  const selector = process.argv[3] ?? "default";

  console.log(`Looking for: ${targetEmail}`);
  console.log(`Setting selector: ${selector}\n`);

  const accounts = await listAccounts();
  console.log(`Found ${accounts.length} email account(s) total`);

  const match = (accounts as Array<Record<string, unknown>>).find(
    (a) =>
      (a.from_email as string | undefined)?.toLowerCase() ===
        targetEmail.toLowerCase() ||
      (a.email as string | undefined)?.toLowerCase() === targetEmail.toLowerCase() ||
      (a.smtp_username as string | undefined)?.toLowerCase() ===
        targetEmail.toLowerCase(),
  );

  if (!match) {
    console.error(`\n✗ "${targetEmail}" not found in account list`);
    console.log("\nAvailable accounts (first 15 — searching for email-like fields):");
    for (const a of (accounts as Array<Record<string, unknown>>).slice(0, 15)) {
      console.log(`  id=${a.id} · ${a.from_email ?? a.email ?? a.smtp_username ?? "?"}`);
    }
    process.exit(1);
  }

  const id = match.id as string | number;
  console.log(`✓ Match id=${id}\n`);

  // First — fetch full account details so we know what fields exist
  const key = process.env.SMARTLEAD_API_KEY;
  const detailRes = await fetch(`${BASE}/email-accounts/${id}?api_key=${key}`);
  if (detailRes.ok) {
    const detail = await detailRes.json();
    console.log("Full account fields:");
    console.log(JSON.stringify(detail, null, 2).slice(0, 2000));
    console.log("\n---\n");

    // Look for any DKIM-related field already on the account
    const flat = JSON.stringify(detail);
    const dkimMentions = flat.match(/"[^"]*dkim[^"]*"/gi) ?? [];
    const selectorMentions = flat.match(/"[^"]*selector[^"]*"/gi) ?? [];
    console.log(
      `DKIM-related field names found: ${[...new Set([...dkimMentions, ...selectorMentions])].join(", ") || "(none)"}\n`,
    );
  }

  // Try a wide net of plausible field names. Endpoint /email-accounts/{id} works (we got 400 from it,
  // meaning it parses requests). We just need the right field name.
  const fieldCandidates = [
    "custom_dkim_selector",
    "dkim_selector",
    "dkim_signing_selector",
    "dkim_dns_selector",
    "smtp_dkim_selector",
    "selector",
    "mailbox_dkim_selector",
    "validation_dkim_selector",
    "dkim_signature_selector",
    "dns_dkim_selector",
  ];

  for (const field of fieldCandidates) {
    const body = { [field]: selector };
    console.log(`Try field "${field}"`);
    const r = await tryUpdate(id, body, "/email-accounts/{id}");
    const snippet = r.text.slice(0, 200);
    console.log(`  ${r.status} → ${snippet}`);
    if (r.ok && !snippet.toLowerCase().includes("error")) {
      console.log(`\n✓ Success with field "${field}"`);
      return;
    }
  }

  console.log("\n✗ No working field name found. Update via Smartlead UI.");
}

main().catch((err) => {
  console.error("[error]", (err as Error).message);
  process.exit(1);
});
