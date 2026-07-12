// Spec doc for Luka / MyNewStaff.ai: what Aljaz needs from his side
// to operate Mia (start/stop campaigns, trigger single calls, monitor state).
//
// Lives at https://wedidit4you.com/mia-access-spec so it's shareable
// via URL. Same styling as /report (companion page).

export const runtime = "nodejs";
export const revalidate = 3600;
export const metadata = { title: "Mia Operator Access — Spec for Luka" };

const CSS = `
:root{--bg:#0a0a0b;--card:#131316;--text:#e7e7ea;--dim:#9b9ba3;--green:#4ade80;--amber:#fbbf24;--red:#f87171;--blue:#7dd3fc;--line:#26262b}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 "Space Grotesk",-apple-system,system-ui,sans-serif;padding:0 16px 80px}
main{max-width:920px;margin:0 auto}
header{padding:48px 0 12px}
h1{font-size:clamp(26px,5vw,40px);line-height:1.15;margin:0 0 8px;letter-spacing:-.02em}
.badge{display:inline-block;background:#1e3a8a;color:#bfdbfe;border:1px solid #3b82f6;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:.4px}
.meta{color:var(--dim);font-size:14px;margin-top:10px}
h2{font-size:21px;margin:38px 0 12px;border-bottom:1px solid var(--line);padding-bottom:8px;letter-spacing:-.01em}
h3{font-size:17px;margin:24px 0 8px;color:var(--text)}
h4{font-size:15px;margin:20px 0 6px;color:var(--dim);text-transform:uppercase;letter-spacing:.05em}
table{border-collapse:collapse;width:100%;font-size:13.5px;display:block;overflow-x:auto;white-space:nowrap;margin-top:8px}
th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;white-space:normal;min-width:70px;vertical-align:top}
th{background:var(--card);position:sticky;top:0}
tr:nth-child(even){background:#0f0f12}
code{background:var(--card);padding:2px 6px;border-radius:5px;font-size:.88em;color:var(--blue)}
pre{background:var(--card);padding:14px;border-radius:10px;overflow-x:auto;border:1px solid var(--line);font-size:13px;line-height:1.5}
pre code{background:none;padding:0;color:var(--text)}
strong{color:#fff}
ul,ol{padding-left:24px}
li{margin:4px 0}
blockquote{border-left:3px solid var(--amber);margin:16px 0;padding:8px 16px;color:var(--dim);background:#131316;border-radius:0 8px 8px 0}
.legend{display:flex;gap:14px;flex-wrap:wrap;margin:18px 0 0;font-size:13px;color:var(--dim)}
.legend b{color:var(--text);font-weight:700}
.pass{color:var(--green)}
.warn{color:var(--amber)}
.fail{color:var(--red)}
.blue{color:var(--blue)}
.callout{background:#0d1a10;border:1px solid #059669;border-radius:12px;padding:18px;margin:20px 0}
.callout h2{margin-top:0;border-bottom:none;color:#a7f3d0}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin:12px 0}
.tag{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
.tag-p0{background:#7f1d1d;color:#fecaca}
.tag-p1{background:#78350f;color:#fed7aa}
.tag-p2{background:#1e3a8a;color:#bfdbfe}
a{color:var(--blue)}
`;

