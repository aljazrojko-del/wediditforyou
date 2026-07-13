// POST /api/admin/book — admin-gated proxy to /api/mia/book-appointment.
// Reads OUTREACH_AUTH_TOKEN from env server-side so the UI never has to
// hold it. Rewrites the request through the same handler that Mia will
// eventually hit.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const token = process.env.OUTREACH_AUTH_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "OUTREACH_AUTH_TOKEN missing" }, { status: 500 });
  }

  const body = await req.text();
  const origin = new URL(req.url).origin;
  const upstream = await fetch(`${origin}/api/mia/book-appointment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
