// Sends a one-off test email to verify the SMTP infrastructure works.
// Usage: npx tsx scripts/test-send-email.ts <to-email>

import "./load-env";
import { sendLinkEmail } from "../lib/email";

async function main() {
  const to = process.argv[2] ?? "info@wedidit4you.com";
  const siteUrl = process.argv[3] ?? "https://sites.wedidit4you.com/aaron-mobile-mechanic-houston-tx";
  const firstName = process.argv[4] ?? "Aljaz";

  console.log(`Sending to: ${to}`);
  console.log(`Site URL:   ${siteUrl}`);
  console.log("");

  const result = await sendLinkEmail({
    to,
    firstName,
    siteUrl,
    subject: "Test: preview link from wediditforyou (build verification)",
    body: `Hi ${firstName},

This is a test send to verify the SMTP infrastructure is working end-to-end.

Preview site (current text update is live, color theme update coming next):
${siteUrl}

If you're reading this, the email pipeline works: nodemailer → SMTP → your inbox.

— Alex
wediditforyou`,
  });

  if (result.ok) {
    console.log(`✓ Sent — message id: ${result.id}`);
  } else {
    console.log(`✗ Failed: ${result.error}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[error]", (e as Error).message);
  process.exit(1);
});
