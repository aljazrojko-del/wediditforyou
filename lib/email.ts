// SMTP sender — sends a short delivery email containing a site link.
// Sends from info@wedidit4you.com directly via the mailbox's SMTP server,
// no third-party transactional provider needed. Same mailbox the prospect
// will see if they reply.
//
// Env (in .env.local + Vercel production):
//   SMTP_HOST       — e.g. smtp.zoho.com / smtp.gmail.com / smtp.office365.com
//   SMTP_PORT       — usually 465 (SSL) or 587 (STARTTLS)
//   SMTP_SECURE     — "true" for port 465, "false" for 587 (default: based on port)
//   SMTP_USER       — full mailbox address, e.g. info@wedidit4you.com
//   SMTP_PASSWORD   — mailbox password OR app-specific password (NEVER paste in chat)
//   SMTP_FROM_NAME  — display name, e.g. "Alex from WediditForYou"
//   SMTP_FROM_EMAIL — sender address (usually same as SMTP_USER)

import nodemailer, { type Transporter } from "nodemailer";

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
  /** Optional reply-to override. */
  replyTo?: string;
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

// Cache the transporter across warm invocations
let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !portStr || !user || !password) return null;

  const port = Number(portStr);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    (process.env.SMTP_SECURE !== "false" && port === 465);

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
  });
  return cachedTransporter;
}

function buildFrom(): string {
  const name = process.env.SMTP_FROM_NAME ?? "Alex";
  const email = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? "";
  // RFC 5322 friendly display name
  return `"${name.replace(/"/g, "")}" <${email}>`;
}

export async function sendLinkEmail(args: SendLinkEmailArgs): Promise<EmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      ok: false,
      error: "SMTP not configured (need SMTP_HOST/PORT/USER/PASSWORD in env)",
    };
  }

  const from = buildFrom();
  const subject = args.subject ?? DEFAULT_SUBJECT;
  const text = args.body ?? defaultBody(args.firstName, args.siteUrl);

  try {
    const info = await transporter.sendMail({
      from,
      to: args.to,
      subject,
      text,
      replyTo: args.replyTo ?? process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER,
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export function isValidEmail(s: string | null | undefined): boolean {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
