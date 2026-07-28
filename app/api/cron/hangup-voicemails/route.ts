// GET /api/cron/hangup-voicemails
//
// Polls SignalWire for in-progress outbound calls where AMD has classified
// the callee as a machine (voicemail) or fax, then:
//   1. Hangs up immediately via the SignalWire API (no wasted seconds)
//   2. Increments the lead's voicemail_attempts counter
//   3. Schedules next_call_at at a different hour-of-day slot (rotating)
//   4. After 5 total voicemail attempts, marks the lead as exhausted and
//      never queues it again
//
// The queue endpoint (/api/outreach/queue) respects next_call_at and
// excludes exhausted leads so this all flows through automatically.
//
// Runs every minute via Vercel cron (see vercel.json).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MACHINE_VERDICTS = new Set([
  "machine_start",
  "machine_end_beep",
  "machine_end_silence",
  "machine_end_other",
  "fax",
]);

// Cap on voicemail attempts before we give up on a lead permanently.
const MAX_VOICEMAIL_ATTEMPTS = 5;

// Rotating hour-of-day slots for retries. Each slot targets a different
// window in the callee's local time so we can catch them if they answer at
// a different time of day. Since we don't (yet) know the callee's tz per
// call, use the caller's SignalWire dial time as a proxy — this is close
// enough for US-only campaigns where all sending is from Dallas.
const RETRY_SLOTS_UTC_HOURS = [
  // In US Central (UTC-5/UTC-6). Rough conversion: subtract 6.
  14, // 8-9am CT — morning
  17, // 11am-12pm CT — pre-lunch
  20, // 2-3pm CT — early afternoon
  23, // 5-6pm CT — end of workday
];

type SwCall = {
  sid: string;
  to: string;
  from: string;
  status: string;
  answered_by: string | null;
  date_created: string;
};

async function fetchInProgressMachineCalls(
  projectId: string,
  token: string,
  space: string,
): Promise<SwCall[]> {
  const basic = Buffer.from(`${projectId}:${token}`).toString("base64");
  const resp = await fetch(
    `https://${space}/api/laml/2010-04-01/Accounts/${projectId}/Calls.json?Status=in-progress&PageSize=50`,
    { headers: { Authorization: `Basic ${basic}` }, cache: "no-store" },
  );
  if (!resp.ok) return [];
  const j = (await resp.json()) as { calls?: SwCall[] };
  return (j.calls ?? []).filter(
    (c) =>
      c.answered_by != null &&
      MACHINE_VERDICTS.has(c.answered_by.toLowerCase()),
  );
}

async function hangupCall(
  projectId: string,
  token: string,
  space: string,
  callSid: string,
): Promise<{ ok: boolean; error?: string }> {
  const basic = Buffer.from(`${projectId}:${token}`).toString("base64");
  const body = new URLSearchParams({ Status: "completed" });
  try {
    const resp = await fetch(
      `https://${space}/api/laml/2010-04-01/Accounts/${projectId}/Calls/${callSid}.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );
    if (!resp.ok) {
      const t = await resp.text();
      return { ok: false, error: `${resp.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Pick the next retry slot. Rotates through morning/midday/afternoon/evening
// UTC-hours so each attempt hits a different part of the callee's workday.
// Skips today's remaining slots and lands on the next available one that's
// at least 3 hours away.
function computeNextCallAt(currentAttempt: number, now: Date): Date {
  // Attempt N -> use slot (N-1) % slots.length so attempt 1 hits slot 0, etc.
  const slotHour = RETRY_SLOTS_UTC_HOURS[(currentAttempt - 1) % RETRY_SLOTS_UTC_HOURS.length];
  const candidate = new Date(now);
  candidate.setUTCHours(slotHour, 0, 0, 0);
  // If that slot on today's date is < 3h from now, roll forward one day.
  const minGapMs = 3 * 60 * 60 * 1000;
  while (candidate.getTime() - now.getTime() < minGapMs) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return candidate;
}

async function findLeadByPhone(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  phone: string,
): Promise<{
  id: string;
  name: string;
  voicemail_attempts: number;
} | null> {
  const last10 = phone.replace(/[^0-9]/g, "").slice(-10);
  if (last10.length !== 10) return null;
  const { data } = await supabase
    .from("leads")
    .select("id, name, phone, voicemail_attempts")
    .not("phone", "is", null)
    .limit(2000);
  if (!data) return null;
  const lead = (
    data as Array<{
      id: string;
      name: string;
      phone: string;
      voicemail_attempts: number | null;
    }>
  ).find((r) => r.phone.replace(/[^0-9]/g, "").slice(-10) === last10);
  return lead
    ? {
        id: lead.id,
        name: lead.name,
        voicemail_attempts: lead.voicemail_attempts ?? 0,
      }
    : null;
}

async function handle(req: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  const bearer = (req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  const vercelCron = req.headers.get("x-vercel-cron") === "1";
  const authOk =
    vercelCron || (cronSecret && bearer && bearer === cronSecret);
  if (!authOk) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_TOKEN;
  const space = process.env.SIGNALWIRE_SPACE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!projectId || !token || !space || !supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { ok: false, error: "server credentials missing" },
      { status: 500 },
    );
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const machineCalls = await fetchInProgressMachineCalls(projectId, token, space);
  const now = new Date();
  const results: Array<{
    call_sid: string;
    to: string;
    answered_by: string;
    hangup: { ok: boolean; error?: string };
    lead_id: string | null;
    new_attempts: number | null;
    next_call_at: string | null;
    exhausted: boolean;
  }> = [];

  for (const c of machineCalls) {
    const hangup = await hangupCall(projectId, token, space, c.sid);
    // Increment the lead's voicemail counter + schedule next retry (or mark
    // exhausted after 5 attempts).
    let leadId: string | null = null;
    let newAttempts: number | null = null;
    let nextCallAt: string | null = null;
    let exhausted = false;
    const lead = await findLeadByPhone(supabase, c.to);
    if (lead) {
      leadId = lead.id;
      newAttempts = lead.voicemail_attempts + 1;
      exhausted = newAttempts >= MAX_VOICEMAIL_ATTEMPTS;
      const patch: Record<string, unknown> = {
        voicemail_attempts: newAttempts,
        last_voicemail_at: now.toISOString(),
      };
      if (exhausted) {
        patch.voicemail_exhausted_at = now.toISOString();
        patch.next_call_at = null;
      } else {
        const scheduled = computeNextCallAt(newAttempts, now);
        nextCallAt = scheduled.toISOString();
        patch.next_call_at = nextCallAt;
      }
      try {
        await supabase.from("leads").update(patch).eq("id", lead.id);
      } catch (e) {
        console.error("[cron/hangup-voicemails] update failed:", (e as Error).message);
      }
    }

    results.push({
      call_sid: c.sid,
      to: c.to,
      answered_by: c.answered_by ?? "",
      hangup,
      lead_id: leadId,
      new_attempts: newAttempts,
      next_call_at: nextCallAt,
      exhausted,
    });
  }

  return NextResponse.json({
    ok: true,
    scanned: machineCalls.length,
    hangups: results.filter((r) => r.hangup.ok).length,
    exhausted_leads: results.filter((r) => r.exhausted).length,
    results,
  });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
