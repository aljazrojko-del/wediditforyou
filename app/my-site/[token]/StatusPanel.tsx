"use client";

import { useState } from "react";

type Stage =
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

type Props = {
  token: string;
  stage: Stage;
  domainRegistered: string | null;
  thirtyDayDeadline: string | null;
  customerApproved: boolean;
};

type StageView = {
  label: string;
  detail: string;
  dotClass: string;
  bg: string;
  border: string;
};

function viewFor(stage: Stage, domain: string | null): StageView {
  switch (stage) {
    case "awaiting_domain":
      return {
        label: "Step 1 of 2 · Pick your domain",
        detail:
          "Enter the .com you want to be known by, below. We register it instantly.",
        dotClass: "bg-amber-500",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
    case "domain_registered":
    case "site_deployed":
      return {
        label: "Step 2 of 2 · Approve your site",
        detail: domain
          ? `Your site is live at ${domain}. Click below to approve and lock in the founding price.`
          : "Your site is live. Click below to approve and lock in the founding price.",
        dotClass: "bg-blue-500",
        bg: "bg-blue-50",
        border: "border-blue-200",
      };
    case "awaiting_approval":
      return {
        label: "Awaiting your approval",
        detail:
          "Take a look at your site. Click Approve below when you're ready.",
        dotClass: "bg-blue-500",
        bg: "bg-blue-50",
        border: "border-blue-200",
      };
    case "approved":
    case "in_30_day_window":
      return {
        label: "Approved · 30-day window active",
        detail:
          "You're in. Your 30-day satisfaction window has started — request changes any time below.",
        dotClass: "bg-emerald-500",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      };
    case "closed_won":
      return {
        label: "All set · 30-day window completed",
        detail:
          "Site is yours, no further action needed. Reach out any time for changes.",
        dotClass: "bg-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      };
    case "refund_pending":
      return {
        label: "Refund being processed",
        detail:
          "We've received your refund request. Stripe usually returns the funds within 5-10 business days.",
        dotClass: "bg-zinc-400",
        bg: "bg-zinc-50",
        border: "border-zinc-200",
      };
    case "refunded":
      return {
        label: "Refund completed",
        detail: "Your refund has been processed. Site has been taken offline.",
        dotClass: "bg-zinc-400",
        bg: "bg-zinc-50",
        border: "border-zinc-200",
      };
    case "deploy_failed":
      return {
        label: "Deployment hiccup — we're on it",
        detail:
          "Something went sideways on our end. Alex has been notified and is fixing it. You'll hear back within 24 hours.",
        dotClass: "bg-red-500",
        bg: "bg-red-50",
        border: "border-red-200",
      };
    case "ghosted":
      return {
        label: "Paused — pick up where you left off",
        detail: "Enter your domain to resume the setup.",
        dotClass: "bg-amber-500",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
  }
}

function daysBetween(fromIso: string | null): { days: number; ended: boolean } | null {
  if (!fromIso) return null;
  const target = new Date(fromIso).getTime();
  if (Number.isNaN(target)) return null;
  const ms = target - Date.now();
  const days = Math.ceil(ms / 86_400_000);
  return { days: Math.max(0, days), ended: ms <= 0 };
}

const APPROVABLE = new Set<Stage>([
  "domain_registered",
  "site_deployed",
  "awaiting_approval",
]);

export default function StatusPanel({
  token,
  stage: initialStage,
  domainRegistered,
  thirtyDayDeadline,
  customerApproved,
}: Props) {
  const [stage, setStage] = useState<Stage>(initialStage);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const view = viewFor(stage, domainRegistered);
  const showApprove = !customerApproved && APPROVABLE.has(stage);
  const countdown = daysBetween(thirtyDayDeadline);
  const showCountdown =
    stage === "approved" || stage === "in_30_day_window";

  async function handleApprove() {
    if (approving) return;
    setApproving(true);
    setError(null);
    try {
      const res = await fetch("/api/customer/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Approval failed");
      } else {
        setStage("approved");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApproving(false);
    }
  }

  return (
    <div
      className={`mt-8 rounded-3xl border ${view.border} ${view.bg} p-7 sm:p-10`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 inline-block h-2.5 w-2.5 rounded-full ${view.dotClass}`}
        />
        <div className="flex-1">
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#1F1814]/60">
            Status
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#1F1814]">
            {view.label}
          </h2>
          <p className="mt-2 text-sm text-[#1F1814]/75">{view.detail}</p>

          {showCountdown && countdown && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[#1F1814]/75">
              <span>
                {countdown.ended
                  ? "30-day window ended"
                  : `${countdown.days} day${countdown.days === 1 ? "" : "s"} left in 30-day window`}
              </span>
            </div>
          )}

          {showApprove && (
            <div className="mt-5">
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="inline-flex items-center justify-center rounded-xl bg-[#1F1814] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C2410C] disabled:opacity-50"
              >
                {approving ? "Approving…" : "Approve this site"}
              </button>
              {error && (
                <p className="mt-2 text-xs text-red-600">{error}</p>
              )}
              <p className="mt-3 text-xs text-[#1F1814]/55">
                After approval, your 30-day satisfaction window starts. Request
                a refund anytime in those 30 days — site is yours either way.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
