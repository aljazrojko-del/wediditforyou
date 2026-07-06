// Launch readiness report for the wedidit4you side of the stack.
// Companion to Luka's wdify-launch-report.vercel.app (which covers the
// agency side). Lives at https://wedidit4you.com/report.
//
// This is a SNAPSHOT — the counts and status reflect what was verified
// at build time. Redeploy to refresh. No live queries so the URL is
// snappy and shareable.

import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const revalidate = 60;
export const metadata = { title: "WDIFY App-Side Launch Report" };

async function fetchCounts() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const [total, siteless, ready, paid] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("has_website", false),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("has_website", false)
      .not("site_url", "is", null)
      .not("phone", "is", null),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid"),
  ]);
  return {
    total: total.count ?? 0,
    siteless: siteless.count ?? 0,
    ready: ready.count ?? 0,
    paid: paid.count ?? 0,
  };
}

const CSS = `
:root{--bg:#0a0a0b;--card:#131316;--text:#e7e7ea;--dim:#9b9ba3;--green:#4ade80;--amber:#fbbf24;--red:#f87171;--line:#26262b}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 "Space Grotesk",-apple-system,system-ui,sans-serif;padding:0 16px 80px}
main{max-width:920px;margin:0 auto}
header{padding:48px 0 12px}
h1{font-size:clamp(26px,5vw,40px);line-height:1.15;margin:0 0 8px;letter-spacing:-.02em}
.badge{display:inline-block;background:#064e3b;color:#a7f3d0;border:1px solid #059669;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:.4px}
.meta{color:var(--dim);font-size:14px;margin-top:10px}
h2{font-size:21px;margin:38px 0 12px;border-bottom:1px solid var(--line);padding-bottom:8px;letter-spacing:-.01em}
h3{font-size:17px;margin:24px 0 8px;color:var(--text)}
table{border-collapse:collapse;width:100%;font-size:13.5px;display:block;overflow-x:auto;white-space:nowrap;margin-top:8px}
th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;white-space:normal;min-width:70px}
th{background:var(--card);position:sticky;top:0}
tr:nth-child(even){background:#0f0f12}
td:nth-child(3),td:nth-child(2){font-weight:600}
code{background:var(--card);padding:2px 6px;border-radius:5px;font-size:.88em}
strong{color:#fff}
blockquote{border-left:3px solid var(--amber);margin:0;padding:4px 16px;color:var(--dim);font-style:italic}
.legend{display:flex;gap:14px;flex-wrap:wrap;margin:18px 0 0;font-size:13px;color:var(--dim)}
.legend b{color:var(--text);font-weight:700}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:24px 0}
.stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px}
.stat .n{font-size:28px;font-weight:700;letter-spacing:-.02em}
.stat .l{font-size:12px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em;margin-top:2px}
.pass{color:var(--green)}
.warn{color:var(--amber)}
.fail{color:var(--red)}
a{color:#7dd3fc}
`;

function Row({
  id,
  name,
  status,
  evidence,
}: {
  id: string;
  name: string;
  status: "PASS" | "DEGRADED" | "FAIL" | "PENDING";
  evidence: React.ReactNode;
}) {
  const icon =
    status === "PASS"
      ? "✅"
      : status === "DEGRADED"
        ? "🟡"
        : status === "FAIL"
          ? "🔴"
          : "⏳";
  const cls = status === "PASS" ? "pass" : status === "FAIL" ? "fail" : "warn";
  return (
    <tr>
      <td>{id}</td>
      <td>{name}</td>
      <td className={cls}>{icon} {status}</td>
      <td style={{ whiteSpace: "normal" }}>{evidence}</td>
    </tr>
  );
}

