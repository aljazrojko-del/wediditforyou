// Generate 3 logo variations for a customer's business using OpenAI's
// gpt-image-1 model, then upload to Vercel Blob and return public URLs.
//
// Each variation uses a different style prompt so the customer gets meaningful
// choices instead of three near-identical logos.

import { put } from "@vercel/blob";

export type LogoStyle = "minimalist" | "typographic" | "niche-icon";

const STYLES: LogoStyle[] = ["minimalist", "typographic", "niche-icon"];

const NICHE_ICONS: Record<string, string> = {
  "mobile mechanic": "stylized wrench or car-with-wheels icon",
  "mobile dog groomer": "stylized dog silhouette with a brush or scissors",
  "dog groomer": "stylized dog silhouette with a brush or scissors",
  "tutor": "stylized open book with a graduation cap or pencil",
  "plumber": "stylized wrench with water drop",
  "hair salon": "stylized scissors or hair brush",
  "landscape": "stylized leaf or shovel with grass",
};

function nicheIcon(niche: string): string {
  const lower = niche.toLowerCase();
  for (const [key, icon] of Object.entries(NICHE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "a clean abstract geometric icon representing the trade";
}

function buildPrompt(opts: {
  businessName: string;
  niche: string;
  style: LogoStyle;
}): string {
  const { businessName, niche, style } = opts;
  const icon = nicheIcon(niche);

  if (style === "minimalist") {
    return `Modern minimalist logo for "${businessName}", a ${niche} business. Single bold flat icon (${icon}), centered on solid white background, no text, no gradients, no shadows, clean vector style, professional, scalable, suitable for a small business website header. 1:1 aspect ratio.`;
  }
  if (style === "typographic") {
    const initials = businessName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    return `Typographic monogram logo for "${businessName}", a ${niche} business. Bold sans-serif initials "${initials}" inside a rounded square badge, deep navy color on white background, no extra decoration, clean professional look suitable for business signage. 1:1 aspect ratio.`;
  }
  // niche-icon
  return `Distinctive emblem logo for "${businessName}", a ${niche} business. Detailed ${icon} as the centerpiece, warm orange and charcoal color palette, on white background, no text, vintage badge style with subtle decorative border, professional craft-style trade business feel. 1:1 aspect ratio.`;
}

async function generateOneImage(prompt: string): Promise<{ ok: boolean; b64?: string; error?: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: "OPENAI_API_KEY not set" };

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "medium",
      }),
    });
    const data = (await res.json()) as { data?: Array<{ b64_json?: string }>; error?: { message?: string } };
    if (data.error) return { ok: false, error: data.error.message };
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return { ok: false, error: "No image data returned" };
    return { ok: true, b64 };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function uploadToBlob(b64: string, key: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const buf = Buffer.from(b64, "base64");
    const result = await put(key, buf, {
      access: "public",
      contentType: "image/png",
    });
    return { ok: true, url: result.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type GeneratedLogo = {
  style: LogoStyle;
  url: string;
};

export async function generateLogoSet(opts: {
  leadId: string;
  businessName: string;
  niche: string;
}): Promise<{ logos: GeneratedLogo[]; errors: string[] }> {
  const errors: string[] = [];
  const logos: GeneratedLogo[] = [];

  // Sequential not parallel — gpt-image-1 is rate-limited and we want to
  // surface partial success (e.g. 2 of 3 succeed) rather than burst-fail.
  for (const style of STYLES) {
    const prompt = buildPrompt({ businessName: opts.businessName, niche: opts.niche, style });
    const gen = await generateOneImage(prompt);
    if (!gen.ok || !gen.b64) {
      errors.push(`${style}: ${gen.error}`);
      continue;
    }
    const blobKey = `logos/${opts.leadId}/${style}-${Date.now()}.png`;
    const upload = await uploadToBlob(gen.b64, blobKey);
    if (!upload.ok || !upload.url) {
      errors.push(`${style} upload: ${upload.error}`);
      continue;
    }
    logos.push({ style, url: upload.url });
  }

  return { logos, errors };
}
