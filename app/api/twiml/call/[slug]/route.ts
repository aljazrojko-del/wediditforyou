import { createClient } from "@supabase/supabase-js";

// SignalWire calls this URL when the recipient picks up. We return TwiML
// XML that tells SignalWire what to say. The slug identifies which lead is
// being called, so we can personalize the script with their business name.
//
// Example: https://wedidit4you.com/api/twiml/call/aaron-mobile-mechanic-houston-tx
//
// For voicemail-friendly + short, we use a single <Say>. For more advanced
// flows (press 1 to talk to Alex, leave a voicemail, etc.), extend with
// <Gather>, <Record>, <Dial>.

type LeadRow = {
  name: string;
  city: string;
  site_url: string | null;
};

async function loadLead(slug: string): Promise<LeadRow | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("leads")
    .select("name, city, site_url")
    .eq("slug", slug)
    .maybeSingle<LeadRow>();
  return data ?? null;
}

function buildTwiml(name: string, siteUrl: string | null): string {
  // Read the URL out loud slowly so the recipient can write it down.
  const urlSpoken = siteUrl
    ? siteUrl.replace("https://", "").replace("http://", "")
    : "wedidit4you dot com";

  const message = [
    `Hi, this is Alex from We Did It For You.`,
    `Quick reason for the call.`,
    `I noticed ${name} does not have a website yet,`,
    `so I built you a free preview.`,
    `Take a look at: ${urlSpoken}`,
    `If you like it, we can hop on a quick call to lock it in.`,
    `No pressure. I will text you the link too.`,
    `Talk soon.`,
  ].join(" ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${message}</Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const lead = await loadLead(slug);
  const name = lead?.name ?? "your business";
  const url = lead?.site_url ?? null;
  const twiml = buildTwiml(name, url);

  return new Response(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

// SignalWire actually POSTs by default. Mirror GET so both methods work.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  return GET(req, ctx);
}
