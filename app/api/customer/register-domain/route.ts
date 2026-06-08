// POST /api/customer/register-domain
// Body: { token, domain }
//
// Full Porkbun + Vercel registration flow:
//   1. validate token + domain syntax
//   2. check availability via Porkbun
//   3. register the domain (charges Porkbun balance)
//   4. set DNS records (A + CNAME to Vercel)
//   5. attach to the Vercel project
//   6. update onboarding_state to stage='domain_registered' + stamp domain

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  checkAvailability,
  registerDomain,
  setPorkbunCnameToVercel,
  addDomainToVercel,
  isLikelyValidDomain,
} from "@/lib/porkbun";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  let body: { token?: string; domain?: string };
  try {
    body = (await req.json()) as { token?: string; domain?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const domain = (body.domain ?? "").trim().toLowerCase();
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });
  if (!isLikelyValidDomain(domain))
    return NextResponse.json(
      { error: "Domain doesn't look right — example: yourbusiness.com" },
      { status: 400 },
    );

  const sb = supabase();
  const { data: lead } = await sb
    .from("leads")
    .select("id, customer_admin_token")
    .eq("customer_admin_token", token)
    .maybeSingle<{ id: string }>();
  if (!lead) return NextResponse.json({ error: "invalid link" }, { status: 404 });

  const { data: onboarding } = await sb
    .from("onboarding_state")
    .select("id, stage, domain_requested, domain_registered")
    .eq("lead_id", lead.id)
    .maybeSingle<{
      id: string;
      stage: string;
      domain_requested: string | null;
      domain_registered: string | null;
    }>();
  if (!onboarding)
    return NextResponse.json({ error: "no onboarding state yet" }, { status: 400 });
  if (onboarding.domain_registered)
    return NextResponse.json(
      { error: `Already registered: ${onboarding.domain_registered}` },
      { status: 400 },
    );

  // Stamp the requested domain immediately so we don't lose the customer's choice
  await sb
    .from("onboarding_state")
    .update({ domain_requested: domain })
    .eq("id", onboarding.id);

  const avail = await checkAvailability(domain);
  if (!avail.available) {
    const msg = avail.error ?? "Domain isn't available — try another";
    await sb
      .from("onboarding_state")
      .update({ domain_register_error: msg })
      .eq("id", onboarding.id);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const reg = await registerDomain(domain, 1);
  if (!reg.ok) {
    const msg = reg.error ?? "registration failed";
    await sb
      .from("onboarding_state")
      .update({ domain_register_error: msg })
      .eq("id", onboarding.id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // DNS + Vercel attachment are best-effort — domain is bought, downstream
  // can retry if these fail. We surface failures but mark the domain registered.
  const dnsErrors: string[] = [];
  const dnsRes = await setPorkbunCnameToVercel(domain);
  if (!dnsRes.ok) dnsErrors.push(`DNS: ${dnsRes.error}`);
  const vercelRes = await addDomainToVercel(domain);
  if (!vercelRes.ok) dnsErrors.push(`Vercel: ${vercelRes.error}`);

  await sb
    .from("onboarding_state")
    .update({
      domain_registered: domain,
      domain_register_at: new Date().toISOString(),
      stage: "domain_registered",
      domain_register_error: dnsErrors.length > 0 ? dnsErrors.join(" | ") : null,
    })
    .eq("id", onboarding.id);

  return NextResponse.json({
    ok: true,
    domain,
    dnsWarnings: dnsErrors.length > 0 ? dnsErrors : undefined,
  });
}
