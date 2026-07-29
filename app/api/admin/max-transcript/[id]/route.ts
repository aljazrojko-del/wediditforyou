// GET /api/admin/max-transcript/[id]
//
// Returns a slimmed transcript for one of Max's ElevenLabs conversations:
// an ordered list of { role, message, secs, tools }. Loaded lazily by the
// /admin/max-calls page when a call is expanded, so the list stays fast.
//
// Admin-authed. Key stays server-side.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Turn = {
  role?: string;
  message?: string | null;
  time_in_call_secs?: number | null;
  tool_calls?: Array<{ tool_name?: string; name?: string }> | null;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "server_misconfig" }, { status: 500 });
  }

  const { id } = await ctx.params;
  if (!/^conv_[a-z0-9]+$/i.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${id}`,
    { headers: { "xi-api-key": key }, cache: "no-store" },
  );
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "upstream_failed", status: upstream.status },
      { status: 502 },
    );
  }

  const data = (await upstream.json()) as {
    transcript?: Turn[];
    analysis?: { transcript_summary?: string | null };
  };

  const turns = (data.transcript ?? [])
    // Drop empty system/tool-only turns that have nothing to show.
    .filter((t) => (t.message && t.message.trim()) || (t.tool_calls && t.tool_calls.length))
    .map((t) => ({
      role: t.role ?? "agent",
      message: t.message ?? "",
      secs: t.time_in_call_secs ?? null,
      tools: (t.tool_calls ?? [])
        .map((tc) => tc.tool_name ?? tc.name)
        .filter((n): n is string => !!n),
    }));

  return NextResponse.json({
    summary: data.analysis?.transcript_summary ?? null,
    turns,
  });
}
