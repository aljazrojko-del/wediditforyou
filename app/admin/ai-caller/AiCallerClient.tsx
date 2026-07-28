"use client";

import { useRef, useState } from "react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  niche: string | null;
  rating: number | null;
};

type RowStatus = "pending" | "calling" | "done" | "error";
type Row = { status: RowStatus; note?: string };

async function callOne(payload: {
  phone: string;
  company?: string;
  first_name?: string;
  lead_id?: string;
}): Promise<{ ok: boolean; note: string }> {
  const res = await fetch("/api/admin/eleven-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let j: Record<string, unknown> | null = null;
  try {
    j = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* raw */
  }
  if (!j) return { ok: false, note: `HTTP ${res.status}` };
  const ok = j.ok === true;
  const eleven = j.eleven as { message?: string } | undefined;
  const note = ok
    ? "call placed"
    : (eleven?.message as string) || (j.error as string) || "failed";
  return { ok, note };
}

const inputCls =
  "w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm";

export default function AiCallerClient() {
  const [mode, setMode] = useState<"manual" | "auto">("manual");

  // Manual
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Auto
  const [concurrency, setConcurrency] = useState(3);
  const [limit, setLimit] = useState(25);
  const [niche, setNiche] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const stopRef = useRef(false);

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await callOne({
        phone: phone.trim(),
        first_name: firstName.trim() || undefined,
        company: company.trim() || undefined,
      });
      setResult(r.ok ? `✅ ${r.note}` : `❌ ${r.note}`);
    } catch (e) {
      setResult(`❌ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function loadLeads() {
    setLoadingLeads(true);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (niche.trim()) params.set("niche", niche.trim());
      const res = await fetch(`/api/admin/callable-leads?${params}`);
      const j = await res.json();
      const ls: Lead[] = j.leads || [];
      setLeads(ls);
      setRows(ls.map(() => ({ status: "pending" as RowStatus })));
    } catch (e) {
      setResult(`❌ load failed: ${(e as Error).message}`);
    } finally {
      setLoadingLeads(false);
    }
  }

  function setRow(i: number, status: RowStatus, note?: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { status, note } : r)));
  }

  async function startAuto() {
    if (!leads.length || running) return;
    setRunning(true);
    stopRef.current = false;
    let cursor = 0;
    const workerCount = Math.min(Math.max(1, concurrency), leads.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (!stopRef.current) {
        const i = cursor++;
        if (i >= leads.length) break;
        const lead = leads[i];
        setRow(i, "calling");
        try {
          const r = await callOne({
            phone: lead.phone,
            company: lead.name,
            lead_id: lead.id,
          });
          setRow(i, r.ok ? "done" : "error", r.note);
        } catch (e) {
          setRow(i, "error", (e as Error).message);
        }
        await new Promise((res) => setTimeout(res, 500));
      }
    });
    await Promise.all(workers);
    setRunning(false);
  }

  function stopAuto() {
    stopRef.current = true;
  }

  const done = rows.filter((r) => r.status === "done" || r.status === "error").length;

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border border-zinc-800 overflow-hidden">
        {(["manual", "auto"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-medium ${
              mode === m ? "bg-white text-zinc-950" : "bg-zinc-950 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {m === "manual" ? "Manual number" : "Auto (leads list)"}
          </button>
        ))}
      </div>

      {mode === "manual" && (
        <form onSubmit={submitManual} className="space-y-3 max-w-md">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 469 608 7322"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">First name (optional)</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Business (optional)</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputCls} />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy || !phone.trim()}
            className="w-full py-3 rounded bg-white text-zinc-950 font-medium hover:bg-zinc-200 disabled:opacity-50"
          >
            {busy ? "Calling…" : "Call with Alex"}
          </button>
          {result && (
            <div className="text-sm rounded bg-zinc-900/60 border border-zinc-800 p-3">{result}</div>
          )}
        </form>
      )}

      {mode === "auto" && (
        <div className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Parallel calls</label>
              <input
                type="number"
                min={1}
                max={10}
                value={concurrency}
                onChange={(e) => setConcurrency(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Max leads</label>
              <input
                type="number"
                min={1}
                max={200}
                value={limit}
                onChange={(e) => setLimit(Math.min(200, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Niche (optional)</label>
              <input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="mobile mechanic"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadLeads}
              disabled={loadingLeads || running}
              className="px-4 py-2.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-sm font-semibold"
            >
              {loadingLeads ? "Loading…" : "Load callable leads"}
            </button>
            {leads.length > 0 && !running && (
              <button
                onClick={startAuto}
                className="px-4 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
              >
                Start — call {leads.length} leads ({concurrency} at a time)
              </button>
            )}
            {running && (
              <button
                onClick={stopAuto}
                className="px-4 py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold"
              >
                Stop ({done}/{leads.length})
              </button>
            )}
          </div>

          {leads.length > 0 && (
            <div className="space-y-1 max-h-96 overflow-y-auto text-xs font-mono">
              {leads.map((l, i) => {
                const r = rows[i] ?? { status: "pending" as RowStatus };
                const color =
                  r.status === "done"
                    ? "text-emerald-400"
                    : r.status === "calling"
                      ? "text-amber-400"
                      : r.status === "error"
                        ? "text-rose-400"
                        : "text-zinc-600";
                const mark =
                  r.status === "done" ? "✓" : r.status === "calling" ? "…" : r.status === "error" ? "✗" : "·";
                return (
                  <div key={l.id} className="flex items-center gap-2 py-1 px-2 rounded bg-zinc-900/40 border border-zinc-900">
                    <span className={color}>{mark}</span>
                    <span className="flex-1 truncate">{l.name}</span>
                    <span className="text-zinc-500">{l.phone}</span>
                    {r.note && <span className="text-zinc-500 truncate max-w-[10rem]">{r.note}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-zinc-500 max-w-2xl border-t border-zinc-900 pt-4">
        Calls route through the ElevenLabs agent over the SignalWire SIP trunk. Until the SIP
        ingress is finished, calls will return a SIP error (shown per row) — the wiring is
        complete and will connect the moment the trunk is live.
      </p>
    </div>
  );
}
