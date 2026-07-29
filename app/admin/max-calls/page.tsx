// /admin/max-calls — every call Max (the AI cold-caller) has made.
//
// List is ElevenLabs-conversation-driven so every recording is here and
// playable (audio + transcript per card). We correlate each conversation to
// its SignalWire call (by start time) purely to LABEL the outcome (picked up
// vs voicemail) and power the filter tabs. Admin-authed.

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import MaxCallCard, { type MaxCall } from "./MaxCallCard";

export const dynamic = "force-dynamic";

const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "agent_0101kymwezq6eg4v91cnf5ed5j3p";
const MAX_FROM = process.env.SIGNALWIRE_PHONE_DALLAS || "+14696087322";

type ElItem = {
  conversation_id: string;
  call_summary_title?: string | null;
  transcript_summary?: string | null;
  start_time_unix_secs?: number | null;
  call_duration_secs?: number | null;
  message_count?: number | null;
  tool_names?: string[] | null;
};

async function loadElevenConvs(): Promise<ElItem[]> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=100`, {
      headers: { "xi-api-key": key }, cache: "no-store",
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { conversations?: ElItem[] };
    return j.conversations ?? [];
  } catch { return []; }
}

type SwCall = { to: string; from: string; answered_by: string | null; date_created: string };
async function loadSwCalls(): Promise<SwCall[]> {
  const pid = process.env.SIGNALWIRE_PROJECT_ID, tok = process.env.SIGNALWIRE_TOKEN, space = process.env.SIGNALWIRE_SPACE_URL;
  if (!pid || !tok || !space) return [];
  const basic = Buffer.from(`${pid}:${tok}`).toString("base64");
  try {
    const r = await fetch(`https://${space}/api/laml/2010-04-01/Accounts/${pid}/Calls.json?PageSize=200`, {
      headers: { Authorization: `Basic ${basic}` }, cache: "no-store",
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { calls?: SwCall[] };
    const from10 = MAX_FROM.replace(/[^0-9]/g, "").slice(-10);
    return (j.calls ?? []).filter((c) => (c.from ?? "").replace(/[^0-9]/g, "").slice(-10) === from10);
  } catch { return []; }
}

function fmtPhone(p: string): string {
  const d = p.replace(/[^0-9]/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

async function loadCalls(): Promise<{ calls: MaxCall[]; error: string | null }> {
  const [el, sw] = await Promise.all([loadElevenConvs(), loadSwCalls()]);

  // Correlate each conversation to its SW call by nearest start time (±90s) to
  // pull the answered_by verdict + prospect number.
  const swByTime = sw
    .map((c) => ({ ...c, epoch: Math.floor(new Date(c.date_created).getTime() / 1000) }))
    .sort((a, b) => a.epoch - b.epoch);
  const used = new Set<number>();

  const calls: MaxCall[] = el.map((c) => {
    const start = c.start_time_unix_secs ?? 0;
    let bestIdx = -1, bestDiff = 91;
    swByTime.forEach((s, i) => {
      if (used.has(i)) return;
      const diff = Math.abs(s.epoch - start);
      if (diff < bestDiff) { bestIdx = i; bestDiff = diff; }
    });
    let outcome: MaxCall["outcome"] = "picked_up"; // a conversation exists => it connected
    let phone: string | null = null;
    if (bestIdx >= 0) {
      used.add(bestIdx);
      const ab = (swByTime[bestIdx].answered_by ?? "").toLowerCase();
      if (ab.startsWith("machine") || ab === "fax") outcome = "voicemail";
      phone = fmtPhone(swByTime[bestIdx].to);
    }
    return {
      id: c.conversation_id,
      title: c.call_summary_title ?? null,
      summary: c.transcript_summary ?? null,
      startSecs: start || null,
      durationSecs: c.call_duration_secs ?? null,
      messageCount: c.message_count ?? null,
      outcome,
      phone,
      toolNames: c.tool_names ?? [],
    };
  });
  calls.sort((a, b) => (b.startSecs ?? 0) - (a.startSecs ?? 0));
  return { calls, error: null };
}

const FILTERS = ["all", "picked_up", "voicemail", "booked", "texted"] as const;
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
            {calls.length} calls · {n("picked_up")} picked up · {n("voicemail")} voicemail · {n("booked")} booked · full audio + transcript
          </p>
        </div>

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
