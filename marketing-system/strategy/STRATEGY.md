# WDIFY LAUNCH STRATEGY — 2026-06-12

> ## ⚠️ CORRECTION (2026-06-12, post-audit — supersedes all "742" figures below)
> The 742 unique-phone pool was audited against the `website` column: **568 leads HAVE a real
> website** (the scrape path ignored the no-website filter). The true pitch-eligible pool is
> **174 site-less businesses**: mobile mechanic 71 · mobile barber 31 · dog groomer 26 · handyman 18 ·
> mobile car wash 15 · auto detailing 13 (house cleaners: 0 site-less). Consequences:
> 1. **First pass ≈ 174 dials → ~35 connects → ~4 walkthroughs → ~2-3 closes.** Founding-10 fills
>    over ~2-3 weeks from scraper inflow + spec-build reveals + inbound, not in one pass.
> 2. Scraper now inserts ONLY site-less leads (patched) and dedupes on (client_id, phone) (patched).
>    Query matrix expanded ~4x across metros so site-less inflow compounds daily.
> 3. The 568 with-website leads are NOT dead — they're the **Phase 2 "your site is costing you jobs"
>    rebuild pitch** (many are square.site/netlify one-pagers). Different script, do not call them
>    with the no-website opener.
> 4. Queue tool enforces the filter: `python3 the campaign queue tool` (the dial list can never
>    contain a real-website lead).

Source of truth: `CONTEXT.md`. No fact here is invented.
Brand: We Did It For You (Aljaz — public persona "Alex Rojko", info@wedidit4you.com). Offer: build-first,
$0 deposit, live URL in 24h or free, founding-10 at $450 (then $700), keep the draft if you walk.

---

## 1. LAUNCH SEQUENCE

### Day 0 (today) — the two calls that make the site true
The live site says "owners get a call this week." That claim is decaying. Mia calls BOTH Lubbock
spec-build owners in the 9-11am CST window, today:

1. **Elite Mobile Tire & Brake** (Lubbock, TX — mobile mechanic focus niche)
2. **Buddy's Mobile Spa** (Lubbock, TX — mobile dog groomer focus niche)

Pitch frame: "Your site is already live. Want the link?" This is a reveal, not a pitch — the strongest
opening in the whole playbook. No connect by 11am → retry 2-4pm CST → SMS the live URL same day
(B2B number, we built it FOR them). Repeat both windows daily until connected. These two are also the
highest-probability founding closes: zero build delay, zero risk, the thing already exists.

Also Day 0: apply the dedup fix (§6) BEFORE the campaign launches, and buy the phase-2 domains (§5).

### Day 0-1 → Day 7 — cold campaign on the 742
- **Volume:** 100-150 dials/day via Mia (includes retries). One full first pass in ~5-6 days.
- **Windows:** 9-11am + 2-4pm lead-local. Timezone batching each day: Miami (ET) first, then
  Houston/Dallas/Lubbock (CT), then Phoenix (MT). Never dial outside 9am-6pm local.
- **Priority order (unique lead counts from postgres):**

| Wave | Niche | Leads | Why |
|---|---|---|---|
| 1 | Mobile mechanic | 153 | Site focus niche — demo (diazmobile) + spec build match |
| 1 | Dog groomer | 186 | Site focus niche — Buddy's spec build match |
| 2 | Auto detailing | 113 | Adjacent to mechanic, same buyer psychology |
| 2 | Handyman | 107 | Trades, acute pain |
| 2 | Mobile barber | 84 | |
| 2 | House cleaner | 48 | |
| 2 | Mobile car wash | 45 | |

Wave 1 = 339 leads → done in days 0-3 at 130/day. Wave 2 = 397 leads → days 3-6.
- **Retry logic:** no-connect → 2nd attempt opposite window same day or next, 3rd attempt day +2.
  After 3 no-connects, park for the spec-build-reveal pass (§4).
- Mia config: female agent calling on behalf of We Did It For You / Alex, NEPQ engine, voicemail
  detect 9s (no voicemail drops — hang and retry). Mia prompt goes through /panel before launch.

---

## 2. CHANNEL DOCTRINE

