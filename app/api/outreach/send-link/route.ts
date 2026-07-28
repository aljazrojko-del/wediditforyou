// POST /api/outreach/send-link
//
// Unified link-delivery endpoint for Mia (the AI cold caller) and any other
// agent. Handles multi-channel send with auto-fallback so a single call from
// Mia can try SMS first, fall back to email if SMS fails or no phone exists.
//
// Auth: shared secret in Authorization: Bearer <OUTREACH_AUTH_TOKEN> header.
//
// Request body (JSON):
//   {
//     "channel": "auto" | "sms" | "email" | "both",   // default "auto"
//     "to_phone": "+17135551234",                      // required if channel includes sms
//     "to_email": "alex@example.com",                  // required if channel includes email
//     "first_name": "Carlos",
//     "site_url": "https://sites.wedidit4you.com/carlos-mendez",
//     "sms_body": "optional override of the SMS text",
//     "email_subject": "optional override",
//     "email_body": "optional override",
//     "lead_id": "uuid-optional",                      // for tracking
//     "source": "mia" | "alex-manual" | "brooke" | ... // for logging
//   }
//
// Response:
//   200 { ok: true, channel_used: "sms"|"email"|"both", attempts: [...] }
//   400 invalid input
//   401 bad auth
//   500 all channels failed (errors in body)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignalWireClient } from "@/lib/signalwire-client";
import { isValidEmail, sendLinkEmail } from "@/lib/email";
import { buildSmsBody, normalizeE164 } from "@/lib/outreach";

export const runtime = "nodejs";

// Log every SMS attempt (success + failure) to outbound_messages so silent
// same-account deliveries, carrier rejects, and successful sends all show up
// in the admin UI + audit trail. Best-effort — DB write failures don't block
// the send-link response.
async function logSmsAttempt(opts: {
  from: string;
  to: string;
  body: string;
  sid: string | null;
  ok: boolean;
  error: string | null;
  leadId: string | null;
  source: string | null;
}): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    await supabase.from("outbound_messages").insert({
      from_phone: opts.from,
      to_phone: opts.to,
      body: opts.body,
      message_sid: opts.sid,
      lead_id: opts.leadId,
      status: opts.ok ? "queued" : "failed",
      error: opts.error,
      raw: { source: opts.source ?? "send-link", via: "outreach/send-link" },
    });
  } catch (e) {
    console.error("[send-link] outbound_messages log failed:", (e as Error).message);
  }
}

type Channel = "auto" | "sms" | "email" | "both";

type Attempt = {
  channel: "sms" | "email";
  ok: boolean;
  id?: string;
  error?: string;
};

type RequestBody = {
  channel?: Channel;
  to_phone?: string;
  to_email?: string;
  to_city?: string;          // used to pick a same-area-code "from" number
  from_phone?: string;       // explicit override of "from"
  first_name?: string;
  site_url?: string;
  sms_body?: string;
  email_subject?: string;
  email_body?: string;
  lead_id?: string;
  source?: string;
};

