// GET /api/cron/appointment-reminders
//
// Self-hosted reminder ladder (replaces GoHighLevel workflows). Runs often
// (see vercel.json) and fires each reminder in a time window measured in
// HOURS-until-appointment, so timing is natural regardless of the appointment's
// time of day. Two reminders: ~a day before, and ~an hour before. Idempotent —
// per-appointment sent-flag columns mean each reminder goes out at most once.
//
// Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically
// when CRON_SECRET is set. Also accepts OUTREACH_AUTH_TOKEN (header or ?key=)
// for manual/external triggering.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignalWireClient } from "@/lib/signalwire-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function ctWhen(d: Date): string {
  // e.g. "Wed, Aug 6 at 2:30 PM CT"
  const day = d.toLocaleDateString("en-US", {
    timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    timeZone: "America/Chicago", hour: "numeric", minute: "2-digit",
  });
  return `${day} at ${time} CT`;
}
function ctTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    timeZone: "America/Chicago", hour: "numeric", minute: "2-digit",
  }) + " CT";
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const outreach = process.env.OUTREACH_AUTH_TOKEN;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey) {
    return NextResponse.json({ error: "missing env vars" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const authorized =
    (cronSecret && auth === `Bearer ${cronSecret}`) ||
    (outreach && (auth === `Bearer ${outreach}` || key === outreach));
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sb = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
  const now = new Date();

  const from = process.env.SIGNALWIRE_PHONE_DALLAS ?? null; // NEVER Houston
  if (!from) return NextResponse.json({ error: "no Dallas from-number configured" }, { status: 500 });
  const client = new SignalWireClient();

  // Mark clearly-past confirmed appointments complete (2h grace).
  const pastCutoff = new Date(now.getTime() - 2 * 60 * 60_000).toISOString();
  await sb.from("appointments").update({ status: "completed" })
    .eq("status", "confirmed").lt("start_time", pastCutoff);

  // Upcoming confirmed appointments in the next ~30h.
  const horizon = new Date(now.getTime() + 30 * 60 * 60_000).toISOString();
  const { data: appts, error } = await sb.from("appointments")
    .select("id, phone, first_name, business_name, start_time, site_url, reminder_daybefore_sent_at, reminder_dayof_sent_at")
    .eq("status", "confirmed")
    .gte("start_time", now.toISOString())
    .lte("start_time", horizon);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sent: Array<{ id: string; kind: string; to: string; ok: boolean; error?: string }> = [];

  for (const a of appts ?? []) {
    const start = new Date(a.start_time);
    const hoursUntil = (start.getTime() - now.getTime()) / 3_600_000;
    const to = (a.phone ?? "").trim();
    if (!to) continue;
    const name = a.first_name || "there";

    // ~a day before (window 22-26h) then ~an hour before (window 0.5-2h).
    let kind: "daybefore" | "hour" | null = null;
    let msg = "";
    if (hoursUntil >= 22 && hoursUntil <= 26 && !a.reminder_daybefore_sent_at) {
      kind = "daybefore";
      const linkPart = a.site_url ? ` Your preview: ${a.site_url}.` : "";
      msg = `Hey ${name}, Alex from wediditforyou - reminder, your free site walkthrough is set for ${ctWhen(start)}. I'll call you then.${linkPart} Reply STOP to opt out. - Alex`;
    } else if (hoursUntil >= 0.5 && hoursUntil <= 2 && !a.reminder_dayof_sent_at) {
      kind = "hour";
      msg = `Hey ${name}, Alex from wediditforyou - quick reminder, your site walkthrough is coming up soon, at ${ctTime(start)}. Talk in a bit! Reply STOP to opt out. - Alex`;
    }
    if (!kind) continue;

    let ok = false, err: string | undefined;
    try {
      const r = await client.sendSms({ from, to, body: msg });
      ok = r.ok; err = r.error;
      if (r.ok) {
        try {
          await sb.from("outbound_messages").insert({
            from_phone: from, to_phone: to, body: msg, message_sid: r.sid ?? null, status: "sent",
          });
        } catch { /* silent */ }
      }
    } catch (e) { err = (e as Error).message; }

    // Mark sent even on failure (dead numbers) so we don't retry-spam each run.
    const col = kind === "daybefore" ? "reminder_daybefore_sent_at" : "reminder_dayof_sent_at";
    await sb.from("appointments").update({ [col]: new Date().toISOString() }).eq("id", a.id);
    sent.push({ id: a.id, kind, to, ok, error: err });
  }

  return NextResponse.json({ ok: true, ran_at: now.toISOString(), checked: (appts ?? []).length, reminders: sent });
}
