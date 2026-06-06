// Customer change-request engine.
// Takes the current site content + a plain-English change description,
// asks Claude Haiku to produce the same JSON schema with the change applied,
// validates, and returns the patched data — or null on any safety failure.

import Anthropic from "@anthropic-ai/sdk";

export type SiteContent = {
  headline?: string | null;
  subheadline?: string | null;
  services?: Array<{ title: string; description: string }> | null;
  reviews?: Array<{ author: string; quote: string; rating?: number }> | null;
  about_text?: string | null;
};

export type ApplyResult = {
  ok: boolean;
  newContent?: SiteContent;
  error?: string;
};

const SYSTEM_PROMPT = `You edit small-business website content based on the owner's request.
You receive the current content as JSON and a change description.
You return the COMPLETE updated content as JSON, preserving every field even if unchanged.

Rules:
- Only change what the owner explicitly asks for. Do not "improve" other fields.
- Keep tone consistent with what's already there.
- Service descriptions stay under 200 chars. Review quotes stay under 280 chars.
- about_text stays under 600 chars.
- Never invent fake reviews or fake business facts.
- If the owner asks for something impossible, refuse politely in a top-level "refusal" field.
- Output VALID JSON only. No prose, no markdown fences.`;

export async function applyChangeWithClaude(
  current: SiteContent,
  changeDescription: string,
): Promise<ApplyResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "ANTHROPIC_API_KEY not configured" };
  }
  if (!changeDescription || changeDescription.trim().length < 3) {
    return { ok: false, error: "Change description is too short" };
  }
  if (changeDescription.length > 2000) {
    return { ok: false, error: "Change description is too long (max 2000 chars)" };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMsg = `Current content:
${JSON.stringify(current, null, 2)}

Owner's change request:
${changeDescription.trim()}

Return the updated JSON now.`;

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    });

    const block = res.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return { ok: false, error: "Empty model response" };
    }
    let text = block.text.trim();
    // Strip markdown fences if Claude slipped them in.
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: `Model returned non-JSON: ${(e as Error).message}` };
    }
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: "Model returned non-object" };
    }
    const obj = parsed as Record<string, unknown>;

    if (typeof obj.refusal === "string" && obj.refusal.length > 0) {
      return { ok: false, error: obj.refusal };
    }

    const next: SiteContent = {
      headline:
        typeof obj.headline === "string"
          ? obj.headline.slice(0, 200)
          : current.headline ?? null,
      subheadline:
        typeof obj.subheadline === "string"
          ? obj.subheadline.slice(0, 400)
          : current.subheadline ?? null,
      services: Array.isArray(obj.services)
        ? (obj.services as Array<Record<string, unknown>>)
            .slice(0, 8)
            .map((s) => ({
              title: typeof s.title === "string" ? s.title.slice(0, 100) : "",
              description:
                typeof s.description === "string"
                  ? s.description.slice(0, 200)
                  : "",
            }))
            .filter((s) => s.title && s.description)
        : current.services ?? null,
      reviews: Array.isArray(obj.reviews)
        ? (obj.reviews as Array<Record<string, unknown>>)
            .slice(0, 6)
            .map((r) => ({
              author: typeof r.author === "string" ? r.author.slice(0, 80) : "",
              quote: typeof r.quote === "string" ? r.quote.slice(0, 280) : "",
              rating: typeof r.rating === "number" ? r.rating : undefined,
            }))
            .filter((r) => r.author && r.quote)
        : current.reviews ?? null,
      about_text:
        typeof obj.about_text === "string"
          ? obj.about_text.slice(0, 600)
          : current.about_text ?? null,
    };

    return { ok: true, newContent: next };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
