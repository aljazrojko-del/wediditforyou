"use client";

import { useState } from "react";

const TX_METROS = [
  "Dallas, TX",
  "Houston, TX",
  "San Antonio, TX",
  "Austin, TX",
  "Fort Worth, TX",
  "El Paso, TX",
  "Arlington, TX",
  "Plano, TX",
  "Frisco, TX",
  "McKinney, TX",
  "Garland, TX",
  "Irving, TX",
  "Mesquite, TX",
  "Grand Prairie, TX",
  "Denton, TX",
  "Round Rock, TX",
  "Corpus Christi, TX",
  "Waco, TX",
  "Killeen, TX",
  "Sugar Land, TX",
  "Pasadena, TX",
  "The Woodlands, TX",
  "Lubbock, TX",
  "Amarillo, TX",
  "Midland, TX",
  "Tyler, TX",
  "Beaumont, TX",
  "Brownsville, TX",
  "Laredo, TX",
  "College Station, TX",
  "Abilene, TX",
  "Wichita Falls, TX",
];

// Top US metros beyond TX — used for the multi-region batch.
const NON_TX_TOP_METROS = [
  "Phoenix, AZ",
  "Nashville, TN",
  "Chicago, IL",
  "Atlanta, GA",
  "Miami, FL",
  "Denver, CO",
  "Orlando, FL",
  "Tampa, FL",
  "Charlotte, NC",
  "Raleigh, NC",
  "Jacksonville, FL",
  "Las Vegas, NV",
  "Columbus, OH",
  "Indianapolis, IN",
  "Kansas City, MO",
  "Oklahoma City, OK",
  "Memphis, TN",
  "New Orleans, LA",
  "Louisville, KY",
  "Birmingham, AL",
];

const ALL_TARGET_METROS = [...TX_METROS, ...NON_TX_TOP_METROS];
const ALL_NICHES = ["mobile mechanic", "mobile dog groomer", "tutor"];

const NICHES = [
  // Proven / locked niches
  "mobile mechanic",
  "mobile dog groomer",
  "dog grooming",
  "tutor",
  // Tier S — appointment-based, DM-run, mostly no website (go next)
  "mobile detailing",
  "dog walking",
  "barber shop",
  "hair salon",
  "nail salon",
  "tattoo shop",
  "house cleaning",
  // Tier A — high pain / high ticket, harder sell
  "locksmith",
  "towing",
  "garage door",
  "plumber",
  "hvac",
  "roofer",
  "pest control",
  "tree service",
  "junk removal",
  "handyman",
  "pressure washing",
];

const CITIES = [
  "Houston, TX",
  "Dallas, TX",
  "Austin, TX",
  "San Antonio, TX",
  "Fort Worth, TX",
  "El Paso, TX",
  "Arlington, TX",
  "Plano, TX",
  "Frisco, TX",
  "McKinney, TX",
  "Garland, TX",
  "Irving, TX",
  "Mesquite, TX",
  "Grand Prairie, TX",
  "Denton, TX",
  "Round Rock, TX",
  "Corpus Christi, TX",
  "Waco, TX",
  "Killeen, TX",
  "Sugar Land, TX",
  "Pasadena, TX",
  "The Woodlands, TX",
  "Lubbock, TX",
  "Amarillo, TX",
  "Midland, TX",
  "Tyler, TX",
  "Beaumont, TX",
  "Brownsville, TX",
  "Laredo, TX",
  "College Station, TX",
  "Abilene, TX",
  "Wichita Falls, TX",
  "Phoenix, AZ",
  "Nashville, TN",
  "Chicago, IL",
  "Atlanta, GA",
  "Miami, FL",
  "Seattle, WA",
  "Denver, CO",
  "Orlando, FL",
  "Tampa, FL",
];

type BatchLine = {
  city: string;
  status: "pending" | "running" | "done" | "error";
  found?: number;
  noSite?: number;
  qualified?: number;
  inserted?: number;
  skipped?: number;
  generated?: number;
  enriched?: number;
  error?: string;
};

