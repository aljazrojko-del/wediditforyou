// /admin/recordings — browsable list of every Mia call recording.
//
// PRIMARY audio source: SignalWire's own native recording (contains BOTH Mia
//   AND the prospect). Proxied through /api/admin/sw-recording so the browser
//   can play it without ever seeing SignalWire credentials.
//
// FALLBACK: Luka's engine-side WAV (brooke_calls.recording_url). These are
//   prospect-only due to WebSocket audio routing — shown for cross-reference.
//
// Admin-authed.

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  phone: string | null;
  duration_sec: number | null;
  status: string | null;
  intent: string | null;
  meeting_booked: boolean | null;
  recording_url: string | null;
  created_at: string;
  lead: { name: string; city: string | null; slug: string | null } | null;
  sw_recording_sid: string | null; // SignalWire native (both sides)
  sw_answered_by: string | null;   // SignalWire ANM verdict
  sw_call_duration: number | null; // SignalWire's authoritative duration
};

// Convert SignalWire's answered_by into our simplified 3-way classification.
// The correct read is: any signal that a person MIGHT have picked up should
// be treated as PICKED_UP so we don't hide real leads. Only explicit machine_*
// verdicts count as voicemail.
type PickupClass = "PICKED_UP" | "VOICEMAIL" | "FAX" | "NO_SIGNAL";
function classifyPickup(answeredBy: string | null | undefined): {
  cls: PickupClass;
  reason: string;
} {
  const v = (answeredBy ?? "").toLowerCase();
  if (v === "human") return { cls: "PICKED_UP", reason: "SW: human" };
  if (v === "unknown")
    return { cls: "PICKED_UP", reason: "SW: unknown — ANM undecided, treat as human" };
  if (v === "" || v === "null") return { cls: "PICKED_UP", reason: "SW: no ANM verdict" };
  if (v.startsWith("machine")) return { cls: "VOICEMAIL", reason: `SW: ${v}` };
  if (v === "fax") return { cls: "FAX", reason: "SW: fax" };
  return { cls: "NO_SIGNAL", reason: `SW: ${v}` };
}

// Fetch SignalWire's native recording SID for each call by matching on phone
// + approximate time. We batch these into a single API pull to keep this
// server render fast.
async function loadSignalWireRecordings(): Promise<
  Array<{ sid: string; call_sid: string; date_created: string; duration: number }>
> {
  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_TOKEN;
  const space = process.env.SIGNALWIRE_SPACE_URL;
  if (!projectId || !token || !space) return [];
  const basic = Buffer.from(`${projectId}:${token}`).toString("base64");
  try {
    const resp = await fetch(
      `https://${space}/api/laml/2010-04-01/Accounts/${projectId}/Recordings.json?PageSize=100`,
      { headers: { Authorization: `Basic ${basic}` }, cache: "no-store" },
    );
    if (!resp.ok) return [];
    const j = (await resp.json()) as {
      recordings?: Array<{
        sid: string;
        call_sid: string;
        date_created: string;
        duration: number;
      }>;
    };
    return j.recordings ?? [];
  } catch {
    return [];
  }
}

type SwCallMeta = {
  sid: string;
  answered_by: string | null;
  duration: number | null;
};

