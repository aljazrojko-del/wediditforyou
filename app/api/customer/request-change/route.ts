// POST /api/customer/request-change
// Body: { token, changeType, description }
//
// Verifies the customer-admin token, runs the change through Claude,
// updates the lead row (so the live site reflects the change immediately
// via dynamic SSR), and logs the full request to change_requests for audit.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  applyChangeWithClaude,
  type SiteContent,
} from "@/lib/customer-changes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Body = {
  token?: string;
  changeType?: string;
  description?: string;
};

const ALLOWED_TYPES = new Set(["text", "hours", "service", "photo", "other"]);

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const changeType = (body.changeType ?? "text").trim();
  const description = (body.description ?? "").trim();

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (!ALLOWED_TYPES.has(changeType))
    return NextResponse.json({ error: "Invalid changeType" }, { status: 400 });
  if (description.length < 5)
    return NextResponse.json({ error: "Description too short" }, { status: 400 });
  if (description.length > 2000)
    return NextResponse.json({ error: "Description too long" }, { status: 400 });

  const sb = supabase();
  const { data: lead, error: leadErr } = await sb
    .from("leads")
    .select("id, headline, subheadline, services, reviews, about_text")
    .eq("customer_admin_token", token)
    .maybeSingle<{
      id: string;
      headline: string | null;
      subheadline: string | null;
      services: SiteContent["services"];
      reviews: SiteContent["reviews"];
      about_text: string | null;
    }>();

  if (leadErr) return NextResponse.json({ error: leadErr.message }, { status: 500 });
  if (!lead)
    return NextResponse.json({ error: "Invalid customer link" }, { status: 404 });

  const current: SiteContent = {
    headline: lead.headline,
    subheadline: lead.subheadline,
    services: lead.services ?? null,
    reviews: lead.reviews ?? null,
    about_text: lead.about_text,
  };

  // Insert pending request first so we have an audit row even on failure.
  const { data: reqRow } = await sb
    .from("change_requests")
    .insert({
      lead_id: lead.id,
      change_type: changeType,
      description,
      prior_site_data: current,
      status: "pending",
    })
    .select("id")
    .maybeSingle<{ id: string }>();
  const reqId = reqRow?.id ?? null;

  const applied = await applyChangeWithClaude(current, description);
  if (!applied.ok || !applied.newContent) {
    if (reqId) {
      await sb
        .from("change_requests")
        .update({ status: "failed", error_message: applied.error })
        .eq("id", reqId);
    }
    return NextResponse.json(
      { error: applied.error ?? "Failed to apply change" },
      { status: 400 },
    );
  }

  const next = applied.newContent;
  const { error: updErr } = await sb
    .from("leads")
    .update({
      headline: next.headline,
      subheadline: next.subheadline,
      services: next.services,
      reviews: next.reviews,
      about_text: next.about_text,
    })
    .eq("id", lead.id);

  if (updErr) {
    if (reqId) {
      await sb
        .from("change_requests")
        .update({ status: "failed", error_message: updErr.message })
        .eq("id", reqId);
    }
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  if (reqId) {
    await sb
      .from("change_requests")
      .update({
        status: "applied",
        new_site_data: next,
        applied_at: new Date().toISOString(),
      })
      .eq("id", reqId);
  }

  return NextResponse.json({ ok: true, requestId: reqId });
}
