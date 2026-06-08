"use client";

import { useState } from "react";

export default function DomainForm({
  token,
  existingDomain,
}: {
  token: string;
  existingDomain: string | null;
}) {
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) {
      setResult({ ok: false, text: "Please enter a domain." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/customer/register-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, domain: domain.trim().toLowerCase() }),
      });
      const j = await res.json();
      if (!res.ok) {
        setResult({ ok: false, text: j.error ?? "Something went wrong." });
        return;
      }
      setResult({
        ok: true,
        text: `✓ ${j.domain} is yours. DNS is propagating — your site will be live at this address within ~30 minutes.`,
      });
      setDomain("");
    } catch (e) {
      setResult({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (existingDomain) {
    return (
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-700">
        ✓ Registered:{" "}
        <a
          href={`https://${existingDomain}`}
          target="_blank"
          rel="noopener"
          className="font-semibold underline"
        >
          {existingDomain}
        </a>
        <p className="mt-1 text-xs text-emerald-600/80">
          DNS propagation can take up to 24 hours. If your site isn't showing yet,
          wait a bit and refresh.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <p className="text-sm text-[#1F1814]/70">
        Pick the domain you want to be found at on Google. We register it,
        connect everything, and your site goes live at your domain in ~30 min.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="bayoumechanic.com"
          className="flex-1 rounded-xl border border-[#1F1814]/15 bg-[#FAF6F0] px-4 py-3 text-[#1F1814] outline-none transition focus:border-[#C2410C]"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-xl bg-[#C2410C] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#9A3412] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Registering…" : "Register"}
        </button>
      </div>
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
      <p className="text-xs text-[#1F1814]/50">
        Cost is included — domain registration paid by We Did It For You for year 1.
      </p>
    </form>
  );
}
