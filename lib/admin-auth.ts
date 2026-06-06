// Cookie-based session auth for the cloud admin UI.
// One password (ADMIN_PASSWORD env), one signed cookie.
// Server-only — never import from a client component.

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "wdy_admin";
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? "";
  if (!s) throw new Error("ADMIN_SESSION_SECRET / ADMIN_PASSWORD not set");
  return s;
}

function getPassword(): string {
  const p = process.env.ADMIN_PASSWORD ?? "";
  if (!p) throw new Error("ADMIN_PASSWORD not set");
  return p;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function constantTimeEq(a: string, b: string): boolean {
  const buf = Buffer.from(a);
  const buf2 = Buffer.from(b);
  if (buf.length !== buf2.length) return false;
  return timingSafeEqual(buf, buf2);
}

export function makeSessionToken(): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `v1.${issuedAt}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [v, ts, sig] = parts;
  if (v !== "v1") return false;
  const issuedAt = parseInt(ts, 10);
  if (!Number.isFinite(issuedAt)) return false;
  const age = Math.floor(Date.now() / 1000) - issuedAt;
  if (age < 0 || age > COOKIE_TTL_SECONDS) return false;
  const expected = sign(`v1.${ts}`);
  return constantTimeEq(sig, expected);
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  const tok = jar.get(COOKIE_NAME)?.value;
  return verifySessionToken(tok);
}

export async function setSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, makeSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_TTL_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export function checkPassword(input: string): boolean {
  if (!input) return false;
  return constantTimeEq(input, getPassword());
}

// Helper for API routes: returns 401 Response if not authed, null if ok.
export async function requireAdmin(): Promise<Response | null> {
  if (await isAuthed()) return null;
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
