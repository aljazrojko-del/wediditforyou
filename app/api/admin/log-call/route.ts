// POST /api/admin/log-call   Body: { conversation_id, phone, lead_id?, call_sid? }
//
// The Max bridge calls this once per call, as soon as it knows the ElevenLabs
// conversation_id AND the prospect number — recording the EXACT mapping so the
// dashboard never has to guess the phone by timestamp (which mismatches when
// many calls fire seconds apart). Upsert keyed by conversation_id.
//
// Auth: the same OUTREACH_AUTH_TOKEN the bridge already uses.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const expected = process.env.OUTREACH_AUTH_TOKEN;
  const auth = req.headers.get("authorization") ?? "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey) {
    return NextResponse.json({ error: "server_misconfig" }, { status: 500 });
  }

  let body: { conversation_id?: string; phone?: string; lead_id?: string; call_sid?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.conversation_id) {
    return NextResponse.json({ error: "conversation_id required" }, { status: 400 });
  }

  const sb = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
  const { error } = await sb.from("max_call_log").upsert(
    {
      conversation_id: body.conversation_id,
      phone: body.phone ?? null,
      lead_id: body.lead_id ?? null,
      call_sid: body.call_sid ?? null,
    },
    { onConflict: "conversation_id" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
