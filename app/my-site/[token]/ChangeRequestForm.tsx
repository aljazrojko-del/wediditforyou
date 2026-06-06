"use client";

import { useState } from "react";

const CHANGE_TYPES: Array<{ value: string; label: string }> = [
  { value: "text", label: "Text / wording" },
  { value: "hours", label: "Hours or contact info" },
  { value: "service", label: "Add / edit a service" },
  { value: "photo", label: "Photo or branding" },
  { value: "other", label: "Something else" },
];

export default function ChangeRequestForm({ token }: { token: string }) {
  const [changeType, setChangeType] = useState(CHANGE_TYPES[0].value);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 5) {
      setResult({ ok: false, text: "Please describe what to change." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/customer/request-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, changeType, description }),
      });
      const j = await res.json();
      if (!res.ok) {
        setResult({ ok: false, text: j.error ?? "Something went wrong." });
        return;
      }
      setResult({
        ok: true,
        text:
          "✓ Done. Your site updates within a few seconds — refresh in 10 sec to see it live.",
      });
      setDescription("");
    } catch (e) {
      setResult({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <label
          htmlFor="changeType"
          className="text-sm font-semibold text-[#1F1814]"
        >
          What are you changing?
        </label>
        <select
          id="changeType"
          value={changeType}
          onChange={(e) => setChangeType(e.target.value)}
          className="rounded-xl border border-[#1F1814]/15 bg-[#FAF6F0] px-4 py-3 text-[#1F1814] outline-none transition focus:border-[#C2410C]"
        >
          {CHANGE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="description"
          className="text-sm font-semibold text-[#1F1814]"
        >
          Describe the change
        </label>
        <textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          placeholder="Be specific — e.g., 'Change my phone to (713) 555-1234' or 'Add a new service called Mobile Diagnostic, $89, takes about 45 min'."
          className="resize-none rounded-xl border border-[#1F1814]/15 bg-[#FAF6F0] px-4 py-3 text-[#1F1814] outline-none transition focus:border-[#C2410C]"
        />
        <div className="text-right text-xs text-[#1F1814]/40">
          {description.length} / 2000
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center rounded-xl bg-[#C2410C] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#9A3412] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Applying change…" : "Apply change"}
      </button>

      {result && (
        <p
          className={
            result.ok
              ? "rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
              : "rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700"
          }
        >
          {result.text}
        </p>
      )}
    </form>
  );
}
