// POST /api/admin/sms-quick/send — body { to, body } → SignalWire send + log.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/outreach";
import { sendQuickSms } from "@/lib/sms-quick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  let payload: { to?: string; body?: string; fromCity?: string };
  try {
    payload = (await req.json()) as { to?: string; body?: string; fromCity?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const to = (payload.to ?? "").trim();
  const body = (payload.body ?? "").trim();
  if (!to) return NextResponse.json({ error: "to is required" }, { status: 400 });
  if (!body) return NextResponse.json({ error: "body is required" }, { status: 400 });

  // Whitelist on the server too — never trust the client's claim about
  // which envelope From to use.
  const ALLOWED = new Set(["dallas", "phoenix", "nashville", "chicago", "houston"]);
  const fromCity =
    payload.fromCity && ALLOWED.has(payload.fromCity)
      ? (payload.fromCity as
          | "dallas"
          | "phoenix"
          | "nashville"
          | "chicago"
          | "houston")
      : null;

  const supabase = getServiceClient();
  const res = await sendQuickSms(supabase, { to, body, fromCity });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true, sid: res.sid, from: res.from, to: res.to });
}
