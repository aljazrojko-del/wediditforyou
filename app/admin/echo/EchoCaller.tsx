"use client";

import { useMemo, useState } from "react";

const FROM_REGIONS = [
  { key: "auto", label: "Auto (Houston default)" },
  { key: "houston", label: "Houston (713)" },
  { key: "dallas", label: "Dallas (469)" },
  { key: "phoenix", label: "Phoenix (602)" },
  { key: "nashville", label: "Nashville" },
  { key: "chicago", label: "Chicago (464)" },
] as const;

type FromRegion = (typeof FROM_REGIONS)[number]["key"];

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

export default function EchoCaller() {
  const [toPhone, setToPhone] = useState("");
  const [fromRegion, setFromRegion] = useState<FromRegion>("auto");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    | { kind: "ok"; callSid: string; to: string }
    | { kind: "err"; message: string }
    | null
  >(null);

  const normalized = useMemo(() => normalizePhone(toPhone), [toPhone]);
  const valid = looksLikeE164(normalized);
  const canFire = valid && !busy;

  async function fire() {
    if (!canFire) return;
    setBusy(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = { phone: normalized };
      if (fromRegion !== "auto") payload.from_city = fromRegion;
      const res = await fetch("/api/admin/echo-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        call_sid?: string;
        error?: string;
        to?: string;
      };
      if (!res.ok || !j.ok || !j.call_sid) {
        setResult({ kind: "err", message: j.error ?? `HTTP ${res.status}` });
      } else {
        setResult({ kind: "ok", callSid: j.call_sid, to: j.to ?? normalized });
        // Wake up the recordings list so the pending row appears without a
        // full navigate (only quick refresh — full playback still needs the
        // webhook to fire on Luka's side).
        setTimeout(() => window.location.reload(), 1200);
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
            Your phone
          </label>
          <input
            type="tel"
            value={toPhone}
            onChange={(e) => setToPhone(e.target.value)}
            placeholder="+38640123456 or (713) 555-1234"
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:border-emerald-600 focus:outline-none text-sm font-mono"
            autoComplete="tel"
            spellCheck={false}
          />
          <div className="mt-1 text-xs">
            {toPhone.length === 0 ? (
              <span className="text-zinc-600">
                Enter the phone to call. You&apos;ll pick up and speak into it.
              </span>
            ) : valid ? (
              <span className="text-emerald-400">
                Will dial {normalized}
              </span>
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
            Different regions = different call quality.
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-400 rounded bg-zinc-900/50 border border-zinc-800 p-3 space-y-1">
        <div className="font-semibold text-zinc-300">What happens:</div>
        <ol className="list-decimal ml-4 space-y-0.5">
          <li>Phone rings from the selected region&apos;s SignalWire number</li>
          <li>Answer, hear &ldquo;Echo test. After the beep, speak for up to thirty seconds. Press pound when done, or hang up.&rdquo;</li>
          <li>Speak — read a paragraph or say &ldquo;test test&rdquo; a few times</li>
          <li>Press # or hang up when done</li>
          <li>Recording appears in the list below within a few seconds — hit Play</li>
        </ol>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canFire}
          onClick={fire}
          className="px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold text-white"
        >
          {busy ? "Dialing…" : "Fire echo test"}
        </button>
        {result?.kind === "ok" && (
          <span className="text-sm text-emerald-400">
            Ringing {result.to} · call_sid <code className="text-xs">{result.callSid}</code>
          </span>
        )}
        {result?.kind === "err" && (
          <span className="text-sm text-rose-400">Failed: {result.message}</span>
        )}
      </div>
    </div>
  );
}
