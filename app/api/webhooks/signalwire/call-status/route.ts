// Webhook: SignalWire POSTs here on every call StatusCallback event for outbound
// calls placed by Mia (the AI cold caller). We persist the live call status onto
// the matching lead so the admin dashboard reflects ringing -> in-progress ->
// completed/no-answer in real time, instead of freezing at placement.
//
// SignalWire delivers form-encoded fields: CallSid, CallStatus, To, From,
// CallDuration, AnsweredBy, etc. (Twilio-compatible).
//
// Matching: prefer an explicit ?lead_id=<uuid> on the callback URL (set by the
// caller when it places the call); otherwise fall back to matching the lead whose
// call_sid equals CallSid (Mia write-backs call_sid at placement).
//
// We respond with empty <Response/> TwiML.

import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// SignalWire/Twilio call statuses -> our leads.call_status enum.
const VALID = new Set([
  "queued",
  "ringing",
  "in-progress",
  "completed",
  "busy",
  "failed",
  "no-answer",
  "canceled",
]);

function emptyTwiml(): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<Response/>', {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

async function handle(req: Request) {
  const envUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!envUrl || !key) {
    console.error("[webhook/sw-call-status] missing supabase env");
    return emptyTwiml();
  }
  const supabase = createClient(envUrl, key, { auth: { persistSession: false } });

  let fields: Record<string, string> = {};
  try {
    const text = await req.text();
    fields = Object.fromEntries(new URLSearchParams(text).entries());
  } catch (e) {
    console.error("[webhook/sw-call-status] body parse error:", (e as Error).message);
  }

  const callSid = fields.CallSid ?? "";
  const rawStatus = (fields.CallStatus ?? "").toLowerCase();
  const status = VALID.has(rawStatus) ? rawStatus : null;
  const leadId = new URL(req.url).searchParams.get("lead_id");

  console.log("[webhook/sw-call-status]", { callSid, status: rawStatus, leadId });

  if (!status) return emptyTwiml();

  const patch: Record<string, unknown> = { call_status: status };

  try {
    if (leadId) {
      // Stamp the sid too so future status events can match by sid as well.
      if (callSid) patch.call_sid = callSid;
      await supabase.from("leads").update(patch).eq("id", leadId);
    } else if (callSid) {
      await supabase.from("leads").update(patch).eq("call_sid", callSid);
    }
  } catch (e) {
    console.error("[webhook/sw-call-status] lead update error:", (e as Error).message);
  }

  return emptyTwiml();
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
