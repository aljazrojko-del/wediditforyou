// POST /api/mia/book-appointment
// Body: { lead_id?, phone, start_time_ct, duration_minutes?, site_preview_url?,
//         first_name?, last_name?, send_combined_sms?, notes? }
//
// The endpoint Mia (or any bearer-holder) hits when a call captures a positive
// booking intent. Does two things:
//   1. Creates a GHL calendar appointment on the walkthrough calendar
//      (REiQNb9rMUEjtRR1Pe7Y) using the location's PIT token.
//   2. Optionally sends a combined SMS with the site preview link AND the
//      booked appointment time — solves the "prospect forgets the time
//      they agreed to" problem in one message instead of two.
//
// The GHL "Walkthrough Appointment Confirmation" workflow fires off the
// Customer Booked event automatically, so the reminder ladder (3d/1d/same-
// day/1h) runs itself. This endpoint doesn't touch those.
//
// Auth: same OUTREACH_AUTH_TOKEN Mia already uses for /api/outreach/send-link.

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

async function findOrCreateGhlContact(
  token: string,
  locationId: string,
  phone: string,
  firstName: string,
  lastName: string,
): Promise<{ ok: true; contactId: string } | { ok: false; error: string }> {
  // Try search first — reuse the contact if one already has this phone.
  const search = await ghl<{ contacts?: Array<{ id: string }> }>(
    "POST",
    "/contacts/search",
    token,
    {
      locationId,
      pageLimit: 5,
      filters: [{ field: "phone", operator: "eq", value: phone }],
    },
  );
  if (search.ok && search.data.contacts?.length) {
    return { ok: true, contactId: search.data.contacts[0].id };
  }
  const create = await ghl<{ contact?: { id: string }; id?: string }>(
    "POST",
    "/contacts/",
    token,
    { locationId, phone, firstName, lastName, source: "mia" },
  );
  if (!create.ok) return { ok: false, error: `contact create: ${create.error}` };
  const cid = create.data.contact?.id ?? create.data.id;
  if (!cid) return { ok: false, error: "contact create returned no id" };
  return { ok: true, contactId: cid };
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
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const phone = e164(body.phone ?? "");
  if (!phone) return NextResponse.json({ error: "invalid phone" }, { status: 400 });

  const startUtc = ctIsoToUtcIso(body.start_time_ct ?? "");
  if (!startUtc) {
    return NextResponse.json(
      { error: "invalid start_time_ct — use ISO like 2026-07-14T10:00:00" },
      { status: 400 },
    );
  }
  const durationMin = Number.isFinite(body.duration_minutes)
    ? Math.min(Math.max(Number(body.duration_minutes), 5), 240)
    : 15;
  const endUtc = new Date(new Date(startUtc).getTime() + durationMin * 60_000).toISOString();

  // Pull lead info from Supabase if lead_id given — used to enrich the SMS.
  let leadName: string | null = null;
  let siteUrl: string | null = body.site_preview_url ?? null;
  if (body.lead_id && supaUrl && supaKey) {
    try {
      const sb = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
      const { data } = await sb.from("leads")
        .select("name, site_url, owner_first_name")
        .eq("id", body.lead_id).maybeSingle<{
          name: string | null; site_url: string | null; owner_first_name: string | null;
        }>();
      if (data) {
        leadName = data.owner_first_name ?? (data.name ? data.name.split(/\s+/)[0] : null);
        if (!siteUrl && data.site_url) siteUrl = data.site_url;
      }
    } catch { /* silent */ }
  }

  const firstName = body.first_name ?? leadName ?? "Friend";
  const lastName = body.last_name ?? "";

  // Find or create the GHL contact keyed by phone.
  const contactRes = await findOrCreateGhlContact(
    ghlToken, locationId, phone, firstName, lastName,
  );
  if (!contactRes.ok) {
    return NextResponse.json({ error: contactRes.error }, { status: 500 });
  }

  // Create the appointment on the walkthrough calendar.
  const appt = await ghl<{ id?: string; appointment?: { id: string } }>(
    "POST",
    "/calendars/events/appointments",
    ghlToken,
    {
      calendarId: CALENDAR_ID,
      locationId,
      contactId: contactRes.contactId,
      startTime: startUtc,
      endTime: endUtc,
      title: "15-min Site Walkthrough with Alex",
      appointmentStatus: "confirmed",
      address: phone,
      notes: body.notes ?? "Booked by Mia on positive verbal capture.",
      ignoreDateRange: false,
      toNotify: true,
    },
  );

  if (!appt.ok) {
    return NextResponse.json(
      { error: `appointment create: ${appt.error}`, contactId: contactRes.contactId },
      { status: 500 },
    );
  }
  const apptId = appt.data.appointment?.id ?? appt.data.id;

  // Optionally send the combined "link + appointment" SMS via SignalWire
  // directly (bypasses /api/outreach/send-link which is shaped for cold
  // outreach templates and requires a site_url on the lead, not an
  // arbitrary custom body). Also logs to outbound_messages so admin/thread
  // views can see it. Fire-and-forget: SMS failure never undoes the booking.
  let smsResult: {
    ok: boolean;
    error?: string;
    sid?: string;
    from?: string;
    to?: string;
    body?: string;
  } | null = null;
  if (body.send_combined_sms) {
    const timeStr = fmtCtDisplay(body.start_time_ct);
    const linkPart = siteUrl ? `Your site preview: ${siteUrl}\n\n` : "";
    const msg =
      `Hey ${firstName}, Alex here — ${linkPart}` +
      `Locked in for ${timeStr}. Reply STOP to opt out. Text me if the ` +
      `time doesn't work anymore. — Alex`;

    // Prefer Dallas (10DLC-approved, campaign-linked) as the outbound number.
    // Houston is still not attached to the campaign so we skip it.
    const from =
      process.env.SIGNALWIRE_PHONE_DALLAS ??
      process.env.SIGNALWIRE_PHONE_PHOENIX ??
      process.env.SIGNALWIRE_PHONE_NASHVILLE ??
      process.env.SIGNALWIRE_PHONE_CHICAGO ??
      null;

    if (!from) {
      smsResult = { ok: false, error: "no configured SignalWire from-number" };
    } else {
      try {
        const client = new SignalWireClient();
        const res = await client.sendSms({ from, to: phone, body: msg });
        smsResult = {
          ok: res.ok,
          sid: res.sid,
          error: res.error,
          from,
          to: phone,
          body: msg,
        };

        // Best-effort log to outbound_messages so admin views stay complete.
        if (res.ok && supaUrl && supaKey) {
          try {
            const sb = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
            await sb.from("outbound_messages").insert({
              from_phone: from,
              to_phone: phone,
              body: msg,
              message_sid: res.sid ?? null,
              lead_id: body.lead_id ?? null,
              status: "sent",
            });
          } catch { /* silent */ }
        }
      } catch (e) {
        smsResult = { ok: false, error: (e as Error).message };
      }
    }
  }

  return NextResponse.json({
    ok: true,
    appointment_id: apptId,
    contact_id: contactRes.contactId,
    start_time_utc: startUtc,
    end_time_utc: endUtc,
    start_time_ct_display: fmtCtDisplay(body.start_time_ct),
    combined_sms: smsResult,
    workflow_note:
      "GHL Walkthrough Appointment Confirmation workflow should fire " +
      "automatically off the Customer Booked event. Reminder ladder " +
      "(3d/1d/same-day/1h) runs itself.",
  });
}
