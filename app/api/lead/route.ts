import { NextResponse } from "next/server";

type LeadPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  businessName?: unknown;
  niche?: unknown;
  location?: unknown;
  onlineLink?: unknown;
  stylePreference?: unknown;
  notes?: unknown;
  logoUrl?: unknown;
  photoUrls?: unknown;
  smsConsent?: unknown;
  smsConsentAt?: unknown;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

export async function POST(req: Request) {
  let body: LeadPayload;
  try {
    body = (await req.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fields = {
    name: str(body.name),
    email: str(body.email),
    phone: str(body.phone),
    businessName: str(body.businessName),
    niche: str(body.niche),
    location: str(body.location),
    onlineLink: str(body.onlineLink),
    stylePreference: str(body.stylePreference),
    notes: str(body.notes),
    logoUrl: str(body.logoUrl),
    photoUrls: strArray(body.photoUrls),
    smsConsent: body.smsConsent === true,
    smsConsentAt: typeof body.smsConsentAt === "string" ? body.smsConsentAt : null,
  };

  // SMS consent is required by the carrier for any phone-based follow-up.
  // Block submissions that ticked the box client-side but were tampered with.
  if (!fields.smsConsent) {
    return NextResponse.json(
      {
        error:
          "Please confirm SMS consent so we can text you the preview URL.",
      },
      { status: 400 },
    );
  }

  const required: Array<"name" | "email" | "phone" | "businessName" | "niche" | "location"> = [
    "name",
    "email",
    "phone",
    "businessName",
    "niche",
    "location",
  ];
  const missing = required.filter((k) => !fields[k]);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `Please fill in: ${missing.join(", ")}.`,
        missing,
      },
      { status: 400 },
    );
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email);
  if (!emailOk) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  const lead = {
    ...fields,
    receivedAt: new Date().toISOString(),
    userAgent: req.headers.get("user-agent") ?? null,
  };

  console.log("[lead]", JSON.stringify(lead));

  // Forward to GoHighLevel custom webhook (the agency's CRM).
  // Lead enters the email cadence + Brooke can pick up follow-up.
  // Per wdify-ops-client.ts comment, the dashboard is NOT a lead-intake
  // surface — it's the content engine. Leads go to GHL.
  const forwards: Array<{ target: string; status: number | "error" }> = [];

  const ghlUrl = process.env.GHL_WEBHOOK_URL;
  if (ghlUrl) {
    try {
      const ghlRes = await fetch(ghlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lead,
          source: "wediditforyou-landing",
          tags: ["inbound", "landing-form", lead.niche]
            .filter(Boolean)
            .map(String),
        }),
      });
      forwards.push({ target: "ghl", status: ghlRes.status });
    } catch (err) {
      console.warn("[lead] GHL forward failed:", err);
      forwards.push({ target: "ghl", status: "error" });
    }
  } else {
    console.warn(
      "[lead] GHL_WEBHOOK_URL not set — lead captured but not pushed.",
    );
  }

  return NextResponse.json({ ok: true, forwards });
}
