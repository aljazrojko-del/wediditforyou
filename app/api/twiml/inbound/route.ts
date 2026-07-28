// SignalWire hits this on every inbound call.
//
// Routing rules (in order):
//   1. If the caller is a lead Mia recently dialed → fire an outbound Mia
//      callback (fire-and-forget), play a "calling you right back" bridge,
//      and hang up. Prospect gets a real conversation within ~15s.
//   2. Otherwise → forward to Alex's cell (original behavior).
//
// Every inbound call is logged to public.inbound_callbacks. Callbacks from
// Mia-dialed leads also fire a Telegram alert so Alex knows even if the
// outbound retry fails.
//
// Query params (override defaults):
//   to     — force forwarding destination
//   greet  — "1" to play the greeting before forwarding

import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORWARD_TO_DEFAULT = process.env.INBOUND_FORWARD_TO ?? "+38640878551";
const MIA_TEST_CALL_URL =
  process.env.MIA_TEST_CALL_URL ??
  "https://wdify.82-25-92-135.sslip.io/api/test-call";

// If the same number calls us twice in this window, don't double-dial Mia.
const CALLBACK_DEDUP_WINDOW_MIN = 5;

function lastTen(phone: string | null | undefined): string {
  return (phone ?? "").replace(/[^0-9]/g, "").slice(-10);
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function forwardTwiml(forwardTo: string, greet: boolean): string {
  const greeting = greet
    ? `<Say voice="alice">Hi, you have reached We Did It For You. Connecting you now.</Say>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${greeting}
  <Dial callerId="" timeout="25" answerOnBridge="true">
    <Number>${xmlEscape(forwardTo)}</Number>
  </Dial>
  <Say voice="alice">Sorry, we missed your call. Please try again or text this number. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

function callbackBridgeTwiml(firstName: string | null): string {
  const name = (firstName ?? "").trim();
  const opener = name
    ? `Hey ${xmlEscape(name)}! It's Mia — thanks for calling back. Give me one second, I'm calling you right back so we can talk properly.`
    : `Hey! It's Mia — thanks for calling back. Give me one second, I'm calling you right back so we can talk properly.`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${opener}</Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`;
}

async function readParams(req: Request): Promise<Record<string, string>> {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) params[k] = v;

  if (req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") ?? "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        const parsed = new URLSearchParams(text);
        for (const [k, v] of parsed.entries()) params[k] = v;
      } else if (contentType.includes("application/json")) {
        const j = (await req.json()) as Record<string, unknown>;
        for (const [k, v] of Object.entries(j)) {
          if (v != null) params[k] = String(v);
        }
      }
    } catch {
      // If body parsing fails we fall through with query params only.
    }
  }
  return params;
}

