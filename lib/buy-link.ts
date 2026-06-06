// Construct a per-lead Stripe payment link URL with slug + email pre-filled.
// Used by the admin dashboard "Copy buy link" button so the prospect lands on
// Stripe Checkout with their context already attached — and the resulting
// webhook can match the payment back to the lead unambiguously.

const STARTER_BASE = process.env.STRIPE_PAYMENT_LINK ?? "";
const PREMIUM_BASE = process.env.STRIPE_PREMIUM_PAYMENT_LINK ?? "";
const SPLIT_BASE = process.env.STRIPE_SPLIT_PAYMENT_LINK ?? "";

export type Tier = "starter" | "premium" | "split";

export function buildBuyLink(
  tier: Tier,
  opts: { slug: string | null; email?: string | null },
): string | null {
  const base =
    tier === "premium"
      ? PREMIUM_BASE
      : tier === "split"
        ? SPLIT_BASE
        : STARTER_BASE;
  if (!base) return null;
  if (!opts.slug) return base;
  const url = new URL(base);
  url.searchParams.set("client_reference_id", opts.slug);
  if (opts.email) url.searchParams.set("prefilled_email", opts.email);
  return url.toString();
}
