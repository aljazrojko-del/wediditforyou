// SignalWire calls this TwiML endpoint when the recipient picks up the echo
// test dial. We speak a short intro then <Record> the caller's voice for up
// to 30 sec. When the recording completes, SignalWire POSTs the recording
// metadata to /api/webhooks/signalwire/recording so we can list + play it
// back in /admin/echo.

// GET handler mirrors POST so SignalWire's default behavior works either way.

function buildTwiml(callbackBase: string): string {
  const recordAction = `${callbackBase}/api/webhooks/signalwire/recording`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">Echo test. After the beep, speak for up to thirty seconds. Press pound when done, or hang up.</Say>
  <Record maxLength="30" playBeep="true" finishOnKey="#" trim="do-not-trim" recordingStatusCallback="${recordAction}" recordingStatusCallbackMethod="POST"/>
  <Say voice="alice" language="en-US">Recording saved. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

export async function GET(_req: Request) {
  const base = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";
  return new Response(buildTwiml(base), {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  return GET(req);
}
