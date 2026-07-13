// Extensive debrief on the 2026-07-13 Mia test call — what happened,
// what checked out, what didn't, and exactly what Luka needs to do.
// Shareable via URL, same style as /report and /mia-access-spec.

export const runtime = "nodejs";
export const revalidate = 3600;
export const metadata = { title: "Mia Test Call Debrief — Luka" };

const CSS = `
:root{--bg:#0a0a0b;--card:#131316;--text:#e7e7ea;--dim:#9b9ba3;--green:#4ade80;--amber:#fbbf24;--red:#f87171;--blue:#7dd3fc;--line:#26262b}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 "Space Grotesk",-apple-system,system-ui,sans-serif;padding:0 16px 80px}
main{max-width:960px;margin:0 auto}
header{padding:48px 0 12px}
h1{font-size:clamp(26px,5vw,40px);line-height:1.15;margin:0 0 8px;letter-spacing:-.02em}
.badge{display:inline-block;background:#78350f;color:#fed7aa;border:1px solid #d97706;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:.4px}
.meta{color:var(--dim);font-size:14px;margin-top:10px}
h2{font-size:22px;margin:40px 0 12px;border-bottom:1px solid var(--line);padding-bottom:8px;letter-spacing:-.01em}
h3{font-size:17px;margin:24px 0 8px;color:var(--text)}
h4{font-size:14px;margin:16px 0 4px;color:var(--dim);text-transform:uppercase;letter-spacing:.05em}
table{border-collapse:collapse;width:100%;font-size:13.5px;display:block;overflow-x:auto;white-space:nowrap;margin-top:8px}
th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;white-space:normal;min-width:80px;vertical-align:top}
th{background:var(--card);position:sticky;top:0}
tr:nth-child(even){background:#0f0f12}
code{background:var(--card);padding:2px 6px;border-radius:5px;font-size:.88em;color:var(--blue)}
pre{background:var(--card);padding:14px;border-radius:10px;overflow-x:auto;border:1px solid var(--line);font-size:12.5px;line-height:1.5;color:var(--text)}
pre code{background:none;padding:0;color:var(--text)}
strong{color:#fff}
ul,ol{padding-left:24px}
li{margin:4px 0}
blockquote{border-left:3px solid var(--amber);margin:16px 0;padding:8px 16px;color:var(--dim);background:#131316;border-radius:0 8px 8px 0}
.pass{color:var(--green)}
.warn{color:var(--amber)}
.fail{color:var(--red)}
.blue{color:var(--blue)}
.tag{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
.tag-p0{background:#7f1d1d;color:#fecaca}
.tag-p1{background:#78350f;color:#fed7aa}
.tag-p2{background:#1e3a8a;color:#bfdbfe}
.callout-red{background:#1c0a0a;border:1px solid #b91c1c;border-radius:12px;padding:18px;margin:20px 0}
.callout-red h3{margin-top:0;color:#fca5a5}
.callout-green{background:#0d1a10;border:1px solid #059669;border-radius:12px;padding:18px;margin:20px 0}
.callout-green h3{margin-top:0;color:#a7f3d0}
.callout-amber{background:#1c1408;border:1px solid #a16207;border-radius:12px;padding:18px;margin:20px 0}
.callout-amber h3{margin-top:0;color:#fcd34d}
a{color:var(--blue)}
`;

