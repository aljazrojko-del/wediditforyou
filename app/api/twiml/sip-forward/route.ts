// SignalWire hits this route when a number is configured for SIP forwarding.
// Returns TwiML that dials a SIP endpoint registered by Zoiper (or any softphone).
//
// Env:
//   SIP_FORWARD_USERNAME — e.g. "alex"
//   SIP_FORWARD_DOMAIN   — e.g. "yourspace.sip.signalwire.com"
//
// Query params:
//   greet  — if "1", play a short greeting before connecting (anti-spam filter)
//   timeout — seconds to ring before falling through (default 25)

const SIP_USER = process.env.SIP_FORWARD_USERNAME ?? "";
const SIP_DOMAIN = process.env.SIP_FORWARD_DOMAIN ?? "";

function buildTwiml(opts: { greet: boolean; timeoutSec: number }): string {
  const greeting = opts.greet
    ? `<Say voice="alice">Hi, you have reached We Did It For You. Connecting you now.</Say>`
    : "";

  // If env isn't set, fall through to apology — better than dialing a malformed URI
  if (!SIP_USER || !SIP_DOMAIN) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, this line is being set up. Please try again in a moment.</Say>
  <Hangup/>
</Response>`;
  }

  const sipUri = `sip:${SIP_USER}@${SIP_DOMAIN}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${greeting}
  <Dial timeout="${opts.timeoutSec}" answerOnBridge="true">
    <Sip>${sipUri}</Sip>
  </Dial>
  <Say voice="alice">Sorry, we missed your call. Please try again or text this number. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

function handle(req: Request) {
  const url = new URL(req.url);
  const greet = url.searchParams.get("greet") === "1";
  const timeoutParam = url.searchParams.get("timeout");
  const timeoutSec = timeoutParam ? Math.max(5, Math.min(60, Number(timeoutParam) || 25)) : 25;
  const xml = buildTwiml({ greet, timeoutSec });
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export const dynamic = "force-dynamic";
export const GET = handle;
export const POST = handle;
