// POST /api/admin/reschedule-appointment
// Body: { appointment_id, start_time_ct, duration_minutes?, phone?, first_name?, notify_sms? }
//
// Moves a walkthrough to a new time in the Supabase `appointments` table
// (self-hosted, replaces GoHighLevel). Clears the reminder flags so the cron
// re-sends reminders for the new time, and optionally texts the prospect.
//
// Auth: OUTREACH_AUTH_TOKEN.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignalWireClient } from "@/lib/signalwire-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

export async function POST(req: Request) {
  const expectedToken = process.env.OUTREACH_AUTH_TOKEN;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!expectedToken || !supaUrl || !supaKey) {
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
    return NextResponse.json({ error: "invalid start_time_ct — use ISO like 2026-08-06T14:30:00" }, { status: 400 });
  }
  const durationMin = Number.isFinite(body.duration_minutes)
    ? Math.min(Math.max(Number(body.duration_minutes), 5), 240) : 15;

  const sb = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
  const { data: upd, error } = await sb.from("appointments")
    .update({
      start_time: startUtc,
      duration_min: durationMin,
      status: "confirmed",
      reminder_daybefore_sent_at: null, // re-arm reminders for the new time
      reminder_dayof_sent_at: null,
    })
    .eq("id", body.appointment_id)
    .select("id, phone, first_name")
    .maybeSingle<{ id: string; phone: string | null; first_name: string | null }>();
  if (error) return NextResponse.json({ error: `reschedule: ${error.message}` }, { status: 500 });
  if (!upd) return NextResponse.json({ error: "appointment not found" }, { status: 404 });

  // Optional confirmation SMS (signed Alex).
  let smsResult: { ok: boolean; error?: string; sid?: string; to?: string; body?: string } | null = null;
  const phone = (body.phone ? e164(body.phone) : null) ?? (upd.phone ? e164(upd.phone) : null);
  if (body.notify_sms && phone) {
    const timeStr = fmtCtDisplay(body.start_time_ct);
    const name = body.first_name ?? upd.first_name ?? "there";
    const msg = `Hey ${name}, Alex here from wediditforyou - quick update, I moved your site walkthrough to ${timeStr}. I'll call you then. Reply STOP to opt out. - Alex`;
    const from = process.env.SIGNALWIRE_PHONE_DALLAS ?? null;
    if (!from) {
      smsResult = { ok: false, error: "no Dallas from-number configured" };
    } else {
      try {
        const client = new SignalWireClient();
        const res = await client.sendSms({ from, to: phone, body: msg });
        smsResult = { ok: res.ok, sid: res.sid, error: res.error, to: phone, body: msg };
        if (res.ok) {
          try {
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
    appointment_id: upd.id,
    start_time_utc: startUtc,
    start_time_ct_display: fmtCtDisplay(body.start_time_ct),
    sms: smsResult,
  });
}
