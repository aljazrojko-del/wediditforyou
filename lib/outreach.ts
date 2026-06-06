// Shared outreach helpers used by the admin API routes (single-lead SMS/call
// and batch blast). Centralizes the name-picking + body template + DB update so
// the CLI scripts and the cloud UI stay in lockstep.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SignalWireClient } from "./signalwire-client";

const NOT_A_NAME =
  /^(the|best|premier|elite|royal|gold|silver|new|old|first|big|little|mobile|local|bayou|city|greenline|riverside|sunrise|sunset|north|south|east|west|main|grand|pro|professional|auto|limousine|express|premium|quick|fast|reliable|trustworthy|guaranteed|certified|texas|houston|dallas|austin|chicago|atlanta|phoenix|lubbock|miami|seattle|denver|orlando|tampa|nashville|raleigh|brooklyn|manhattan|midtown|downtown|america|american)$/i;

const SITE_BASE = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";

export type LeadForOutreach = {
  id: string; // uuid
  name: string;
  slug: string | null;
  city: string;
  phone: string | null;
  site_url: string | null;
  owner_first_name: string | null;
};

export function pickFirstName(lead: Pick<LeadForOutreach, "name" | "owner_first_name">): string {
  const candidate = (lead.owner_first_name ?? "").trim()
    || lead.name.replace(/[''']s\b/, "").split(/\s+/)[0];
  if (!candidate || !/^[A-Z][a-z]+$/.test(candidate)) return "there";
  if (NOT_A_NAME.test(candidate)) return "there";
  return candidate;
}

export function buildSmsBody(firstName: string, siteUrl: string): string {
  return `Hi ${firstName}, Alex from We Did It For You. Saw you don't have a website yet, so I built you a free preview:

${siteUrl}

If you like it, let me know and we can hop on a quick call. — Alex`;
}

export function normalizeE164(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/[^0-9]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (/^\+[1-9]\d{7,14}$/.test(input.trim())) return input.trim();
  return null;
}

export function getServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export type SendResult = {
  ok: boolean;
  sid?: string;
  error?: string;
  skipped?: "no-phone" | "no-site" | "already-sent";
};

export async function sendSmsToLead(
  lead: LeadForOutreach,
  client: SignalWireClient,
  supabase: SupabaseClient,
  opts: { skipIfSent?: boolean } = {},
): Promise<SendResult> {
  if (!lead.phone) return { ok: false, skipped: "no-phone" };
  if (!lead.site_url) return { ok: false, skipped: "no-site" };
  const to = normalizeE164(lead.phone);
  if (!to) return { ok: false, error: "Phone could not be normalized" };

  const from = client.pickFromNumber(lead.city);
  if (!from) return { ok: false, error: "No SignalWire from-number for city" };

  const body = buildSmsBody(pickFirstName(lead), lead.site_url);
  const res = await client.sendSms({ from, to, body });
  if (!res.ok) return { ok: false, error: res.error };

  await supabase
    .from("leads")
    .update({
      sms_sent_at: new Date().toISOString(),
      sms_message_id: res.sid,
      sms_body: body,
    })
    .eq("id", lead.id);

  return { ok: true, sid: res.sid };
}

export type CallResult = {
  ok: boolean;
  sid?: string;
  status?: string;
  error?: string;
  skipped?: "no-phone" | "no-slug";
};

export async function placeCallToLead(
  lead: LeadForOutreach,
  client: SignalWireClient,
  supabase: SupabaseClient,
): Promise<CallResult> {
  if (!lead.phone) return { ok: false, skipped: "no-phone" };
  if (!lead.slug) return { ok: false, skipped: "no-slug" };
  const to = normalizeE164(lead.phone);
  if (!to) return { ok: false, error: "Phone could not be normalized" };

  const from = client.pickFromNumber(lead.city);
  if (!from) return { ok: false, error: "No SignalWire from-number for city" };

  const twimlUrl = `${SITE_BASE}/api/twiml/call/${lead.slug}`;

  const res = await client.makeCall({ from, to, twimlUrl });
  if (!res.ok) return { ok: false, error: res.error };

  await supabase
    .from("leads")
    .update({
      call_placed_at: new Date().toISOString(),
      call_sid: res.sid,
      call_status: res.status,
    })
    .eq("id", lead.id);

  return { ok: true, sid: res.sid, status: res.status };
}
