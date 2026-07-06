// Fires every 5 minutes to auto-generate sites for any new lead that
// doesn't have a site_url yet. Idempotent — only touches rows where
// site_url IS NULL AND has_website = false.
//
// Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` on
// scheduled invocations. Set CRON_SECRET in Vercel env.
//
// Why this is separate from /api/cron/daily:
// - Daily runs enrich + generate + review-sms + reminders once/day. That
//   cadence is right for enrich (external API cost) and reminders (time-
//   sensitive but not urgent).
// - Generate needs to be near-realtime so Mia can call brand-new leads
//   with a truly live preview URL. Every 5 min = worst case ~5 min gap
//   between lead upsert and site build.

import { NextResponse } from "next/server";
import { generateAll } from "@/scripts/generate-sites";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  try {
    const result = await generateAll({ limit: 50 });
    const finishedAt = new Date().toISOString();
    console.log("[cron:generate-sites]", { startedAt, finishedAt, ...result });
    return NextResponse.json({ startedAt, finishedAt, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron:generate-sites] failed:", message);
    return NextResponse.json(
      { startedAt, error: message },
      { status: 500 },
    );
  }
}
