// /admin/max-calls — every call Max (the AI cold-caller) has made, with outcome.
//
// Source of truth for OUTCOMES is SignalWire (it's the only place that knows
// about no-answers and AMD-hangup voicemails — those never reach ElevenLabs).
// We pull Max's outbound calls (from the Dallas caller-ID), classify each as
// picked-up / voicemail / no-answer / failed, and enrich the ones that actually
// connected with the ElevenLabs transcript + audio (matched by start time).
//
// Filter tabs + stat cards let Aljaz slice by outcome. Admin-authed.
// (Max calls = Dallas caller-ID. Mia is currently not calling; if she resumes
// on the same number we'd separate via brooke_calls.)

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import MaxCallCard, { type MaxCall } from "./MaxCallCard";

export const dynamic = "force-dynamic";

const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "agent_0101kymwezq6eg4v91cnf5ed5j3p";
const MAX_FROM = process.env.SIGNALWIRE_PHONE_DALLAS || "+14696087322";
// Our own SW numbers — calls TO these are internal test calls, hide them.
const OWN_NUMBERS = new Set(
  [
    process.env.SIGNALWIRE_PHONE_HOUSTON, process.env.SIGNALWIRE_PHONE_PHOENIX,
    process.env.SIGNALWIRE_PHONE_DALLAS, process.env.SIGNALWIRE_PHONE_NASHVILLE,
    process.env.SIGNALWIRE_PHONE_CHICAGO,
  ].filter(Boolean).map((n) => (n as string).replace(/[^0-9]/g, "").slice(-10)),
);

type Outcome = "picked_up" | "voicemail" | "no_answer" | "failed" | "other";
function classify(answeredBy: string | null, status: string | null): Outcome {
  const ab = (answeredBy ?? "").toLowerCase();
  const s = (status ?? "").toLowerCase();
  if (ab.startsWith("machine") || ab === "fax") return "voicemail";
  if (s === "no-answer" || s === "busy" || s === "canceled") return "no_answer";
  if (s === "failed") return "failed";
  if (ab === "human" || (["", "unknown", "null"].includes(ab) && s === "completed")) return "picked_up";
  if (s === "completed") return "picked_up";
  return "other";
}

type SwCall = { sid: string; to: string; from: string; status: string | null; answered_by: string | null; date_created: string; duration: string | number | null };

