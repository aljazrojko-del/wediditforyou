// GET /api/admin/max-recording/[id]
//
// Proxies the ElevenLabs conversation audio (MP3) for Max's AI cold calls so
// the browser can play it in an <audio> tag without ever seeing the ElevenLabs
// API key. Every convai conversation is recorded automatically on ElevenLabs'
// side (both Max + prospect), so this is the full call audio.
//
// Admin-authed. Separate from /admin/recordings, which is Mia's engine.

import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _req: Request,
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

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "audio/mpeg",
      "Cache-Control": "private, max-age=300",
      ...(upstream.headers.get("Content-Length")
        ? { "Content-Length": upstream.headers.get("Content-Length")! }
        : {}),
    },
  });
}