export default function MiaAccessSpecPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <main>
        <header>
          <span className="badge">SPEC · MIA OPERATOR ACCESS FOR ALJAZ</span>
          <h1>Mia Operator Access — Spec for Luka</h1>
          <div className="meta">
            What we need on your side (MyNewStaff.ai VPS) so Aljaz can{" "}
            <strong>initiate, pause, resume, and monitor</strong> Mia&apos;s
            dialing directly from his admin dashboard.
          </div>
        </header>

        <section className="callout">
          <h2>The ask in one sentence</h2>
          <p style={{ marginTop: 8 }}>
            Expose 5 bearer-guarded HTTP endpoints on your VPS
            (<code>start</code>, <code>stop</code>, <code>dial-one</code>,
            <code>status</code>, <code>queue</code>) so Aljaz can operate Mia as
            a pilot rather than needing to WhatsApp you every time he wants to
            fire a batch or a one-off call. All call outcomes still write back
            to his existing <code>/api/webhooks/signalwire/call-status</code>{" "}
            endpoint (already tested, hardened, live).
          </p>
        </section>

        <section>
          <h2>1) Why this matters (use cases for Aljaz)</h2>
          <ul>
            <li>
              <strong>Fire the campaign directly</strong> — no more &quot;can you
              start Mia?&quot; roundtrips. Aljaz clicks a button, batch starts.
            </li>
            <li>
              <strong>Emergency stop</strong> — if something goes sideways
              (wrong pool, bad opener, quota issue), Aljaz can pause Mia in{" "}
              <em>seconds</em>. Currently zero kill-switch on his end.
            </li>
            <li>
              <strong>Hot inbound triggers</strong> — a lead replies to a
              Smartlead email or opts in via SMS → Aljaz dials Mia at them{" "}
              <em>within 30 seconds</em>, hitting them at peak intent instead of
              waiting for the next batch tick.
            </li>
            <li>
              <strong>Dress rehearsals</strong> — Aljaz can trigger 1-2 test
              calls before firing a big batch, verifying voice quality + script
              + link delivery on live prospects at low volume.
            </li>
            <li>
              <strong>VIP re-engagement</strong> — high-value ghosted leads
              deserve manual re-dials with context. Aljaz can do this without
              re-loading the whole batch on your side.
            </li>
            <li>
              <strong>24/7 visibility</strong> — Aljaz&apos;s admin shows Mia&apos;s
              live state (idle / dialing / paused, N calls in flight, queue
              depth). No more &quot;is Mia dialing right now?&quot; questions.
            </li>
          </ul>
          <blockquote>
            <strong>Ownership stays with you.</strong> Mia&apos;s engine, script,
            voice, Gemini Live config, dial cadence, retry logic, transcripts,
            recordings — all remain on your side. Aljaz just gets pilot
            controls + read-only state. He never sees Mia&apos;s internals.
          </blockquote>
        </section>

        <section>
          <h2>2) Proposed endpoints — 5 total</h2>
          <p style={{ color: "var(--dim)" }}>
            Base URL: your VPS domain (e.g., <code>mns-cold-caller.mynewstaff.ai</code>{" "}
            — whatever you already run Mia on). All endpoints require{" "}
            <code>Authorization: Bearer $MIA_OPERATOR_TOKEN</code> — Aljaz stores
            this as a Sensitive env on his Vercel; you generate + rotate.
          </p>

          <h3><span className="tag tag-p0">P0 · MVP</span> POST /api/mia/start</h3>
          <p style={{ marginTop: 6 }}>
            Start the batch campaign. Same as running <code>queue_campaign.py</code>{" "}
            on your VPS today, but exposed as HTTP.
          </p>
          <h4>Request</h4>
          <pre><code>{`{
  "pool": "spec" | "cold",           // which lead pool to pull from
  "limit": 100,                      // optional cap; default = all ready leads
  "niche": "mobile mechanic" | ...,  // optional filter
  "dry_run": false                   // if true, plan only, don't dial
}`}</code></pre>
          <h4>Response</h4>
          <pre><code>{`{
  "ok": true,
  "campaign_id": "cmp_20260712_1430",
  "leads_queued": 174,
  "started_at": "2026-07-12T14:30:12Z"
}`}</code></pre>

          <h3><span className="tag tag-p0">P0 · MVP</span> POST /api/mia/stop</h3>
          <p style={{ marginTop: 6 }}>
            Emergency stop. Halts new dials + lets in-flight calls finish
            gracefully. Returns immediately.
          </p>
          <h4>Response</h4>
          <pre><code>{`{
  "ok": true,
  "campaign_id": "cmp_20260712_1430",
  "state": "stopping",
  "active_calls": 3,       // still on the line, will finish
  "queue_dropped": 47,     // cancelled from the pending list
  "stopped_at": "2026-07-12T14:37:04Z"
}`}</code></pre>

          <h3><span className="tag tag-p0">P0 · MVP</span> POST /api/mia/dial-one</h3>
          <p style={{ marginTop: 6 }}>
            Fire Mia at ONE specific lead immediately, jumping ahead of the
            batch queue. High-priority insert.
          </p>
          <h4>Request</h4>
          <pre><code>{`{
  "lead_id": "uuid",                        // matches leads.id in Aljaz's Supabase
  "phone": "+18062810513",                  // E.164, MUST match lead.phone
  "call_type": "reveal" | "call2" | "test", // script selection
  "from_number": "+14696087322",            // optional; Mia picks geo default
  "notes": "hot lead — replied at 14:32"    // optional; shows in Mia's context
}`}</code></pre>
          <h4>Response</h4>
          <pre><code>{`{
  "ok": true,
  "call_sid": "SW-abc123",
  "queued_at": "2026-07-12T14:32:15Z",
  "estimated_dial_at": "2026-07-12T14:32:20Z"  // ~5 sec typical
}`}</code></pre>

          <h3><span className="tag tag-p1">P1 · Fast follow</span> GET /api/mia/status</h3>
          <p style={{ marginTop: 6 }}>
            Real-time state for the admin dashboard.
          </p>
          <h4>Response</h4>
          <pre><code>{`{
  "state": "idle" | "dialing" | "paused",
  "campaign_id": "cmp_20260712_1430" | null,
  "active_calls": 3,
  "queue_depth": 47,
  "calls_placed_today": 156,
  "calls_connected_today": 42,
  "calls_booked_today": 8,
  "last_call_at": "2026-07-12T14:36:51Z",
  "engine_healthy": true
}`}</code></pre>

          <h3><span className="tag tag-p1">P1 · Fast follow</span> GET /api/mia/queue?limit=20</h3>
          <p style={{ marginTop: 6 }}>
            Peek at what Mia is about to dial. Useful for the admin&apos;s
            &quot;up-next&quot; sidebar.
          </p>
          <h4>Response</h4>
          <pre><code>{`{
  "campaign_id": "cmp_20260712_1430",
  "queue": [
    {
      "lead_id": "uuid",
      "phone": "+18062810513",
      "business_name": "Elite Mobile Tire & Brake",
      "city": "Lubbock, TX",
      "priority": 100,          // higher = sooner
      "call_type": "reveal",
      "estimated_dial_at": "2026-07-12T14:38:12Z"
    },
    ...
  ]
}`}</code></pre>
        </section>

        <section>
          <h2>3) Auth model + security</h2>
          <ul>
            <li>
              <strong>Bearer token:</strong> single{" "}
              <code>MIA_OPERATOR_TOKEN</code> generated on your side, sent to
              Aljaz via WhatsApp/Signal. Aljaz stores it as Sensitive env on
              Vercel. Never in chat, never in git.
            </li>
            <li>
              <strong>Rate limits:</strong> your side enforces max N dials/hour
              (protects against runaway triggers). Suggested:{" "}
              <code>/dial-one</code> = 30/hour, <code>/start</code> = 5/day,{" "}
              <code>/status</code> = 60/min.
            </li>
            <li>
              <strong>IP allowlist (optional):</strong> if you want extra
              paranoia, allowlist Vercel&apos;s outbound IP ranges. Not strictly
              needed since bearer token is enough.
            </li>
            <li>
              <strong>Token rotation:</strong> if the token leaks, you
              regenerate + Aljaz updates his Vercel env in 30 seconds. Zero
              downtime.
            </li>
            <li>
              <strong>Audit log on your side:</strong> log every request that
              hits these endpoints — timestamp, IP, action, lead_id. Aljaz
              doesn&apos;t need to see this, but you might want it for
              debugging.
            </li>
          </ul>
        </section>

        <section>
          <h2>4) What Aljaz builds on his side (~1 day once endpoints exist)</h2>
          <ol>
            <li>
              Add <code>MIA_OPERATOR_TOKEN</code> as Sensitive env on Vercel.
            </li>
            <li>
              Add <code>MIA_VPS_URL</code> as env (your public VPS URL).
            </li>
            <li>
              Build <strong>/admin/mia</strong> route:
              <ul>
                <li>
                  <strong>Header:</strong> Mia state badge (idle · dialing ·
                  paused) + big red STOP button + big blue START button.
                </li>
                <li>
                  <strong>Stats row:</strong> today&apos;s calls placed /
                  connected / booked / paid. Refreshed every 30 sec via{" "}
                  <code>/api/mia/status</code>.
                </li>
                <li>
                  <strong>Live queue:</strong> next 10 leads Mia will dial, with
                  business name + city + estimated time. Polled from{" "}
                  <code>/api/mia/queue</code>.
                </li>
                <li>
                  <strong>Live call feed:</strong> streams from Aljaz&apos;s
                  existing call-status webhook — ringing, in-progress, completed,
                  booked. Real time.
                </li>
              </ul>
            </li>
            <li>
              Add <strong>&quot;Call with Mia&quot;</strong> button on each lead
              row in the existing <code>/admin</code> Leads tab. Confirmation
              modal → POST to <code>/api/mia/dial-one</code>.
            </li>
            <li>
              Add <strong>Telegram alert</strong> when Mia state changes (start,
              stop, error) — reuses existing Telegram bot integration.
            </li>
          </ol>
        </section>

        <section>
          <h2>5) Data flow (end-to-end, once built)</h2>
          <pre><code>{`Aljaz clicks "START" in /admin/mia
    → Aljaz's server: POST https://mia-vps/api/mia/start
       Header: Authorization: Bearer $MIA_OPERATOR_TOKEN
       Body:   { pool: "spec", limit: 100 }
    → Luka's VPS: queue_campaign.py fires
    → Mia dials first lead from geo-matched SignalWire number
    → SignalWire fires call-status webhook to Aljaz's existing
      /api/webhooks/signalwire/call-status?lead_id={uuid}
    → Aljaz's Supabase: leads.call_status updated in real time
    → Aljaz's /admin/mia dashboard: shows live "ringing → in-progress → completed"
    → Mia texts the reveal link via existing /api/outreach/send-link (already wired)
    → Prospect books via GHL calendar (existing, already wired)
    → GHL fires appointment confirmation workflow (already published)
    → Aljaz gets Telegram ping for the booking
    → Alex Rojko does call-2 → $450 close`}</code></pre>
        </section>

        <section>
          <h2>6) Priority + effort estimate</h2>
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Endpoint</th>
                <th>Effort on your side</th>
                <th>Effort on Aljaz&apos;s side</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="tag tag-p0">P0</span></td>
                <td><code>/api/mia/start</code></td>
                <td>2-4h (wrap queue_campaign.py)</td>
                <td>30 min</td>
              </tr>
              <tr>
                <td><span className="tag tag-p0">P0</span></td>
                <td><code>/api/mia/stop</code></td>
                <td>1-2h (signal handler + queue drain)</td>
                <td>10 min</td>
              </tr>
              <tr>
                <td><span className="tag tag-p0">P0</span></td>
                <td><code>/api/mia/dial-one</code></td>
                <td>4-6h (priority insert into queue)</td>
                <td>30 min</td>
              </tr>
              <tr>
                <td><span className="tag tag-p1">P1</span></td>
                <td><code>/api/mia/status</code></td>
                <td>2-3h (metric aggregation)</td>
                <td>1h (dashboard tiles)</td>
              </tr>
              <tr>
                <td><span className="tag tag-p1">P1</span></td>
                <td><code>/api/mia/queue</code></td>
                <td>1-2h (queue read endpoint)</td>
                <td>1h (queue sidebar UI)</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: 12 }}>
            <strong>P0 total on your side: ~1 day.</strong> P1 total: ~half a
            day. Aljaz builds the dashboard side in parallel.
          </p>
        </section>

        <section>
          <h2>7) Optional future additions (not needed for MVP)</h2>
          <ul>
            <li>
              <code>WebSocket /api/mia/events</code> — real-time call events
              streamed to admin instead of polling
            </li>
            <li>
              <code>POST /api/mia/pause</code> / <code>/resume</code> — pause
              new dials without stopping the campaign entirely
            </li>
            <li>
              <code>GET /api/mia/leads/{`{id}`}/history</code> — full call
              history + transcripts for a specific lead
            </li>
            <li>
              <code>GET /api/mia/stats?period=today|week|month</code> — deeper
              analytics (connect rate, book rate, close rate)
            </li>
            <li>
              <code>POST /api/mia/quota</code> — adjust dial quota on the fly
              (raise when funnel is converting, lower for warm-up)
            </li>
          </ul>
        </section>

        <section>
          <h2>8) Timeline suggestion</h2>
          <ol>
            <li>
              <strong>Week 1:</strong> P0 endpoints built + tested on your
              side. Aljaz gets the operator token.
            </li>
            <li>
              <strong>Week 2:</strong> Aljaz&apos;s <code>/admin/mia</code> dashboard
              built + Live queue + Call button on leads.
            </li>
            <li>
              <strong>Week 3+:</strong> P1 endpoints + analytics + optional
              WebSocket real-time.
            </li>
          </ol>
          <p>
            None of this blocks the launch we&apos;re doing right now. Everything
            here is a post-launch upgrade — Aljaz doesn&apos;t need it for the
            first 10 founding-client closes. But once the funnel is proven,
            this operator layer removes the WhatsApp bottleneck and lets Aljaz
            run daily ops without needing you for every button press.
          </p>
        </section>

        <section>
          <h2>9) What&apos;s NOT in scope</h2>
          <ul>
            <li>❌ Access to Mia&apos;s script / opener text / voice config</li>
            <li>❌ Access to Gemini Live transcripts</li>
            <li>❌ Access to Mia&apos;s dial cadence / retry logic</li>
            <li>❌ Ability to modify Mia&apos;s conversation flow</li>
            <li>❌ Raw access to your VPS / SSH / production data</li>
          </ul>
          <p>
            All of the above stays 100% on your side. Aljaz gets{" "}
            <strong>operator controls only</strong> — start / stop / dial /
            monitor. Voice + script + AI stay yours.
          </p>
        </section>

        <blockquote>
          <strong>TL;DR:</strong> 5 bearer-guarded HTTP endpoints on your VPS
          →&nbsp;Aljaz builds a Mia operator dashboard on his side
          →&nbsp;WhatsApp roundtrips for &quot;can you start Mia?&quot; go away.
          Ownership boundary preserved. Not launch-blocking, but the natural
          post-launch upgrade. Total effort: ~1 day yours + ~1 day Aljaz&apos;s,
          split across 2 weeks.
        </blockquote>

        <section>
          <h2>10) Next step</h2>
          <p>
            <strong>Luka:</strong> if this scope makes sense, ping Aljaz and
            propose a start date. If it doesn&apos;t (scope too big, wrong
            architecture, etc.), counter-propose. Either way — no rush,
            post-launch is fine.
          </p>
          <p>
            <strong>Aljaz:</strong> once you get the operator token, drop it as{" "}
            <code>MIA_OPERATOR_TOKEN</code> Sensitive env on Vercel and I&apos;ll
            build the <code>/admin/mia</code> dashboard side.
          </p>
        </section>
      </main>
    </>
  );
}
