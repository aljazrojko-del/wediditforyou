// POST /api/customer/select-logo
// Body: { token, url }
//
// Records the customer's choice from their generated logo options. The
// selected URL must be one of the entries in their logo_options to prevent
// arbitrary URL injection.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { GeneratedLogo } from "@/lib/openai-logo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  let body: { token?: string; url?: string };
  try {
    body = (await req.json()) as { token?: string; url?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const chosen = (body.url ?? "").trim();
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });
  if (!chosen) return NextResponse.json({ error: "missing url" }, { status: 400 });

  const sb = supabase();
  const { data: lead, error } = await sb
    .from("leads")
    .select("id, logo_options")
    .eq("customer_admin_token", token)
    .maybeSingle<{ id: string; logo_options: GeneratedLogo[] | null }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!lead) return NextResponse.json({ error: "invalid link" }, { status: 404 });

  // Validate the chosen URL is from this customer's options — prevents arbitrary URL save
  const validUrls = new Set((lead.logo_options ?? []).map((l) => l.url));
  if (!validUrls.has(chosen))
    return NextResponse.json({ error: "URL not in your generated options" }, { status: 400 });

  const { error: upErr } = await sb
    .from("leads")
    .update({
      logo_url: chosen,
      logo_selected_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, url: chosen });
}
