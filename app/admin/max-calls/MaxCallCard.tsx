"use client";

import { useState } from "react";

export type MaxCall = {
  id: string;               // ElevenLabs conversation id (audio + transcript key)
  title: string | null;
  summary: string | null;
  startSecs: number | null;
  durationSecs: number | null;
  messageCount: number | null;
  outcome: "picked_up" | "voicemail" | "unknown";
  phone: string | null;     // from SignalWire correlation, if matched
  toolNames: string[];
  spoke: boolean;           // human who actually said something (real conversation)
};

type Turn = { role: string; message: string; secs: number | null; tools: string[] };

function fmtDate(unixSecs: number | null): string {
  if (!unixSecs) return "—";
  return new Date(unixSecs * 1000).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
function fmtDur(sec: number | null): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

const OUTCOME_BADGE: Record<MaxCall["outcome"], { cls: string; label: string } | null> = {
  picked_up: { cls: "bg-emerald-700 text-emerald-50", label: "PICKED UP" },
  voicemail: { cls: "bg-zinc-700 text-zinc-200", label: "VOICEMAIL" },
  unknown: null,
};

export default function MaxCallCard({ call }: { call: MaxCall }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const booked = call.toolNames.includes("book_appointment");
  const texted = call.toolNames.includes("send_sms");
  const badge = OUTCOME_BADGE[call.outcome];

  async function toggleTranscript() {
    const next = !open;
    setOpen(next);
    if (next && turns === null && !loading) {
      setLoading(true); setErr(null);
      try {
        const res = await fetch(`/api/admin/max-transcript/${call.id}`);
        if (!res.ok) throw new Error(`load failed (${res.status})`);
        const data = (await res.json()) as { turns: Turn[] };
        setTurns(data.turns ?? []);
      } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
    }
  }

  return (
    <li className="border border-zinc-900 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-zinc-100">{call.title || call.phone || "Untitled call"}</span>
            {badge && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>}
            {call.spoke && <span className="text-[10px] font-semibold bg-teal-700 text-teal-50 px-1.5 py-0.5 rounded">CONVERSATION</span>}
            {booked && <span className="text-[10px] font-bold bg-sky-600 text-white px-1.5 py-0.5 rounded">BOOKED</span>}
            {texted && <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">TEXTED</span>}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {call.phone && (
              <><a href={`tel:${call.phone.replace(/[^+0-9]/g, "")}`} className="text-sky-400 hover:text-sky-300 underline decoration-dotted underline-offset-2">{call.phone}</a>{" · "}</>
            )}
            {fmtDate(call.startSecs)} · {fmtDur(call.durationSecs)} · {call.messageCount ?? 0} turns
          </div>
        </div>
      </div>

      {call.summary && <p className="text-xs text-zinc-400 mb-2 leading-relaxed">{call.summary}</p>}

      {/* Full call audio — always available for every conversation. */}
      <audio controls preload="none" className="w-full h-10" src={`/api/admin/max-recording/${call.id}`} />

      <button onClick={toggleTranscript} className="mt-2 text-[11px] text-zinc-500 hover:text-zinc-300">
        {open ? "hide transcript ↑" : "show transcript ↓"}
      </button>

      {open && (
        <div className="mt-2 border-t border-zinc-900 pt-3">
          {loading && <div className="text-xs text-zinc-500">Loading transcript…</div>}
          {err && <div className="text-xs text-rose-400">Couldn&apos;t load transcript: {err}</div>}
          {turns && turns.length === 0 && <div className="text-xs text-zinc-600">No transcript captured.</div>}
          {turns && turns.length > 0 && (
            <div className="space-y-2">
              {turns.map((t, i) => {
                const isMax = t.role === "agent";
                return (
                  <div key={i} className="text-xs leading-relaxed">
                    <span className={"font-semibold mr-2 " + (isMax ? "text-emerald-400" : "text-zinc-300")}>{isMax ? "Max" : "Prospect"}:</span>
                    <span className="text-zinc-300">{t.message}</span>
                    {t.tools.length > 0 && <span className="ml-2 text-[10px] text-amber-400">[{t.tools.join(", ")}]</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
