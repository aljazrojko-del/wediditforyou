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
// Security: requests are verified against SignalWire's x-signalwire-signature
// header before any DB write (see verifySignature). We respond with empty
// <Response/> TwiML.

import crypto from "node:crypto";
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

// Validate SignalWire's webhook signature (Twilio-compatible HMAC-SHA1).
// Signed string = full request URL (incl. query string) followed by each POST
// param sorted by key as key+value, HMAC-SHA1 with the project's dedicated
// signing key, base64-encoded — compared in constant time to the header.
//
// The signing key is the per-project "signing key" from the SignalWire Dashboard
// (API Credentials), NOT the REST API token. Configure it as SIGNALWIRE_SIGNING_KEY.
// If it is unset, we fail OPEN (allow, but warn) so the endpoint keeps working
// until the key is provisioned; set the env var to enforce rejection.
function verifySignature(req: Request, fields: Record<string, string>): boolean {
  const signingKey = process.env.SIGNALWIRE_SIGNING_KEY;
  if (!signingKey) {
    console.warn(
      "[webhook/sw-call-status] SIGNALWIRE_SIGNING_KEY not set — signature check skipped. Set it to enforce.",
    );
    return true;
  }

  const sig =
    req.headers.get("x-signalwire-signature") ??
    req.headers.get("x-twilio-signature");
  if (!sig) {
    console.error("[webhook/sw-call-status] missing signature header");
    return false;
  }

  // Rebuild the exact public URL SignalWire signed. The caller sets the
  // StatusCallback against this same origin, so reconstruct from it rather than
  // trusting the proxied request host (Vercel rewrites Host internally).
  const base = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";
  const reqUrl = new URL(req.url);
  let data = base + reqUrl.pathname + reqUrl.search;
  for (const k of Object.keys(fields).sort()) data += k + fields[k];

  const expected = crypto
    .createHmac("sha1", signingKey)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function handle(req: Request) {
  const envUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!envUrl || !key) {
    console.error("[webhook/sw-call-status] missing supabase env");
    return emptyTwiml();
  }

  let fields: Record<string, string> = {};
  try {
    const text = await req.text();
    fields = Object.fromEntries(new URLSearchParams(text).entries());
  } catch (e) {
    console.error("[webhook/sw-call-status] body parse error:", (e as Error).message);
  }

  // Reject forged requests before touching the database.
  if (!verifySignature(req, fields)) {
    console.error("[webhook/sw-call-status] invalid signature — rejecting");
    return new Response("invalid signature", { status: 403 });
  }

  const callSid = fields.CallSid ?? "";
  const rawStatus = (fields.CallStatus ?? "").toLowerCase();
  const status = VALID.has(rawStatus) ? rawStatus : null;
  const leadId = new URL(req.url).searchParams.get("lead_id");

  console.log("[webhook/sw-call-status]", { callSid, status: rawStatus, leadId });

  if (!status) return emptyTwiml();

  const supabase = createClient(envUrl, key, { auth: { persistSession: false } });
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

// Health check only — SignalWire status callbacks are POST. No DB write occurs
// on GET (no body -> no CallStatus), so this is a safe liveness probe.
export async function GET() {
  return emptyTwiml();
}
