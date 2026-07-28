// GET /api/admin/recordings/[sid] — admin-authed proxy that streams the audio
// for a saved recording. SignalWire recording URLs require Basic auth, so we
// can't just embed them in an <audio> tag on the client. The proxy holds the
// project creds server-side and pipes the audio through to the browser.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ sid: string }> },
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { sid } = await ctx.params;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "server_misconfig" }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: rec } = await supabase
    .from("voice_recordings")
    .select("recording_url, recording_sid")
    .eq("recording_sid", sid)
    .maybeSingle<{ recording_url: string | null; recording_sid: string | null }>();

  if (!rec?.recording_url) {
    return NextResponse.json({ error: "recording_not_found" }, { status: 404 });
  }

  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_TOKEN;
  if (!projectId || !token) {
    return NextResponse.json({ error: "signalwire_not_configured" }, { status: 500 });
  }
  const basic = "Basic " + Buffer.from(`${projectId}:${token}`).toString("base64");

  // Ask for MP3 explicitly so browsers with restricted WAV codec still play it.
  const audioUrl = rec.recording_url.endsWith(".mp3")
    ? rec.recording_url
    : `${rec.recording_url}.mp3`;

  const upstream = await fetch(audioUrl, {
    headers: { Authorization: basic },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      {
        error: "upstream_fetch_failed",
        status: upstream.status,
        url: audioUrl,
      },
      { status: 502 },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "audio/mpeg",
      "Content-Length": upstream.headers.get("Content-Length") ?? "",
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
