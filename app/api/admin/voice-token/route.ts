// POST /api/admin/voice-token — mints a short-lived JWT for the browser
// SignalWire JS client (@signalwire/js v4) to authenticate and make WebRTC
// voice calls out to real phone numbers.
//
// Auth: admin session cookie (via requireAdmin).
// Body: (optional) { reference?: string, expires_in?: number }
// Response: { token, expires_in }
//
// The JWT is scoped to the SignalWire project and expires quickly so a
// leaked cookie can't be turned into long-lived call credit.

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_TOKEN;
  const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;

  if (!projectId || !token || !spaceUrl) {
    return NextResponse.json(
      {
        error: "signalwire_not_configured",
        missing: {
          project: !projectId,
          token: !token,
          space: !spaceUrl,
        },
      },
      { status: 500 },
    );
  }

  let body: { reference?: string; expires_in?: number } = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    // fall through with defaults
  }

  const reference = body.reference ?? `admin-${randomUUID()}`;
  const expiresIn = Math.min(Math.max(body.expires_in ?? 3600, 60), 24 * 3600);

  const basic = Buffer.from(`${projectId}:${token}`).toString("base64");

  // SignalWire v4 uses "Subject Access Tokens" (SATs) minted via the Fabric
  // subscribers API, NOT the older Relay JWT endpoint. Minting a token with a
  // stable `reference` auto-creates a subscriber the first time and reuses it
  // on subsequent mints. The browser SDK then presents this SAT to the
  // Fabric endpoints (auth, users, calling) that it hits after connect.
  const swResp = await fetch(
    `https://${spaceUrl}/api/fabric/subscribers/tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        reference,
        expires_in: expiresIn,
      }),
    },
  );

  const rawText = await swResp.text();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }

  if (!swResp.ok) {
    console.error(
      "[admin/voice-token] SignalWire JWT mint failed:",
      swResp.status,
      rawText.slice(0, 300),
    );
    return NextResponse.json(
      {
        error: "signalwire_jwt_failed",
        status: swResp.status,
        detail: parsed ?? rawText.slice(0, 500),
      },
      { status: 502 },
    );
  }

  const data = (parsed ?? {}) as {
    // Fabric SAT response varies slightly between spaces; support both shapes.
    token?: string;
    jwt_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const sat = data.token ?? data.jwt_token ?? null;
  if (!sat) {
    return NextResponse.json(
      { error: "signalwire_token_missing_in_response", raw: data },
      { status: 502 },
    );
  }

  return NextResponse.json({
    token: sat,
    refresh_token: data.refresh_token ?? null,
    expires_in: data.expires_in ?? expiresIn,
    reference,
    // Also return the default from-number so the client doesn't have to guess.
    default_from: process.env.SIGNALWIRE_PHONE_DALLAS ?? "+14696087322",
  });
}
