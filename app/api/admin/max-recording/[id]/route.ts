// GET /api/admin/max-recording/[id]
//
// Proxies the ElevenLabs conversation audio (MP3) for Max's AI cold calls so
// the browser can play it in an <audio> tag without ever seeing the ElevenLabs
// API key. Every convai conversation is recorded automatically on ElevenLabs'
// side (both Max + prospect), so this is the full call audio.
//
// ElevenLabs streams the audio chunked with NO Content-Length and NO range
// support, which leaves the <audio> scrubber unable to compute duration or
// seek (the bar shows 0:00 / doesn't match the real length). So we buffer the
// full file server-side and re-serve it with an explicit Content-Length +
// Accept-Ranges, honouring Range requests (206) so seeking + duration work.
//
// Admin-authed. Separate from /admin/recordings, which is Mia's engine.

import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return new Response("ElevenLabs API key missing on server", { status: 500 });
  }

  const { id } = await ctx.params;
  if (!/^conv_[a-z0-9]+$/i.test(id)) {
    return new Response("Invalid conversation id", { status: 400 });
  }

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${id}/audio`,
    { headers: { "xi-api-key": key }, cache: "no-store" },
  );
  if (!upstream.ok || !upstream.body) {
    return new Response(`ElevenLabs audio fetch failed: ${upstream.status}`, {
      status: upstream.status === 404 ? 404 : 502,
    });
  }

  // Buffer the whole file so we can report an accurate length + serve ranges.
  const buf = Buffer.from(await upstream.arrayBuffer());
  const total = buf.length;
  const commonHeaders: Record<string, string> = {
    "Content-Type": "audio/mpeg",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=300",
  };

  // Honour a Range request so the browser can seek and read duration.
  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : total - 1;
    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(end) || end >= total) end = total - 1;
    if (start > end || start >= total) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      });
    }
    const chunk = buf.subarray(start, end + 1);
    return new Response(chunk, {
      status: 206,
      headers: {
        ...commonHeaders,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(chunk.length),
      },
    });
  }

  return new Response(buf, {
    status: 200,
    headers: { ...commonHeaders, "Content-Length": String(total) },
  });
}
