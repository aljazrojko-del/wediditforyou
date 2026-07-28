// SignalWire POSTs here after a <Record> verb finishes. We persist the
// recording metadata to voice_recordings so /admin/echo can list + play it
// back. Standard SignalWire form-encoded fields:
//   CallSid, RecordingSid, RecordingUrl, RecordingDuration, RecordingStatus

import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function emptyTwiml(): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<Response/>', {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

async function handle(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return emptyTwiml();
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let fields: Record<string, string> = {};
  try {
    const text = await req.text();
    fields = Object.fromEntries(new URLSearchParams(text).entries());
  } catch (e) {
    console.error("[webhook/sw-recording] body parse:", (e as Error).message);
    return emptyTwiml();
  }

  const callSid = fields.CallSid ?? null;
  const recordingSid = fields.RecordingSid ?? null;
  const recordingUrl = fields.RecordingUrl ?? null;
  const durationRaw = fields.RecordingDuration ?? null;
  const duration = durationRaw ? parseInt(durationRaw, 10) : null;
  const status = fields.RecordingStatus ?? "completed";

  console.log("[webhook/sw-recording]", {
    callSid,
    recordingSid,
    hasUrl: !!recordingUrl,
    duration,
    status,
  });

  if (!recordingSid) return emptyTwiml();

  try {
    // Upsert on recording_sid so retries from SignalWire don't dupe rows.
    await supabase
      .from("voice_recordings")
      .upsert(
        {
          call_sid: callSid,
          recording_sid: recordingSid,
          recording_url: recordingUrl,
          duration_sec: duration,
          status,
          kind: "echo-test",
          raw: fields,
        },
        { onConflict: "recording_sid" },
      );
  } catch (e) {
    console.error("[webhook/sw-recording] insert:", (e as Error).message);
  }

  return emptyTwiml();
}

export async function POST(req: Request) {
  return handle(req);
}
export async function GET(req: Request) {
  return handle(req);
}
