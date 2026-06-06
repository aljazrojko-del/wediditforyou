// SignalWire calls this endpoint when someone dials one of our numbers.
// We return TwiML that forwards the call to Alex's personal phone.
//
// Query params:
//   to     — override the forward destination (defaults to env var)
//   greet  — if "1", play a short greeting before connecting (anti-spam filter)

const FORWARD_TO_DEFAULT = process.env.INBOUND_FORWARD_TO ?? "+38640878551";

function buildTwiml(forwardTo: string, greet: boolean): string {
  const greeting = greet
    ? `<Say voice="alice">Hi, you have reached We Did It For You. Connecting you now.</Say>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${greeting}
  <Dial callerId="" timeout="25" answerOnBridge="true">
    <Number>${forwardTo}</Number>
  </Dial>
  <Say voice="alice">Sorry, we missed your call. Please try again or text this number. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

function handle(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") ?? FORWARD_TO_DEFAULT;
  const greet = url.searchParams.get("greet") === "1";

  return new Response(buildTwiml(to, greet), {
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
