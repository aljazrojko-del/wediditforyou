// POST /api/outreach/mark-dialed
//
// Called by the external dialer immediately after a call is placed (regardless
// of pickup outcome) so the same lead is never re-queued.
//
// Auth: Authorization: Bearer <OUTREACH_AUTH_TOKEN>
//
// Body: { lead_id: uuid, call_sid?: string, outcome?: string }
// Response: 200 { ok: true } | 404 { ok: false, error: "lead_not_found" }

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(): Response {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

type Body = {
  lead_id?: string;
  call_sid?: string;
  outcome?: string;
};

export async function POST(req: Request) {
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

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "server not configured: Supabase creds missing" },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid json" },
      { status: 400 },
    );
  }

  const leadId = (body.lead_id ?? "").trim();
  if (!leadId) {
    return NextResponse.json(
      { ok: false, error: "lead_id required" },
      { status: 400 },
    );
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("leads")
    .update({ call_placed_at: new Date().toISOString() })
    .eq("id", leadId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { ok: false, error: "lead_not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, lead_id: data.id });
}
