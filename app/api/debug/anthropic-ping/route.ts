// Temporary debug route — confirms whether the function can reach Anthropic.
// Returns { hasKey, keyPrefix, sdkVersion, callOk, callError } so we can pin
// down exactly where /api/customer/request-change is failing.
// REMOVE AFTER DIAGNOSIS.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  const hasKey = Boolean(key);
  const keyPrefix = key ? `${key.slice(0, 12)}…${key.slice(-4)}` : "missing";

  if (!hasKey) {
    return NextResponse.json({ hasKey, keyPrefix, callOk: false, error: "no key" });
  }

  const client = new Anthropic({ apiKey: key });
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      messages: [{ role: "user", content: "Reply with exactly: pong" }],
    });
    const block = res.content.find((b) => b.type === "text");
    const text = block && block.type === "text" ? block.text : "(no text)";
    return NextResponse.json({
      hasKey,
      keyPrefix,
      callOk: true,
      reply: text,
      stopReason: res.stop_reason,
    });
  } catch (e) {
    const err = e as Error & { status?: number; message?: string };
    return NextResponse.json({
      hasKey,
      keyPrefix,
      callOk: false,
      error: err.message ?? String(e),
      status: err.status,
      name: err.name,
    });
  }
}