async function loadSignalWireCalls(): Promise<SwCall[]> {
  const pid = process.env.SIGNALWIRE_PROJECT_ID, tok = process.env.SIGNALWIRE_TOKEN, space = process.env.SIGNALWIRE_SPACE_URL;
  if (!pid || !tok || !space) return [];
  const basic = Buffer.from(`${pid}:${tok}`).toString("base64");
  try {
    const r = await fetch(`https://${space}/api/laml/2010-04-01/Accounts/${pid}/Calls.json?PageSize=200`, {
      headers: { Authorization: `Basic ${basic}` }, cache: "no-store",
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { calls?: SwCall[] };
    const fromLast10 = MAX_FROM.replace(/[^0-9]/g, "").slice(-10);
    return (j.calls ?? []).filter((c) => (c.from ?? "").replace(/[^0-9]/g, "").slice(-10) === fromLast10);
  } catch { return []; }
}

type ElConv = { conversationId: string; startSecs: number; durationSecs: number | null; toolNames: string[]; title: string | null; summary: string | null };
async function loadElevenConvs(): Promise<ElConv[]> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=200`, {
      headers: { "xi-api-key": key }, cache: "no-store",
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { conversations?: Array<Record<string, unknown>> };
    return (j.conversations ?? []).map((c) => ({
      conversationId: String(c.conversation_id),
      startSecs: Number(c.start_time_unix_secs) || 0,
      durationSecs: (c.call_duration_secs as number) ?? null,
      toolNames: (c.tool_names as string[]) ?? [],
      title: (c.call_summary_title as string) ?? null,
      summary: (c.transcript_summary as string) ?? null,
    }));
  } catch { return []; }
}

function fmtPhone(p: string): string {
  const d = p.replace(/[^0-9]/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

async function loadCalls(): Promise<{ calls: MaxCall[]; error: string | null }> {
  const [sw, el] = await Promise.all([loadSignalWireCalls(), loadElevenConvs()]);
  if (sw.length === 0) return { calls: [], error: null };

  // Greedy nearest-time match SW call -> ElevenLabs conversation (±90s).
  const elByTime = [...el].sort((a, b) => a.startSecs - b.startSecs);
  const used = new Set<string>();
  const calls: MaxCall[] = sw
    .filter((c) => !OWN_NUMBERS.has((c.to ?? "").replace(/[^0-9]/g, "").slice(-10)))
    .map((c) => {
      const swEpoch = Math.floor(new Date(c.date_created).getTime() / 1000);
      let best: ElConv | null = null, bestDiff = 91;
      for (const e of elByTime) {
        if (used.has(e.conversationId)) continue;
        const diff = Math.abs(e.startSecs - swEpoch);
        if (diff < bestDiff) { best = e; bestDiff = diff; }
      }
      if (best) used.add(best.conversationId);
      const durationSecs = typeof c.duration === "string" ? parseInt(c.duration, 10) : (c.duration ?? null);
      return {
        id: c.sid,
        phone: fmtPhone(c.to),
        outcome: classify(c.answered_by, c.status),
        answeredBy: c.answered_by,
        status: c.status,
        startSecs: swEpoch,
        durationSecs,
        conversationId: best?.conversationId ?? null,
        title: best?.title ?? null,
        summary: best?.summary ?? null,
        toolNames: best?.toolNames ?? [],
      };
    });
  return { calls, error: null };
}

const FILTERS = ["all", "picked_up", "voicemail", "no_answer", "booked", "texted"] as const;
type Filter = (typeof FILTERS)[number];
function matches(c: MaxCall, f: Filter): boolean {
  if (f === "all") return true;
  if (f === "booked") return c.toolNames.includes("book_appointment");
  if (f === "texted") return c.toolNames.includes("send_sms");
  return c.outcome === f;
}

export default async function MaxCallsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  if (!(await isAuthed())) redirect("/admin/login");
  const sp = await searchParams;
  const filter: Filter = (FILTERS as readonly string[]).includes(sp.filter ?? "") ? (sp.filter as Filter) : "all";
  const { calls, error } = await loadCalls();
  const rows = calls.filter((c) => matches(c, filter));

  const n = (f: Filter) => calls.filter((c) => matches(c, f)).length;
  const tabs: Array<{ key: Filter; label: string }> = [
    { key: "all", label: "All" },
    { key: "picked_up", label: "Picked up" },
    { key: "voicemail", label: "Voicemail" },
    { key: "no_answer", label: "No answer" },
    { key: "booked", label: "Booked" },
    { key: "texted", label: "Texted" },
  ];

  return (
    <>
      <AdminNav />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold">Max — AI caller</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {calls.length} calls · outcomes from SignalWire · transcripts + audio from ElevenLabs
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {([
            ["Picked up", n("picked_up"), "text-emerald-300 border-emerald-900 bg-emerald-950/40"],
            ["Voicemail", n("voicemail"), "text-zinc-300 border-zinc-800 bg-zinc-900/40"],
            ["No answer", n("no_answer"), "text-amber-300 border-amber-900/60 bg-amber-950/30"],
            ["Booked", n("booked"), "text-sky-300 border-sky-900 bg-sky-950/40"],
          ] as const).map(([label, count, cls]) => (
            <div key={label} className={`rounded border p-3 ${cls}`}>
              <div className="text-2xl font-semibold">{count}</div>
              <div className="text-[11px] uppercase tracking-wider mt-1 opacity-80">{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = filter === t.key;
            return (
              <a key={t.key} href={t.key === "all" ? "/admin/max-calls" : `/admin/max-calls?filter=${t.key}`}
                className={"px-3 py-1.5 rounded text-sm border transition-colors " + (active
                  ? "border-emerald-700 bg-emerald-900/40 text-emerald-100"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200")}>
                {t.label} <span className={active ? "text-emerald-400" : "text-zinc-600"}>({n(t.key)})</span>
              </a>
            );
          })}
        </div>

        {error ? (
          <div className="border border-rose-900 bg-rose-950/30 rounded-lg p-6 text-sm text-rose-300">Couldn&apos;t load calls: {error}</div>
        ) : rows.length === 0 ? (
          <div className="border border-zinc-900 rounded-lg p-12 text-center text-zinc-500">No calls in this view.</div>
        ) : (
          <ul className="space-y-3">{rows.map((c) => <MaxCallCard key={c.id} call={c} />)}</ul>
        )}
      </div>
    </>
  );
}
