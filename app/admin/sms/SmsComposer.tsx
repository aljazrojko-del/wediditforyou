"use client";

import { useMemo, useState } from "react";

// Region options matching lib/signalwire-client.ts REGION_PREFIXES. "auto" lets
// the endpoint pick from the to_city (used when sending to a lead by area);
// with a raw number and no city we default from Houston server-side anyway.
const FROM_REGIONS = [
  { key: "auto", label: "Auto (server default)" },
  { key: "houston", label: "Houston (713)" },
  { key: "dallas", label: "Dallas (469)" },
  { key: "phoenix", label: "Phoenix (602)" },
  { key: "nashville", label: "Nashville" },
  { key: "chicago", label: "Chicago (464)" },
] as const;

type FromRegion = (typeof FROM_REGIONS)[number]["key"];

type Result = { kind: "ok"; sid: string } | { kind: "err"; message: string };

// Loose E.164 formatter: strip everything except leading + and digits, prefix
// +1 for 10-digit US numbers so operator UX matches the admin dashboards.
function normalizePhone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return "+" + trimmed.slice(1).replace(/[^0-9]/g, "");
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function looksLikeE164(input: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(input);
}

export default function SmsComposer() {
  const [toPhone, setToPhone] = useState("");
  const [fromRegion, setFromRegion] = useState<FromRegion>("auto");
  const [body, setBody] = useState("");
  const [appendStop, setAppendStop] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [firstName, setFirstName] = useState("");
  const [company, setCompany] = useState("");
  const [callArm, setCallArm] = useState(false);
  const [callBusy, setCallBusy] = useState(false);
  const [callResult, setCallResult] = useState<
    | { kind: "ok"; matchedLead: string | null }
    | { kind: "err"; message: string }
    | null
  >(null);

  const normalizedTo = useMemo(() => normalizePhone(toPhone), [toPhone]);
  const validTo = looksLikeE164(normalizedTo);
  const finalBody = useMemo(() => {
    const base = body.trim();
    if (!base) return "";
    if (appendStop && !/\bSTOP\b/i.test(base)) {
      return `${base}\n\nReply STOP to opt out.`;
    }
    return base;
  }, [body, appendStop]);
  const charCount = finalBody.length;
  const segments = Math.max(1, Math.ceil(charCount / 160));
  const canSend = validTo && finalBody.length > 0 && !busy;

  async function send() {
    if (!canSend) return;
    setBusy(true);
    setResult(null);
    try {
      // Every from-region maps to an env-var-backed number server-side. We pass
      // the label as to_city to reuse SignalWireClient.pickFromNumber when the
      // operator picks a region; "auto" leaves the field off so the server
      // falls back to Houston. Admin session cookie authenticates the request.
      const payload: Record<string, unknown> = {
        to_phone: normalizedTo,
        sms_body: finalBody,
      };
      if (fromRegion !== "auto") {
        payload.to_city = fromRegion;
      }
      const res = await fetch("/api/admin/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        attempts?: Array<{ channel: string; ok: boolean; id?: string; error?: string }>;
        error?: string;
      };
      if (!res.ok || !j.ok) {
        const attempt = j.attempts?.find((a) => a.channel === "sms");
        const message = attempt?.error ?? j.error ?? `HTTP ${res.status}`;
        setResult({ kind: "err", message });
      } else {
        const attempt = j.attempts?.find((a) => a.channel === "sms" && a.ok);
        setResult({ kind: "ok", sid: attempt?.id ?? "(unknown)" });
        setBody("");
      }
    } catch (e) {
      setResult({ kind: "err", message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
            To (phone)
          </label>
          <input
            type="tel"
            value={toPhone}
            onChange={(e) => setToPhone(e.target.value)}
            placeholder="+17135551234 or (713) 555-1234"
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:border-emerald-600 focus:outline-none text-sm font-mono"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="mt-1 text-xs">
            {toPhone.length === 0 ? (
              <span className="text-zinc-600">Enter a number to send to.</span>
            ) : validTo ? (
              <span className="text-emerald-400">Will send to {normalizedTo}</span>
            ) : (
              <span className="text-rose-400">Not a valid phone number.</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
            From (region)
          </label>
          <select
            value={fromRegion}
            onChange={(e) => setFromRegion(e.target.value as FromRegion)}
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:border-emerald-600 focus:outline-none text-sm"
          >
            {FROM_REGIONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="mt-1 text-xs text-zinc-600">
            Picks the SignalWire number by city.
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
          Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the SMS body…"
          rows={6}
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:border-emerald-600 focus:outline-none text-sm font-mono leading-relaxed resize-y"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={appendStop}
              onChange={(e) => setAppendStop(e.target.checked)}
              className="accent-emerald-600"
            />
            Auto-append &ldquo;Reply STOP to opt out&rdquo;
          </label>
          <span className="font-mono">
            {charCount} chars · {segments} segment{segments === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {finalBody && (
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
            Preview
          </div>
          <div className="rounded bg-zinc-900 border border-zinc-800 p-3 text-sm whitespace-pre-wrap font-mono text-zinc-300">
            {finalBody}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canSend}
          onClick={send}
          className="px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold text-white"
        >
          {busy ? "Sending…" : "Send SMS"}
        </button>
        {result?.kind === "ok" && (
          <span className="text-sm text-emerald-400">
            Sent · sid <code className="text-xs">{result.sid}</code>
          </span>
        )}
        {result?.kind === "err" && (
          <span className="text-sm text-rose-400">
            Failed: {result.message}
          </span>
        )}
      </div>

      {/* --- Mia call section: same phone, optional context, two-tap confirm --- */}
      <div className="pt-5 mt-2 border-t border-zinc-900 space-y-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
          Or call this number with Mia
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
              First name (optional)
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Auto-filled if matched lead"
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:border-rose-600 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
              Company (optional)
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Auto-filled if matched lead"
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:border-rose-600 focus:outline-none text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!callArm ? (
            <button
              type="button"
              disabled={!validTo || callBusy}
              onClick={() => {
                setCallResult(null);
                setCallArm(true);
              }}
              className="px-4 py-2 rounded bg-rose-950/60 border border-rose-900 text-rose-200 hover:bg-rose-900/60 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Mia call
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-rose-950/60 border border-rose-800 text-rose-200 px-1 py-0.5">
              <button
                type="button"
                disabled={callBusy}
                onClick={async () => {
                  setCallBusy(true);
                  setCallResult(null);
                  try {
                    const payload: Record<string, unknown> = { phone: normalizedTo };
                    if (firstName.trim()) payload.first_name = firstName.trim();
                    if (company.trim()) payload.company = company.trim();
                    const res = await fetch("/api/admin/mia-call", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    const j = (await res.json()) as {
                      ok?: boolean;
                      matched_lead?: { id: string; name: string } | null;
                      error?: string;
                    };
                    if (!res.ok || !j.ok) {
                      setCallResult({
                        kind: "err",
                        message: j.error ?? `HTTP ${res.status}`,
                      });
                    } else {
                      setCallResult({
                        kind: "ok",
                        matchedLead: j.matched_lead?.name ?? null,
                      });
                    }
                  } catch (e) {
                    setCallResult({
                      kind: "err",
                      message: (e as Error).message,
                    });
                  } finally {
                    setCallArm(false);
                    setCallBusy(false);
                  }
                }}
                className="px-2.5 py-1 text-xs rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold disabled:opacity-40"
              >
                {callBusy ? "Firing…" : `Confirm Mia dial ${normalizedTo}`}
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
          {callResult?.kind === "ok" && (
            <span className="text-sm text-emerald-400">
              Mia dial queued
              {callResult.matchedLead && (
                <span className="text-zinc-500">
                  {" "}
                  · matched <span className="text-zinc-300">{callResult.matchedLead}</span>
                </span>
              )}
            </span>
          )}
          {callResult?.kind === "err" && (
            <span className="text-sm text-rose-400">Failed: {callResult.message}</span>
          )}
        </div>
        <div className="text-xs text-zinc-500">
          Fires the specbuild AI script at this phone. If the number matches a
          lead in your pool, Mia gets full context (company, site URL, real
          UUID) automatically. Two-tap confirm required.
        </div>
      </div>
    </div>
  );
}
