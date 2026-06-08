"use client";

import { useState } from "react";
import { nextStagesFrom, stageLabel, type Stage } from "@/lib/onboarding-stages";

export type OnboardingRowData = {
  id: string;
  stage: Stage;
  thirty_day_deadline: string | null;
  domain_requested: string | null;
  domain_registered: string | null;
  site_url: string | null;
  refund_requested: boolean;
  reminders_sent: Array<{ day_marker: number }>;
  created_at: string;
  lead_name: string;
  lead_slug: string | null;
  lead_city: string;
  lead_phone: string | null;
  lead_tier: string | null;
  welcome_sms_sent_at: string | null;
  customer_link: string | null;
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

const stageColor: Record<Stage, string> = {
  awaiting_domain: "bg-amber-700/40 text-amber-200",
  domain_registered: "bg-sky-700/40 text-sky-200",
  site_deployed: "bg-sky-700/40 text-sky-200",
  awaiting_approval: "bg-violet-700/40 text-violet-200",
  approved: "bg-emerald-700/40 text-emerald-200",
  in_30_day_window: "bg-emerald-700/40 text-emerald-200",
  refund_pending: "bg-rose-700/40 text-rose-200",
  refunded: "bg-zinc-700/40 text-zinc-300",
  closed_won: "bg-emerald-700/60 text-emerald-100",
  deploy_failed: "bg-rose-700/40 text-rose-200",
  ghosted: "bg-zinc-700/40 text-zinc-300",
};

export default function OnboardingRow({ row }: { row: OnboardingRowData }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const daysLeft = daysUntil(row.thirty_day_deadline);
  const nextOptions = nextStagesFrom(row.stage);
  const reminders = row.reminders_sent.map((r) => r.day_marker).join(", ");

  async function transition(nextStage: Stage) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${row.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "transition failed");
        return;
      }
      window.location.reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!row.customer_link) return;
    try {
      await navigator.clipboard.writeText(row.customer_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setErr("clipboard blocked");
    }
  }

  return (
    <div className="border border-zinc-900 rounded-lg p-5 bg-zinc-900/30">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-lg font-semibold text-zinc-100">{row.lead_name}</div>
          <div className="text-xs text-zinc-500">
            {row.lead_city} · {row.lead_tier ?? "no tier"} · {row.lead_phone ?? "no phone"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${stageColor[row.stage]}`}
          >
            {stageLabel(row.stage)}
          </span>
          {daysLeft != null && daysLeft > 0 && (
            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-zinc-800 text-zinc-300">
              {daysLeft}d left
            </span>
          )}
          {daysLeft != null && daysLeft <= 0 && (
            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-700/40 text-emerald-200">
              Window closed
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
        <div>
          <div className="text-zinc-500">Domain</div>
          <div className="text-zinc-200">{row.domain_registered ?? row.domain_requested ?? "—"}</div>
        </div>
        <div>
          <div className="text-zinc-500">Welcome SMS</div>
          <div className="text-zinc-200">{row.welcome_sms_sent_at ? "sent ✓" : "—"}</div>
        </div>
        <div>
          <div className="text-zinc-500">Reminders</div>
          <div className="text-zinc-200">{reminders || "—"}</div>
        </div>
        <div>
          <div className="text-zinc-500">Refund pending</div>
          <div className="text-zinc-200">{row.refund_requested ? "yes" : "no"}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {row.customer_link && (
          <button
            type="button"
            onClick={copyLink}
            className="px-3 py-1.5 text-xs rounded bg-sky-700/40 hover:bg-sky-700/60 text-sky-200"
          >
            {copied ? "✓ copied" : "Cust link"}
          </button>
        )}
        {row.lead_slug && (
          <a
            href={`https://sites.wedidit4you.com/${row.lead_slug}`}
            target="_blank"
            rel="noopener"
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            View site ↗
          </a>
        )}
        {nextOptions.map((next) => (
          <button
            key={next}
            type="button"
            disabled={busy}
            onClick={() => transition(next)}
            className="px-3 py-1.5 text-xs rounded bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-200 disabled:opacity-40"
          >
            → {stageLabel(next)}
          </button>
        ))}
      </div>

      {err && <p className="mt-2 text-xs text-rose-400">{err}</p>}
    </div>
  );
}
