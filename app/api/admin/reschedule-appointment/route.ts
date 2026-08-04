// POST /api/admin/reschedule-appointment
// Body: { appointment_id, start_time_ct, duration_minutes?, phone?, first_name?, notify_sms? }
//
// Moves an existing GHL walkthrough appointment to a new time (the booking
// endpoint only creates; this reschedules in place so the reminder ladder
// re-points instead of double-booking). Optionally texts the prospect the new
// time via SignalWire (Dallas 10DLC number), same as the booking flow.
//
// Auth: same OUTREACH_AUTH_TOKEN the booking endpoint uses.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignalWireClient } from "@/lib/signalwire-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GHL_BASE = "https://services.leadconnectorhq.com";
const CALENDAR_ID = "REiQNb9rMUEjtRR1Pe7Y";
const CT_UTC_OFFSET_MINUTES_CDT = -5 * 60;

type Body = {
  appointment_id: string;
  start_time_ct: string;
  duration_minutes?: number;
  phone?: string;
  first_name?: string;
  notify_sms?: boolean;
};

function e164(p: string): string | null {
  if (!p) return null;
  const digits = p.replace(/[^0-9]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (/^\+[1-9]\d{7,14}$/.test(p.trim())) return p.trim();
  return null;
}

function ctIsoToUtcIso(startCt: string): string | null {
  const stripped = startCt.replace(/[Zz]|[+-]\d{2}:?\d{2}$/, "");
  const m = stripped.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const utc = Date.UTC(+y, +mo - 1, +d, +h, +mi, s ? +s : 0)
    - CT_UTC_OFFSET_MINUTES_CDT * 60_000;
  return new Date(utc).toISOString();
}

function fmtCtDisplay(startCt: string): string {
  const m = startCt.replace(/[Zz]|[+-]\d{2}:?\d{2}$/, "")
    .match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return startCt;
  const [, y, mo, d, h, mi] = m;
  const dt = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi));
  const day = dt.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
  const hr = +h; const suffix = hr >= 12 ? "PM" : "AM";
  const hr12 = hr % 12 || 12;
  return `${day} at ${hr12}:${mi} ${suffix} CT`;
}

async function ghl<T>(method: string, path: string, token: string, body?: unknown): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await fetch(GHL_BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  if (!res.ok) {
    const err = typeof parsed === "object" && parsed !== null && "message" in parsed
      ? String((parsed as { message: unknown }).message)
      : text;
    return { ok: false, status: res.status, error: err };
  }
  return { ok: true, data: parsed as T };
}

export async function POST(req: Request) {
  const expectedToken = process.env.OUTREACH_AUTH_TOKEN;
  const ghlToken = process.env.GHL_PIT_TOKEN;
  const locationId = process.env.GHL_WDIFY_LOCATION_ID;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!expectedToken || !ghlToken || !locationId) {
    return NextResponse.json({ error: "missing env vars" }, { status: 500 });
  }
  if ((req.headers.get("authorization") ?? "") !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try { body = (await req.json()) as Body; } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.appointment_id) return NextResponse.json({ error: "appointment_id required" }, { status: 400 });

  const startUtc = ctIsoToUtcIso(body.start_time_ct ?? "");
  if (!startUtc) {
    return NextResponse.json({ error: "invalid start_time_ct — use ISO like 2026-08-05T14:30:00" }, { status: 400 });
  }
  const durationMin = Number.isFinite(body.duration_minutes)
    ? Math.min(Math.max(Number(body.duration_minutes), 5), 240) : 15;
  const endUtc = new Date(new Date(startUtc).getTime() + durationMin * 60_000).toISOString();

  // Reschedule in place. GHL update-appointment: PUT the event id with new times.
  const upd = await ghl<{ id?: string; appointment?: { id: string; startTime?: string } }>(
    "PUT",
    `/calendars/events/appointments/${encodeURIComponent(body.appointment_id)}`,
    ghlToken,
    { calendarId: CALENDAR_ID, startTime: startUtc, endTime: endUtc, toNotify: true },
  );
  if (!upd.ok) {
    return NextResponse.json({ error: `reschedule: ${upd.error}`, status: upd.status }, { status: 500 });
  }

  // Optional confirmation SMS (signed Alex, per house style).
  let smsResult: { ok: boolean; error?: string; sid?: string; to?: string; body?: string } | null = null;
  const phone = body.phone ? e164(body.phone) : null;
  if (body.notify_sms && phone) {
    const timeStr = fmtCtDisplay(body.start_time_ct);
    const name = body.first_name ?? "there";
    const msg = `Hey ${name}, Alex here from wediditforyou — quick update, I moved your site walkthrough to ${timeStr}. I'll call you then. Reply STOP to opt out. — Alex`;
    const from = process.env.SIGNALWIRE_PHONE_DALLAS ?? null;
    if (!from) {
      smsResult = { ok: false, error: "no Dallas from-number configured" };
    } else {
      try {
        const client = new SignalWireClient();
        const res = await client.sendSms({ from, to: phone, body: msg });
        smsResult = { ok: res.ok, sid: res.sid, error: res.error, to: phone, body: msg };
        if (res.ok && supaUrl && supaKey) {
          try {
            const sb = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
            await sb.from("outbound_messages").insert({
              from_phone: from, to_phone: phone, body: msg, message_sid: res.sid ?? null, status: "sent",
            });
          } catch { /* silent */ }
        }
      } catch (e) { smsResult = { ok: false, error: (e as Error).message }; }
    }
  }

  return NextResponse.json({
    ok: true,
    appointment_id: body.appointment_id,
    start_time_utc: startUtc,
    end_time_utc: endUtc,
    start_time_ct_display: fmtCtDisplay(body.start_time_ct),
    sms: smsResult,
  });
}
