"use client";

import { useState } from "react";
import MaxCallCard, { type MaxCall } from "./MaxCallCard";

const PER_PAGE = 100;

// Client-side search + pagination over the (tab-filtered) calls. Search covers
// ALL calls in the tab; results paginate 100 per page.
export default function SearchableList({ calls }: { calls: MaxCall[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const query = q.trim().toLowerCase();
  const qDigits = query.replace(/\D/g, "");
  const filtered = query
    ? calls.filter((c) => {
        const text = ((c.title ?? "") + " " + (c.summary ?? "")).toLowerCase();
        if (text.includes(query)) return true;
        // Number search: match on digits, so "(817) 757-3050", "8177573050"
        // and "817-757" all find the same card.
        if (qDigits.length >= 3) {
          const phoneDigits = (c.phone ?? "").replace(/\D/g, "");
          if (phoneDigits.includes(qDigits)) return true;
        }
        return false;
      })
    : calls;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const cur = Math.min(page, pageCount);
  const start = (cur - 1) * PER_PAGE;
  const rows = filtered.slice(start, start + PER_PAGE);

  return (
    <>
      <input
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setPage(1); }}
        placeholder="Search calls by business, summary, or phone…"
        className="w-full mb-3 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 outline-none"
      />

      <div className="flex items-center justify-between mb-3 text-xs text-zinc-500">
        <span>
          {filtered.length === 0 ? "No matches" : `Showing ${start + 1}–${start + rows.length} of ${filtered.length}`}
        </span>
        {pageCount > 1 && (
          <span className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={cur <= 1}
              className="px-2 py-1 rounded border border-zinc-800 disabled:opacity-30 hover:border-zinc-600 disabled:hover:border-zinc-800"
            >← Prev</button>
            <span className="text-zinc-400">Page {cur} / {pageCount}</span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={cur >= pageCount}
              className="px-2 py-1 rounded border border-zinc-800 disabled:opacity-30 hover:border-zinc-600 disabled:hover:border-zinc-800"
            >Next →</button>
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="border border-zinc-900 rounded-lg p-10 text-center text-zinc-500">
          {query ? <>No calls match &ldquo;{q}&rdquo;.</> : "No calls in this view."}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <MaxCallCard key={c.id} call={c} />
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={cur <= 1}
            className="px-3 py-1.5 rounded border border-zinc-800 disabled:opacity-30 hover:border-zinc-600 disabled:hover:border-zinc-800">← Prev</button>
          <span className="text-zinc-400">Page {cur} / {pageCount}</span>
          <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={cur >= pageCount}
            className="px-3 py-1.5 rounded border border-zinc-800 disabled:opacity-30 hover:border-zinc-600 disabled:hover:border-zinc-800">Next →</button>
        </div>
      )}
    </>
  );
}
