"use client";

import { useCallback, useState } from "react";

const DEFAULT_SITE_URL =
  "https://sites.wedidit4you.com/elite-mobile-tire-brake-lubbock-tx";

// Rough current time in Chicago (CDT/CST). Not perfect around DST edges
// but fine for the form's default value picker.
function nowChicagoIsoLocal(): string {
  const now = new Date();
  // Chicago is UTC-5 (CDT) most of the year — use UTC-5 as default offset.
  const offsetMin = -5 * 60;
  const local = new Date(now.getTime() + offsetMin * 60_000 - now.getTimezoneOffset() * 60_000);
  local.setSeconds(0, 0);
  const iso = local.toISOString();
  return iso.slice(0, 16);
}

function inHours(hoursAhead: number): string {
  const base = new Date(nowChicagoIsoLocal() + ":00");
  const future = new Date(base.getTime() + hoursAhead * 3600_000);
  future.setSeconds(0, 0);
  return future.toISOString().slice(0, 16);
}

type BookResponse = {
  ok?: boolean;
  appointment_id?: string;
  contact_id?: string;
  start_time_ct_display?: string;
  start_time_utc?: string;
  combined_sms?: {
    ok: boolean;
    sid?: string;
    error?: string;
    from?: string;
    to?: string;
    body?: string;
  } | null;
  error?: string;
};

export default function BookClient() {
  const [phone, setPhone] = useState("+14696087322");
  const [startCt, setStartCt] = useState(inHours(3));
  const [duration, setDuration] = useState(15);
  const [firstName, setFirstName] = useState("Buddy");
  const [lastName, setLastName] = useState("Test");
  const [siteUrl, setSiteUrl] = useState(DEFAULT_SITE_URL);
  const [notes, setNotes] = useState("Manual book from admin");
  const [sendCombined, setSendCombined] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (busy) return;
      setBusy(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch("/api/admin/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            start_time_ct: startCt.length === 16 ? `${startCt}:00` : startCt,
            duration_minutes: duration,
            first_name: firstName,
            last_name: lastName,
            site_preview_url: siteUrl,
            send_combined_sms: sendCombined,
            notes,
          }),
        });
        const data = (await res.json()) as BookResponse;
        if (!res.ok || !data.ok) {
          setError(data.error ?? `HTTP ${res.status}`);
        } else {
          setResult(data);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [busy, phone, startCt, duration, firstName, lastName, siteUrl, sendCombined, notes],
  );

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
            Phone (E.164)
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-base font-mono focus:outline-none focus:border-zinc-600"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
            Start (Chicago local time)
          </label>
          <input
            type="datetime-local"
            required
            step={900}
            value={startCt}
            onChange={(e) => setStartCt(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-base focus:outline-none focus:border-zinc-600"
          />
          <div className="text-[11px] text-zinc-500 mt-1">
            Calendar requires ≥2h ahead. Presets:{" "}
            <button
              type="button"
              onClick={() => setStartCt(inHours(3))}
              className="underline hover:text-zinc-300"
            >
              +3h
            </button>
            {" · "}
            <button
              type="button"
              onClick={() => setStartCt(inHours(24))}
              className="underline hover:text-zinc-300"
            >
              tomorrow same time
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
            First name
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-base focus:outline-none focus:border-zinc-600"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
            Last name
          </label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-base focus:outline-none focus:border-zinc-600"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
            Duration (min)
          </label>
          <input
            type="number"
            min={5}
            max={60}
            step={5}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10) || 15)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-base focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
          Site preview URL
        </label>
        <input
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-base font-mono focus:outline-none focus:border-zinc-600"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
          Notes
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-base focus:outline-none focus:border-zinc-600"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={sendCombined}
          onChange={(e) => setSendCombined(e.target.checked)}
          className="w-4 h-4"
        />
        Send combined SMS (preview link + booking time in one message)
      </label>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 font-medium"
        >
          {busy ? "Booking…" : "Book appointment"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result?.ok && (
        <div className="rounded-md border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-100 space-y-1">
          <div className="font-semibold">✅ Booked · {result.start_time_ct_display}</div>
          <div className="text-xs text-emerald-300 font-mono">
            appointment_id: {result.appointment_id}
          </div>
          <div className="text-xs text-emerald-300 font-mono">
            contact_id: {result.contact_id}
          </div>
          {result.combined_sms && (
            <div className="mt-2 text-xs">
              {result.combined_sms.ok
                ? `SMS sent · sid ${result.combined_sms.sid?.slice(0, 12)}…`
                : `SMS failed: ${result.combined_sms.error ?? "unknown"}`}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
