// /admin/max-calls — every call Max (the AI cold-caller) has made.
//
// Source: ElevenLabs Conversational AI. Every convai conversation is recorded
// + transcribed automatically, so this page just lists them with the full call
// audio, an AI summary, and per-call BOOKED / TEXTED badges (from the tools Max
// actually fired). Completely separate from /admin/recordings, which is Mia's.
//
// Admin-authed. ELEVENLABS_API_KEY stays server-side.

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import MaxCallCard, { type MaxCall } from "./MaxCallCard";

export const dynamic = "force-dynamic";

const AGENT_ID =
  process.env.ELEVENLABS_AGENT_ID || "agent_0101kymwezq6eg4v91cnf5ed5j3p";

type ElevenListItem = {
  conversation_id: string;
  call_summary_title?: string | null;
  transcript_summary?: string | null;
  start_time_unix_secs?: number | null;
  call_duration_secs?: number | null;
  message_count?: number | null;
  status?: string | null;
  call_successful?: string | null;
  tool_names?: string[] | null;
  direction?: string | null;
};

async function loadMaxCalls(): Promise<{ calls: MaxCall[]; error: string | null }> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { calls: [], error: "ELEVENLABS_API_KEY not set on server" };

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=100`,
      { headers: { "xi-api-key": key }, cache: "no-store" },
    );
    if (!res.ok) return { calls: [], error: `ElevenLabs list failed (${res.status})` };
    const data = (await res.json()) as { conversations?: ElevenListItem[] };
    const calls = (data.conversations ?? []).map<MaxCall>((c) => ({
      id: c.conversation_id,
      title: c.call_summary_title ?? null,
      summary: c.transcript_summary ?? null,
      startSecs: c.start_time_unix_secs ?? null,
      durationSecs: c.call_duration_secs ?? null,
      messageCount: c.message_count ?? null,
      status: c.status ?? null,
      callSuccessful: c.call_successful ?? null,
      toolNames: c.tool_names ?? [],
      direction: c.direction ?? null,
    }));
    // Already newest-first from the API, but be explicit.
    calls.sort((a, b) => (b.startSecs ?? 0) - (a.startSecs ?? 0));
    return { calls, error: null };
  } catch (e) {
    return { calls: [], error: (e as Error).message };
  }
}

export default async function MaxCallsPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  const { calls, error } = await loadMaxCalls();

  const booked = calls.filter((c) => c.toolNames.includes("book_appointment")).length;
  const texted = calls.filter((c) => c.toolNames.includes("send_sms")).length;

  return (
    <>
      <AdminNav />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Max — AI caller</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {calls.length} calls · {booked} booked · {texted} texted · full audio +
            transcript from ElevenLabs
          </p>
        </div>

        {error ? (
          <div className="border border-rose-900 bg-rose-950/30 rounded-lg p-6 text-sm text-rose-300">
            Couldn&apos;t load Max&apos;s calls: {error}
          </div>
        ) : calls.length === 0 ? (
          <div className="border border-zinc-900 rounded-lg p-12 text-center text-zinc-500">
            No calls yet. When Max makes a call it&apos;ll show up here.
          </div>
        ) : (
          <ul className="space-y-3">
            {calls.map((c) => (
              <MaxCallCard key={c.id} call={c} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
