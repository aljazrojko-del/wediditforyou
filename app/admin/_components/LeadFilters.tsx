"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LeadFilters({ cities }: { cities: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const city = sp.get("city") ?? "";
  const status = sp.get("status") ?? "";
  const niche = sp.get("niche") ?? "";
  // Default view is A+B (elite + hot) so the Mia-call button is aimed at
  // premium leads by default. User can widen to C+D or "all" explicitly.
  const grade = sp.get("grade") ?? "A,B";
  const qParam = sp.get("q") ?? "";

  // Local state on the search input so typing feels instant; navigate
  // on submit (Enter) or when the input blurs after a real change.
  const [qDraft, setQDraft] = useState(qParam);
  useEffect(() => { setQDraft(qParam); }, [qParam]);

  function update(k: string, v: string) {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    router.replace(`/admin?${next.toString()}`);
  }

  function commitSearch(value: string) {
    if (value === qParam) return;
    update("q", value);
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <form
        onSubmit={(e) => { e.preventDefault(); commitSearch(qDraft.trim()); }}
        className="flex items-center gap-1"
      >
        <input
          type="search"
          placeholder="Search by business name…"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
          onBlur={() => commitSearch(qDraft.trim())}
          className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm w-56 focus:outline-none focus:border-emerald-700"
          title="Enter to search — bypasses grade + ready-to-call filters"
        />
        {qParam && (
          <button
            type="button"
            onClick={() => { setQDraft(""); commitSearch(""); }}
            className="text-zinc-500 hover:text-zinc-200 px-2 py-2 text-sm"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </form>
      <select
        value={grade}
        onChange={(e) => update("grade", e.target.value)}
        className="bg-emerald-950/40 border border-emerald-900 rounded px-3 py-2 text-sm font-medium"
        title="Quality grade filter"
      >
        <option value="A,B">🟢 A + B (elite + hot)</option>
        <option value="A">🟢 A_ELITE only</option>
        <option value="B">🟢 B_HOT only</option>
        <option value="C">🟡 C_WARM</option>
        <option value="A,B,C">🟢 A + B + C</option>
        <option value="D">⚪ D_MID</option>
        <option value="E">🔴 E_SUSPECT</option>
        <option value="all">All grades</option>
      </select>
      <select
        value={city}
        onChange={(e) => update("city", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
      >
        <option value="">All cities</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={niche}
        onChange={(e) => update("niche", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
      >
        <option value="">All niches</option>
        <option value="mobile mechanic">mobile mechanic</option>
        <option value="mobile dog groomer">mobile dog groomer</option>
        <option value="tutor">tutor</option>
        <option value="plumber">plumber</option>
      </select>
      <select
        value={status}
        onChange={(e) => update("status", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
      >
        <option value="">Any status</option>
        <option value="untouched">Not contacted</option>
        <option value="sms-sent">SMS sent</option>
        <option value="called">Called</option>
        <option value="inbound">Has reply</option>
      </select>
    </div>
  );
}
