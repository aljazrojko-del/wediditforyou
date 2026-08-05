// POST /api/mia/book-appointment
// Body: { lead_id?, phone, start_time_ct, duration_minutes?, site_preview_url?,
//         first_name?, last_name?, send_combined_sms?, notes? }
//
// Self-hosted booking (replaces GoHighLevel). Writes the walkthrough to the
// Supabase `appointments` table, rejects double-books (so Max's "that slot is
// taken, pick another" retry still fires), and optionally sends a combined
// link+time SMS via SignalWire. Reminders are handled by the
// /api/cron/appointment-reminders cron, not here.
//
// Response contract is unchanged from the old GHL version (appointment_id,
// start_time_ct_display) so the Max bridge needs no changes.
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
  lead_id?: string;
  phone: string;
  start_time_ct: string;
  duration_minutes?: number;
  site_preview_url?: string;
  first_name?: string;
  last_name?: string;
  send_combined_sms?: boolean;
  notes?: string;
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

  const phone = e164(body.phone ?? "");
  if (!phone) return NextResponse.json({ error: "invalid phone" }, { status: 400 });

  const startUtc = ctIsoToUtcIso(body.start_time_ct ?? "");
  if (!startUtc) {
    return NextResponse.json(
      { error: "invalid start_time_ct — use ISO like 2026-08-05T10:00:00" },
      { status: 400 },
    );
  }
  const durationMin = Number.isFinite(body.duration_minutes)
    ? Math.min(Math.max(Number(body.duration_minutes), 5), 240) : 15;
  const startMs = new Date(startUtc).getTime();
  const endMs = startMs + durationMin * 60_000;

  const sb = createClient(supaUrl, supaKey, { auth: { persistSession: false } });

  // Enrich from the lead (name + site url) when a lead_id is given.
  let leadName: string | null = null;
  let businessName: string | null = null;
  let siteUrl: string | null = body.site_preview_url ?? null;
  if (body.lead_id) {
    try {
      const { data } = await sb.from("leads")
        .select("name, site_url, owner_first_name")
        .eq("id", body.lead_id).maybeSingle<{
          name: string | null; site_url: string | null; owner_first_name: string | null;
        }>();
      if (data) {
        businessName = data.name;
        leadName = data.owner_first_name ?? (data.name ? data.name.split(/\s+/)[0] : null);
        if (!siteUrl && data.site_url) siteUrl = data.site_url;
      }
    } catch { /* silent */ }
  }
  const firstName = body.first_name ?? leadName ?? "Friend";

  // Double-booking guard: reject if a confirmed appointment overlaps this slot.
  // Message contains "not available" so the bridge's retry regex fires.
  const windowStart = new Date(startMs - 4 * 60 * 60_000).toISOString();
  const windowEnd = new Date(endMs + 4 * 60 * 60_000).toISOString();
  const { data: nearby } = await sb.from("appointments")
    .select("start_time, duration_min, status")
    .eq("status", "confirmed")
    .gte("start_time", windowStart)
    .lte("start_time", windowEnd);
  const clash = (nearby ?? []).some((a) => {
    const aStart = new Date(a.start_time).getTime();
    const aEnd = aStart + (a.duration_min ?? 15) * 60_000;
    return aStart < endMs && aEnd > startMs; // intervals overlap
  });
  if (clash) {
    return NextResponse.json(
      { error: "That time slot is not available — pick another time." },
      { status: 409 },
    );
  }

  const { data: appt, error } = await sb.from("appointments").insert({
    lead_id: body.lead_id ?? null,
    phone,
    first_name: firstName,
    business_name: businessName,
    start_time: startUtc,
    duration_min: durationMin,
    status: "confirmed",
    site_url: siteUrl,
    notes: body.notes ?? "Booked via wediditforyou call.",
  }).select("id").single<{ id: string }>();
  if (error || !appt) {
    return NextResponse.json({ error: `insert failed: ${error?.message ?? "no row"}` }, { status: 500 });
  }

  // Optional combined SMS (bridge sends its own, so this is off by default).
  let smsResult: { ok: boolean; error?: string; sid?: string; to?: string; body?: string } | null = null;
  if (body.send_combined_sms) {
    const timeStr = fmtCtDisplay(body.start_time_ct);
    const linkPart = siteUrl ? `Your site preview: ${siteUrl}\n\n` : "";
    const msg = `Hey ${firstName}, Alex here — ${linkPart}Locked in for ${timeStr}. Reply STOP to opt out. Text me if the time doesn't work anymore. — Alex`;
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
              from_phone: from, to_phone: phone, body: msg, message_sid: res.sid ?? null,
              lead_id: body.lead_id ?? null, status: "sent",
            });
          } catch { /* silent */ }
        }
      } catch (e) { smsResult = { ok: false, error: (e as Error).message }; }
    }
  }

  return NextResponse.json({
    ok: true,
    appointment_id: appt.id,
    start_time_utc: startUtc,
    end_time_utc: new Date(endMs).toISOString(),
    start_time_ct_display: fmtCtDisplay(body.start_time_ct),
    combined_sms: smsResult,
  });
}
