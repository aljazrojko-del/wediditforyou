"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function LeadFilters({ cities }: { cities: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const city = sp.get("city") ?? "";
  const status = sp.get("status") ?? "";
  const niche = sp.get("niche") ?? "";
  // Default view is A+B (elite + hot) so the Mia-call button is aimed at
  // premium leads by default. User can widen to C+D or "all" explicitly.
  const grade = sp.get("grade") ?? "A,B";

  function update(k: string, v: string) {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    router.replace(`/admin?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
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
