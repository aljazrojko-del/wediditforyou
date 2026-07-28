// Admin echo test — dial a number, record the caller for up to 30 sec, then
// list all recordings with in-browser playback. Useful for QAing outbound
// call audio quality (echo, distortion, latency) from different from-numbers.

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import EchoCaller from "./EchoCaller";

export const dynamic = "force-dynamic";

type Recording = {
  id: string;
  call_sid: string | null;
  recording_sid: string | null;
  recording_url: string | null;
  duration_sec: number | null;
  to_phone: string | null;
  from_phone: string | null;
  status: string | null;
  created_at: string;
};

async function loadRecordings(): Promise<Recording[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("voice_recordings")
    .select("id, call_sid, recording_sid, recording_url, duration_sec, to_phone, from_phone, status, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as Recording[];
}

function fmtWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function EchoPage() {
  const ok = await isAuthed();
  if (!ok) redirect("/admin/login");
  const recs = await loadRecordings();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <AdminNav />
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Echo test
          </h1>
          <p className="text-sm text-zinc-400">
            Places a call to any number, plays a short intro, then records your
            voice for up to 30 seconds. Use it to QA audio quality (echo,
            distortion, latency) from different SignalWire from-numbers.
          </p>
        </div>

        <EchoCaller />

        <section>
          <h2 className="text-sm uppercase tracking-wider text-zinc-500 font-semibold mb-3">
            Recordings ({recs.length})
          </h2>
          {recs.length === 0 ? (
            <div className="text-sm text-zinc-500">
              No recordings yet. Fire a test above.
            </div>
          ) : (
            <ul className="space-y-3">
              {recs.map((r) => (
                <li
                  key={r.id}
                  className="rounded border border-zinc-900 bg-zinc-950 p-4"
                >
                  <div className="flex flex-wrap gap-4 items-baseline justify-between text-xs text-zinc-400 mb-2">
                    <span className="font-mono">{fmtWhen(r.created_at)}</span>
                    <span>
                      <span className="text-zinc-500">from</span>{" "}
                      <span className="font-mono text-zinc-300">{r.from_phone ?? "—"}</span>{" "}
                      <span className="text-zinc-500">→ to</span>{" "}
                      <span className="font-mono text-zinc-300">{r.to_phone ?? "—"}</span>
                    </span>
                    <span>
                      <span className="text-zinc-500">status</span>{" "}
                      <span
                        className={
                          r.status === "completed"
                            ? "text-emerald-400"
                            : r.status === "pending"
                              ? "text-amber-400"
                              : "text-zinc-300"
                        }
                      >
                        {r.status ?? "?"}
                      </span>
                    </span>
                    {r.duration_sec != null && (
                      <span>
                        <span className="text-zinc-500">duration</span>{" "}
                        <span className="text-zinc-300">{r.duration_sec}s</span>
                      </span>
                    )}
                  </div>
                  {r.recording_sid ? (
                    <audio
                      controls
                      preload="none"
                      className="w-full mt-1"
                      src={`/api/admin/recordings/${encodeURIComponent(r.recording_sid)}`}
                    >
                      Your browser can&apos;t play audio.
                    </audio>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      Waiting for SignalWire recording webhook to arrive…
                    </div>
                  )}
                  <div className="mt-2 text-[11px] text-zinc-600 font-mono">
                    call_sid: {r.call_sid ?? "—"} · recording_sid: {r.recording_sid ?? "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
