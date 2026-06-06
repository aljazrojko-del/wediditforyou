// POST /api/admin/auth — verify password, set session cookie.
// DELETE /api/admin/auth — clear session cookie (logout).

import { NextResponse } from "next/server";
import { checkPassword, setSession, clearSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const ok = checkPassword(body.password ?? "");
  if (!ok) {
    // Constant-time-ish delay to slow brute force on a 1-password endpoint.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }
  await setSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
