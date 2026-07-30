// /admin/max-calls — every call Max (the AI cold-caller) has made.
//
// Fetches ALL ElevenLabs conversations (paginated), correlates each to its
// SignalWire call for the outcome label + prospect number, and hands the list
// to a client component that does search + pagination (100/page). "Conversation"
// (a human who actually spoke) is derived cheaply from the call's title +
// length, so the page never has to read every transcript on load. Admin-authed.

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import { type MaxCall } from "./MaxCallCard";
import SearchableList from "./SearchableList";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  const all: ElItem[] = [];
  let cursor: string | null = null;
  try {
    for (let i = 0; i < 30; i++) {
      const u = `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=100` +
        (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
      const r = await fetch(u, { headers: { "xi-api-key": key }, cache: "no-store" });
      if (!r.ok) break;
      const j = (await r.json()) as { conversations?: ElItem[]; has_more?: boolean; next_cursor?: string | null };
      all.push(...(j.conversations ?? []));
      if (!j.has_more || !j.next_cursor) break;
      cursor = j.next_cursor;
    }
  } catch { /* return what we have */ }
  return all;
}

type SwCall = { to: string; from: string; answered_by: string | null; date_created: string };
async function loadSwCalls(): Promise<SwCall[]> {
  const pid = process.env.SIGNALWIRE_PROJECT_ID, tok = process.env.SIGNALWIRE_TOKEN, space = process.env.SIGNALWIRE_SPACE_URL;
  if (!pid || !tok || !space) return [];
  const basic = Buffer.from(`${pid}:${tok}`).toString("base64");
  try {
    const r = await fetch(`https://${space}/api/laml/2010-04-01/Accounts/${pid}/Calls.json?PageSize=1000`, {
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

// ElevenLabs auto-titles a call a "voicemail" when it actually reached one, and
// "silent/unresponsive" for dead air. We trust the conversation itself over
// SignalWire's answered_by, which frequently false-positives "machine" on calls
// a human clearly answered (hence a 5-17 turn conversation still tagged machine).
const VM_TITLE = /voice ?mail|answering machine|mailbox|left (a|you a) message|leave a message|(not|un)available|can'?t take (your|the|this) call/i;
const SILENCE_TITLE = /silent|unrespons|no response|confirming (the )?(user|presence)|user (presence|identification)|incomplete|dial tone|dead air|wrong number|no answer/i;

// Real two-way conversation? (no transcript fetch — title + turns + duration).
function isConversation(title: string | null | undefined, msgs: number | null | undefined, dur: number | null | undefined): boolean {
  const t = title ?? "";
  if (VM_TITLE.test(t) || SILENCE_TITLE.test(t)) return false;
  // A topic title (not voicemail/silence) + a couple of real turns = a person
  // said something. Keep it low so short exchanges (e.g. "are you AI?") count.
  return (msgs ?? 0) >= 3 && (dur ?? 0) >= 12;
}

// Every row here already CONNECTED (it has an ElevenLabs conversation), so this
// only distinguishes human-conversation vs voicemail-Max-talked-to.
function classify(answeredBy: string | null, title: string | null | undefined, msgs: number | null | undefined, dur: number | null | undefined): MaxCall["outcome"] {
  if (VM_TITLE.test(title ?? "")) return "voicemail";           // EL confirmed a voicemail
  if (isConversation(title, msgs, dur)) return "picked_up";     // real human talk -> ignore AMD false positive
  const ab = (answeredBy ?? "").toLowerCase();
  if (ab.startsWith("machine") || ab === "fax") return "voicemail";
  return "picked_up";
}

async function loadCalls(): Promise<{ calls: MaxCall[]; error: string | null }> {
  const [el, sw] = await Promise.all([loadElevenConvs(), loadSwCalls()]);

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
    let swAnsweredBy: string | null = null;
    let phone: string | null = null;
    if (bestIdx >= 0) {
      used.add(bestIdx);
      swAnsweredBy = swByTime[bestIdx].answered_by;
      phone = fmtPhone(swByTime[bestIdx].to);
    }
    const outcome = classify(swAnsweredBy, c.call_summary_title, c.message_count, c.call_duration_secs);
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
      spoke: isConversation(c.call_summary_title, c.message_count, c.call_duration_secs),
    };
  });
  calls.sort((a, b) => (b.startSecs ?? 0) - (a.startSecs ?? 0));
  return { calls, error: null };
}

const FILTERS = ["all", "conversation", "picked_up", "voicemail", "booked", "texted"] as const;
type Filter = (typeof FILTERS)[number];
function matches(c: MaxCall, f: Filter): boolean {
  if (f === "all") return true;
  if (f === "conversation") return c.spoke;
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
    { key: "conversation", label: "Conversation" },
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
            {calls.length} calls · {n("conversation")} conversations · {n("picked_up")} picked up · {n("voicemail")} voicemail · {n("booked")} booked
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
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
        ) : (
          <SearchableList calls={rows} />
        )}
      </div>
    </>
  );
}
