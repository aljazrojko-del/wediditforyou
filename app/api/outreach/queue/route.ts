// GET /api/outreach/queue
//
// Read-only lead queue for external dialers (e.g. Mia on Luka's VPS).
// Returns leads in a payload shape ready to feed straight into a
// /api/test-call — no field renaming needed on the consumer side.
//
// DEFAULT BEHAVIOR: only returns quality_grade IN ('A_ELITE','B_HOT') so
// the dialer wastes no minutes on E_SUSPECT / D_MID. Override with the
// ?grade= param.
//
// Auth: Authorization: Bearer <OUTREACH_AUTH_TOKEN>
//
// Query params (all optional):
//   limit        — max rows (default 30, max 500)
//   niche        — filter by niche ("mobile mechanic" | "mobile dog groomer" | "tutor")
//   city         — exact city match (e.g. "Dallas, TX")
//   state        — 2-letter state code (matches trailing ", XX" in city)
//   grade        — comma-list of quality_grade codes to include.
//                  Default "A,B" (A_ELITE + B_HOT only).
//                  Accepted: A, B, C, D, E or the full code (A_ELITE, ...).
//                  Pass "all" to disable the filter entirely.
//   untouched    — "true" (default) skips leads where call_placed_at is set
//   include_dialed — "true" includes already-dialed leads (for auditing)
//
// Response:
//   200 {
//     ok: true,
//     count: 30,
//     total_available: 196,
//     leads: [
//       {
//         lead_id, phone, name, company, site_url,
//         city, state, niche, address, rating, rating_count,
//         quality_grade, call_placed_at
//       },
//       ...
//     ]
//   }

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(): Response {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

// "Dallas, TX" -> "TX". Falls back to null when the city has no ", XX" suffix.
function stateFromCity(city: string | null | undefined): string | null {
  if (!city) return null;
  const m = city.match(/,\s*([A-Z]{2})\s*$/);
  return m ? m[1] : null;
}

// First word of the business name, cleaned. Used as the callee first-name so
// Mia's opener stays natural even when the row has no explicit owner_first_name.
function firstNameFromBusiness(name: string): string {
  const stripped = name.replace(/['"]/g, "").trim();
  const first = stripped.split(/\s+/)[0] ?? "";
  return first.replace(/[^A-Za-z]/g, "");
}

export async function GET(req: Request) {
  const expected = process.env.OUTREACH_AUTH_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "server not configured: OUTREACH_AUTH_TOKEN missing" },
      { status: 500 },
    );
  }
  const provided = (req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!provided || provided !== expected) return unauthorized();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "server not configured: Supabase creds missing" },
      { status: 500 },
    );
  }

  const params = new URL(req.url).searchParams;
  const limit = Math.min(500, Math.max(1, Number(params.get("limit") ?? 30)));
  const niche = params.get("niche")?.trim();
  const city = params.get("city")?.trim();
  const state = params.get("state")?.trim().toUpperCase();
  const gradeParam = (params.get("grade") ?? "A,B").trim();
  const untouched = params.get("untouched") !== "false"; // default true
  const includeDialed = params.get("include_dialed") === "true";

  // Parse the grade filter. "all" disables the filter (used for audits).
  // Accepts short codes (A,B,C,D,E) or full codes (A_ELITE,...).
  const GRADE_MAP: Record<string, string> = {
    A: "A_ELITE",
    B: "B_HOT",
    C: "C_WARM",
    D: "D_MID",
    E: "E_SUSPECT",
  };
  let grades: string[] | null = null;
  if (gradeParam.toLowerCase() !== "all") {
    grades = gradeParam
      .split(",")
      .map((g) => g.trim().toUpperCase())
      .map((g) => GRADE_MAP[g] ?? g)
      .filter((g) => g.length > 0);
    if (grades.length === 0) grades = ["A_ELITE", "B_HOT"];
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let q = supabase
    .from("leads")
    .select(
      "id,name,phone,city,niche,site_url,address,rating,rating_count,quality_grade,call_placed_at,voicemail_attempts,next_call_at,voicemail_exhausted_at",
      { count: "exact" },
    )
    .not("site_url", "is", null)
    .not("slug", "is", null)
    .not("phone", "is", null)
    // Never return leads that have hit the voicemail cap.
    .is("voicemail_exhausted_at", null)
    // Respect the retry schedule: if next_call_at is set and still in the
    // future, skip. Leads without a next_call_at are eligible immediately.
    .or(`next_call_at.is.null,next_call_at.lte.${new Date().toISOString()}`);

  if (niche) q = q.eq("niche", niche);
  if (city) q = q.eq("city", city);
  if (state) q = q.ilike("city", `%, ${state}`);
  if (grades) q = q.in("quality_grade", grades);
  // Untouched filter: include leads that were never dialed OR that hit
  // voicemail and are due for a retry (voicemail_attempts > 0 means the
  // retry system already scheduled them via next_call_at above).
  if (untouched && !includeDialed) {
    q = q.or("call_placed_at.is.null,voicemail_attempts.gt.0");
  }

  q = q.order("quality_grade", { ascending: true })
       .order("rating", { ascending: false, nullsFirst: false })
       .order("rating_count", { ascending: false, nullsFirst: false })
       .limit(limit);

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  const leads = (data ?? []).map((row) => ({
    lead_id: row.id as string,
    phone: row.phone as string,
    name: firstNameFromBusiness(row.name as string),
    company: row.name as string,
    site_url: row.site_url as string,
    city: row.city as string,
    state: stateFromCity(row.city as string),
    niche: row.niche as string,
    address: (row.address as string | null) ?? null,
    rating: (row.rating as number | null) ?? null,
    rating_count: (row.rating_count as number | null) ?? null,
    quality_grade: (row.quality_grade as string | null) ?? null,
    call_placed_at: (row.call_placed_at as string | null) ?? null,
    // Retry context so the dialer can log which attempt this is.
    voicemail_attempts: (row.voicemail_attempts as number | null) ?? 0,
  }));

  return NextResponse.json({
    ok: true,
    count: leads.length,
    total_available: count ?? leads.length,
    grade_filter: grades,
    leads,
  });
}
