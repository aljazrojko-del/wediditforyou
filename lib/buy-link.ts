// Construct a per-lead Stripe payment link URL with slug + email pre-filled.
// Used by the admin dashboard "Copy buy link" buttons so the prospect lands
// on Stripe Checkout with their context already attached — the resulting
// webhook can match the payment back to the lead unambiguously.
//
// Four link types:
//   starter-full   — $450 one-time
//   starter-split  — 2 × $225 weekly (offered when prospect resists on price)
//   premium-full   — $700 one-time
//   premium-split  — 2 × $350 weekly
//
// Falls back to legacy STRIPE_PAYMENT_LINK / STRIPE_SPLIT_PAYMENT_LINK names
// if the new env vars aren't set yet, so a half-deployed config still works.

const STARTER_FULL =
  process.env.STRIPE_STARTER_FULL_PAYMENT_LINK ??
  process.env.STRIPE_PAYMENT_LINK ??
  "";
const STARTER_SPLIT =
  process.env.STRIPE_STARTER_SPLIT_PAYMENT_LINK ??
  process.env.STRIPE_SPLIT_PAYMENT_LINK ??
  "";
const PREMIUM_FULL =
  process.env.STRIPE_PREMIUM_FULL_PAYMENT_LINK ??
  process.env.STRIPE_PREMIUM_PAYMENT_LINK ??
  "";
const PREMIUM_SPLIT = process.env.STRIPE_PREMIUM_SPLIT_PAYMENT_LINK ?? "";

export type Tier = "starter-full" | "starter-split" | "premium-full" | "premium-split";

export function buildBuyLink(
  tier: Tier,
  opts: { slug: string | null; email?: string | null },
): string | null {
  const base =
    tier === "premium-full"
      ? PREMIUM_FULL
      : tier === "premium-split"
        ? PREMIUM_SPLIT
        : tier === "starter-split"
          ? STARTER_SPLIT
          : STARTER_FULL;
  if (!base) return null;
  if (!opts.slug) return base;
  const url = new URL(base);
  url.searchParams.set("client_reference_id", opts.slug);
  if (opts.email) url.searchParams.set("prefilled_email", opts.email);
  return url.toString();
}
