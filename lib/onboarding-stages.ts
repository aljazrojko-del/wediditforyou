// Allowed stage transitions for onboarding_state. Mirrors the CHECK constraint
// in migration 008. Every transition button in the admin UI hits an endpoint
// that validates against this map before flipping the row.

export type Stage =
  | "awaiting_domain"
  | "domain_registered"
  | "site_deployed"
  | "awaiting_approval"
  | "approved"
  | "in_30_day_window"
  | "refund_pending"
  | "refunded"
  | "closed_won"
  | "deploy_failed"
  | "ghosted";

export const ALL_STAGES: readonly Stage[] = [
  "awaiting_domain",
  "domain_registered",
  "site_deployed",
  "awaiting_approval",
  "approved",
  "in_30_day_window",
  "refund_pending",
  "refunded",
  "closed_won",
  "deploy_failed",
  "ghosted",
] as const;

const TRANSITIONS: Record<Stage, Stage[]> = {
  awaiting_domain: ["domain_registered", "deploy_failed", "ghosted", "refund_pending"],
  domain_registered: ["site_deployed", "deploy_failed", "refund_pending"],
  site_deployed: ["awaiting_approval", "refund_pending"],
  awaiting_approval: ["approved", "refund_pending"],
  approved: ["in_30_day_window", "refund_pending"],
  in_30_day_window: ["closed_won", "refund_pending"],
  refund_pending: ["refunded", "approved"],
  refunded: [],
  closed_won: [],
  deploy_failed: ["domain_registered", "site_deployed", "refund_pending"],
  ghosted: ["awaiting_domain", "refund_pending"],
};

const LABELS: Record<Stage, string> = {
  awaiting_domain: "Awaiting domain",
  domain_registered: "Domain registered",
  site_deployed: "Site deployed",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  in_30_day_window: "In 30-day window",
  refund_pending: "Refund pending",
  refunded: "Refunded",
  closed_won: "Closed won",
  deploy_failed: "Deploy failed",
  ghosted: "Ghosted",
};

export function nextStagesFrom(stage: Stage): Stage[] {
  return TRANSITIONS[stage] ?? [];
}

export function isValidTransition(from: Stage, to: Stage): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function stageLabel(stage: Stage): string {
  return LABELS[stage] ?? stage;
}
