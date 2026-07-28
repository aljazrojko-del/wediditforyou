// POST /api/admin/sms — admin-authed proxy for the SMS composer at /admin/sms.
//
// The composer runs in the browser, so it can't send a Bearer OUTREACH_AUTH_TOKEN.
// Instead we gate by the admin session cookie, then send via SignalWire directly
// and log the attempt to outbound_messages (mirrors Path B logging in
// /api/outreach/send-link).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { SignalWireClient } from "@/lib/signalwire-client";
import { normalizeE164 } from "@/lib/outreach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type RequestBody = {
  to_phone?: string;
  to_city?: string;   // 'houston'|'dallas'|'phoenix'|'nashville'|'chicago' — picks the from number
  sms_body?: string;
};

async function logAttempt(opts: {
  from: string;
  to: string;
  body: string;
  sid: string | null;
  ok: boolean;
  error: string | null;
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
      status: opts.ok ? "queued" : "failed",
      error: opts.error,
      raw: { source: "admin-composer", via: "admin/sms" },
    });
  } catch (e) {
    console.error("[admin/sms] outbound_messages log failed:", (e as Error).message);
  }
}

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const toRaw = (body.to_phone ?? "").trim();
  const to = normalizeE164(toRaw);
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "invalid_to_phone" },
      { status: 400 },
    );
  }

  const smsBody = (body.sms_body ?? "").trim();
  if (!smsBody) {
    return NextResponse.json(
      { ok: false, error: "sms_body required" },
      { status: 400 },
    );
  }

  let client: SignalWireClient;
  try {
    client = new SignalWireClient();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }

  const cityHint = body.to_city ?? null;
  // Dallas is the only A2P-approved SMS sender; Houston is retired.
  const from =
    client.pickFromNumber(cityHint) ??
    process.env.SIGNALWIRE_PHONE_DALLAS ??
    "";
  if (!from) {
    return NextResponse.json(
      { ok: false, error: "no_from_number_available" },
      { status: 500 },
    );
  }

  const result = await client.sendSms({ from, to, body: smsBody });
  await logAttempt({
    from,
    to,
    body: smsBody,
    sid: result.sid ?? null,
    ok: result.ok,
    error: result.ok ? null : (result.error ?? "unknown_sms_error"),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error ?? "send_failed",
        attempts: [{ channel: "sms", ok: false, error: result.error }],
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    channel_used: "sms",
    attempts: [{ channel: "sms", ok: true, id: result.sid }],
    from,
    to,
  });
}