**Call-first. Period.** Only 14 of 742 leads have emails — email cannot be the spear.

1. **Mia call** = primary. Every dial.
2. **SMS link-drop immediately after EVERY connect** (SignalWire, B2B number). The killer move:
   the site URL lands in their texts while the call is still warm. One line, ends on the link,
   zero begging. Example shape: `alex from we did it for you. the site we talked about: {{url}}`
3. **Email = follow-up only**: (a) emails captured ON calls, (b) inbound form leads, (c) the 14
   existing emails. Warm/transactional from info@wedidit4you.com is fine now. Cold email at
   volume = Phase 2 (§5), not before.
4. **GHL is the only email sender** (the standing rule, never custom SMTP). GHL agency account is
   currently INACTIVE — every email artifact (sequences, merge tags, contact CSV mapping, pipeline
   stages) is built import-ready NOW so the moment it reactivates, push-button.

Every connect must end three ways: SMS link sent + email captured if possible + pipeline stage set.

---

## 3. CONVERSION MATH

Stated assumptions (B2B mobile-service numbers, owner usually answers their own phone):

| Stage | Rate | Count |
|---|---|---|
| Dials (first pass, unique) | — | 742 |
| Connects | 20% | ~148 |
| Books 15-min walkthrough | 10% of connects | ~15 |
| Closes (offer is $0-risk; demo already built) | 60-70% of walkthroughs | ~9-10 |

- **One pass through the 742 ≈ fills the founding-10.** If rates hold, founding-10 closes in
  week 1-2 (first pass + retries). If short, the scraper adds ~10-99 new leads/day and the
  spec-build-reveal pass (§4) lifts the back half.
- **Founding-10 revenue: 10 × $450 = $4,500.** At $700 pricing a full funnel pass of 10 closes = $7,000.
- **Price flips to $700 permanently the day client #10 pays.** Same-day: update site pricing +
  "Spot X of 10" counter + Mia script. The counter must always be accurate — it's the urgency engine.
  The founding-10 is the proof run; the $700 era is the business.

---

## 4. THE FOUNDING-10 ENGINE

Two flywheels, both compounding:

**A. Testimonial conversion.** The site's testimonials are currently illustrative. Every founding
close converts one into a REAL one: on the review call (their colors/phone/photos), Aljaz asks for
one sentence + permission to use name/city. Real client #1 replaces illustrative #1 the same week.
By client 10, the site is 100% real proof — that's what justifies $700.

**B. Spec-build-ahead motion (the unfair advantage).** The Lubbock pair proved it: the strongest
pitch on earth is "it already exists, want the link?"
- **Build 3-5 sites/week on spec** for the hottest leads BEFORE Mia calls them.
- Hottest = focus niche (mechanic/groomer) + high rating tag + website=null + good public info
  (Google/reviews/social — same research the offer promises).
- Those leads get the reveal call instead of the pitch call: "We already built {{company}} a site.
  It's live. Want the link?" → SMS link on connect → walkthrough books itself.
- Also the rescue play: 3x-no-connect leads in focus niches get a spec build + SMS link drop —
  the link does the talking when the phone doesn't.
- Cap at 5/week — Aljaz's build throughput must stay clear for the 24h promise on inbound forms
  and the founding-client review calls. Closes outrank spec builds, always.

The loop: spec build → reveal call → close → real testimonial → stronger site → higher connect-to-book
→ price flip to $700 → repeat with scraper's daily fresh leads.

---

## 5. PHASE 2 — COLD EMAIL INFRA (buy TODAY, warm by mid-July)

Warmup takes 3-4 weeks. **Trigger is NOW (June 12)** → sending-ready ~July 10-17. Do not wait for
GHL reactivation to buy domains — DNS warmup starts independent of the sender.

Shopping list (exact):

| Item | Spec | Cost |
|---|---|---|
| 2-3 sending domains | .com variants of wedidit4you (never the main domain) | ~$24-36/yr total (~$8-12 ea) |
| SPF + DKIM + DMARC | on each domain, day 1 of purchase | $0 |
| 4-6 inboxes | 2 per domain (Google Workspace Business Starter) | ~$7.20/inbox/mo → $29-43/mo |
| Warmup service | GHL/LC warmup when account reactivates; Smartlead ($39/mo) as standby so warmup never waits on GHL | $0-39/mo |
| Ramp schedule | wk1: 5/inbox/day → wk2: 15 → wk3: 25 → wk4: 40 | — |
| Send cap | **40/inbox/day hard cap** → 160-240 cold emails/day capacity warm | — |

