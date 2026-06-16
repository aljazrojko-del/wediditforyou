// Weekly cron — pulls fresh leads from Google Places for the configured
// niche×city combos. Runs on Vercel Cron (see vercel.json).
//
// Auth: same Bearer CRON_SECRET as /api/cron/daily.
//
// Manual invocation:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://wedidit4you.com/api/cron/pull-leads
//
// Combos + filtering live in lib/lead-puller.ts (DEFAULT_COMBOS array).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pullLeadsForConfiguredCombos } from "@/lib/lead-puller";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function makeSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

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
  const supabase = makeSupabase();

  try {
    const result = await pullLeadsForConfiguredCombos(supabase);
    const finishedAt = new Date().toISOString();
    console.log("[cron:pull-leads]", JSON.stringify({ ...result, startedAt, finishedAt }));
    return NextResponse.json({ ...result, startedAt, finishedAt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron:pull-leads] crashed:", msg);
    return NextResponse.json(
      { error: msg, startedAt, finishedAt: new Date().toISOString() },
      { status: 500 },
    );
  }
}