export default function PullForm() {
  const [niche, setNiche] = useState(NICHES[0]);
  const [city, setCity] = useState(CITIES[0]);
  const [pages, setPages] = useState(3);
  const [minRating, setMinRating] = useState(4.0);
  const [minReviews, setMinReviews] = useState(5);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [batch, setBatch] = useState<BatchLine[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [enrichRunning, setEnrichRunning] = useState(false);
  const [enrichResult, setEnrichResult] = useState<string | null>(null);
  const [fbRunning, setFbRunning] = useState(false);
  const [fbResult, setFbResult] = useState<string | null>(null);

  async function runFacebookPull() {
    if (fbRunning) return;
    if (
      !confirm(
        `Pull Facebook pages via Serper for "${niche}" in "${city}"?\n\n` +
          `Runs 2 Serper queries (~$0.006) to find Facebook business pages Google has indexed. ` +
          `Filters out groups/events/personal pages. Inserts up to 30 new leads with source='facebook_serper'. ` +
          `Dedup automatic.`,
      )
    ) {
      return;
    }
    setFbRunning(true);
    setFbResult("Searching Facebook via Serper…");
    try {
      const res = await fetch("/api/admin/pull-facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, city, limit: 30 }),
      });
      const text = await res.text();
      let j: Record<string, unknown> | null = null;
      try { j = JSON.parse(text) as Record<string, unknown>; } catch { /* non-JSON */ }
      if (!res.ok || !j) {
        setFbResult(`Error: HTTP ${res.status} ${text.slice(0, 200)}`);
        return;
      }
      const found = Number(j.found ?? 0);
      const withPhone = Number(j.with_phone ?? 0);
      const inserted = Number(j.inserted ?? 0);
      const skipped = Number(j.skipped ?? 0);
      const sample = Array.isArray(j.sample) ? j.sample : [];
      setFbResult(
        `Facebook: found ${found} pages · ${withPhone} with phone · +${inserted} new inserted · ${skipped} were duplicates.` +
          (sample.length > 0
            ? "\n\nSample: " +
              sample
                .map((s: unknown) => {
                  const r = s as { name?: string; phone?: string | null };
                  return `${r.name ?? "?"}${r.phone ? " · " + r.phone : ""}`;
                })
                .join(" | ")
            : ""),
      );
    } catch (e) {
      setFbResult(`Error: ${(e as Error).message}`);
    } finally {
      setFbRunning(false);
    }
  }

  async function runEnrichBatch(
    limit: number,
    grades: string[],
    possessiveOnly = false,
  ) {
    if (enrichRunning) return;
    const label = possessiveOnly
      ? `🎯 HIGH-CONFIDENCE: ${limit} possessive-pattern leads (grades ${grades.join(", ")})`
      : `${limit} leads (grades ${grades.join(", ")})`;
    if (
      !confirm(
        `Enrich ${label}?\n\n` +
          `Runs Serper → Facebook/domain lookup → LeadMagic (only fires on validated US first names) → QuickEmail/Hunter verify.\n\n` +
          `Est. cost: ~$${(limit * (possessiveOnly ? 0.20 : 0.15)).toFixed(2)}.\n\n` +
          `Possessive-only mode targets "X's Business" name patterns where LeadMagic has the highest hit rate.`,
      )
    ) {
      return;
    }
    setEnrichRunning(true);
    setEnrichResult("Enriching…");
    try {
      const res = await fetch("/api/admin/enrich-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit, grades, possessive_only: possessiveOnly }),
      });
      const text = await res.text();
      let j: Record<string, unknown> | null = null;
      try { j = JSON.parse(text) as Record<string, unknown>; } catch { /* fall through */ }
      if (!res.ok || !j) {
        setEnrichResult(`Error: HTTP ${res.status} ${text.slice(0, 200)}`);
        return;
      }
      setEnrichResult(
        `Enriched ${j.updated ?? 0} of ${j.processed ?? 0} (${j.skipped ?? 0} skipped, ${j.failed ?? 0} failed).`,
      );
    } catch (e) {
      setEnrichResult(`Error: ${(e as Error).message}`);
    } finally {
      setEnrichRunning(false);
    }
  }

  async function pullOne(pullCity: string): Promise<{
    found: number;
    noSite: number;
    qualified: number;
    inserted: number;
    skipped: number;
    generated: number;
    enriched: number;
  }> {
    const res = await fetch("/api/admin/pull-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche, city: pullCity, pages, minRating, minReviews }),
    });
    // Read body as text first — Vercel timeouts / gateway errors return
    // empty or HTML bodies that break res.json().
    const text = await res.text();
    let j: Record<string, unknown> | null = null;
    if (text) {
      try {
        j = JSON.parse(text) as Record<string, unknown>;
      } catch {
        // Non-JSON response — likely a Vercel error page or empty body.
      }
    }
    if (!res.ok || !j) {
      const preview = text.slice(0, 200) || "(empty response)";
      throw new Error(
        `HTTP ${res.status}${j && "error" in j ? ` · ${String(j.error)}` : ` · ${preview}`}`,
      );
    }
    return {
      found: Number(j.found ?? 0),
      noSite: Number(j.noSite ?? 0),
      qualified: Number(j.qualified ?? 0),
      inserted: Number(j.inserted ?? 0),
      skipped: Number(j.skipped ?? 0),
      generated: Number(j.generated ?? 0),
      enriched: Number(j.enriched ?? 0),
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const j = await pullOne(city);
      const funnel =
        `Google found ${j.found} → ${j.noSite} without site → ` +
        `${j.qualified} passed rating/reviews → ${j.inserted} new inserted ` +
        `(${j.skipped} were duplicates) → ${j.generated} sites generated · ` +
        `${j.enriched} enriched`;
      setResult(funnel);
    } catch (e) {
      setResult(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  // Cross-niche batch: hits every (metro, niche) combo. Uses fetch directly
  // instead of pullOne() because pullOne is bound to the current `niche` state.
  async function pullAllNichesAllMetros() {
    if (batchRunning) return;
    const totalPulls = ALL_TARGET_METROS.length * ALL_NICHES.length;
    if (
      !confirm(
        `NUKE: pull ${ALL_TARGET_METROS.length} metros × ${ALL_NICHES.length} niches = ${totalPulls} sequential pulls.\n\n` +
          `Filters: rating ≥ ${minRating}, reviews ≥ ${minReviews}, pages ${pages}\n` +
          `Estimated: ${Math.round((totalPulls * 45) / 60)} min.\n\n` +
          `This will run for a long time. You can leave this tab open.`,
      )
    ) {
      return;
    }
    setBatchRunning(true);
    setResult(null);

    const combos: Array<{ city: string; niche: string }> = [];
    for (const c of ALL_TARGET_METROS) {
      for (const n of ALL_NICHES) combos.push({ city: c, niche: n });
    }
    setBatch(combos.map((c) => ({ city: `${c.city} · ${c.niche}`, status: "pending" })));

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalGenerated = 0;

    for (let i = 0; i < combos.length; i++) {
      const { city: c, niche: n } = combos[i];
      setBatch((prev) =>
        prev.map((row, idx) => (idx === i ? { ...row, status: "running" } : row)),
      );
      try {
        const res = await fetch("/api/admin/pull-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ niche: n, city: c, pages, minRating, minReviews }),
        });
        const text = await res.text();
        let j: Record<string, unknown> | null = null;
        try { j = JSON.parse(text) as Record<string, unknown>; } catch { /* non-JSON */ }
        if (!res.ok || !j) throw new Error(`HTTP ${res.status}${text ? ": " + text.slice(0, 120) : ""}`);
        const found = Number(j.found ?? 0);
        const noSite = Number(j.noSite ?? 0);
        const qualified = Number(j.qualified ?? 0);
        const inserted = Number(j.inserted ?? 0);
        const skipped = Number(j.skipped ?? 0);
        const generated = Number(j.generated ?? 0);
        const enriched = Number(j.enriched ?? 0);
        totalInserted += inserted;
        totalSkipped += skipped;
        totalGenerated += generated;
        setBatch((prev) =>
          prev.map((row, idx) =>
            idx === i
              ? { ...row, status: "done", found, noSite, qualified, inserted, skipped, generated, enriched }
              : row,
          ),
        );
      } catch (e) {
        setBatch((prev) =>
          prev.map((row, idx) =>
            idx === i ? { ...row, status: "error", error: (e as Error).message } : row,
          ),
        );
      }
    }

    setResult(
      `NUKE done. Inserted ${totalInserted} new · skipped ${totalSkipped} dupes · ${totalGenerated} sites generated.`,
    );
    setBatchRunning(false);
  }

  async function pullBatch(cities: string[], label: string) {
    if (batchRunning) return;
    if (
      !confirm(
        `Pull ${cities.length} metros for "${niche}"?\n\n` +
          `Filters: rating ≥ ${minRating}, reviews ≥ ${minReviews}, pages ${pages}\n` +
          `Dedup is automatic (skips leads already in DB).\n` +
          `Runs sequentially — will take ~${Math.round((cities.length * 45) / 60)} min.\n\n` +
          `Full waterfall: search → filter no-website → dedup → generate site → enrich.\n\n` +
          `Batch: ${label}`,
      )
    ) {
      return;
    }
    setBatchRunning(true);
    setResult(null);
    const initial: BatchLine[] = cities.map((c) => ({ city: c, status: "pending" }));
    setBatch(initial);

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalGenerated = 0;
    let totalEnriched = 0;

    for (let i = 0; i < cities.length; i++) {
      const c = cities[i];
      setBatch((prev) =>
        prev.map((row, idx) => (idx === i ? { ...row, status: "running" } : row)),
      );
      try {
        const j = await pullOne(c);
        totalInserted += j.inserted;
        totalSkipped += j.skipped;
        totalGenerated += j.generated;
        totalEnriched += j.enriched;
        setBatch((prev) =>
          prev.map((row, idx) =>
            idx === i
              ? {
                  ...row,
                  status: "done",
                  found: j.found,
                  noSite: j.noSite,
                  qualified: j.qualified,
                  inserted: j.inserted,
                  skipped: j.skipped,
                  generated: j.generated,
                  enriched: j.enriched,
                }
              : row,
          ),
        );
      } catch (e) {
        setBatch((prev) =>
          prev.map((row, idx) =>
            idx === i
              ? { ...row, status: "error", error: (e as Error).message }
              : row,
          ),
        );
      }
    }

    setResult(
      `Batch done. Inserted ${totalInserted} new · skipped ${totalSkipped} dupes · ${totalGenerated} sites generated · ${totalEnriched} enriched.`,
    );
    setBatchRunning(false);
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
        disabled={busy || batchRunning}
        className="w-full py-3 rounded bg-white text-zinc-950 font-medium hover:bg-zinc-200 disabled:opacity-50"
      >
        {busy ? "Pulling… (up to ~60s)" : "Pull one city"}
      </button>

      <div className="pt-4 border-t border-zinc-900 space-y-3">
        <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
          Batch pulls
        </div>

        <button
          type="button"
          onClick={() => pullBatch(TX_METROS, `${TX_METROS.length} TX metros`)}
          disabled={busy || batchRunning}
          className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm"
        >
          {batchRunning
            ? `Running… ${batch.filter((b) => b.status === "done" || b.status === "error").length}/${batch.length}`
            : `Pull ${TX_METROS.length} Texas metros · "${niche}"`}
        </button>

        <button
          type="button"
          onClick={() => pullBatch(ALL_TARGET_METROS, `${ALL_TARGET_METROS.length} US metros`)}
          disabled={busy || batchRunning}
          className="w-full py-2.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm"
        >
          {batchRunning
            ? `Running… ${batch.filter((b) => b.status === "done" || b.status === "error").length}/${batch.length}`
            : `Pull ${ALL_TARGET_METROS.length} US metros · "${niche}"`}
        </button>

        <button
          type="button"
          onClick={() => pullAllNichesAllMetros()}
          disabled={busy || batchRunning}
          className="w-full py-2.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold text-sm"
        >
          {batchRunning
            ? `Running… ${batch.filter((b) => b.status === "done" || b.status === "error").length}/${batch.length}`
            : `NUKE: ${ALL_TARGET_METROS.length} metros × ${ALL_NICHES.length} niches (${ALL_TARGET_METROS.length * ALL_NICHES.length} pulls)`}
        </button>

        <p className="text-xs text-zinc-500">
          Sequential. Dedup automatic. NUKE hits every metro × niche — takes ~2h,
          usually surfaces 200-500 new leads.
        </p>
      </div>

      {result && (
        <div className="text-sm text-emerald-400 rounded bg-emerald-950/30 border border-emerald-900 p-3">
          {result}
        </div>
      )}

      <div className="pt-4 border-t border-zinc-900 space-y-2">
        <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
          Facebook (via Serper)
        </div>
        <button
          type="button"
          onClick={runFacebookPull}
          disabled={fbRunning || busy || batchRunning || enrichRunning}
          className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold"
        >
          {fbRunning
            ? "Searching Facebook…"
            : `Pull Facebook pages for "${niche}" in "${city}"`}
        </button>
        <p className="text-xs text-zinc-500">
          Serper searches for facebook.com business pages Google has indexed for
          this niche + city. Extracts business name + phone. Cost ~$0.006/city.
          Dedupes by Facebook URL.
        </p>
        {fbResult && (
          <div className="text-xs text-blue-300 rounded bg-blue-950/30 border border-blue-900 p-2 whitespace-pre-wrap">
            {fbResult}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-900 space-y-2">
        <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
          Enrichment (owner emails)
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => runEnrichBatch(30, ["C_WARM"])}
            disabled={enrichRunning || batchRunning}
            className="py-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-semibold"
          >
            30 C_WARM
          </button>
          <button
            type="button"
            onClick={() => runEnrichBatch(30, ["D_MID"])}
            disabled={enrichRunning || batchRunning}
            className="py-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-semibold"
          >
            30 D_MID
          </button>
          <button
            type="button"
            onClick={() => runEnrichBatch(100, ["C_WARM", "D_MID"])}
            disabled={enrichRunning || batchRunning}
            className="py-2 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold"
          >
            100 C+D
          </button>
        </div>

        <button
          type="button"
          onClick={() => runEnrichBatch(150, ["A_ELITE","B_HOT","C_WARM","D_MID"], true)}
          disabled={enrichRunning || batchRunning}
          className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold"
        >
          🎯 SMART: 150 possessive-name leads (LeadMagic sweet spot)
        </button>
        <p className="text-xs text-zinc-500">
          Only fires LeadMagic on leads with &quot;Firstname&apos;s Business&quot; patterns
          where the first token is a validated US first name. This is where your
          remaining ~6,000 tokens will do the most work.
        </p>
        {enrichResult && (
          <div className="text-xs text-zinc-400 rounded bg-zinc-900/40 border border-zinc-800 p-2">
            {enrichResult}
          </div>
        )}
      </div>

      {batch.length > 0 && (
        <div className="pt-3 space-y-1 max-h-96 overflow-y-auto text-xs font-mono">
          {batch.map((row) => (
            <div
              key={row.city}
              className="flex items-center gap-2 py-1 px-2 rounded bg-zinc-900/40 border border-zinc-900"
            >
              <span
                className={
                  row.status === "done"
                    ? "text-emerald-400"
                    : row.status === "running"
                      ? "text-amber-400"
                      : row.status === "error"
                        ? "text-rose-400"
                        : "text-zinc-600"
                }
              >
                {row.status === "done"
                  ? "✓"
                  : row.status === "running"
                    ? "…"
                    : row.status === "error"
                      ? "✗"
                      : "·"}
              </span>
              <span className="flex-1 truncate">{row.city}</span>
              {row.status === "done" && (
                <span className="text-zinc-500">
                  {row.found}→{row.noSite}→{row.qualified} · +{row.inserted} · skip {row.skipped}
                </span>
              )}
              {row.status === "error" && (
                <span className="text-rose-400 truncate max-w-xs">
                  {row.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