function unauthorized(): Response {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

function badRequest(error: string): Response {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(req: Request) {
  // --- Auth ---
  const expected = process.env.OUTREACH_AUTH_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "server not configured: OUTREACH_AUTH_TOKEN missing" },
      { status: 500 },
    );
  }
  const provided = (req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!provided || provided !== expected) return unauthorized();

  // --- Parse + validate ---
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return badRequest("invalid_json");
  }

  const channel: Channel = body.channel ?? "auto";
  const firstName = (body.first_name ?? "there").trim();
  const siteUrl = (body.site_url ?? "").trim();
  // site_url is only required when we need it to build the default SMS/email
  // body. If the caller supplies a custom sms_body + email_body, we can send
  // ad-hoc messages without a site URL (used by the admin SMS composer).
  const hasCustomSmsBody = typeof body.sms_body === "string" && body.sms_body.trim().length > 0;
  const hasCustomEmailBody = typeof body.email_body === "string" && body.email_body.trim().length > 0;
  const needsSiteUrl =
    (channel === "sms" && !hasCustomSmsBody) ||
    (channel === "email" && !hasCustomEmailBody) ||
    (channel === "both" && (!hasCustomSmsBody || !hasCustomEmailBody)) ||
    (channel === "auto" && !hasCustomSmsBody && !hasCustomEmailBody);
  if (needsSiteUrl && !siteUrl) return badRequest("site_url required (or provide custom sms_body/email_body)");

  const phone = body.to_phone ? normalizeE164(body.to_phone) : null;
  const email = body.to_email && isValidEmail(body.to_email) ? body.to_email.trim() : null;

  if (!phone && !email) {
    return badRequest("at least one of to_phone or to_email required");
  }

  // --- Build channel attempt order ---
  let order: ("sms" | "email")[];
  switch (channel) {
    case "sms":
      if (!phone) return badRequest("channel=sms requires to_phone");
      order = ["sms"];
      break;
    case "email":
      if (!email) return badRequest("channel=email requires to_email");
      order = ["email"];
      break;
    case "both":
      order = [];
      if (phone) order.push("sms");
      if (email) order.push("email");
      break;
    case "auto":
    default:
      order = [];
      if (phone) order.push("sms");
      if (email) order.push("email");
      break;
  }

  const attempts: Attempt[] = [];
  const sentOn: ("sms" | "email")[] = [];

  // --- Try each channel; stop after first success unless channel=both ---
  for (const c of order) {
    if (c === "sms" && phone) {
      const smsBody = body.sms_body ?? buildSmsBody(firstName, siteUrl);
      try {
        const sw = new SignalWireClient();
        // Dallas is the only A2P-10DLC-approved SMS sender. Never fall back
        // to Houston (retired) or Phoenix/Nashville/Chicago (voice-only for
        // now) — those trigger 21601 "from not SMS-capable".
        const from =
          body.from_phone ??
          sw.pickFromNumber(body.to_city) ??
          process.env.SIGNALWIRE_PHONE_DALLAS ??
          "";
        if (!from) {
          attempts.push({
            channel: "sms",
            ok: false,
            error: "no_from_number_available",
          });
          await logSmsAttempt({
            from: "",
            to: phone,
            body: smsBody,
            sid: null,
            ok: false,
            error: "no_from_number_available",
            leadId: body.lead_id ?? null,
            source: body.source ?? null,
          });
        } else {
          const result = await sw.sendSms({ from, to: phone, body: smsBody });
          await logSmsAttempt({
            from,
            to: phone,
            body: smsBody,
            sid: result.sid ?? null,
            ok: result.ok,
            error: result.ok ? null : (result.error ?? "unknown_sms_error"),
            leadId: body.lead_id ?? null,
            source: body.source ?? null,
          });
          if (result.ok && result.sid) {
            attempts.push({ channel: "sms", ok: true, id: result.sid });
            sentOn.push("sms");
            if (channel === "auto") break; // stop on first success in auto mode
            continue;
          }
          attempts.push({
            channel: "sms",
            ok: false,
            error: result.error ?? "unknown_sms_error",
          });
        }
      } catch (err) {
        const errMsg = (err as Error).message;
        attempts.push({ channel: "sms", ok: false, error: errMsg });
        await logSmsAttempt({
          from: "",
          to: phone,
          body: smsBody,
          sid: null,
          ok: false,
          error: errMsg,
          leadId: body.lead_id ?? null,
          source: body.source ?? null,
        });
      }
    } else if (c === "email" && email) {
      const result = await sendLinkEmail({
        to: email,
        firstName,
        siteUrl,
        subject: body.email_subject,
        body: body.email_body,
      });
      if (result.ok) {
        attempts.push({ channel: "email", ok: true, id: result.id });
        sentOn.push("email");
        if (channel === "auto") break;
        continue;
      }
      attempts.push({ channel: "email", ok: false, error: result.error });
    }
  }

  if (sentOn.length === 0) {
    return NextResponse.json(
      { ok: false, channel_used: null, attempts, error: "all_channels_failed" },
      { status: 500 },
    );
  }

  // --- Success ---
  const channelUsed = sentOn.length === 1 ? sentOn[0] : "both";
  return NextResponse.json({
    ok: true,
    channel_used: channelUsed,
    attempts,
    lead_id: body.lead_id ?? null,
    source: body.source ?? null,
  });
}
