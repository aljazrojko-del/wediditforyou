// GET /api/mia-brain
//
// Serves Mia's brain (the words she says) to Luka's voice pipeline poller.
// Contract per mia-brain.md:
//   - Auth: Authorization: Bearer <OUTREACH_AUTH_TOKEN>
//   - Returns: application/json with the mia_brain.json shape
//   - Poller hits this every 5 minutes; if we return non-2xx, Luka's system
//     keeps the last-known-good brain.
//
// Current source: static JSON file bundled with the deployment
// (mia-brain-seed.json at repo root). Import at build time so Next bundles it.
//
// To update the brain:
//   1. Edit mia-brain-seed.json (in repo root)
//   2. Commit + push
//   3. Vercel auto-redeploys
//   4. Luka's next 5-min poll picks up the new brain
//
// Future upgrade path: swap the static import for a Supabase table read to
// allow hot updates without redeploy. Contract stays identical.

import { NextResponse } from "next/server";
import brain from "@/mia-brain-seed.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(): Response {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

// Defense-in-depth: match the validation rules in Luka's mia-brain.md contract
// so a bad brain can never reach his system through us.
function validateBrain(b: unknown): { ok: true } | { ok: false; error: string } {
  if (!b || typeof b !== "object") return { ok: false, error: "brain must be an object" };
  const brainObj = b as Record<string, unknown>;
  const stages = brainObj.stages;
  if (!stages || typeof stages !== "object") return { ok: false, error: "brain.stages missing" };

  const stagesObj = stages as Record<string, unknown>;
  for (const key of ["specbuild", "call2", "cold"] as const) {
    const stage = stagesObj[key];
    if (!stage || typeof stage !== "object") {
      return { ok: false, error: `stage.${key} missing or not an object` };
    }
    const s = stage as Record<string, unknown>;
    for (const field of ["agent_name", "forced_opener", "campaign_instructions"] as const) {
      const v = s[field];
      if (typeof v !== "string" || v.trim().length === 0) {
        return { ok: false, error: `stage.${key}.${field} missing or empty` };
      }
    }
    const opener = s.forced_opener as string;
    const instr = s.campaign_instructions as string;
    if (opener.length > 2000) {
      return { ok: false, error: `stage.${key}.forced_opener too long (${opener.length} > 2000)` };
    }
    if (instr.length > 25000) {
      return { ok: false, error: `stage.${key}.campaign_instructions too long (${instr.length} > 25000)` };
    }
  }
  return { ok: true };
}

export async function GET(req: Request) {
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

  // --- Validate the brain before serving (safety net) ---
  const check = validateBrain(brain);
  if (!check.ok) {
    console.error("[mia-brain] validation failed:", check.error);
    return NextResponse.json(
      { ok: false, error: "brain_invalid", detail: check.error },
      { status: 500 },
    );
  }

  // --- Serve ---
  return new NextResponse(JSON.stringify(brain), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
