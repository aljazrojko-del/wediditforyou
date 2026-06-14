// Resend wrapper — send a short delivery email containing a site link.
// Used by /api/outreach/send-link as a fallback channel when SMS fails or
// when the prospect prefers email.
//
// Env:
//   RESEND_API_KEY    — from resend.com dashboard
//   RESEND_FROM_EMAIL — e.g. "Alex <alex@wedidit4you.com>" (domain must be verified)

import { Resend } from "resend";

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type SendLinkEmailArgs = {
  to: string;
  firstName: string;
  siteUrl: string;
  /** Optional override of the body text. If omitted, uses the default template. */
  body?: string;
  /** Optional subject. Default: "Your wediditforyou preview site". */
  subject?: string;
};

const DEFAULT_SUBJECT = "Your wediditforyou preview site";

function defaultBody(firstName: string, siteUrl: string): string {
  return `Hi ${firstName},

Here's the link to the site I built for you:

${siteUrl}

Take a look whenever you have 2 minutes. If you want it live with your own domain, just reply and we'll hop on a 15-minute call to point your photos, phone number, and colors at it.

If you don't want it, no hard feelings — keep the draft, no charge.

— Alex
wediditforyou`;
}

export async function sendLinkEmail(args: SendLinkEmailArgs): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
  if (!from) return { ok: false, error: "RESEND_FROM_EMAIL not set" };

  const resend = new Resend(apiKey);
  const subject = args.subject ?? DEFAULT_SUBJECT;
  const text = args.body ?? defaultBody(args.firstName, args.siteUrl);

  try {
    const result = await resend.emails.send({
      from,
      to: args.to,
      subject,
      text,
    });
    if (result.error) {
      return { ok: false, error: `${result.error.name}: ${result.error.message}` };
    }
    return { ok: true, id: result.data?.id ?? "unknown" };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export function isValidEmail(s: string | null | undefined): boolean {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
