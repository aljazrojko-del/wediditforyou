"use client";

import { useState } from "react";

export type LeadRowData = {
  id: string;
  name: string;
  slug: string | null;
  city: string;
  niche: string;
  phone: string | null;
  site_url: string | null;
  owner_first_name: string | null;
  email: string | null;
  rating: number | null;
  rating_count: number | null;
  sms_sent_at: string | null;
  call_placed_at: string | null;
  inbound_count: number;
  last_inbound_at: string | null;
  buy_link_starter: string | null;
  buy_link_premium: string | null;
  payment_status: string | null;
  tier: string | null;
  customer_link: string | null;
};

type CopyKind = "starter" | "premium" | "customer";

export default function LeadRow({ lead }: { lead: LeadRowData }) {
  const [smsBusy, setSmsBusy] = useState(false);
  const [callBusy, setCallBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState<CopyKind | null>(null);

  async function copy(text: string, which: CopyKind) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setMsg({ kind: "err", text: "Clipboard blocked" });
    }
  }

  async function fire(action: "sms" | "call") {
    if (!lead.slug) return;
    const set = action === "sms" ? setSmsBusy : setCallBusy;
    set(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.slug}/${action}`, {
        method: "POST",
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg({ kind: "err", text: j.error ?? "Failed" });
      } else {
        setMsg({
          kind: "ok",
          text: action === "sms" ? "SMS sent" : "Call placed",
        });
        // refresh row state via a soft reload after 1s
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally {
      set(false);
    }
  }

  const smsSent = Boolean(lead.sms_sent_at);
  const called = Boolean(lead.call_placed_at);
  const hasInbound = lead.inbound_count > 0;

  return (
    <tr className="border-b border-zinc-900 hover:bg-zinc-900/30">
      <td className="px-3 py-3 align-top">
        <div className="font-medium text-zinc-100">{lead.name}</div>
        <div className="text-xs text-zinc-500">{lead.city} · {lead.niche}</div>
      </td>
      <td className="px-3 py-3 align-top text-zinc-300">
        {lead.phone ?? <span className="text-zinc-600">—</span>}
        {lead.owner_first_name && (
          <div className="text-xs text-zinc-500">{lead.owner_first_name}</div>
        )}
      </td>
      <td className="px-3 py-3 align-top">
        {lead.site_url ? (
          <a
            href={lead.site_url}
            target="_blank"
            rel="noopener"
            className="text-emerald-400 hover:text-emerald-300 text-sm"
          >
            preview ↗
          </a>
        ) : (
          <span className="text-zinc-600 text-sm">no site</span>
        )}
      </td>
      <td className="px-3 py-3 align-top">
        <div className="flex flex-col gap-1 text-xs">
          <span className={smsSent ? "text-zinc-300" : "text-zinc-600"}>
            SMS {smsSent ? "sent" : "—"}
          </span>
          <span className={called ? "text-zinc-300" : "text-zinc-600"}>
            Call {called ? "placed" : "—"}
          </span>
          {hasInbound && (
            <span className="text-amber-400">
              ▸ {lead.inbound_count} reply
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 align-top">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={smsBusy || !lead.slug || !lead.phone}
            onClick={() => fire("sms")}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
          >
            {smsBusy ? "…" : "SMS"}
          </button>
          <button
            type="button"
            disabled={callBusy || !lead.slug || !lead.phone}
            onClick={() => fire("call")}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
          >
            {callBusy ? "…" : "Call"}
          </button>
          {lead.buy_link_starter && (
            <button
              type="button"
              onClick={() => copy(lead.buy_link_starter!, "starter")}
              title="Copy $450 buy link with this lead's slug baked in"
              className="px-3 py-1.5 text-xs rounded bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-200"
            >
              {copied === "starter" ? "✓ copied" : "$450"}
            </button>
          )}
          {lead.buy_link_premium && (
            <button
              type="button"
              onClick={() => copy(lead.buy_link_premium!, "premium")}
              title="Copy $700 Premium buy link"
              className="px-3 py-1.5 text-xs rounded bg-amber-700/40 hover:bg-amber-700/60 text-amber-200"
            >
              {copied === "premium" ? "✓ copied" : "$700"}
            </button>
          )}
          {lead.customer_link && lead.payment_status === "paid" && (
            <button
              type="button"
              onClick={() => copy(lead.customer_link!, "customer")}
              title="Copy customer self-service link (send to paid customer)"
              className="px-3 py-1.5 text-xs rounded bg-sky-700/40 hover:bg-sky-700/60 text-sky-200"
            >
              {copied === "customer" ? "✓ copied" : "Cust link"}
            </button>
          )}
        </div>
        {msg && (
          <div
            className={`mt-1 text-xs ${
              msg.kind === "ok" ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {msg.text}
          </div>
        )}
      </td>
    </tr>
  );
}
