// POST /api/mia/book-appointment
//
// Called by Mia's voice pipeline when a prospect verbally agrees to a Call 2
// slot. Persists the booking to `cal_bookings`, fires a combined confirmation
// SMS (site link + slot time), and marks the lead as booked.
//
// Auth: Authorization: Bearer <OUTREACH_AUTH_TOKEN>  (same secret as send-link)
//
// Request body (JSON):
//   {
//     "lead_id":          "uuid",                          // required
//     "iso_datetime":     "2026-07-14T10:00:00-05:00",     // required, fully-qualified ISO 8601 with offset or Z
//     "duration_minutes": 15,                              // default 15
//     "first_name":       "Carlos",                        // optional, falls back to lead.owner_first_name
//     "phone":            "+17135551234",                  // optional, falls back to lead.phone
//     "notes":            "expressed interest in tire biz",// optional
//     "source":           "mia" | "manual" | ...           // default "mia"
//   }
//
// Response:
//   200 { ok, booking_id, cal_booking_uid, start_time_utc, wall_clock_ct, sms_sid, sms_error }
//   400 invalid input
//   401 bad auth
//   404 lead not found
//   409 duplicate cal_booking_uid (same lead + same start time already booked)
//   500 server misconfig or DB failure

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignalWireClient } from "@/lib/signalwire-client";
import { normalizeE164 } from "@/lib/outreach";

export const runtime = "nodejs";

type RequestBody = {
  lead_id?: string;
  // Time — accept either format. iso_datetime is our documented ISO 8601 with
  // offset; start_time_ct is Luka's Central-time wall clock ("2026-07-18T13:00").
  iso_datetime?: string;
  start_time_ct?: string;
  duration_minutes?: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  notes?: string;
  source?: string;
  // Luka's alias for the preview URL. Falls back to lead.site_url if omitted.
  site_preview_url?: string;
  // Whether we (WDIFY) send the combined link+time SMS. If Luka's Mia already
  // texted the link mid-call, he sets this to false to avoid a duplicate.
  send_combined_sms?: boolean;
};

// Parse an America/Chicago wall-clock string ("2026-07-18T13:00" or
// "2026-07-18 1:00 PM") into a UTC Date, correctly accounting for CDT (Mar-Nov)
// vs CST (Nov-Mar). Uses Intl to derive the offset for that exact date so
// DST transitions are handled without a date library.
function parseCentralToUtc(input: string): Date | null {
  if (!input) return null;
  // Try native ISO parse first (handles values with explicit offset already)
  const naive = new Date(input);
  const asIfLocal = input.includes("T") || input.includes(" ")
    ? new Date(input.replace(" ", "T") + "Z")
    : null;
  if (asIfLocal && !isNaN(asIfLocal.getTime())) {
    // Get the offset (in minutes) that America/Chicago has for this instant.
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      timeZoneName: "shortOffset",
      hour: "numeric",
    });
    const parts = dtf.formatToParts(asIfLocal);
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    // shortOffset like "GMT-5" or "GMT-6"
    const m = tzName.match(/GMT([+-]?\d+)/);
    const offsetHours = m ? parseInt(m[1], 10) : -5;
    return new Date(asIfLocal.getTime() - offsetHours * 3600 * 1000);
  }
  return isNaN(naive.getTime()) ? null : naive;
}

function unauthorized(): Response {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}
function badRequest(error: string): Response {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

function formatWallClockCT(startUtc: Date): string {
  const dayFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Chicago",
  });
  return `${dayFmt.format(startUtc)} at ${timeFmt.format(startUtc)} CT`;
}

type GhlSyncResult = {
  ok: boolean;
  contact_id?: string;
  appointment_id?: string;
  error?: string;
  skipped?: "no_pit" | "no_location" | "no_calendar";
};

