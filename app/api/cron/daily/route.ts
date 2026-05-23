// Daily cron — runs once per day via Vercel Cron Jobs (configured in vercel.json).
//
// Auth: Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically
// when invoking cron paths in production. Set CRON_SECRET in Vercel env.
//
// Manual invocation (testing):
//   curl -H "Authorization: Bearer $CRON_SECRET" https://wedidit4you.com/api/cron/daily
//
// What it does:
//   1. enrichLeads — fills email/contact for any lead missing it (capped)
//   2. generateSites — creates niche-specific sites for any lead missing site_url (capped)
//
// Skipped from cron (require human niche/city decisions):
//   - pull-leads (run manually: `npm run leads -- --niche X --city Y`)
//   - draft-emails (run manually after a batch finishes generating)

import { NextResponse } from "next/server";
import { enrichAll } from "@/scripts/enrich-leads";
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
  const result: {
    startedAt: string;
    finishedAt?: string;
    enrich?: Awaited<ReturnType<typeof enrichAll>>;
    generate?: Awaited<ReturnType<typeof generateAll>>;
    errors: string[];
  } = { startedAt, errors: [] };

  try {
    result.enrich = await enrichAll({ limit: 15 });
  } catch (err) {
    result.errors.push(
      `enrich: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  try {
    result.generate = await generateAll({ limit: 15 });
  } catch (err) {
    result.errors.push(
      `generate: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  result.finishedAt = new Date().toISOString();
  console.log("[cron:daily]", JSON.stringify(result));

  return NextResponse.json(result);
}
