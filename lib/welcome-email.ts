// Welcome email sent immediately after a successful Stripe payment.
// Mirrors lib/welcome.ts (which handles SMS) but sends via SMTP so the
// customer also gets a written confirmation they can refer back to.
//
// Idempotency: gated by leads.welcome_email_sent_at column (mirror of
// welcome_sms_sent_at). Safe against duplicate webhook deliveries.
//
// Migration needed (one-time):
//   ALTER TABLE leads
//     ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz,
//     ADD COLUMN IF NOT EXISTS welcome_email_id text;

import type { SupabaseClient } from "@supabase/supabase-js";
import { pickFirstName } from "./outreach";
import { sendLinkEmail, isValidEmail } from "./email";

const SITE_BASE = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";

type WelcomeLead = {
  id: string;
  name: string;
  email: string | null;
  city: string;
  owner_first_name: string | null;
  site_url: string | null;
  customer_admin_token: string | null;
  welcome_email_sent_at: string | null;
};

export type WelcomeEmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: "no-email" | "invalid-email" | "no-token" | "already-sent";
};

export async function sendWelcomeEmail(
  leadId: string,
  supabase: SupabaseClient,
): Promise<WelcomeEmailResult> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, name, email, city, owner_first_name, site_url, customer_admin_token, welcome_email_sent_at",
    )
    .eq("id", leadId)
    .maybeSingle<WelcomeLead>();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "lead not found" };
  }
  if (data.welcome_email_sent_at) return { ok: false, skipped: "already-sent" };
  if (!data.email) return { ok: false, skipped: "no-email" };
  if (!isValidEmail(data.email)) return { ok: false, skipped: "invalid-email" };
  if (!data.customer_admin_token) return { ok: false, skipped: "no-token" };

  const firstName = pickFirstName(data);
  const customerLink = `${SITE_BASE}/my-site/${data.customer_admin_token}`;
  const sitePreview = data.site_url ?? "https://sites.wedidit4you.com";

  const subject = "Thanks for the order — your site is being prepared";
  const body = `Hi ${firstName},

Payment received — thank you. Here's what happens next:

1. Your preview site is here:
   ${sitePreview}

2. Anything you want changed (hours, services, photos, phone number), tell me here:
   ${customerLink}

3. Once you've reviewed it and we've made any edits you want, your site goes live on your own domain within 24 hours of your final OK.

If you don't have a domain yet, no worries — we'll register one for you (cost included).

I'll text you the moment your site is live on your domain.

Talk soon,
— Alex
wediditforyou`;

  const res = await sendLinkEmail({
    to: data.email,
    firstName,
    siteUrl: sitePreview,
    subject,
    body,
  });

  if (!res.ok) return { ok: false, error: res.error };

  await supabase
    .from("leads")
    .update({
      welcome_email_sent_at: new Date().toISOString(),
      welcome_email_id: res.id,
    })
    .eq("id", data.id);

  return { ok: true, id: res.id };
}