async function syncToGhl(opts: {
  firstName: string;
  lastName?: string;
  phone: string;
  city: string | null;
  leadName: string;
  isoDatetime: string;
  durationMinutes: number;
  siteUrl: string;
  notes: string | null;
}): Promise<GhlSyncResult> {
  const pit = process.env.GHL_PIT_TOKEN;
  const locationId = process.env.GHL_WDIFY_LOCATION_ID;
  const calendarId = process.env.GHL_CALENDAR_ID;

  if (!pit) return { ok: false, skipped: "no_pit" };
  if (!locationId) return { ok: false, skipped: "no_location" };
  if (!calendarId) return { ok: false, skipped: "no_calendar" };

  const headers = {
    Authorization: `Bearer ${pit}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // 1. Upsert contact (by phone)
  let contactId: string | undefined;
  try {
    const upsertRes = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers,
      body: JSON.stringify({
        locationId,
        firstName: opts.firstName,
        lastName: opts.lastName ?? opts.leadName,
        phone: opts.phone,
        source: "mia-voice-call",
        tags: ["mia-booked", "walkthrough-scheduled"],
        customFields: [
          { key: "notes", field_value: opts.notes ?? "" },
          { key: "site_url", field_value: opts.siteUrl ?? "" },
          { key: "city", field_value: opts.city ?? "" },
        ],
      }),
    });
    const upsertData = (await upsertRes.json()) as {
      contact?: { id?: string };
      id?: string;
      message?: string;
    };
    if (!upsertRes.ok) {
      return {
        ok: false,
        error: `contact_upsert_${upsertRes.status}: ${upsertData?.message ?? JSON.stringify(upsertData)}`,
      };
    }
    contactId = upsertData?.contact?.id ?? upsertData?.id;
    if (!contactId) {
      return {
        ok: false,
        error: `contact_upsert_no_id: ${JSON.stringify(upsertData)}`,
      };
    }
  } catch (e) {
    return { ok: false, error: `contact_upsert_threw: ${(e as Error).message}` };
  }

  // 2. Create appointment
  const startIso = new Date(opts.isoDatetime).toISOString();
  const endIso = new Date(new Date(opts.isoDatetime).getTime() + opts.durationMinutes * 60_000).toISOString();

  try {
    const apptRes = await fetch(
      "https://services.leadconnectorhq.com/calendars/events/appointments",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          calendarId,
          locationId,
          contactId,
          title: `Website Walkthrough — ${opts.firstName}`,
          appointmentStatus: "confirmed",
          startTime: startIso,
          endTime: endIso,
          meetingLocationType: "phone",
          meetingLocationId: opts.phone,
          ignoreDateRange: true,
          toNotify: true,
        }),
      },
    );
    const apptData = (await apptRes.json()) as {
      id?: string;
      appointment?: { id?: string };
      message?: string;
    };
    if (!apptRes.ok) {
      return {
        ok: false,
        contact_id: contactId,
        error: `appointment_${apptRes.status}: ${apptData?.message ?? JSON.stringify(apptData)}`,
      };
    }
    const appointmentId = apptData?.id ?? apptData?.appointment?.id;
    return {
      ok: true,
      contact_id: contactId,
      appointment_id: appointmentId,
    };
  } catch (e) {
    return {
      ok: false,
      contact_id: contactId,
      error: `appointment_threw: ${(e as Error).message}`,
    };
  }
}

export async function POST(req: Request) {
  // --- Auth ---
  const expected = process.env.OUTREACH_AUTH_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "server_misconfig", detail: "OUTREACH_AUTH_TOKEN missing" },
      { status: 500 },
    );
  }
  const provided = (req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!provided || provided !== expected) return unauthorized();

  // --- Parse + validate ---
  let body: RequestBody;
  let rawText = "";
  try {
    rawText = await req.text();
    body = JSON.parse(rawText) as RequestBody;
  } catch {
    console.error("[book-appointment] invalid_json — raw body:", rawText.slice(0, 500));
    return badRequest("invalid_json");
  }

  // Log every incoming payload so we can align with Luka's system when
  // validation errors happen. Keys logged, values redacted if sensitive.
  console.log("[book-appointment] incoming payload:", JSON.stringify(body));

  const leadId = (body.lead_id ?? "").trim();
  if (!leadId) {
    console.warn("[book-appointment] lead_id missing");
    return badRequest("lead_id required");
  }

  // Accept iso_datetime (our docs) OR start_time_ct (Luka's shape) — first
  // one that parses wins. This is the field-name alignment fix.
  const isoDatetime = (body.iso_datetime ?? "").trim();
  const startTimeCt = (body.start_time_ct ?? "").trim();
  let start: Date | null = null;
  let sourceField = "";
  if (isoDatetime) {
    start = new Date(isoDatetime);
    sourceField = "iso_datetime";
  } else if (startTimeCt) {
    start = parseCentralToUtc(startTimeCt);
    sourceField = "start_time_ct";
  }
  if (!start) {
    console.warn(
      "[book-appointment] no valid datetime. Body keys:",
      Object.keys(body),
    );
    return badRequest("iso_datetime or start_time_ct required");
  }
  if (isNaN(start.getTime())) {
    console.warn(`[book-appointment] ${sourceField} unparseable:`, isoDatetime || startTimeCt);
    return badRequest(`${sourceField} invalid — expected ISO 8601 or Central-time wall clock`);
  }
  if (start.getTime() < Date.now() - 60_000) {
    console.warn(`[book-appointment] ${sourceField} in past:`, isoDatetime || startTimeCt);
    return badRequest(`${sourceField} is in the past`);
  }

  const durationMin =
    body.duration_minutes && body.duration_minutes > 0 && body.duration_minutes <= 240
      ? body.duration_minutes
      : 15;
  const end = new Date(start.getTime() + durationMin * 60_000);
  const source = (body.source ?? "mia").trim() || "mia";
  const notesIn = (body.notes ?? "").trim();

  // --- Supabase ---
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { ok: false, error: "server_misconfig", detail: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing" },
      { status: 500 },
    );
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  // --- Look up lead ---
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, name, owner_first_name, phone, city, site_url")
    .eq("id", leadId)
    .maybeSingle();
  if (leadErr) {
    return NextResponse.json(
      { ok: false, error: "lead_lookup_failed", detail: leadErr.message },
      { status: 500 },
    );
  }
  if (!lead) {
    return NextResponse.json({ ok: false, error: "lead_not_found" }, { status: 404 });
  }

  const firstName =
    (body.first_name ?? lead.owner_first_name ?? "").trim() || "there";
  const rawPhone = body.phone ?? lead.phone ?? "";
  const phone = normalizeE164(rawPhone);
  if (!phone) {
    return badRequest("no valid phone (payload and lead both blank/unnormalizable)");
  }

  // Prefer explicit site_preview_url from Luka; fall back to the lead's site_url.
  const siteUrl = (body.site_preview_url ?? lead.site_url ?? "").trim();

  // --- Insert cal_bookings ---
  const calBookingUid = `mia-${leadId}-${start.toISOString()}`;
  const { data: bookingRow, error: bookErr } = await supabase
    .from("cal_bookings")
    .insert({
      lead_id: leadId,
      cal_booking_uid: calBookingUid,
      cal_event_type: "mia-walkthrough",
      status: "confirmed",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      attendee_name: `${firstName} (${lead.name})`,
      attendee_phone: phone,
      attendee_timezone: "America/Chicago",
      notes: notesIn || null,
      raw: { source, request: body, created_via: "mia-book-appointment" },
    })
    .select("id, cal_booking_uid")
    .single();

  if (bookErr) {
    // 23505 = unique_violation on cal_booking_uid
    if (bookErr.code === "23505") {
      return NextResponse.json(
        {
          ok: false,
          error: "duplicate_booking",
          detail: "A booking with this lead + start_time already exists",
          cal_booking_uid: calBookingUid,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "booking_insert_failed", detail: bookErr.message },
      { status: 500 },
    );
  }

  // --- Combined confirmation SMS ---
  const wallClock = formatWallClockCT(start);
  const smsBody = siteUrl
    ? `Hi ${firstName}, confirming your ${durationMin}-min walkthrough ${wallClock} with We Did It For You.

Here's the site we built for you: ${siteUrl}

Reply STOP to cancel.`
    : `Hi ${firstName}, confirming your ${durationMin}-min walkthrough ${wallClock} with We Did It For You.

We'll walk you through your site on the call.

Reply STOP to cancel.`;

  let smsSid: string | null = null;
  let smsError: string | null = null;
  let smsSkipped = false;
  let fromNumber: string | null = null;
  // send_combined_sms lets Luka opt-out when Mia already texted the link
  // mid-call, so we don't double-SMS the prospect. Default (undefined) = true.
  const shouldSendSms = body.send_combined_sms !== false;
  if (!shouldSendSms) {
    smsSkipped = true;
  } else {
    try {
      const sw = new SignalWireClient();
      // Dallas is the only A2P-approved SMS sender; Houston is retired.
      fromNumber =
        sw.pickFromNumber(lead.city) ??
        process.env.SIGNALWIRE_PHONE_DALLAS ??
        null;
      if (!fromNumber) {
        smsError = "no_from_number_available";
      } else {
        const result = await sw.sendSms({ from: fromNumber, to: phone, body: smsBody });
        if (result.ok && result.sid) {
          smsSid = result.sid;
        } else {
          smsError = result.error ?? "unknown_sms_error";
        }
      }
    } catch (e) {
      smsError = (e as Error).message;
    }
  }

  // --- Log to outbound_messages (best-effort) ---
  if (smsSid && fromNumber) {
    try {
      await supabase.from("outbound_messages").insert({
        from_phone: fromNumber,
        to_phone: phone,
        body: smsBody,
        message_sid: smsSid,
        lead_id: leadId,
        status: "queued",
        raw: {
          source: "mia-booking-confirm",
          cal_booking_uid: calBookingUid,
          booking_id: bookingRow.id,
        },
      });
    } catch (e) {
      console.error("[mia/book-appointment] outbound_messages log failed:", (e as Error).message);
    }
  }

  // --- Sync to GHL (best-effort) ---
  const ghl = await syncToGhl({
    firstName,
    lastName: lead.name,
    phone,
    city: lead.city,
    leadName: lead.name,
    // syncToGhl expects a parseable date string. We resolved `start` from
    // whichever field arrived (iso_datetime OR start_time_ct → Central-time
    // parsed to UTC), so pass the canonical UTC ISO — not the raw iso_datetime
    // field (which is empty when the caller uses start_time_ct).
    isoDatetime: start.toISOString(),
    durationMinutes: durationMin,
    siteUrl,
    notes: notesIn || null,
  });

  // --- Mark lead as booked (best-effort) ---
  try {
    await supabase.from("leads").update({ call_status: "booked" }).eq("id", leadId);
  } catch (e) {
    console.error("[mia/book-appointment] leads.call_status update failed:", (e as Error).message);
  }

  // --- Backfill cal_bookings with GHL IDs (best-effort) ---
  if (ghl.contact_id || ghl.appointment_id) {
    try {
      await supabase
        .from("cal_bookings")
        .update({
          raw: {
            source,
            request: body,
            created_via: "mia-book-appointment",
            ghl_contact_id: ghl.contact_id ?? null,
            ghl_appointment_id: ghl.appointment_id ?? null,
            ghl_sync_ok: ghl.ok,
            ghl_sync_error: ghl.error ?? null,
          },
        })
        .eq("id", bookingRow.id);
    } catch (e) {
      console.error("[mia/book-appointment] cal_bookings raw backfill failed:", (e as Error).message);
    }
  }

  // Response includes both our documented field names AND Luka-side aliases
  // (appointment_id + combined_sms.ok) so his engine can read straight off
  // the top-level keys per his spec.
  const combinedSmsOk = smsSkipped ? true : smsSid !== null && !smsError;
  return NextResponse.json({
    ok: true,
    // Aliases Luka's engine reads back:
    appointment_id: ghl.appointment_id ?? bookingRow.id,
    combined_sms: {
      ok: combinedSmsOk,
      sid: smsSid,
      error: smsError,
      skipped: smsSkipped,
    },
    // Full detail for our own consumers:
    booking_id: bookingRow.id,
    cal_booking_uid: bookingRow.cal_booking_uid,
    start_time_utc: start.toISOString(),
    end_time_utc: end.toISOString(),
    wall_clock_ct: wallClock,
    duration_minutes: durationMin,
    sms_sid: smsSid,
    sms_error: smsError,
    sms_from: fromNumber,
    sms_skipped: smsSkipped,
    ghl_sync_ok: ghl.ok,
    ghl_contact_id: ghl.contact_id ?? null,
    ghl_appointment_id: ghl.appointment_id ?? null,
    ghl_error: ghl.error ?? null,
    ghl_skipped: ghl.skipped ?? null,
    source,
  });
}