// Fire Mia's outbound call in the background — we don't await it in the
// TwiML response because SignalWire is holding the caller on the line and we
// need to hang up fast. Mia will call the prospect within seconds.
async function fireMiaCallback(payload: Record<string, unknown>): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  const token = process.env.OUTREACH_AUTH_TOKEN;
  if (!token) return { ok: false, error: "OUTREACH_AUTH_TOKEN missing" };
  try {
    const resp = await fetch(MIA_TEST_CALL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return {
      ok: resp.ok,
      status: resp.status,
      error: resp.ok ? undefined : (await resp.text()).slice(0, 300),
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function sendTelegramAlert(text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // Telegram failures never block call routing.
  }
}

function firstNameFromBusiness(name: string): string {
  const stripped = name.replace(/['"'']/g, "").trim();
  const first = stripped.split(/\s+/)[0] ?? "";
  return first.replace(/[^A-Za-z]/g, "");
}

async function handle(req: Request): Promise<Response> {
  const params = await readParams(req);
  const overrideTo = params.to ?? null;
  const greet = params.greet === "1";
  const fromPhone = params.From ?? params.from ?? "";
  const toPhone = params.To ?? params.to ?? "";
  const callSid = params.CallSid ?? params.call_sid ?? null;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const targetLast10 = lastTen(fromPhone);

  // Default: forward to Alex.
  let respondWith: "callback" | "forward" = "forward";
  let matchedLead: {
    id: string;
    name: string;
    site_url: string | null;
    city: string | null;
    niche: string | null;
    call_placed_at: string | null;
    owner_first_name: string | null;
  } | null = null;
  let minutesSinceDial: number | null = null;
  let miaResult: { ok: boolean; status?: number; error?: string } | null = null;

  if (supabaseUrl && supabaseKey && targetLast10.length === 10) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Look up caller as a lead (last-10 match, same as SMS/mia-call).
    const { data: leadRows } = await supabase
      .from("leads")
      .select(
        "id,name,phone,site_url,city,niche,call_placed_at,owner_first_name",
      )
      .not("phone", "is", null)
      .limit(2000);

    if (leadRows) {
      matchedLead =
        (leadRows as Array<{
          id: string;
          name: string;
          phone: string | null;
          site_url: string | null;
          city: string | null;
          niche: string | null;
          call_placed_at: string | null;
          owner_first_name: string | null;
        }>).find(
          (r) => r.phone && lastTen(r.phone) === targetLast10,
        ) ?? null;
    }

    // Dedup: skip Mia auto-callback if we've already fired one for this
    // number in the last 5 minutes.
    const dedupSince = new Date(
      Date.now() - CALLBACK_DEDUP_WINDOW_MIN * 60_000,
    ).toISOString();
    const { data: recentCbs } = await supabase
      .from("inbound_callbacks")
      .select("id,routed_to,created_at")
      .eq("from_phone", fromPhone)
      .gt("created_at", dedupSince)
      .order("created_at", { ascending: false })
      .limit(1);
    const recentlyFiredMia =
      recentCbs?.some((c) => c.routed_to === "mia_callback") ?? false;

    if (
      matchedLead &&
      matchedLead.call_placed_at &&
      !recentlyFiredMia
    ) {
      const dialedAt = new Date(matchedLead.call_placed_at).getTime();
      minutesSinceDial = Math.round((Date.now() - dialedAt) / 60_000);

      const firstName =
        matchedLead.owner_first_name ??
        firstNameFromBusiness(matchedLead.name);

      const payload = {
        phone: fromPhone,
        name: firstName || "there",
        company: matchedLead.name,
        lead_id: matchedLead.id,
        site_url: matchedLead.site_url ?? "",
        stage: "specbuild",
      };

      // Fire the outbound callback — this call takes ~200-500ms.
      miaResult = await fireMiaCallback(payload);
      respondWith = miaResult.ok ? "callback" : "forward";

      // Ping Alex on Telegram (fire-and-forget — don't block TwiML).
      void sendTelegramAlert(
        `🔥 *Callback from Mia-dialed lead*\n` +
          `${matchedLead.name}\n` +
          `${fromPhone}\n` +
          `${matchedLead.city ?? ""}${matchedLead.niche ? ` · ${matchedLead.niche}` : ""}\n` +
          `Called ${minutesSinceDial}m ago.\n` +
          (miaResult.ok
            ? `Mia is dialing them back now.`
            : `⚠️ Mia dial failed: ${miaResult.error ?? "unknown"}. Forwarding to you.`),
      );
    }

    // Log the inbound event whatever we did with it.
    await supabase.from("inbound_callbacks").insert({
      from_phone: fromPhone,
      to_phone: toPhone,
      call_sid: callSid,
      lead_id: matchedLead?.id ?? null,
      was_dialed_by_mia: Boolean(matchedLead?.call_placed_at),
      minutes_since_dial: minutesSinceDial,
      routed_to:
        respondWith === "callback"
          ? "mia_callback"
          : matchedLead
            ? "forward_to_alex_matched"
            : "forward_to_alex_unmatched",
      mia_status: miaResult
        ? miaResult.ok
          ? "queued"
          : "failed"
        : null,
      mia_error: miaResult?.error ?? null,
      raw: params,
    });
  }

  const forwardTo = overrideTo ?? FORWARD_TO_DEFAULT;
  const twiml =
    respondWith === "callback"
      ? callbackBridgeTwiml(matchedLead?.owner_first_name ?? null)
      : forwardTwiml(forwardTo, greet);

  return new Response(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
