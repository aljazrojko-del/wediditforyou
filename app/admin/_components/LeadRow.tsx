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
  owner_last_name?: string | null;
  owner_title?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  owner_name?: string | null;
  email: string | null;
  email_status?: string | null;
  rating: number | null;
  rating_count: number | null;
  sms_sent_at: string | null;
  call_placed_at: string | null;
  inbound_count: number;
  last_inbound_at: string | null;
  buy_link_starter_full: string | null;
  buy_link_starter_split: string | null;
  buy_link_premium_full: string | null;
  buy_link_premium_split: string | null;
  payment_status: string | null;
  tier: string | null;
  customer_link: string | null;
  // Source + enrichment context, surfaced in the expand panel so operators
  // can sanity-check phone/name provenance before dialing (e.g. does the
  // Google Places phone match a Facebook page they can find independently?).
  address?: string | null;
  source?: string | null;
  place_id?: string | null;
  types?: string[] | null;
  facebook_url?: string | null;
  company_domain?: string | null;
  google_review_url?: string | null;
  website_url?: string | null;
  enrichment_data?: Record<string, unknown> | null;
  enriched_at?: string | null;
  generated_at?: string | null;
  created_at?: string | null;
  quality_grade?: string | null;
};

function GradeBadge({ grade }: { grade: string | null | undefined }) {
  if (!grade) return null;
  const map: Record<string, { label: string; cls: string }> = {
    A_ELITE: { label: "A ELITE", cls: "bg-emerald-600 text-emerald-50" },
    B_HOT:   { label: "B HOT",   cls: "bg-emerald-700 text-emerald-50" },
    C_WARM:  { label: "C WARM",  cls: "bg-amber-700 text-amber-50" },
    D_MID:   { label: "D MID",   cls: "bg-zinc-700 text-zinc-200" },
    E_SUSPECT: { label: "E SUSPECT", cls: "bg-rose-800 text-rose-100" },
  };
  const m = map[grade] ?? { label: grade, cls: "bg-zinc-800 text-zinc-300" };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider ${m.cls}`}>
      {m.label}
    </span>
  );
}

type CopyKind =
  | "starter-full"
  | "starter-split"
  | "premium-full"
  | "premium-split"
  | "customer";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Google recommends the URL-API format for place_id links; the older
// /maps/place/?q=place_id:XXX form is unreliable and sometimes routes to a
// generic search. Falls back to name + address/city search when the place_id
// is missing or is a non-Google identifier (e.g. our mns-XXXX imports).
//
// MNS CRM imports put the full address in the `city` column and leave
// `address` NULL, so we merge both fields (dedupe if identical) to avoid
// searches like "JB Mobile Mechanic Service" alone routing to a London match.
function googleMapsLink(
  placeId: string | null | undefined,
  name: string,
  address: string | null | undefined,
  city: string | null | undefined,
): string {
  const isRealGoogleId = typeof placeId === "string" && placeId.startsWith("ChIJ");
  if (isRealGoogleId) {
    const q = encodeURIComponent(name);
    return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${encodeURIComponent(placeId)}`;
  }
  const parts = [name];
  const addressTrim = (address ?? "").trim();
  const cityTrim = (city ?? "").trim();
  if (addressTrim) parts.push(addressTrim);
  if (cityTrim && cityTrim !== addressTrim) parts.push(cityTrim);
  const q = encodeURIComponent(parts.join(" "));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function googleSearchLink(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export default function LeadRow({ lead }: { lead: LeadRowData }) {
  const [smsBusy, setSmsBusy] = useState(false);
  const [callBusy, setCallBusy] = useState(false);
  const [callArm, setCallArm] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState<CopyKind | null>(null);
  const [expanded, setExpanded] = useState(false);

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
          text: action === "sms" ? "SMS sent" : "Mia dial queued",
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
    <>
    <tr className="border-b border-zinc-900 hover:bg-zinc-900/30">
      <td className="px-3 py-3 align-top">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-left w-full group"
          title="Click for source data & enrichment context"
        >
          <div className="font-medium text-zinc-100 group-hover:text-emerald-300 flex items-center gap-2">
            <span className={`text-xs text-zinc-600 transition-transform inline-block ${expanded ? "rotate-90" : ""}`}>▸</span>
            <span>{lead.name}</span>
            <GradeBadge grade={lead.quality_grade} />
          </div>
          <div className="text-xs text-zinc-500 ml-4">
            {lead.city} · {lead.niche}
            {lead.rating != null && (
              <span className="ml-1 text-zinc-600">
                · ★ {lead.rating}{lead.rating_count != null ? ` (${lead.rating_count})` : ""}
              </span>
            )}
          </div>
        </button>
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
          {!callArm ? (
            <button
              type="button"
              disabled={callBusy || !lead.slug || !lead.phone}
              onClick={() => setCallArm(true)}
              title="Fires a Mia AI call to this prospect (specbuild). Two-tap confirm."
              className="px-3 py-1.5 text-xs rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
            >
              Mia call
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-rose-950/60 border border-rose-800 text-rose-200 px-1 py-0.5">
              <button
                type="button"
                disabled={callBusy}
                onClick={() => {
                  setCallArm(false);
                  fire("call");
                }}
                className="px-2.5 py-1 text-xs rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold disabled:opacity-40"
              >
                {callBusy ? "Firing…" : `Confirm dial ${lead.phone}`}
              </button>
              <button
                type="button"
                disabled={callBusy}
                onClick={() => setCallArm(false)}
                className="px-2 py-1 text-xs rounded text-zinc-300 hover:text-white"
              >
                cancel
              </button>
            </span>
          )}
          {lead.buy_link_starter_full && (
            <button
              type="button"
              onClick={() => copy(lead.buy_link_starter_full!, "starter-full")}
              title="Copy $450 Starter (one-time) buy link with slug baked in"
              className="px-3 py-1.5 text-xs rounded bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-200"
            >
              {copied === "starter-full" ? "✓ copied" : "$450"}
            </button>
          )}
          {lead.buy_link_starter_split && (
            <button
              type="button"
              onClick={() => copy(lead.buy_link_starter_split!, "starter-split")}
              title="Copy Starter split (2×$225 weekly) buy link — use only when prospect objects on price"
              className="px-3 py-1.5 text-xs rounded bg-emerald-700/20 hover:bg-emerald-700/40 text-emerald-300/80"
            >
              {copied === "starter-split" ? "✓ copied" : "2×$225"}
            </button>
          )}
          {lead.buy_link_premium_full && (
            <button
              type="button"
              onClick={() => copy(lead.buy_link_premium_full!, "premium-full")}
              title="Copy $700 Premium (one-time) buy link"
              className="px-3 py-1.5 text-xs rounded bg-amber-700/40 hover:bg-amber-700/60 text-amber-200"
            >
              {copied === "premium-full" ? "✓ copied" : "$700"}
            </button>
          )}
          {lead.buy_link_premium_split && (
            <button
              type="button"
              onClick={() => copy(lead.buy_link_premium_split!, "premium-split")}
              title="Copy Premium split (2×$350 weekly) buy link — use only when prospect objects on price"
              className="px-3 py-1.5 text-xs rounded bg-amber-700/20 hover:bg-amber-700/40 text-amber-300/80"
            >
              {copied === "premium-split" ? "✓ copied" : "2×$350"}
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
    {expanded && (
      <tr className="border-b border-zinc-900 bg-zinc-950/60">
        <td colSpan={5} className="px-6 py-5">
          <LeadDetails lead={lead} />
        </td>
      </tr>
    )}
    </>
  );
}

function LeadDetails({ lead }: { lead: LeadRowData }) {
  const ownerFull = [lead.owner_first_name, lead.owner_last_name].filter(Boolean).join(" ") || lead.owner_name || null;
  const mapsLink = googleMapsLink(lead.place_id, lead.name, lead.address, lead.city);
  const searchLink = googleSearchLink(`${lead.name} ${lead.city}`);
  const phoneSearchLink = lead.phone ? googleSearchLink(`"${lead.phone}"`) : null;
  const enrichment =
    lead.enrichment_data && typeof lead.enrichment_data === "object"
      ? lead.enrichment_data
      : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
      {/* SOURCE + PLACES */}
      <div className="space-y-2">
        <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-800 pb-1">
          Source
        </h3>
        <Field label="Source" value={lead.source ?? "—"} />
        <Field label="Address" value={lead.address ?? "—"} />
        <Field label="Types" value={lead.types?.join(", ") ?? "—"} />
        <Field
          label="Google rating"
          value={
            lead.rating != null
              ? `${lead.rating.toFixed(1)} ★ · ${lead.rating_count ?? 0} reviews`
              : "—"
          }
        />
        <Field label="Place ID" value={lead.place_id ?? "—"} mono />
        <div className="pt-2 flex flex-wrap gap-3 text-xs">
          <a href={mapsLink} target="_blank" rel="noopener" className="text-emerald-400 hover:text-emerald-300">
            Open in Google Maps ↗
          </a>
          <a href={searchLink} target="_blank" rel="noopener" className="text-emerald-400 hover:text-emerald-300">
            Google &ldquo;{lead.name}&rdquo; ↗
          </a>
          {phoneSearchLink && (
            <a href={phoneSearchLink} target="_blank" rel="noopener" className="text-emerald-400 hover:text-emerald-300">
              Google the phone ↗
            </a>
          )}
          {lead.facebook_url && (
            <a href={lead.facebook_url} target="_blank" rel="noopener" className="text-sky-400 hover:text-sky-300">
              Facebook ↗
            </a>
          )}
          {lead.google_review_url && (
            <a href={lead.google_review_url} target="_blank" rel="noopener" className="text-emerald-400 hover:text-emerald-300">
              Reviews ↗
            </a>
          )}
        </div>
      </div>

      {/* OWNER + CONTACT */}
      <div className="space-y-2">
        <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-800 pb-1">
          Owner & contact
        </h3>
        <Field label="Owner" value={ownerFull ?? "—"} />
        <Field label="Title" value={lead.owner_title ?? "—"} />
        <Field label="Owner email" value={lead.owner_email ?? "—"} />
        <Field label="Owner phone" value={lead.owner_phone ?? "—"} mono />
        <Field label="Business phone" value={lead.phone ?? "—"} mono />
        <Field
          label="Email"
          value={
            lead.email
              ? `${lead.email}${lead.email_status ? ` (${lead.email_status})` : ""}`
              : "—"
          }
        />
        <Field label="Company domain" value={lead.company_domain ?? "—"} mono />
        <Field label="Website (declared)" value={lead.website_url ?? "—"} mono />
      </div>

      {/* SITE & TIMING */}
      <div className="space-y-2">
        <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-800 pb-1">
          Our site build
        </h3>
        <Field label="Slug" value={lead.slug ?? "—"} mono />
        <Field label="Site URL" value={lead.site_url ?? "—"} mono />
        <Field label="Tier" value={lead.tier ?? "—"} />
        <Field label="Payment" value={lead.payment_status ?? "—"} />
        <Field label="Site generated" value={fmtDate(lead.generated_at)} />
        <Field label="Enriched at" value={fmtDate(lead.enriched_at)} />
        <Field label="Added" value={fmtDate(lead.created_at)} />
      </div>

      {/* ACTIVITY */}
      <div className="space-y-2">
        <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-800 pb-1">
          Outreach activity
        </h3>
        <Field label="SMS sent" value={fmtDate(lead.sms_sent_at)} />
        <Field label="Call placed" value={fmtDate(lead.call_placed_at)} />
        <Field label="Last inbound" value={fmtDate(lead.last_inbound_at)} />
        <Field label="Inbound count" value={String(lead.inbound_count ?? 0)} />
      </div>

      {/* RAW ENRICHMENT */}
      {enrichment && Object.keys(enrichment).length > 0 && (
        <div className="md:col-span-2 space-y-2">
          <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-800 pb-1">
            Raw enrichment data
          </h3>
          <details className="text-xs">
            <summary className="cursor-pointer text-zinc-400 hover:text-zinc-200">
              Show JSON ({Object.keys(enrichment).length} keys)
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded bg-zinc-900 border border-zinc-800 p-3 text-[11px] text-zinc-300 font-mono">
              {JSON.stringify(enrichment, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-xs">
      <div className="text-zinc-500">{label}</div>
      <div className={`text-zinc-200 break-words ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
