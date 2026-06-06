"use client";

import { useState } from "react";

const NICHES = ["mobile mechanic", "mobile dog groomer", "tutor"];

const CITIES = [
  "Houston, TX",
  "Dallas, TX",
  "Phoenix, AZ",
  "Nashville, TN",
  "Chicago, IL",
  "Austin, TX",
  "Atlanta, GA",
  "Miami, FL",
  "Seattle, WA",
  "Denver, CO",
  "Orlando, FL",
  "Tampa, FL",
];

export default function PullForm() {
  const [niche, setNiche] = useState(NICHES[0]);
  const [city, setCity] = useState(CITIES[0]);
  const [pages, setPages] = useState(3);
  const [minRating, setMinRating] = useState(4.0);
  const [minReviews, setMinReviews] = useState(5);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/pull-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, city, pages, minRating, minReviews }),
      });
      const j = await res.json();
      if (!res.ok) setResult(`Error: ${j.error ?? "failed"}`);
      else
        setResult(
          `Inserted ${j.inserted ?? 0} · skipped ${j.skipped ?? 0} · qualified ${j.qualified ?? 0}` +
            (j.generated != null ? ` · sites generated ${j.generated}` : ""),
        );
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Niche</label>
        <select
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2"
        >
          {NICHES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">City</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Pages</label>
          <input
            type="number"
            min={1}
            max={3}
            value={pages}
            onChange={(e) => setPages(parseInt(e.target.value, 10) || 1)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Min rating</label>
          <input
            type="number"
            step="0.1"
            min={0}
            max={5}
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value) || 0)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Min reviews</label>
          <input
            type="number"
            min={0}
            value={minReviews}
            onChange={(e) => setMinReviews(parseInt(e.target.value, 10) || 0)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full py-3 rounded bg-white text-zinc-950 font-medium hover:bg-zinc-200 disabled:opacity-50"
      >
        {busy ? "Pulling… (up to ~60s)" : "Pull leads"}
      </button>

      {result && <p className="text-sm text-zinc-300">{result}</p>}
    </form>
  );
}