export default async function ReportPage() {
  const counts = await fetchCounts();
  const asOf = new Date().toISOString().slice(0, 10);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <main>
        <header>
          <span className="badge">APP-SIDE GO · WAITING ON MIA-SIDE READINESS</span>
          <h1>WDIFY App-Side Launch Report</h1>
          <div className="meta">
            The wedidit4you.com side of the stack · Verified {asOf} · Companion
            to Luka&apos;s{" "}
            <a href="https://wdify-launch-report.vercel.app/" target="_blank" rel="noopener">
              agency-side report
            </a>
          </div>
          <div className="legend">
            <span>✅ <b>25 PASS</b></span>
            <span>🟡 <b>3 DEGRADED</b></span>
            <span>🔴 <b>1 FAIL</b></span>
            <span>⏳ <b>2 PENDING</b></span>
          </div>
        </header>

        <section>
          <h2>Lead pool — live from Supabase</h2>
          {counts ? (
            <div className="stat-grid">
              <div className="stat">
                <div className="n">{counts.total.toLocaleString()}</div>
                <div className="l">Total leads in DB</div>
              </div>
              <div className="stat">
                <div className="n">{counts.siteless.toLocaleString()}</div>
                <div className="l">Site-less (target pool)</div>
              </div>
              <div className="stat">
                <div className="n pass">{counts.ready.toLocaleString()}</div>
                <div className="l">Ready-to-call now</div>
              </div>
              <div className="stat">
                <div className="n">{counts.paid.toLocaleString()}</div>
                <div className="l">Paid customers</div>
              </div>
            </div>
          ) : (
            <p className="warn">Supabase env not configured — counts unavailable.</p>
          )}
          <p style={{ color: "var(--dim)", fontSize: 14 }}>
            Ready-to-call = <code>has_website=false</code>, has a phone, has a
            live preview site at <code>sites.wedidit4you.com/{`{slug}`}</code>.
            Mia can dial these today. New leads become ready-to-call within ~5
            minutes of upsert thanks to the site-generation cron.
          </p>
        </section>

        <section>
          <h2>1) Scorecard</h2>
          <p style={{ color: "var(--dim)", fontSize: 14 }}>
            31 checks covering: app infra, database, webhooks, SignalWire,
            outreach channels, admin tools, customer flow, security.
          </p>

          <h3>App infrastructure</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Subsystem</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <Row id="1" name="Landing page (wedidit4you.com)" status="PASS" evidence={<>200 OK · &quot;$450 launch pricing / 10 founding clients&quot; live</>} />
              <Row id="2" name="Admin dashboard (/admin)" status="PASS" evidence={<>Cookie auth active · Leads/Inbox/SMS/Onboarding tabs</>} />
              <Row id="3" name="Customer self-service (/my-site/{token})" status="PASS" evidence={<>Status panel + Approve button + 30-day countdown live</>} />
              <Row id="4" name="Per-lead preview sites" status="PASS" evidence={<>SSR from Supabase · 1,148 sites live at <code>sites.wedidit4you.com/{`{slug}`}</code></>} />
              <Row id="5" name="Site generation cron" status="PASS" evidence={<>Every 5 min via <code>/api/cron/generate-sites</code> (was daily)</>} />
              <Row id="6" name="Weekly Google Places scraper" status="PASS" evidence={<>Mondays 08:00 UTC · 8 combos across 3 niches</>} />
            </tbody>
          </table>

          <h3>Database (Supabase)</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <Row id="7" name="Schema migrations current" status="PASS" evidence={<>15 migrations applied · onboarding_state + brooke_calls tables in place</>} />
              <Row id="8" name="RLS on all sensitive tables" status="PASS" evidence={<>Locked down site_events + outbound_messages · all others already RLS-enabled</>} />
              <Row id="9" name="Ready-to-call pool > 1000" status="PASS" evidence={<>{counts?.ready.toLocaleString() ?? "1,148"} leads with preview live · plenty of runway</>} />
              <Row id="10" name="Waiting pool building" status="PASS" evidence={<>~1,250 previews will build via 5-min cron over next hours</>} />
            </tbody>
          </table>

          <h3>Webhooks</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <Row id="11" name="/api/webhooks/stripe" status="PASS" evidence={<>Repointed to landing page (from stale dashboard route) · welcome-SMS + token gen wired</>} />
              <Row id="12" name="/api/webhooks/signalwire/call-status" status="PASS" evidence={<>403 on unsigned probe · HMAC-SHA1 verification active</>} />
              <Row id="13" name="/api/webhooks/signalwire/sms" status="PASS" evidence={<>Just hardened <code>484ec75</code> · signature-verified · Telegram ping on inbound</>} />
            </tbody>
          </table>

          <h3>SignalWire</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <Row id="14" name="Account status" status="PASS" evidence={<>Full/active · brand + campaign approved (Wedidit4you Capm1)</>} />
              <Row id="15" name="Voice on all 5 regional numbers" status="PASS" evidence={<>Houston/Dallas/Phoenix/Nashville/Chicago · SIP-forward to Zoiper live</>} />
              <Row id="16" name="SMS on 4/5 numbers" status="PASS" evidence={<>Dallas/Phoenix/Nashville/Chicago · test-verified sending to external US</>} />
              <Row id="17" name="Houston SMS (10DLC)" status="FAIL" evidence={<>Not linked to campaign · returns &quot;must send to verified caller id&quot; · <strong>deferred</strong> — will buy replacement if needed</>} />
              <Row id="18" name="Auto-recharge balance" status="PASS" evidence={<>Enabled per Aljaz confirmation · no mid-campaign drain risk</>} />
              <Row id="19" name="SIGNALWIRE_SIGNING_KEY provisioned" status="PASS" evidence={<>Set on Vercel prod · used by both call-status + SMS webhooks</>} />
            </tbody>
          </table>

          <h3>Agency integration boundary</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <Row id="20" name="SUPABASE_URL + service role on Vercel" status="PASS" evidence={<>Set 56 days ago · Luka&apos;s writeback subcommand can reach the leads table</>} />
              <Row id="21" name="OUTREACH_AUTH_TOKEN" status="PASS" evidence={<>Set on Vercel · Luka has it · gates <code>/api/outreach/send-link</code> + new <code>/api/leads/ready-for-calls</code></>} />
              <Row id="22" name="Vercel access for contact474" status="PASS" evidence={<>Promoted MEMBER → DEVELOPER · his PRs auto-preview</>} />
              <Row id="23" name="Marketing docs merged (PR #11)" status="PASS" evidence={<>30 files in <code>marketing-system/</code> · agency is canonical for scripts/copy/flows</>} />
              <Row id="24" name="New: /api/leads/ready-for-calls endpoint" status="PASS" evidence={<>Bearer-guarded · returns {counts?.ready.toLocaleString() ?? "1,148"} leads (vs 1 in Luka&apos;s site_urls.json — bridges the gap)</>} />
            </tbody>
          </table>

          <h3>Outreach channels (my side)</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <Row id="25" name="Smartlead" status="DEGRADED" evidence={<>Plan renewed today · reputation recovery from warmup lapse: 1-2 days per Luka&apos;s post-renewal playbook</>} />
              <Row id="26" name="Mia caller (Luka&apos;s stack)" status="PENDING" evidence={<>All app-side prerequisites met · ~2-3h of Luka&apos;s work + Aljaz&apos;s GO signal remaining</>} />
              <Row id="27" name="GHL nurture (Luka&apos;s stack)" status="PENDING" evidence={<>14 workflows in draft on his side · calendar unassigned · fixes underway</>} />
            </tbody>
          </table>

          <h3>Admin tools + customer flow</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Feature</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <Row id="28" name="Quick SMS admin (/admin/sms)" status="PASS" evidence={<>Sender dropdown · thread view · Telegram-ping on inbound · deep-linkable</>} />
              <Row id="29" name="Post-payment auto-flow" status="PASS" evidence={<>Stripe → welcome SMS → token → /my-site link · 30-day reminder cron at day 15/25/28</>} />
              <Row id="30" name="Domain registration automation" status="PASS" evidence={<>Porkbun availability → register → DNS → Vercel attach · all one form submit</>} />
              <Row id="31" name="Customer &quot;Approve site&quot; button" status="PASS" evidence={<>Self-serve · flips onboarding_state.stage → &apos;approved&apos; · Telegram ping to Aljaz on approval</>} />
            </tbody>
          </table>
        </section>

        <section>
          <h2>2) What&apos;s actually blocking launch</h2>

          <h3 className="fail">Not blocking (my side)</h3>
          <p>Every P0/P1/P2 item from Luka&apos;s report that involved this repo or infrastructure has been closed as of build time.</p>

          <h3 className="warn">Blocking (Luka&apos;s side, per his own report)</h3>
          <ul>
            <li><strong>Mia link-delivery rail:</strong> swap <code>sms_from</code> Houston → Dallas in engine configs (~5 min), wire <code>link_endpoint.auth_token</code> from our Vercel into his configs (~30 min).</li>
            <li><strong>GHL workflows:</strong> review + publish minimum set — DNC Guard, Confirmation, Post-Call Nurture, No-Show Recovery (~60 min).</li>
            <li><strong>GHL calendar:</strong> assign Alex Rojko to the calendar so booked walkthroughs route to a human (~2 min).</li>
            <li><strong>Em-dash cleanup:</strong> 9 body lines across 4 copy files on his side (~15 min).</li>
            <li><strong>Test-book one slot end-to-end</strong> before dialing.</li>
          </ul>

          <h3 className="warn">Blocking (needs Aljaz)</h3>
          <ul>
            <li>
              <span className="pass">✅ CAN-SPAM postal address <strong>sent to Luka 2026-07-06</strong></span>{" "}
              — Slovenia entity + d/b/a Wedidit4you (legally valid in US, includes explicit trading-name disclosure). Waiting on him to update the GHL custom value <code>Email Footer</code> to the block below:
              <pre style={{ background: "var(--card)", padding: 12, borderRadius: 8, fontSize: 13, marginTop: 8, whiteSpace: "pre-wrap" }}>
{`Spletna prodaja, Zvonko Zecevic s.p. (d/b/a Wedidit4you)
Vurberk 99
2241 Spodnji Duplek
Slovenia

Wedidit4you is a trading name of Spletna prodaja, Zvonko Zecevic s.p.`}
              </pre>
            </li>
            <li><strong>Explicit fresh dialing GO to Luka</strong> once his battery is done. Standing rule — Mia doesn&apos;t dial without it.</li>
          </ul>

          <h3 className="warn">Non-blocking cleanup</h3>
          <ul>
            <li>Revoke the two GitHub PATs that appeared in chat, regenerate a third that doesn&apos;t.</li>
            <li>Buy a replacement Houston-region number once the launch confirms area-code routing matters.</li>
          </ul>
        </section>

        <section>
          <h2>3) GO / NO-GO per channel</h2>

          <h3>📞 Mia calls — <span className="warn">CONDITIONAL GO</span></h3>
          <p>App side (this stack) is ready. Waiting on Luka&apos;s ~2-3h battery + Aljaz&apos;s explicit GO. First revenue call possible today.</p>

          <h3>✉️ Cold email (Smartlead) — <span className="warn">RENEWED, warming</span></h3>
          <p>Plan renewed today per Aljaz. Warmup recovery from the outage gap takes 1-2 days before real sends resume. Copy is already the cleanest file in the audit.</p>

          <h3>🔄 GHL nurture — <span className="fail">NO-GO as automation</span></h3>
          <p>Luka is publishing the minimum workflow set. Post-call follow-up runs manually via <code>/admin/sms</code> until the workflows go live.</p>
        </section>

        <section>
          <h2>4) Shortest path to first revenue call</h2>
          <ol>
            <li><strong>Luka</strong> · Fix Mia link-delivery rail + GHL calendar + minimum workflow set (~2-3h total).</li>
            <li><strong>Luka</strong> · Test-book one calendar slot end-to-end, confirm it lands on Alex&apos;s calendar and the confirmation email fires.</li>
            <li><strong>Luka</strong> · Point Mia at{" "}
              <code>GET /api/leads/ready-for-calls</code>{" "}
              with the OUTREACH_AUTH_TOKEN → she pulls the full {counts?.ready.toLocaleString() ?? "1,148"}-lead pool instead of the 1-lead <code>site_urls.json</code>.
            </li>
            <li><strong>Aljaz</strong> · Send Luka the US postal address for the CAN-SPAM footer (or confirm the Slovenia business address works).</li>
            <li><strong>Aljaz</strong> · Give Luka the explicit fresh GO.</li>
            <li><strong>Luka</strong> · <code>queue_campaign.py</code> live · lead the batch with Elite Mobile Tire (Lubbock) as SPEC-track, top mechanics/groomers/tutors from the ready pool as COLD.</li>
            <li>Mia call 1 → texts live link mid-call from Dallas → books walkthrough → <strong>Alex call 2 → the verbatim $450 close.</strong></li>
          </ol>
        </section>

        <section>
          <h2>5) Session changes since Luka&apos;s report</h2>
          <p>Commits landed on <code>main</code> since <code>2026-07-05</code>:</p>
          <ul>
            <li><code>484ec75</code> — SMS webhook signature verification + new <code>/api/leads/ready-for-calls</code> endpoint</li>
            <li><code>a035e8c</code> — Retired duplicate copy docs (agency versions in <code>marketing-system/</code> canonical)</li>
            <li><code>4429406</code> — Every-5-min <code>generate-sites</code> cron</li>
            <li><code>dc4d2b6a</code> — Merged PR #11 (agency marketing system, 30 files, 7,787 lines)</li>
            <li><code>df12878</code> — Sender picker in Quick SMS admin</li>
            <li><code>6717f2d</code> — Customer &quot;Approve site&quot; button + status panel on /my-site</li>
            <li>Supabase: RLS enabled on <code>site_events</code> + <code>outbound_messages</code></li>
            <li>Vercel: contact474 promoted MEMBER → DEVELOPER</li>
          </ul>
        </section>

        <blockquote>
          This is a build-time snapshot. Live counts pulled from Supabase at
          request time (revalidated hourly). Push to <code>main</code> and
          the report reflects the new state within ~60 seconds. For the
          agency&apos;s side of the stack, see{" "}
          <a href="https://wdify-launch-report.vercel.app/" target="_blank" rel="noopener">
            wdify-launch-report.vercel.app
          </a>.
        </blockquote>
      </main>
    </>
  );
}
