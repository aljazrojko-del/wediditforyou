// POST /api/admin/onboarding/[id]/transition
// Body: { stage: <next stage> }
// Validates the requested transition against the state machine, then flips
// the row and stamps the appropriate timestamp column.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import {
  isValidTransition,
  type Stage,
  ALL_STAGES,
} from "@/lib/onboarding-stages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TIMESTAMP_COLUMN: Partial<Record<Stage, string>> = {
  domain_registered: "domain_register_at",
  site_deployed: "site_deployed_at",
  approved: "customer_approved_at",
  refunded: "refund_completed_at",
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await ctx.params;

  let body: { stage?: string };
  try {
    body = (await req.json()) as { stage?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const nextStage = body.stage as Stage | undefined;
  if (!nextStage || !ALL_STAGES.includes(nextStage)) {
    return NextResponse.json({ error: "invalid stage" }, { status: 400 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    return NextResponse.json({ error: "supabase env missing" }, { status: 500 });
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: cur, error: curErr } = await supabase
    .from("onboarding_state")
    .select("id, stage")
    .eq("id", id)
    .maybeSingle<{ id: string; stage: Stage }>();

  if (curErr) return NextResponse.json({ error: curErr.message }, { status: 500 });
  if (!cur) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!isValidTransition(cur.stage, nextStage)) {
    return NextResponse.json(
      { error: `Cannot transition from "${cur.stage}" to "${nextStage}"` },
      { status: 400 },
    );
  }

  const patch: Record<string, unknown> = { stage: nextStage };
  const tsCol = TIMESTAMP_COLUMN[nextStage];
  if (tsCol) patch[tsCol] = new Date().toISOString();
  if (nextStage === "refund_pending") patch.refund_requested = true;

  const { error: upErr } = await supabase
    .from("onboarding_state")
    .update(patch)
    .eq("id", id);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, stage: nextStage });
}
