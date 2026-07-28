// POST /api/admin/enrich-batch
//
// Run the enrichment waterfall against N leads that are missing an email.
// Prioritizes C_WARM and D_MID grades (the leads worth calling but currently
// unreachable by email). A_ELITE / B_HOT are skipped because we call them first,
// and E_SUSPECT is skipped because they're not worth spending API credits on.
//
// Auth: admin session cookie (via requireAdmin) OR
//       Authorization: Bearer <OUTREACH_AUTH_TOKEN> (for CLI/automation).
//
// Body:
//   {
//     limit?: number,          // default 30, max 100
//     grades?: string[],       // default ["C_WARM","D_MID"]
//     force?: boolean,         // re-enrich even if email already set
//     dry_run?: boolean        // return the target list without running
//   }
//
// Response:
//   { ok, processed, updated, skipped, failed, sample: [...] }

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import { enrichLead, guessOwnerName } from "@/lib/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Body = {
  limit?: number;
  grades?: string[];
  force?: boolean;
  dry_run?: boolean;
  // Prioritize leads whose business name matches a possessive person-name
  // pattern ("Hector's Mobile Auto") — these have the highest LeadMagic
  // success rate. Off by default (processes any lead in the grade slice).
  possessive_only?: boolean;
};

export async function POST(req: Request) {
  // Accept either admin cookie OR bearer token for CLI-driven runs.
  const bearer = (req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  const tokenOk =
    bearer.length > 0 &&
    process.env.OUTREACH_AUTH_TOKEN &&
    bearer === process.env.OUTREACH_AUTH_TOKEN;
  if (!tokenOk) {
    const unauth = await requireAdmin();
    if (unauth) return unauth;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "server_misconfig: Supabase creds missing" },
      { status: 500 },
    );
  }

  let body: Body = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = (await req.json()) as Body;
    }
  } catch {
    // fall through with defaults
  }

  const limit = Math.min(100, Math.max(1, Number(body.limit ?? 30)));
  const grades =
    Array.isArray(body.grades) && body.grades.length > 0
      ? body.grades
      : ["C_WARM", "D_MID"];
  const force = Boolean(body.force);
  const dryRun = Boolean(body.dry_run);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const possessiveOnly = Boolean(body.possessive_only);

  // When targeting high-confidence LeadMagic candidates, pull a much larger
  // slice from the DB and filter in JS using our canonical guessOwnerName —
  // this uses the US_FIRST_NAMES whitelist + BUSINESS_WORDS blocklist and
  // is way more reliable than a regex through PostgREST.
  const dbLimit = possessiveOnly ? Math.min(2000, Math.max(200, limit * 20)) : limit;

  let query = supabase
    .from("leads")
    .select("id, name, city, niche, phone, owner_email, email_status, quality_grade")
    .in("quality_grade", grades)
    .not("phone", "is", null)
    .limit(dbLimit);
  if (!force) query = query.is("owner_email", null);

  const { data: rowsRaw, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: `supabase_select: ${error.message}` },
      { status: 500 },
    );
  }

  // When possessive_only is on, filter the DB slice down to leads where our
  // canonical name extractor actually produces a validated first name.
  const rows = possessiveOnly
    ? (rowsRaw ?? [])
        .filter((r) => guessOwnerName((r.name as string) ?? "").first)
        .slice(0, limit)
    : (rowsRaw ?? []).slice(0, limit);

  if (!rows || rows.length === 0) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      sample: [],
      db_slice_size: rowsRaw?.length ?? 0,
      message:
        possessiveOnly
          ? "No leads with validated first-name pattern in the DB slice. Widen grades or turn off possessive_only."
          : "No leads matched the criteria — nothing to enrich.",
    });
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      processed: 0,
      would_process: rows.length,
      db_slice_size: rowsRaw?.length ?? 0,
      grades,
      possessive_only: possessiveOnly,
      sample: rows.slice(0, 15).map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city,
        quality_grade: r.quality_grade,
        extracted_first: guessOwnerName((r.name as string) ?? "").first ?? null,
      })),
    });
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const sample: Array<{
    id: string;
    name: string;
    email: string | null;
    email_status: string | null;
    owner: string | null;
  }> = [];

  for (const row of rows) {
    try {
      const result = await enrichLead({
        business_name: row.name as string,
        city: (row.city as string) ?? "",
        niche: (row.niche as string) ?? "",
        phone: (row.phone as string) ?? null,
      });

      const patch: Record<string, unknown> = {};
      if (result.owner_first_name) patch.owner_first_name = result.owner_first_name;
      if (result.owner_last_name) patch.owner_last_name = result.owner_last_name;
      if (result.company_domain) patch.company_domain = result.company_domain;
      if (result.facebook_url) patch.facebook_url = result.facebook_url;
      if (result.email) {
        patch.owner_email = result.email;
        patch.email_status = result.email_status;
      }
      if (result.raw) patch.enrichment_data = result.raw;

      if (Object.keys(patch).length === 0) {
        skipped++;
        continue;
      }

      const { error: upErr } = await supabase
        .from("leads")
        .update(patch)
        .eq("id", row.id as string);
      if (upErr) {
        console.error("[enrich-batch] update failed:", upErr.message);
        failed++;
        continue;
      }
      updated++;
      if (sample.length < 20) {
        sample.push({
          id: row.id as string,
          name: row.name as string,
          email: result.email ?? null,
          email_status: result.email_status ?? null,
          owner: result.owner_first_name
            ? `${result.owner_first_name}${result.owner_last_name ? " " + result.owner_last_name : ""}`
            : null,
        });
      }
    } catch (e) {
      console.error("[enrich-batch] error:", (e as Error).message);
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: rows.length,
    updated,
    skipped,
    failed,
    grades,
    sample,
  });
}
