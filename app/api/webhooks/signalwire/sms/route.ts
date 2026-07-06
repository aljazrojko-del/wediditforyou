// Webhook: SignalWire POSTs here whenever someone sends an SMS to one of our
// numbers. We log every inbound to `inbound_messages` and, when the From phone
// matches an existing lead, bump that lead's inbound counter so it surfaces in
// the admin dashboard.
//
// SignalWire delivers form-encoded fields: From, To, Body, MessageSid, etc.
// We respond with empty <Response/> TwiML (no auto-reply at this layer; replies
// are composed manually from the admin Inbox or a future agent flow).

import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { notifyTelegram } from "@/lib/telegram";
import { SITE_ORIGIN } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Same signature check as /api/webhooks/signalwire/call-status. Twilio-
// compatible HMAC-SHA1: signed string = full public URL + each sorted
// (key,value) concatenated, HMAC-SHA1 with SIGNALWIRE_SIGNING_KEY, base64,
// compared constant-time against x-signalwire-signature header.
//
// If SIGNALWIRE_SIGNING_KEY is unset we fail OPEN with a warn — same
// posture as the call-status route so this can't break a deploy while
// the key is being provisioned. In prod the key IS set, so real traffic
// is verified.
function verifySignature(
  req: Request,
  url: URL,
  fields: Record<string, string>,
): boolean {
  const signingKey = process.env.SIGNALWIRE_SIGNING_KEY;
  if (!signingKey) {
    console.warn(
      "[webhook/sw-sms] SIGNALWIRE_SIGNING_KEY not set — signature check skipped",
    );
    return true;
  }
  const sig =
    req.headers.get("x-signalwire-signature") ??
    req.headers.get("x-twilio-signature");
  if (!sig) {
    console.error("[webhook/sw-sms] missing signature header");
    return false;
  }
  let data = SITE_ORIGIN + url.pathname + url.search;
  for (const k of Object.keys(fields).sort()) data += k + fields[k];
  const expected = crypto
    .createHmac("sha1", signingKey)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function emptyTwiml(): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<Response/>', {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function digitsOnly(p: string): string {
  return (p ?? "").replace(/[^0-9]/g, "");
}

async function findLeadIdByPhone(
  supabase: SupabaseClient,
  fromPhone: string,
): Promise<string | null> {
  const digits = digitsOnly(fromPhone);
  if (digits.length < 10) return null;
  // Match the last 10 digits (US local), since stored phones come from Google
  // Places as (713) 555-1234 while SignalWire delivers +17135551234.
  const last10 = digits.slice(-10);

  const { data } = await supabase
    .from("leads")
    .select("id, phone")
    .not("phone", "is", null)
    .limit(500);
  if (!data) return null;
  for (const row of data as { id: string; phone: string | null }[]) {
    if (!row.phone) continue;
    if (digitsOnly(row.phone).slice(-10) === last10) return row.id;
  }
  return null;
}

async function handle(req: Request) {
  const supaUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !key) {
    console.error("[webhook/sw-sms] missing supabase env");
    return emptyTwiml();
  }
  const supabase = createClient(supaUrl, key, { auth: { persistSession: false } });

  // Parse form-encoded body from SignalWire (matches Twilio convention).
  const url = new URL(req.url);
  let fields: Record<string, string> = {};
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    fields = Object.fromEntries(params.entries());
  } catch (e) {
    console.error("[webhook/sw-sms] body parse error:", (e as Error).message);
  }

  // Reject forged inbound before any DB write / Telegram push.
  if (!verifySignature(req, url, fields)) {
    console.error("[webhook/sw-sms] invalid signature — rejecting");
    return new Response("invalid signature", { status: 403 });
  }

  const from = fields.From ?? "";
  const to = fields.To ?? "";
  const body = fields.Body ?? "";
  const sid = fields.MessageSid ?? null;

  console.log("[webhook/sw-sms]", { from, to, sid, len: body.length });

  let leadId: string | null = null;
  try {
    leadId = await findLeadIdByPhone(supabase, from);
  } catch (e) {
    console.error("[webhook/sw-sms] lead lookup error:", (e as Error).message);
  }

  try {
    await supabase.from("inbound_messages").insert({
      from_phone: from,
      to_phone: to,
      body,
      message_sid: sid,
      lead_id: leadId,
      raw: fields,
    });
  } catch (e) {
    console.error("[webhook/sw-sms] insert error:", (e as Error).message);
  }

  let leadName: string | null = null;
  if (leadId) {
    try {
      // Bump inbound_count and stamp last_inbound_at via two-step (no RPC).
      const { data: cur } = await supabase
        .from("leads")
        .select("inbound_count, name")
        .eq("id", leadId)
        .maybeSingle<{ inbound_count: number; name: string | null }>();
      const next = (cur?.inbound_count ?? 0) + 1;
      leadName = cur?.name ?? null;
      await supabase
        .from("leads")
        .update({
          inbound_count: next,
          last_inbound_at: new Date().toISOString(),
          sms_reply_at: new Date().toISOString(),
        })
        .eq("id", leadId);
    } catch (e) {
      console.error("[webhook/sw-sms] lead update error:", (e as Error).message);
    }
  }

  const header = leadName
    ? `New SMS from ${leadName} (${from})`
    : leadId
      ? `New SMS from ${from} (lead matched)`
      : `New SMS from ${from} (no lead match)`;
  const replyUrl = `https://wedidit4you.com/admin/sms?phone=${encodeURIComponent(from)}`;
  void notifyTelegram(
    `${header}\nTo: ${to}\n\n${body}\n\nReply: ${replyUrl}`,
  );

  return emptyTwiml();
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
