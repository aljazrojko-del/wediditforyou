"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function LeadFilters({ cities }: { cities: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const city = sp.get("city") ?? "";
  const status = sp.get("status") ?? "";
  const niche = sp.get("niche") ?? "";

  function update(k: string, v: string) {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    router.replace(`/admin?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
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
        <option value="dog groomer">dog groomer</option>
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
