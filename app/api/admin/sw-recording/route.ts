// GET /api/admin/sw-recording?sid={recording_sid}
//
// Proxies a SignalWire native call recording so the browser can play it in
// an <audio> tag without ever seeing the SignalWire project credentials.
// Adds Basic auth server-side and streams the WAV back with proper headers.
//
// Why this exists: SignalWire's native recordings (stored on its servers,
// accessed via /Recordings/{sid}.wav) capture BOTH sides of the call.
// Luka's engine-side WAVs only capture the prospect audio because of how
// his WebSocket streaming architecture wires audio.

import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_TOKEN;
  const space = process.env.SIGNALWIRE_SPACE_URL;
  if (!projectId || !token || !space) {
    return new Response("SignalWire credentials missing on server", {
      status: 500,
    });
  }

  const sid = new URL(req.url).searchParams.get("sid");
  if (!sid || !/^[a-f0-9-]{20,}$/i.test(sid)) {
    return new Response("Missing or invalid ?sid", { status: 400 });
  }

  const basic = Buffer.from(`${projectId}:${token}`).toString("base64");
  const swUrl = `https://${space}/api/laml/2010-04-01/Accounts/${projectId}/Recordings/${sid}.wav`;

  const upstream = await fetch(swUrl, {
    headers: { Authorization: `Basic ${basic}` },
    redirect: "follow",
  });

  if (!upstream.ok) {
    return new Response(
      `SignalWire fetch failed: ${upstream.status}`,
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  // Stream the WAV back to the browser as audio/wav so <audio> plays inline.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "private, max-age=300",
      // Length passthrough helps the browser show a proper scrub bar.
      ...(upstream.headers.get("content-length")
        ? { "Content-Length": upstream.headers.get("content-length")! }
        : {}),
    },
  });
}