Total: ~$70-90/mo + ~$30/yr. Sequences (≤75 words, email 1 has NO links, lowercase 3-5 word subjects,
one Voss device each, "— alex" sign-off) are written and import-ready before the domains finish warming.
By mid-July: calling + warm cold-email = two spears instead of one.

---

## 6. METRICS + KILL CRITERIA

**Daily dashboard (from Mia campaign API + postgres, every evening):**
dials · connects · connect % · voicemails hit · SMS link-drops sent · emails captured · walkthroughs
booked · booking % (of connects) · closes · revenue · Mia call minutes · DNC requests · new
scraper leads. Weekly: cost per close, connect % by niche, connect % by window.

**Kill/change criteria:**
- **Connect <15% after 2 days (≥200 dials):** rotate SignalWire caller IDs; test our numbers against
  spam-flag (call own cells); reweight toward whichever window is outperforming; check connect % by
  city — drop the worst metro for a day.
- **Booking <5% of connects after ≥30 connects:** script problem, not list problem. Re-run Mia
  prompt through /panel; shorten the pitch; shift hot leads into the spec-build-reveal motion (reveal
  converts where pitch doesn't).
- **Close <50% of walkthroughs:** the offer is $0-risk, so this means demo quality or expectation
  mismatch — Aljaz reviews call recordings before the next walkthrough.
- **Niche-level:** any niche at <50% of mean connect-to-book after 100 dials → deprioritize,
  reallocate dials to mechanics/groomers.

**Dedup fix (REQUIRED before launch — Day 0):** `our lead database` has 10,894 rows for 742 unique
phones; the scraper INSERT has no dedup and the cron adds ~10-99/day, so it compounds daily.
1. One-time migration: keep earliest row per `((WDIFY), contact_phone)`, merge tags.
2. Add unique index on `(client_id, contact_phone)` + change scraper INSERT to `ON CONFLICT DO UPDATE`.
3. Until #2 ships, every campaign pull uses `SELECT DISTINCT ON (contact_phone)`.
Without this, Mia double-dials the same business — wasted spend and a DNC/reputation problem.

---

## 7. RISKS

1. **GHL inactive** ("Company is not active") — escalation in progress. Mitigation: nothing in week 1
   depends on it (SMS goes via SignalWire post-connect; warm email from info@ works). All GHL
   artifacts import-ready. Risk window: if still down at price-flip time, pipeline tracking lives in
   postgres until it returns.
2. **"Owners get a call this week" goes stale.** The site makes a public, dated claim about the two
   Lubbock spec builds. The Day 0 calls are not optional — if those owners find their site via a
   customer before Alex calls, the trust frame inverts. Daily retries + same-day SMS link until reached.
3. **TCPA posture: accepted** (project decision). These are B2B business numbers.
   Hard hygiene anyway: honor every DNC instantly (suppress in DB), 9am-6pm local only, Mia
   identifies "We Did It For You" on every call. The dedup fix is part of this — no double-dials.
4. **Scarcity integrity.** "Spot 3 of 10" on the site must move with reality. A counter that never
   moves reads fake and kills the urgency engine. Update within 24h of every founding close.
5. **Single-spear dependence until mid-July.** If calling underperforms, there's no volume fallback
   until email is warm. Mitigation: domains bought Day 0 (§5), spec-build SMS reveals as the
   no-connect channel, inbound form as the passive channel.
6. **Aljaz build throughput.** 24h-or-free is a hard public promise. 10 closes + review calls +
   5 spec builds/week can stack. Order of operations when it does: inbound 24h promise → founding
   review calls → spec builds. Cap spec builds, never the promise.

---

*Next actions, in order: dedup migration → Mia WDIFY campaign config + /panel on the prompt →
Lubbock calls 9-11am CST → wave 1 launch → buy domains. All Day 0.*