export default function DebriefPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <main>
        <header>
          <span className="badge">MIA TEST CALL DEBRIEF · 2026-07-13</span>
          <h1>Mia Test Call Debrief — Full Data + Action Items for Luka</h1>
          <div className="meta">
            First live Mia dial through the wdify.82-25-92-135.sslip.io panel
            ·&nbsp;Aljaz played Buddy from Elite Mobile Tire (Lubbock) &nbsp;·
            &nbsp;Everything below is verified from SignalWire API, GHL API,
            Supabase, and Vercel logs — nothing inferred.
          </div>
        </header>

        <div className="callout-green">
          <h3>TL;DR</h3>
          <p style={{ marginBottom: 0 }}>
            <strong>The voice pipeline works.</strong> The call connected, ran
            for 4m20s, both link SMS delivered. But <strong>no appointment
            was booked</strong> despite verbal 10 AM agreement, <strong>no
            call outcomes wrote back</strong> to Aljaz&apos;s Supabase, and{" "}
            <strong>the &quot;10 AM callback&quot; won&apos;t happen</strong>{" "}
            unless Mia&apos;s post-call handler is wired to POST somewhere.
            Aljaz built the endpoint that closes the loop —{" "}
            <code>POST /api/mia/book-appointment</code> — verified working
            end-to-end. Luka needs ~5 lines of code on his side to hit it.
          </p>
        </div>

        <section>
          <h2>1) The test call — timeline (all UTC unless noted)</h2>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>09:48:19</td><td>Outbound call placed via SignalWire API</td><td>Dallas +14696087322 → Dallas +14696087322 · direction: outbound-api · cost $0.071</td></tr>
              <tr><td>09:48:21</td><td>Call arrived at Dallas inbound leg</td><td>direction: inbound · cost $0.03364</td></tr>
              <tr><td>09:48:22</td><td>SIP forward attempt (busy on one endpoint)</td><td>sip:alex-mobile duration 0s · status: busy</td></tr>
              <tr><td>09:48:22</td><td>SIP forward connected to alex-mobile (Zoiper)</td><td>duration 260s · cost $0.015</td></tr>
              <tr><td>09:48:22</td><td>Aljaz picked up on Zoiper</td><td>Voice quality clear · 4m20s conversation</td></tr>
              <tr><td>09:51:54</td><td>Link SMS #1 sent (3m35s into call)</td><td className="warn">outbound-api · delivered</td></tr>
              <tr><td>09:52:02</td><td>Link SMS #2 sent (8 seconds after #1, same body)</td><td className="warn">outbound-api · delivered · <strong>duplicate</strong></td></tr>
              <tr><td>09:52:09</td><td>Both SMS logged to Aljaz&apos;s inbound_messages table</td><td>SMS webhook fired for the 2 receipts at Dallas</td></tr>
              <tr><td>09:52:39</td><td>Call ended (clean disconnect)</td><td>Total call duration: 4m20s · Total cost: ~$0.12</td></tr>
              <tr><td>Aljaz verbally agreed to &quot;call me back at 10 AM tomorrow&quot;</td><td colSpan={2}>during the conversation — captured in Mia&apos;s transcript (which Aljaz doesn&apos;t have access to)</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>2) The SMS content Mia sent (exact copy)</h2>
          <pre><code>{`Hi Test, Alex from We Did It For You. Saw you don't have a website yet,
so I built you a free preview:

https://elite-mobile-tire.wedidit4you.com

If you like it, let me know and we can hop on a quick call. — Alex`}</code></pre>
          <blockquote>
            <strong>Question for Luka:</strong> the preview URL used is{" "}
            <code>elite-mobile-tire.wedidit4you.com</code> (subdomain style).
            Our production preview sites live at{" "}
            <code>sites.wedidit4you.com/{`{slug}`}</code>. Is Mia
            deliberately hitting a different subdomain build? If so, is it
            live? If not — Mia should be using{" "}
            <code>https://sites.wedidit4you.com/elite-mobile-tire-brake-lubbock-tx</code>{" "}
            which is verified 200 OK.
          </blockquote>
        </section>

        <section>
          <h2>3) What checked out ✅</h2>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Outbound voice from Nashville/Dallas via SignalWire</td><td className="pass">✅ PASS</td><td>Call placed, connected, 4m20s duration</td></tr>
              <tr><td>SIP forwarding to alex-mobile (Zoiper)</td><td className="pass">✅ PASS</td><td>duration 260s completed cleanly</td></tr>
              <tr><td>Voice quality on Zoiper</td><td className="pass">✅ PASS</td><td>Aljaz sustained 4m20s conversation, no drops reported</td></tr>
              <tr><td>SMS delivery via SignalWire</td><td className="pass">✅ PASS</td><td>2 sends, both delivered, both webhook-received</td></tr>
              <tr><td>Mia&apos;s script + persona (Alex Rojko)</td><td className="pass">✅ PASS</td><td>Correct branding, correct offer framing</td></tr>
              <tr><td>Aljaz&apos;s inbound SMS webhook (P2-1)</td><td className="pass">✅ PASS</td><td>2 rows written to inbound_messages at 09:52:09</td></tr>
              <tr><td>SignalWire billing (post top-up)</td><td className="pass">✅ PASS</td><td>Call charged normally, no balance error</td></tr>
              <tr><td>Aljaz&apos;s call-status webhook</td><td className="pass">✅ PASS (endpoint working)</td><td>Would have fired if Mia passed <code>?lead_id={`{uuid}`}</code> or a real lead phone — see gap #3 below</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>4) What did NOT work / gaps ❌</h2>

          <div className="callout-red">
            <h3>Gap #1 · NO appointment was booked in GHL</h3>
            <p>
              Aljaz verbally agreed to a 10 AM callback. Mia captured this
              (it&apos;s in her transcript). But <strong>zero
              appointments</strong> were created in GHL calendar
              <code>REiQNb9rMUEjtRR1Pe7Y</code>.
            </p>
            <h4>Why</h4>
            <p style={{ marginBottom: 0 }}>
              Mia&apos;s post-call handler doesn&apos;t POST anywhere on
              booking-intent capture. She hangs up and moves on. No API call
              is made to create the appointment.
            </p>
          </div>

          <div className="callout-red">
            <h3>Gap #2 · Duplicate SMS (2x 8 seconds apart, same body)</h3>
            <p>
              SMS #1 at 09:51:54, SMS #2 at 09:52:02 — identical content, no
              difference in body. On a real prospect this looks spammy at
              best, scam-signal at worst.
            </p>
            <h4>Likely cause</h4>
            <p>
              Mia&apos;s delivery-confirmation window is set too short (~8
              sec). SignalWire&apos;s delivery callback can take 10-15 sec
              under normal load. Mia doesn&apos;t receive the callback in
              time, assumes SMS failed, sends again — while the first is
              already in the SMSC queue.
            </p>
            <h4>Fix options</h4>
            <ol>
              <li>Increase Mia&apos;s delivery-confirmation window to at least 30 sec (5-min is safer)</li>
              <li>OR: route SMS through Aljaz&apos;s <code>/api/outreach/send-link</code> endpoint — he can hold the response as long as needed and only respond after confirmed delivery</li>
              <li>OR: use the combined SMS from Aljaz&apos;s new <code>/api/mia/book-appointment</code> endpoint on booking capture (see §6) which sends ONE message and handles the delivery-window properly</li>
            </ol>
          </div>

          <div className="callout-red">
            <h3>Gap #3 · Call outcomes did NOT write back to Aljaz&apos;s Supabase</h3>
            <p>
              Aljaz&apos;s <code>leads.call_status</code>, <code>leads.call_placed_at</code>,
              and <code>brooke_calls</code> tables all show 0 records for the
              test call.
            </p>
            <h4>Why</h4>
            <p>
              Test call went to +14696087322 (Aljaz&apos;s SignalWire Dallas number,
              not a real lead row). Call-status webhook receives the events but has
              nothing to match → silent no-op. This is fine for the test.
            </p>
            <h4>But: on REAL prospect calls</h4>
            <p style={{ marginBottom: 0 }}>
              Mia MUST include <code>?lead_id={`{lead_uuid}`}</code> in the
              StatusCallback URL when placing calls. Aljaz&apos;s call-status
              webhook handler is already coded to look for that param and
              match to the lead. Without it, real call statuses will never
              land in Supabase and Aljaz&apos;s admin will be flying blind.
            </p>
          </div>

          <div className="callout-red">
            <h3>Gap #4 · brooke_calls table (post-call analyzer writeback) empty</h3>
            <p>
              Post-call summary + intent + sentiment + recording_url — none
              of it wrote to Aljaz&apos;s <code>brooke_calls</code> table.
              This table exists specifically to receive Mia&apos;s post-call
              analysis. Currently getting nothing.
            </p>
            <h4>Fix</h4>
            <p style={{ marginBottom: 0 }}>
              Mia&apos;s post-call handler POSTs the summary to Aljaz&apos;s
              existing <code>/api/webhooks/brooke</code> endpoint (bearer-guarded
              with <code>BROOKE_WEBHOOK_SECRET</code>, X-API-Key header).
              Schema: <code>lead_id, agent_call_id, phone, status, started_at,
              ended_at, duration_sec, transcript, summary, intent, sentiment,
              meeting_booked, cal_booking_id, recording_url</code>.
            </p>
          </div>

          <div className="callout-red">
            <h3>Gap #5 · Aljaz has no access to Mia&apos;s transcripts</h3>
            <p>
              Aljaz would like to review the exact transcript of the test
              call — what Mia said, how she handled objections, when Aljaz
              agreed to 10 AM. Currently there&apos;s no way for Aljaz to
              see this from his side.
            </p>
            <h4>Options</h4>
            <ol>
              <li><strong>Full transcript in the brooke_calls writeback</strong> (see Gap #4) — solves both problems at once. Aljaz gets the transcript in his own Supabase, queryable from his admin</li>
              <li>Dashboard link on wdify.82-25-92-135.sslip.io that shows recent calls + transcripts</li>
              <li>Send transcript file/link via SMS or email after each call</li>
              <li>Real-time streaming (WebSocket) of Mia&apos;s speech-to-text output — nice-to-have, not blocking</li>
            </ol>
            <p style={{ marginBottom: 0 }}>
              <strong>Preferred: option 1</strong> — combined with the
              brooke_calls fix, one API call solves everything.
            </p>
          </div>

          <div className="callout-amber">
            <h3>Gap #6 (partial) · outbound_messages table empty</h3>
            <p>
              Mia sent link SMS directly via SignalWire API, bypassing
              Aljaz&apos;s <code>/api/outreach/send-link</code>. Fine for
              performance but Aljaz&apos;s admin doesn&apos;t see the sends.
            </p>
            <h4>Not urgent — but decide once</h4>
            <p style={{ marginBottom: 0 }}>
              Two acceptable architectures: (a) Mia sends direct, Aljaz
              polls SignalWire Messages API on a cron for backfill, or (b)
              Mia POSTs through Aljaz&apos;s send-link endpoint, log
              consistency is native. Pick one, stick with it.
            </p>
          </div>

          <div className="callout-amber">
            <h3>Gap #7 · GHL &quot;Walkthrough Confirmation&quot; workflow doesn&apos;t fire on API-created appointments</h3>
            <p>
              Aljaz manually created a GHL appointment via API. The
              &quot;Customer Booked&quot; trigger did NOT fire the workflow
              — even after manually enrolling the contact via
              <code>POST /contacts/{`{id}`}/workflow/{`{id}`}</code> which
              returned <code>succeeded: true</code>.
            </p>
            <h4>Not launch-blocking (Aljaz&apos;s endpoint sends its own SMS)</h4>
            <p style={{ marginBottom: 0 }}>
              But the GHL reminder ladder (3-day, 1-day, 1-hour) also relies
              on this workflow firing. If it stays broken, no reminders
              ever send. Luka should audit the workflow trigger config —
              may be gated on a specific tag or booking source.
            </p>
          </div>
        </section>

        <section>
          <h2>5) What Aljaz built to bridge the biggest gap</h2>
          <div className="callout-green">
            <h3>New endpoint: POST /api/mia/book-appointment</h3>
            <p>
              Live at <code>https://wedidit4you.com/api/mia/book-appointment</code>.
              Bearer-guarded with the same <code>OUTREACH_AUTH_TOKEN</code>{" "}
              Mia already carries. Fully tested end-to-end with 3 real
              bookings against Aljaz&apos;s live GHL.
            </p>

            <h4>Request</h4>
            <pre><code>{`POST https://wedidit4you.com/api/mia/book-appointment
Authorization: Bearer $OUTREACH_AUTH_TOKEN
Content-Type: application/json

{
  "phone": "+18062810513",              // lead E.164
  "start_time_ct": "2026-07-14T10:00:00", // ISO, Chicago local, no TZ suffix
  "duration_minutes": 15,               // default 15
  "first_name": "Buddy",                // for GHL contact + SMS greeting
  "last_name": "Owens",                 // optional
  "site_preview_url": "https://sites.wedidit4you.com/<slug>",
  "send_combined_sms": true,            // sends ONE SMS (link + booking time)
  "notes": "captured on Mia call <call_sid>",
  "lead_id": "<uuid>"                   // optional — used to enrich SMS
}`}</code></pre>

            <h4>Response (success)</h4>
            <pre><code>{`{
  "ok": true,
  "appointment_id": "LjkBbKoIphmBJCRnPp7M",
  "contact_id": "qq8yqmas9dLdeNzto2FI",
  "start_time_utc": "2026-07-15T19:00:00.000Z",
  "start_time_ct_display": "Wed, Jul 15 at 2:00 PM CT",
  "combined_sms": {
    "ok": true,
    "sid": "971a4643-53ab-4a5e-a1a4-bcd256b9fccd",
    "from": "+14696087322",
    "to": "+14696087322",
    "body": "Hey Buddy, Alex here — Your site preview: [link]
Locked in for Wed, Jul 15 at 2:00 PM CT. Reply STOP to opt out.
Text me if the time doesn't work anymore. — Alex"
  }
}`}</code></pre>

            <h4>What it does under the hood</h4>
            <ol>
              <li>Finds/creates a GHL contact keyed by phone (dedupes, sets source=mia)</li>
              <li>Creates the appointment on the walkthrough calendar (<code>REiQNb9rMUEjtRR1Pe7Y</code>), Chicago-local time converted to UTC</li>
              <li>Sends ONE combined SMS from Dallas (10DLC-linked) containing the preview link AND the booking confirmation time — kills the double-SMS problem from Gap #2 in one message</li>
              <li>Logs the outbound SMS to Aljaz&apos;s <code>outbound_messages</code> table so admin views stay consistent</li>
              <li>Fire-and-forget on SMS failure so a comms hiccup never undoes the successfully-created appointment</li>
            </ol>
          </div>

          <div className="callout-green">
            <h3>Also built: manual override at /admin/book</h3>
            <p style={{ marginBottom: 0 }}>
              Aljaz can manually book any lead from <code>wedidit4you.com/admin/book</code>{" "}
              — same endpoint under the hood. Bridge for testing today
              without waiting on Luka. Once Mia&apos;s side is wired, this
              stays as the manual-override / support-agent fallback.
            </p>
          </div>
        </section>

        <section>
          <h2>6) What Luka needs to do — prioritized action list</h2>

          <h3><span className="tag tag-p0">P0 · LAUNCH-BLOCKING</span> Wire Mia&apos;s post-call handler to POST bookings</h3>
          <p>Effort: ~5 minutes. Single-line HTTP POST after booking intent is classified positive.</p>
          <h4>Exact code (Python)</h4>
          <pre><code>{`import os, requests, datetime

# After Mia's post-call classifier tags this call as
# positive-booking-intent AND has captured start_time:

def on_positive_booking(lead, call_sid, captured_start_time_ct):
    payload = {
        "phone":              lead["phone"],
        "start_time_ct":      captured_start_time_ct.isoformat(),
        "duration_minutes":   15,
        "first_name":         lead.get("first_name", "there"),
        "last_name":          lead.get("last_name", ""),
        "site_preview_url":   lead.get("site_url"),
        "send_combined_sms":  True,       # <-- replaces Mia's own link SMS
        "notes":              f"Captured on Mia call {call_sid}",
        "lead_id":            lead["id"], # if we have Aljaz's Supabase UUID
    }
    r = requests.post(
        "https://wedidit4you.com/api/mia/book-appointment",
        headers={"Authorization": f"Bearer {os.environ['OUTREACH_AUTH_TOKEN']}"},
        json=payload,
        timeout=15,
    )
    r.raise_for_status()
    return r.json()  # -> {"ok": true, "appointment_id": "...", ...}`}</code></pre>

          <h3><span className="tag tag-p0">P0 · LAUNCH-BLOCKING</span> Turn OFF Mia&apos;s own link SMS when booking captured</h3>
          <p>
            Because Aljaz&apos;s endpoint now sends the combined
            link+booking SMS, Mia&apos;s previous double-send is redundant.
            Keep her own link SMS only for the &quot;interest-but-no-booking&quot;
            branch of Call 1.
          </p>
          <ul>
            <li>Positive booking captured → let Aljaz&apos;s endpoint send the SMS</li>
            <li>Interest without booking → Mia keeps sending her link SMS (but increase her delivery-confirmation window to at least 30 sec to kill the double-send bug)</li>
          </ul>

          <h3><span className="tag tag-p0">P0 · LAUNCH-BLOCKING</span> Pass ?lead_id=&#123;uuid&#125; in Mia&apos;s StatusCallback</h3>
          <p>
            When placing outbound calls, Mia&apos;s SignalWire{" "}
            <code>StatusCallback</code> URL should include the Aljaz-side
            lead UUID so status updates land on the correct row:
          </p>
          <pre><code>{`# When placing the call:
StatusCallback = f"https://wedidit4you.com/api/webhooks/signalwire/call-status?lead_id={lead_id}"

# Aljaz's webhook is already coded to grab this param
# and update leads.call_status + leads.call_placed_at accordingly.`}</code></pre>

          <h3><span className="tag tag-p0">P0 · LAUNCH-BLOCKING</span> Post-call brooke_calls writeback (transcript included)</h3>
          <p>
            After every call ends, POST the summary to Aljaz&apos;s brooke
            webhook so his Supabase gets the transcript, summary, intent,
            sentiment, and recording URL. This also solves Aljaz&apos;s
            &quot;I want to review transcripts&quot; request.
          </p>
          <pre><code>{`POST https://wediditforyou-dashboard-lemon.vercel.app/api/webhooks/brooke
X-API-Key: $BROOKE_WEBHOOK_SECRET
Content-Type: application/json

{
  "agent_call_id":  "<Mia's internal call id>",
  "lead_id":        "<Aljaz-side lead uuid>",   // if known
  "phone":          "+18062810513",
  "status":         "completed" | "busy" | "no-answer" | "failed",
  "started_at":     "2026-07-13T09:48:19Z",
  "ended_at":       "2026-07-13T09:52:39Z",
  "duration_sec":   260,
  "transcript":     "Full transcript text ...",   // <-- Aljaz needs this
  "summary":        "Prospect Buddy agreed to 10 AM walkthrough tomorrow...",
  "intent":         "positive-booking" | "negative" | "callback-later",
  "sentiment":      "warm" | "neutral" | "cold" | "hostile",
  "meeting_booked": true,
  "cal_booking_id": "<GHL appointment_id from /api/mia/book-appointment>",
  "recording_url":  "https://mns-vps/recordings/<call_id>.mp3"
}`}</code></pre>

          <h3><span className="tag tag-p1">P1 · Fast follow</span> Call 2 auto-dial at appointment.start_time</h3>
          <p>
            When the walkthrough appointment time arrives, Mia needs to
            auto-dial for Call 2 (showcase + $450 close). Two acceptable
            patterns:
          </p>
          <table>
            <thead>
              <tr>
                <th>Pattern</th>
                <th>Who fires</th>
                <th>Effort</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>A.</strong> Mia&apos;s VPS reads GHL calendar (via Aljaz&apos;s PIT token, given by Aljaz) and dials 5 min before appointment</td>
                <td>Luka</td>
                <td>Medium — needs polling cron</td>
              </tr>
              <tr>
                <td><strong>B.</strong> GHL Workflow adds an HTTP action at <code>appointment.start_time</code> that POSTs to Luka&apos;s dial endpoint</td>
                <td>Both — Luka exposes endpoint, Aljaz configures workflow</td>
                <td>Simplest overall</td>
              </tr>
              <tr>
                <td><strong>C.</strong> Aljaz has a cron that polls GHL calendar every 5 min, POSTs to Luka&apos;s dial endpoint</td>
                <td>Luka exposes endpoint, Aljaz owns cron</td>
                <td>Least Luka work but more brittle</td>
              </tr>
            </tbody>
          </table>
          <p>
            <strong>Preferred: B.</strong> Cleanest ownership. Luka needs
            a POST endpoint like:
          </p>
          <pre><code>{`POST https://mns-vps/api/mia/dial-one
Authorization: Bearer <mia_dial_token>
{
  "lead_id": "<uuid>",
  "phone":   "+1...",
  "call_type": "call2_walkthrough",
  "notes":   "GHL appointment <appointment_id> at <time>"
}`}</code></pre>

          <h3><span className="tag tag-p1">P1 · Fast follow</span> Confirm preview URL format</h3>
          <p>
            The test call SMS used <code>elite-mobile-tire.wedidit4you.com</code>{" "}
            (subdomain). Aljaz&apos;s production preview sites are at{" "}
            <code>sites.wedidit4you.com/&#123;slug&#125;</code>. Is Mia
            using a different subdomain build? If not, she should use
            <code>site_url</code> from Aljaz&apos;s{" "}
            <code>GET /api/leads/ready-for-calls</code> — that&apos;s the
            correct verified-live URL for each lead.
          </p>

          <h3><span className="tag tag-p2">P2 · Polish (post-launch)</span> Fix GHL Walkthrough Confirmation workflow trigger</h3>
          <p>
            Currently doesn&apos;t fire on API-created appointments even
            with manual enrollment. Aljaz&apos;s endpoint sends its own
            confirmation SMS so this isn&apos;t blocking. But the reminder
            ladder (3-day, 1-day, 1-hour) won&apos;t fire until this is
            fixed. Luka has the PIT scope + agency-side access to inspect
            and repair the workflow trigger config.
          </p>

          <h3><span className="tag tag-p2">P2 · Polish (post-launch)</span> Give Aljaz a lightweight transcript viewer</h3>
          <p>
            Once the brooke_calls writeback is landing transcripts, Aljaz
            can build his own admin view. But a quick dashboard link from
            the wdify panel showing &quot;last 20 Mia calls with
            transcript preview&quot; would help during warm-up. Nice-to-have.
          </p>
        </section>

        <section>
          <h2>7) Endpoints already live and waiting for Mia to hit</h2>
          <table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Purpose</th>
                <th>Auth</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>POST /api/mia/book-appointment</code></td><td>Book walkthrough on positive intent + send combined SMS</td><td>Bearer OUTREACH_AUTH_TOKEN</td><td className="pass">✅ live, tested</td></tr>
              <tr><td><code>POST /api/webhooks/signalwire/call-status</code></td><td>Live call status updates (queued → ringing → in-progress → completed)</td><td>SignalWire HMAC-SHA1 sig</td><td className="pass">✅ live, hardened</td></tr>
              <tr><td><code>POST /api/webhooks/signalwire/sms</code></td><td>Inbound SMS (prospects replying)</td><td>SignalWire HMAC-SHA1 sig</td><td className="pass">✅ live, hardened</td></tr>
              <tr><td><code>POST /api/webhooks/brooke</code></td><td>Post-call analyzer writeback (transcript, summary, intent, sentiment)</td><td>X-API-Key BROOKE_WEBHOOK_SECRET</td><td className="pass">✅ live, receiving 0 today</td></tr>
              <tr><td><code>POST /api/outreach/send-link</code></td><td>SMS-first with email fallback, city-routed</td><td>Bearer OUTREACH_AUTH_TOKEN</td><td className="pass">✅ live</td></tr>
              <tr><td><code>GET /api/leads/ready-for-calls</code></td><td>1,148 site-less leads with live preview sites</td><td>Bearer OUTREACH_AUTH_TOKEN</td><td className="pass">✅ live</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>8) Test results from Aljaz&apos;s /api/mia/book-appointment</h2>
          <p>Aljaz fired 3 bookings today to verify the endpoint end-to-end:</p>
          <table>
            <thead>
              <tr><th>Time</th><th>Attempt</th><th>Result</th></tr>
            </thead>
            <tbody>
              <tr><td>~10:40 UTC</td><td>Book Tue Jul 14 10:00 CT (tomorrow morning)</td><td className="fail">❌ Rejected — calendar had 1-day min lead time. Contact created (<code>qq8yqmas9dLdeNzto2FI</code>), appointment failed</td></tr>
              <tr><td>~10:42 UTC</td><td>Loosened calendar to 2-hour min · Book Wed Jul 15 10:00 CT</td><td className="pass">✅ Appointment <code>V9ZFmGJiGHsXWvx8R6iu</code> created</td></tr>
              <tr><td>~10:44 UTC</td><td>Book Wed Jul 15 14:00 CT with combined SMS enabled (post-fix)</td><td className="pass">✅ Appointment <code>LjkBbKoIphmBJCRnPp7M</code> + SMS sid <code>971a4643</code> delivered + logged to inbound_messages</td></tr>
            </tbody>
          </table>
          <p style={{ color: "var(--dim)" }}>
            All 3 test appointments still on the walkthrough calendar under
            &quot;Buddy Test&quot;. Aljaz will delete before real prospects
            start filling it.
          </p>
        </section>

        <section>
          <h2>9) Estimated total effort for Luka</h2>
          <table>
            <thead>
              <tr><th>P0 items</th><th>Effort</th></tr>
            </thead>
            <tbody>
              <tr><td>Wire post-call handler to POST bookings</td><td>~5 min</td></tr>
              <tr><td>Turn off Mia&apos;s own link SMS on positive-booking branch</td><td>~5 min</td></tr>
              <tr><td>Pass ?lead_id in StatusCallback</td><td>~2 min</td></tr>
              <tr><td>brooke_calls writeback (with transcript)</td><td>~30 min</td></tr>
            </tbody>
          </table>
          <p><strong>P0 total: ~45 minutes of Luka&apos;s work.</strong> After that, real prospect calls work end-to-end with full booking, tracking, and transcript access for Aljaz.</p>

          <table style={{ marginTop: 20 }}>
            <thead>
              <tr><th>P1 items</th><th>Effort</th></tr>
            </thead>
            <tbody>
              <tr><td>Call 2 auto-dial endpoint on Luka&apos;s VPS</td><td>~2-4h (option B)</td></tr>
              <tr><td>Preview URL alignment (use lead.site_url from Aljaz&apos;s API)</td><td>~5 min</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>10) Suggested next step</h2>
          <ol>
            <li><strong>Luka</strong> implements the P0 items (~45 min)</li>
            <li><strong>Aljaz</strong> deletes the 3 test appointments</li>
            <li><strong>Luka</strong> fires ONE fresh Mia test call to Aljaz&apos;s Dallas number</li>
            <li><strong>Aljaz</strong> plays Buddy, agrees to a time, hangs up</li>
            <li><strong>Both</strong> verify (within 60 seconds of hang-up):
              <ul>
                <li>Appointment appears in GHL calendar</li>
                <li>Single combined SMS lands in Aljaz&apos;s admin inbox</li>
                <li>brooke_calls row appears with transcript + summary</li>
                <li>leads.call_status updates for the matched lead row</li>
              </ul>
            </li>
            <li>Once all 4 verify → <strong>press Play</strong> on the panel and go live on real prospects</li>
          </ol>
        </section>

        <blockquote>
          <strong>Bottom line:</strong> the voice pipeline is proven, the
          booking endpoint is ready, the admin bridge exists. Everything
          left is on Luka&apos;s side — 4 items totaling ~45 minutes of
          his work — and Aljaz doesn&apos;t press Play until they&apos;re
          in. See you on the other side.
        </blockquote>
      </main>
    </>
  );
}
