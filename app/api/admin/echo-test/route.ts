// POST /api/admin/echo-test — place a SignalWire outbound call that plays a
// short intro and records the callee's voice via <Record>. Recording lands
// in voice_recordings via /api/webhooks/signalwire/recording.
//
// Body: { phone: string, from_city?: 'houston'|'dallas'|'phoenix'|'nashville'|'chicago' }

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { SignalWireClient } from "@/lib/signalwire-client";
import { normalizeE164 } from "@/lib/outreach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Body = {
  phone?: string;
  from_city?: string;
};

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const to = normalizeE164((body.phone ?? "").trim());
  if (!to) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });

  let client: SignalWireClient;
  try {
    client = new SignalWireClient();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // Dallas is our only A2P-approved SMS-capable number. Houston is retired.
  const from =
    client.pickFromNumber(body.from_city ?? null) ??
    process.env.SIGNALWIRE_PHONE_DALLAS ??
    "";
  if (!from) {
    return NextResponse.json({ error: "no_from_number" }, { status: 500 });
  }

  const origin = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";
  const twimlUrl = `${origin}/api/twiml/echo-test`;
  const statusCallback = `${origin}/api/webhooks/signalwire/call-status`;

  const result = await client.makeCall({ from, to, twimlUrl, statusCallback });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "call_failed" },
      { status: 502 },
    );
  }

  // Insert a pending row so the UI can show "call placed" immediately; the
  // recording webhook will upsert the row with the recording_sid + url later.
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
      await supabase.from("voice_recordings").insert({
        call_sid: result.sid ?? null,
        to_phone: to,
        from_phone: from,
        status: "pending",
        kind: "echo-test",
      });
    } catch (e) {
      console.error("[admin/echo-test] insert:", (e as Error).message);
    }
  }

  return NextResponse.json({
    ok: true,
    call_sid: result.sid,
    from,
    to,
  });
}
