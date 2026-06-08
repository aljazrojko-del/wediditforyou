// Welcome SMS sent immediately after a successful Stripe payment.
// Uses SignalWire (our verified A2P channel) routed by the lead's city.

import type { SupabaseClient } from "@supabase/supabase-js";
import { SignalWireClient } from "./signalwire-client";
import { pickFirstName, normalizeE164 } from "./outreach";

const SITE_BASE = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";

type WelcomeLead = {
  id: string;
  name: string;
  phone: string | null;
  city: string;
  owner_first_name: string | null;
  site_url: string | null;
  customer_admin_token: string | null;
  welcome_sms_sent_at: string | null;
};

export type WelcomeResult = {
  ok: boolean;
  sid?: string;
  error?: string;
  skipped?: "no-phone" | "no-token" | "already-sent";
};

export async function sendWelcomeSms(
  leadId: string,
  supabase: SupabaseClient,
): Promise<WelcomeResult> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, name, phone, city, owner_first_name, site_url, customer_admin_token, welcome_sms_sent_at",
    )
    .eq("id", leadId)
    .maybeSingle<WelcomeLead>();
  if (error || !data) return { ok: false, error: error?.message ?? "lead not found" };
  if (data.welcome_sms_sent_at) return { ok: false, skipped: "already-sent" };
  if (!data.phone) return { ok: false, skipped: "no-phone" };
  if (!data.customer_admin_token) return { ok: false, skipped: "no-token" };

  const to = normalizeE164(data.phone);
  if (!to) return { ok: false, error: "phone could not be normalized" };

  let client: SignalWireClient;
  try {
    client = new SignalWireClient();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const from = client.pickFromNumber(data.city);
  if (!from) return { ok: false, error: "no SignalWire from-number for city" };

  const firstName = pickFirstName(data);
  const customerLink = `${SITE_BASE}/my-site/${data.customer_admin_token}`;
  const body = `Hi ${firstName}, Alex from We Did It For You. Thanks for the order! Your preview is at ${data.site_url ?? "sites.wedidit4you.com"}. Edit anything (hours, services, photos) here: ${customerLink} — Reply STOP to opt out.`;

  const res = await client.sendSms({ from, to, body });
  if (!res.ok) return { ok: false, error: res.error };

  await supabase
    .from("leads")
    .update({
      welcome_sms_sent_at: new Date().toISOString(),
      welcome_sms_id: res.sid,
    })
    .eq("id", data.id);

  return { ok: true, sid: res.sid };
}
