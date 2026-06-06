"use client";

import { useState } from "react";

export default function BlastButton({
  filterParams,
  count,
}: {
  filterParams: Record<string, string>;
  count: number;
}) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function fire() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...filterParams, channel: "sms" }),
      });
      const j = await res.json();
      if (!res.ok) {
        setResult(`Error: ${j.error ?? "failed"}`);
      } else {
        setResult(`Sent ${j.sent} · failed ${j.failed} · skipped ${j.skipped}`);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {!confirm ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="px-4 py-2 rounded bg-amber-500/90 hover:bg-amber-500 text-zinc-950 font-medium text-sm"
        >
          Blast SMS to filtered ({count})
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={fire}
            className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm disabled:opacity-50"
          >
            {busy ? "Sending…" : `Confirm blast (${count})`}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirm(false)}
            className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm"
          >
            Cancel
          </button>
        </>
      )}
      {result && <span className="text-sm text-zinc-300">{result}</span>}
    </div>
  );
}