async function loadSignalWireCallsByPhone(): Promise<Map<string, SwCallMeta>> {
  // Map "phone|approxTimestamp" -> SignalWire call metadata (SID + ANM verdict
  // + duration). Used to fuse SW's ground truth with brooke_calls.
  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_TOKEN;
  const space = process.env.SIGNALWIRE_SPACE_URL;
  if (!projectId || !token || !space) return new Map();
  const basic = Buffer.from(`${projectId}:${token}`).toString("base64");
  try {
    const resp = await fetch(
      `https://${space}/api/laml/2010-04-01/Accounts/${projectId}/Calls.json?PageSize=100`,
      { headers: { Authorization: `Basic ${basic}` }, cache: "no-store" },
    );
    if (!resp.ok) return new Map();
    const j = (await resp.json()) as {
      calls?: Array<{
        sid: string;
        to: string;
        date_created: string;
        answered_by: string | null;
        duration: string | number | null;
      }>;
    };
    const map = new Map<string, SwCallMeta>();
    for (const c of j.calls ?? []) {
      const ts = new Date(c.date_created).getTime();
      const meta: SwCallMeta = {
        sid: c.sid,
        answered_by: c.answered_by ?? null,
        duration:
          typeof c.duration === "string" ? parseInt(c.duration, 10) : c.duration ?? null,
      };
      for (let offset = -2; offset <= 3; offset++) {
        const bucket = Math.floor(ts / 60000) + offset;
        map.set(`${c.to}|${bucket}`, meta);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

async function loadRecordings(): Promise<Row[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Pull last 100 calls with an engine-side recording, plus SW native
  // recordings + call index in parallel.
  const [
    { data, error },
    swRecordings,
    swCallsByPhone,
  ] = await Promise.all([
    supabase
      .from("brooke_calls")
      .select(
        "id, phone, duration_sec, status, intent, meeting_booked, recording_url, created_at, lead_id",
      )
      .not("recording_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(100),
    loadSignalWireRecordings(),
    loadSignalWireCallsByPhone(),
  ]);
  if (error || !data) return [];

  // Build lookup: call_sid -> recording_sid (SW native, both-side audio)
  const recordingByCallSid = new Map<string, string>();
  for (const r of swRecordings) recordingByCallSid.set(r.call_sid, r.sid);

  const leadIds = Array.from(
    new Set(
      data
        .map((r) => (r as { lead_id: string | null }).lead_id)
        .filter((x): x is string => x != null),
    ),
  );

  let leadsById: Record<string, { name: string; city: string | null; slug: string | null }> = {};
  if (leadIds.length > 0) {
    const { data: leadsData } = await supabase
      .from("leads")
      .select("id, name, city, slug")
      .in("id", leadIds);
    leadsById = Object.fromEntries(
      ((leadsData ?? []) as Array<{
        id: string;
        name: string;
        city: string | null;
        slug: string | null;
      }>).map((l) => [l.id, { name: l.name, city: l.city, slug: l.slug }]),
    );
  }

  return data.map((r) => {
    const row = r as {
      id: string;
      phone: string | null;
      duration_sec: number | null;
      status: string | null;
      intent: string | null;
      meeting_booked: boolean | null;
      recording_url: string | null;
      created_at: string;
      lead_id: string | null;
    };
    // Match a SignalWire call by phone + timestamp-bucket, then look up
    // its native recording sid + ANM verdict + true duration.
    let swRecSid: string | null = null;
    let swAnsweredBy: string | null = null;
    let swCallDuration: number | null = null;
    if (row.phone) {
      const bucket = Math.floor(new Date(row.created_at).getTime() / 60000);
      for (let off = -3; off <= 1; off++) {
        const key = `${row.phone}|${bucket + off}`;
        const meta = swCallsByPhone.get(key);
        if (meta) {
          swAnsweredBy = meta.answered_by;
          swCallDuration = meta.duration;
          const rec = recordingByCallSid.get(meta.sid);
          if (rec) swRecSid = rec;
          break;
        }
      }
    }
    return {
      id: row.id,
      phone: row.phone,
      duration_sec: row.duration_sec,
      status: row.status,
      intent: row.intent,
      meeting_booked: row.meeting_booked,
      recording_url: row.recording_url,
      created_at: row.created_at,
      lead: row.lead_id ? leadsById[row.lead_id] ?? null : null,
      sw_recording_sid: swRecSid,
      sw_answered_by: swAnsweredBy,
      sw_call_duration: swCallDuration,
    };
  });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtDur(sec: number | null): string {
  if (!sec) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

// Recording filenames from Luka's engine follow the pattern:
//   YYYYMMDD-HHMMSS_{slugified-company-name}_caller.wav
// The company slug reflects the ACTUAL "company" value passed to /api/test-call,
// which may differ from leads.name (e.g. when we reuse a lead_id for a self-test
// with an overridden company). Extracting it lets us show the real pitch context.
function companyFromFilename(url: string | null | undefined): string | null {
  if (!url) return null;
  const filename = url.split("/").pop() ?? "";
  // Strip the trailing _caller.wav / _callee.wav / .wav
  const stem = filename
    .replace(/\.wav$/i, "")
    .replace(/_caller$|_callee$|_recording$/i, "");
  // Split off the leading timestamp
  const idx = stem.indexOf("_");
  if (idx < 0) return null;
  const slug = stem.slice(idx + 1);
  if (!slug) return null;
  // Un-slug: "mike's-tires" → "Mike's Tires"
  return slug
    .split("-")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function statusPill(status: string | null): { cls: string; label: string } {
  const s = (status ?? "").toLowerCase();
  if (s === "completed" || s === "connected") return { cls: "bg-emerald-800 text-emerald-100", label: status ?? "" };
  if (s === "no-answer" || s === "no_answer") return { cls: "bg-zinc-700 text-zinc-300", label: "no-answer" };
  if (s === "failed" || s === "busy") return { cls: "bg-rose-800 text-rose-100", label: status ?? "" };
  return { cls: "bg-zinc-800 text-zinc-300", label: status ?? "?" };
}

function withToken(url: string, token: string | null | undefined): string {
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

export default async function RecordingsPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  const rows = await loadRecordings();
  const token = process.env.OUTREACH_AUTH_TOKEN ?? "";

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Call recordings</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {rows.length} recording{rows.length === 1 ? "" : "s"} · classification
            from SignalWire <code className="text-zinc-400">answered_by</code>
          </p>
        </div>

        {/* Reality-check panel: how many "no-answer" per Luka were actually humans */}
        {(() => {
          const total = rows.length;
          const classified = rows.map((r) => classifyPickup(r.sw_answered_by));
          const pickedUp = classified.filter((c) => c.cls === "PICKED_UP").length;
          const voicemail = classified.filter((c) => c.cls === "VOICEMAIL").length;
          const other = total - pickedUp - voicemail;
          const humanCount = rows.filter((r) => (r.sw_answered_by ?? "") === "human").length;
          const misclassified = rows.filter((r) => {
            const cls = classifyPickup(r.sw_answered_by).cls;
            const engineStatus = (r.status ?? "").toLowerCase();
            return cls === "PICKED_UP" && (engineStatus === "no-answer" || engineStatus === "no_answer");
          }).length;
          return (
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded border border-emerald-900 bg-emerald-950/40 p-3">
                <div className="text-2xl font-semibold text-emerald-300">{pickedUp}</div>
                <div className="text-xs text-emerald-500 uppercase tracking-wider mt-1">
                  Picked up (human/unknown/null)
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">
                  {humanCount} confirmed human by SW
                </div>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3">
                <div className="text-2xl font-semibold text-zinc-300">{voicemail}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
                  Voicemail
                </div>
              </div>
              <div className="rounded border border-zinc-900 bg-zinc-950 p-3">
                <div className="text-2xl font-semibold text-zinc-500">{other}</div>
                <div className="text-xs text-zinc-600 uppercase tracking-wider mt-1">
                  Fax / no signal
                </div>
              </div>
              <div className={`rounded border p-3 ${misclassified > 0 ? "border-rose-900 bg-rose-950/40" : "border-zinc-900 bg-zinc-950"}`}>
                <div className={`text-2xl font-semibold ${misclassified > 0 ? "text-rose-300" : "text-zinc-500"}`}>
                  {misclassified}
                </div>
                <div className={`text-xs uppercase tracking-wider mt-1 ${misclassified > 0 ? "text-rose-400" : "text-zinc-600"}`}>
                  Misclassified by engine
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5">
                  Actually picked up but flagged &quot;no-answer&quot;
                </div>
              </div>
            </div>
          );
        })()}

        {rows.length === 0 ? (
          <div className="border border-zinc-900 rounded-lg p-12 text-center text-zinc-500">
            No recordings yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const enginePill = statusPill(r.status);
              const swClass = classifyPickup(r.sw_answered_by);
              const audioUrl = r.recording_url ? withToken(r.recording_url, token) : null;
              const pitchedAs = companyFromFilename(r.recording_url);
              const dbLeadName = r.lead?.name ?? null;
              const showBoth =
                pitchedAs != null &&
                dbLeadName != null &&
                pitchedAs.toLowerCase() !== dbLeadName.toLowerCase();
              const primaryLabel = pitchedAs ?? dbLeadName ?? "(no lead)";
              // Highlight discrepancies: engine says "no-answer" but SW says human/unknown/null.
              const engineStatus = (r.status ?? "").toLowerCase();
              const isMisclassified =
                swClass.cls === "PICKED_UP" &&
                (engineStatus === "no-answer" || engineStatus === "no_answer");

              // SW pickup badge styles
              const swBadge = {
                PICKED_UP: { cls: "bg-emerald-700 text-emerald-50", label: "PICKED UP" },
                VOICEMAIL: { cls: "bg-zinc-700 text-zinc-200", label: "VOICEMAIL" },
                FAX: { cls: "bg-zinc-800 text-zinc-400", label: "FAX" },
                NO_SIGNAL: { cls: "bg-zinc-800 text-zinc-500", label: "NO SIGNAL" },
              }[swClass.cls];
              return (
                <li
                  key={r.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isMisclassified
                      ? "border-rose-900 hover:border-rose-700 bg-rose-950/10"
                      : "border-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-zinc-100">{primaryLabel}</span>
                        {r.meeting_booked && (
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                            BOOKED
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${swBadge.cls}`}
                          title={swClass.reason}
                        >
                          {swBadge.label}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${enginePill.cls} opacity-60`}
                          title="Luka's engine classification"
                        >
                          engine: {enginePill.label}
                        </span>
                        {isMisclassified && (
                          <span className="text-[10px] font-bold text-rose-300">
                            ⚠ engine mislabeled
                          </span>
                        )}
                      </div>
                      {showBoth && (
                        <div className="text-[11px] text-amber-400 mt-0.5 italic">
                          self-test override — lead in DB: {dbLeadName}
                        </div>
                      )}
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {r.lead?.city ? `${r.lead.city} · ` : ""}
                        {r.phone ?? "—"} · {fmtDur(r.duration_sec)}
                        {r.intent && r.intent !== "negative" && (
                          <span className="ml-2 text-emerald-400">{r.intent}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 whitespace-nowrap">
                      {fmtDate(r.created_at)}
                    </div>
                  </div>

                  {r.sw_recording_sid ? (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-emerald-500 mb-1 font-semibold">
                        SignalWire native — both sides audible
                      </div>
                      <audio
                        controls
                        preload="none"
                        className="w-full h-10"
                        src={`/api/admin/sw-recording?sid=${r.sw_recording_sid}`}
                      />
                    </>
                  ) : (
                    <div className="text-[11px] text-zinc-500 mb-1">
                      No SignalWire native recording matched — engine-side WAV only (prospect audio, Mia missing)
                    </div>
                  )}
                  {(() => {
                    // Derive Mia-only URL: swap _caller.wav for _brooke.wav in
                    // the engine-side recording path. Luka's engine writes both
                    // files per call — caller is prospect-only, brooke is Mia-only.
                    const brookeUrl = r.recording_url?.includes("_caller.wav")
                      ? withToken(r.recording_url.replace("_caller.wav", "_brooke.wav"), token)
                      : null;
                    return (
                      <details className="mt-2 space-y-2">
                        <summary className="text-[10px] text-zinc-600 hover:text-zinc-400 cursor-pointer">
                          isolate audio (Mia-only, prospect-only) ↓
                        </summary>
                        {brookeUrl && (
                          <div className="mt-2">
                            <div className="text-[10px] uppercase tracking-wider text-purple-400 mb-1 font-semibold">
                              Mia only — 24kHz, higher fidelity
                            </div>
                            <audio
                              controls
                              preload="none"
                              className="w-full h-8"
                              src={brookeUrl}
                            />
                            <div className="mt-0.5 text-[10px] text-zinc-600 truncate">
                              <a href={brookeUrl} download className="hover:text-zinc-400">
                                ↓ download {r.recording_url?.split("/").pop()?.replace("_caller.wav","_brooke.wav") ?? "brooke.wav"}
                              </a>
                            </div>
                          </div>
                        )}
                        {audioUrl && (
                          <div className={brookeUrl ? "mt-2" : ""}>
                            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">
                              Prospect only — 16kHz
                            </div>
                            <audio
                              controls
                              preload="none"
                              className="w-full h-8"
                              src={audioUrl}
                            />
                            <div className="mt-0.5 text-[10px] text-zinc-600 truncate">
                              <a href={audioUrl} download className="hover:text-zinc-400">
                                ↓ download {r.recording_url?.split("/").pop() ?? "recording"}
                              </a>
                            </div>
                          </div>
                        )}
                      </details>
                    );
                  })()}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
