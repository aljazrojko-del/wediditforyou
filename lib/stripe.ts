// Stripe helpers: SDK init + lead matching.
//
// Lead matching order (best signal first):
//   1. client_reference_id  — set via ?client_reference_id={slug} on the buy URL
//   2. customer email match — set via Stripe Checkout email field
//   3. customer phone match — last 10 digits of US number
// Returns null when no match — admin can manually link later.

import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
}

function digitsOnly(p: string | null | undefined): string {
  return (p ?? "").replace(/[^0-9]/g, "");
}

type LeadMatch = { id: string; slug: string | null; email: string | null; phone: string | null };

export async function findLeadByPaymentContext(
  supabase: SupabaseClient,
  ctx: {
    clientReferenceId?: string | null;
    email?: string | null;
    phone?: string | null;
  },
): Promise<LeadMatch | null> {
  // 1. client_reference_id (slug)
  if (ctx.clientReferenceId) {
    const { data } = await supabase
      .from("leads")
      .select("id, slug, email, phone")
      .eq("slug", ctx.clientReferenceId)
      .maybeSingle<LeadMatch>();
    if (data) return data;
  }

  // 2. email exact match
  if (ctx.email) {
    const { data } = await supabase
      .from("leads")
      .select("id, slug, email, phone")
      .ilike("email", ctx.email.trim())
      .maybeSingle<LeadMatch>();
    if (data) return data;
  }

  // 3. phone last-10 match (US local digits)
  if (ctx.phone) {
    const last10 = digitsOnly(ctx.phone).slice(-10);
    if (last10.length === 10) {
      const { data } = await supabase
        .from("leads")
        .select("id, slug, email, phone")
        .not("phone", "is", null)
        .limit(500);
      if (data) {
        for (const row of data as LeadMatch[]) {
          if (digitsOnly(row.phone).slice(-10) === last10) return row;
        }
      }
    }
  }

  return null;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function thirtyDayDeadline(fromIso: string): string {
  return new Date(new Date(fromIso).getTime() + THIRTY_DAYS_MS).toISOString();
}

export type PackageType = "starter" | "premium" | "split" | "unknown";

export function packageFromAmount(amountCents: number | null | undefined): PackageType {
  if (!amountCents) return "unknown";
  if (amountCents >= 79000 && amountCents <= 80000) return "premium";   // $797
  if (amountCents >= 29000 && amountCents <= 30000) return "starter";   // $297
  if (amountCents >= 14000 && amountCents <= 15000) return "split";     // $149/wk × 2
  return "unknown";
}
