# WDIFY — LONG-GAME NURTURE + REACTIVATION (GHL-import-ready)

**Date:** 2026-06-16 · **Persona/sender:** Alex Rojko · `info@wedidit4you.com` / "Alex at We Did It For You" (GHL LC Email only — never custom SMTP).
**Copy law (every line obeys it):** the WDIFY copy standards.
**Built on (do not contradict):** `../CONTEXT.md` · `../email/SEQUENCES.md` (A1–A4, B1–B3, C1–C3, D1–D4) · `../sms/SMS-COPY.md` (SMS-1…5) · `../ghl/GHL-BUILD-SPEC.md` (WF-1…WF-5, fields, pipeline) · `../OFFER-AB-PREDICTION.md` (Hybrid: prove real, re-open the loop) · `00-TOUCHPOINT-GRAPH.md` (WF-6 reactivation, states 3.4/3.6/3.9/3.11).

**What this file is.** Two new copy sets the touchpoint graph names but doesn't yet carry the words for:

1. **LONG-GAME NURTURE (LGN)** — a 4-6 touch value+pressure drip over **3-4 weeks**, for a lead that went **cold / not-yet-ready**: link is in their pocket, the short WF-2 ladder (A3→A4, days 2 and 5) ran out, they didn't book, but they're **not a fresh dormant lead either** — they engaged once and stalled. This sequence lives in the gap between WF-2's day-5 walk-away and the 30-60 day WF-6 reactivation. It also catches the **"let me think / talk to my partner"** state (graph 3.6) after a shown-not-closed walkthrough.
2. **REACTIVATION (REA)** — the **WF-6** copy (graph §4): old/dormant leads, **30-60+ days** since last touch, draft still live, recycled with present-tense "your site's *still* live, still yours, founding price's almost gone."

Two variations each (A and B). Both variations of each piece are complete and interchangeable — A is the **consequence-forward** line (loss-aversion lead), B is the **possession-forward** line (the thing-you-already-own lead). Run them as an A/B split in GHL; the loser gets retired after ~40 sends per arm.

---

## Merge fields used (all already specced in GHL-BUILD-SPEC §3)

| Field | Source | Empty-field behavior (verified below) |
|---|---|---|
| `{{contact.first_name}}` | standard (rare — ~14/742 + form leads) | **never sentence-load it.** Only used as an optional `{{contact.first_name}} — ` prefix on ONE opener per sequence; every body reads clean with no name. |
| `{{contact.company_name}}` | standard (always present from scraper/form) | always populated — safe to use inline. |
| `{{contact.draft_site_url}}` | custom field "Site URL" | gates every nurture/reactivation send — if empty the lead is not eligible (no link = nothing to nurture). The workflow entry filter guarantees it's set. |
| `{{custom_values.booking_link}}` | custom value "Booking Link" | global, always set. |
| `{{contact.niche}}` | custom field "Niche" | **may be empty.** Every line that uses it is written to read naturally if it resolves to nothing (see the "your trade" fallback pattern — never "your  business" with a hole). |
| `{{contact.founding_spot_number}}` | custom field (1-10) | **may be empty.** Used only where the sentence survives an empty value ("a founding spot" not "spot #{{...}}"). |
| `{{custom_values.spots_remaining}}` | **NEW location custom value** — driven by `10 − (count of WON founding opportunities)`, updated by Alex/automation at each close (GHL-BUILD-SPEC §3) | the LIVE scarcity counter. Replaces the unverifiable "almost gone / barely" claim — scarcity is now SHOWN ("4 of 10 left"), not asserted. Reads clean if set to a number; never ship the reactivation copy with this empty (gate the send on it). |
| `{{custom_values.first_founder}}` | **NEW location custom value** — the named first founding client (e.g. "Elite Mobile Tire & Brake in Lubbock") | real social proof. Set the moment the first founding close lands; until then, the lines that use it are held (REA copy gated on it being non-empty). Named proof > repeated assertion. |

**Empty-field rule applied to every body below:** read each sentence twice — once with the field full, once with it empty. No sentence may break, double-space, or dangle. Where a field would dangle, the field is omitted and the generic survives ("your trade", "a founding spot"). This is why no body hard-depends on `niche` or `first_name`.

---

# PART 1 — LONG-GAME NURTURE (LGN)

**Who enters:** lead in **Site Link Sent** (graph 3.4) whose WF-2 ladder finished (A3 day 2 + A4 day 5 both sent) with **no booking, no DNC** — i.e. about to be tagged gone-cold — PLUS the **shown-not-closed "let me think"** lead (graph 3.6). Instead of dropping straight to Lost at day 5, these get one more **3-4 week** arc, then go to Lost/`reactivation:eligible` if still silent.

**Why a long-game arc exists at all (the mechanism).** The WF-2 ladder is a *sprint* — it assumes the lead is hot and just needs a nudge. A lead who survives the sprint without booking isn't dead; they're **not-yet-ready** (busy season, money timing, "I'll get to it"). For that lead, **frequency is the enemy and patience is the weapon.** Begging weekly confirms the scam hypothesis (copy law) and trains them to ignore the sender. So the long game *slows down* (5-7 day gaps, not 2), and each touch does exactly one job: **keep the loss alive without nagging.** It alternates two pressures the buyer can't argue with — the **standing cost** (jobs leaking to whoever's on Google) and the **closing window** (founding price → $700) — wrapped around the one fact that makes this offer un-ghostable: **they already own the thing.** The draft is a Zeigarnik hook (an unfinished possession with their name on it), and every touch re-points at it instead of pitching anew.

**Cadence (5 touches over ~24 days):** LGN-1 day 0 · LGN-2 day +5 · LGN-3 day +11 · LGN-4 day +17 · LGN-5 day +24 (walk-away). Channel-aware: email for the 14/742 with email; **SMS carries the phone-rich majority** (every email touch has an SMS twin so the pool is actually reachable). Twins are **worded apart** — an SMS never repeats a sentence from the email firing the same day (the anti-twin rule from SMS-COPY §6).

**Goal/exit (the whole sequence auto-stops the instant any is true):** `status:booked` OR `status:approved` OR opportunity ≥ Walkthrough Booked OR DND. After LGN-5 with no booking → opportunity **Lost** (reason: nurture-exhausted), tag `reactivation:eligible`, draft stays live → eligible for WF-6 in 30-60d.

**GHL wiring:** add as **WF-2b "Long-Game Nurture"**, trigger = tag `nurture:long-game` (applied by WF-2's exit step when its ladder ends with no booking, instead of moving straight to Lost). Same goal events as WF-2. Suppress for any contact with `status:booked`/`status:approved`/`status:dnc`.

---

## LGN-1 — "still on Google?" (day 0)

- **Purpose:** re-open the standing-cost loop after the sprint went quiet, without referencing the silence (referencing silence = "just checking in" = banned). Lead with the asset, not the absence.
- **Trigger:** tag `nurture:long-game` added.
- **Delay:** immediate (this is ~day 7 of the lead's life — 2 days after A4).
- **Channel:** Email (+ SMS twin LGN-1s).

### Variation A — consequence-forward
**Subject:** still losing the jobs

Your site's still sitting there, live, with your name on it: {{contact.draft_site_url}}

And every week it stays a draft, you're handing jobs to whoever a customer can actually find. That's not a maybe. That's the week you just had.

Fifteen minutes makes it actually yours: {{custom_values.booking_link}}

— alex

*(Voss: label — "Your site's still sitting there." 50 words. Leads with the gift (the live draft) before the cost. The loss is restructured off the frozen searcher skeleton — "you're handing jobs to whoever a customer can actually find" — so this LGN opener doesn't reuse the same mold the rest of the campaign caps at one per workflow. Stated as already-happened fact, not a threat; aimed at what a site fixes, not Google rankings. Ends on the booking imperative, not a naked link.)*

### Variation B — possession-forward
**Subject:** you already own this

The site we built {{contact.company_name}} hasn't moved. It's live, it's yours, and nothing's owed on it: {{contact.draft_site_url}}

It's just not *finished*. It's on our address, not yours, with our placeholder photos instead of your work. That last part needs you, and it takes fifteen minutes.

{{custom_values.booking_link}}

— alex

*(Voss: label — "hasn't moved." 51 words. The Zeigarnik hook made literal: they own an *unfinished* thing, and the incompletion is the hook. No cost-threat — possession + a half-done feeling pulls harder than fear for the not-yet-ready lead. Reads clean if company_name resolved or not.)*

### LGN-1s — SMS twin (both variations share one SMS; pick by arm)
- **Trigger:** fires with LGN-1 when no email on file, OR alongside it.
- **Delay:** immediate.

> The site we built you is up and it hasn't cost you a dime: {{contact.draft_site_url}} 15 min and it's actually yours. {{custom_values.booking_link}} — alex's team. Reply STOP to opt out

*(Worded apart from both email variations — no shared sentence. STOP line included if first SMS to the number.)*

---

## LGN-2 — "the math, not the pitch" (day +5)

- **Purpose:** dollarize the standing cost so the reader does the arithmetic on themselves — the strongest Hormozi move for a money-timing stall. Let them compute the loss; we invent no number.
- **Trigger:** LGN-1 sent, no booking.
- **Delay:** +5 days.
- **Channel:** Email (+ SMS twin).

### Variation A — consequence-forward
**Subject:** what's one job worth

One job in your trade. What's it pay you? Fifty, a hundred, more?

A guy in your trade with no real site loses three to five of those a week to whoever shows up when someone looks. Run your own number times five. That's the weekly bill for staying a draft, and it dwarfs the $450 this costs once.

Your site: {{contact.draft_site_url}}
Fifteen minutes to finish it: {{custom_values.booking_link}}

— alex

*(Voss: no-oriented framing via the opening question — they answer in their head. 64 words. Hormozi value-stacking: the cost of inaction (5 jobs/wk) is made to dwarf the price ($450 once) using THEIR number, not ours — the reader convicts themselves. Two links, each labeled, no naked URL ending.)*

### Variation B — possession-forward
**Subject:** the small part

The $450 isn't the thing to weigh. The thing to weigh is the work walking to whoever a searcher actually lands on while yours sits as a draft.

You've already got the site. You've already paid nothing. The only open question is whether it ever becomes the version that rings your phone.

Fifteen minutes: {{custom_values.booking_link}}

— alex

*(Voss: accusation audit folded in — "The $450 isn't the thing to weigh" pre-empts the price objection before they raise it. 58 words. Reframes the decision from "spend $450?" to "let the asset I own keep dying?" — possession + cost-of-inaction fused. Ends on strength.)*

### LGN-2s — SMS twin
> A draft site costs you 3-5 jobs a week to the guy whose site loads when a customer looks you up. The fix is $450 once and 15 min. {{custom_values.booking_link}} — alex's team. Reply STOP to opt out

---

## LGN-3 — "the clock on the price" (day +11)

- **Purpose:** introduce the *closing window* (founding price → $700) as the time-boxed loss — the second pressure axis. Loss-aversion on a deadline beats gain-framing on the same offer.
- **Trigger:** LGN-2 sent, no booking.
- **Delay:** +6 days (day 11).
- **Channel:** Email (+ SMS twin).

### Variation A — consequence-forward
**Subject:** the price moves soon

The $450 you're holding isn't permanent. It's the founding price for our first ten, and the spots are filling. After ten it's $700 for good. Same site, same work, just more.

You'd be locking the lower one. The draft's already built: {{contact.draft_site_url}}

Would it be crazy to grab the fifteen minutes before the number changes? {{custom_values.booking_link}}

— alex

*(Voss: no-oriented question — "Would it be crazy to..." 60 words. The deadline is the loss (the lower price closing), not a fake urgency stunt — it's the real founding-10 mechanic. "You'd be locking the lower one" = endowment language: it's already theirs to lose. Survives empty founding_spot_number — never cites a specific spot here.)*

### Variation B — possession-forward
**Subject:** lock it before it jumps

You're sitting on two things most owners never get: a finished site, and the founding price to make it yours. Both have a shelf life.

The site stays live. The $450 doesn't. It's $700 once the first ten are gone. One of those ten could be {{contact.company_name}}.

{{custom_values.booking_link}}

— alex

*(Voss: label — "You're sitting on two things." 52 words. Frames the price as a *second possession* that decays — pairs the standing asset (durable) with the price (perishable) so the urgency attaches to something they already feel they own. "could be {{contact.company_name}}" reads fine empty or full.)*

### LGN-3s — SMS twin
> The $450 founding price moves to $700 once our first ten are gone. Your site's built and waiting: {{contact.draft_site_url}} Lock the lower one: {{custom_values.booking_link}} — alex's team. Reply STOP to opt out

---

## LGN-4 — "one honest line" (day +17)

- **Purpose:** the proof-of-realness re-touch. Three weeks in, the not-yet-ready lead's residual fear is "is this still a trap / will it cost me later?" Kill it once, plainly, with the kept-draft guarantee — then point at the asset.
- **Trigger:** LGN-3 sent, no booking.
- **Delay:** +6 days (day 17).
- **Channel:** Email (+ SMS twin).

### Variation A — consequence-forward
**Subject:** three weeks, zero dollars

Three weeks of me in your inbox and I still haven't asked you for a dime. That's not an accident. It's the whole offer. You don't pay until you say keep it, and if you never do, the draft's still yours.

What I can't do is bring back the customers who searched you and found nothing. Only the live site does that: {{contact.draft_site_url}}

{{custom_values.booking_link}}

— alex

*(Voss: accusation audit — "Three weeks... and I still haven't asked you for a dime" pre-empts the scam thought by naming the evidence against it. 66 words. The guarantee is the trust-purchase (OFFER-AB §1); the cost-of-inaction ("the jobs you're missing") immediately re-arms the stakes so the reassurance doesn't go soft.)*

### Variation B — possession-forward
**Subject:** yours the whole time

The site we built {{contact.company_name}} has been live and free this whole time. No deposit ever came out, and none will unless you decide you want it. You've paid nothing and you never will unless you say keep it. That's the whole offer.

It's still sitting here, still finishable: {{contact.draft_site_url}}

{{custom_values.booking_link}}

— alex

*(Voss: label — "it's been yours the whole time." 56 words. Disarms by stating the offer as a positive fact, not by denying a catch ("that's the catch, there isn't one" was a negation that plants the negated word — cut). For a skeptic, the *track record* of not charging is more convincing than any promise. Ends on the asset + the door.)*

### LGN-4s — SMS twin
> 3 weeks, $0 charged, and your site's still live. That's the whole deal. Keep it or don't, never a surprise bill. {{contact.draft_site_url}} Finish it in 15: {{custom_values.booking_link}} — alex's team. Reply STOP to opt out

---

## LGN-5 — "I'll stop here" (day +24, walk-away)

- **Purpose:** end the long game on strength. The dignified walk-away is the highest-converting touch in a skeptic sequence *because* it removes the pressure that was feeding the suspicion. Leaves the loss ringing and the door open — no nagging, no last desperate pitch.
- **Trigger:** LGN-4 sent, no booking.
- **Delay:** +7 days (day 24).
- **Channel:** Email (+ SMS twin). After this → Lost (nurture-exhausted), `reactivation:eligible`.

### Variation A — consequence-forward
**Subject:** last one, then quiet

I'm going to leave you alone now. I won't keep emailing about a site you can already see for free.

The draft stays live and stays yours: {{contact.draft_site_url}}

When a slow week has you wondering where the calls went, you'll know exactly who to text. It comes straight to me.

— Alex Rojko, We Did It For You

*(Voss: walk-away. ~52 words. One device — the walk-away stings on its own; no excuse-label to soften it. The future-pacing line ("a slow week... where the calls went") plants the cost-of-inaction as a *future certainty they'll feel*, then hands them the recovery path. "comes straight to me" = the site's "I answer every email myself." Sign-off uses the FULL name (stress-test face+proof fix #1) so this sequence establishes a verifiable human at least once.)*

### Variation B — possession-forward
**Subject:** keeping it simple

This is the last one from me. Chasing someone about something free feels wrong, so I won't.

Your site doesn't disappear. It's built, it's live, it's yours: {{contact.draft_site_url}}

If the timing ever lands, reply to this and we finish it in fifteen minutes. No re-explaining, I'll remember.

— Alex Rojko, We Did It For You

*(Voss: walk-away. ~54 words. Possession framing on the exit — what they *keep* (the live draft) outlasts the conversation, so the door stays warm. "I'll remember" lowers the re-entry cost to zero — the #1 reason a not-yet-ready lead comes back when timing changes. Sign-off uses the FULL name (stress-test face+proof fix #1) so the LGN sequence establishes a verifiable human at least once.)*

### LGN-5s — SMS twin
> Last one from me — won't chase you about something free. Site stays live and yours: {{contact.draft_site_url}} Timing ever changes, just reply, I'll remember. — alex. Reply STOP to opt out

---

# PART 2 — REACTIVATION (REA) — the WF-6 copy

**Who enters (graph §4):** opportunity in **Lost** with reason ∈ {walked-away, gone-cold, nurture-exhausted, no-show-exhausted}, `DND = false`, last stage change ≥ **30 days**, `reactivation:eligible`. Pulled monthly. **Cap: 2 rounds** (`reactivation:round-1`, `reactivation:round-2`), then permanent Lost (never DND — they just never bit).

**Why reactivation is a *stronger* pitch than the first touch (the mechanism).** Counter-intuitively, a 30-60 day-old dead lead is **warmer** to this specific offer than they were on day one, and the copy leans entirely on that. Three forces compound over the gap: (1) **the asset still exists.** "Your site is *still* live" is a pattern-break — dead leads expect to be re-pitched, not reminded they own something. It re-triggers the endowment effect from a cold start. (2) **the standing cost has been running the whole time** — and this is the **lead lever** of the rewritten hook. They've now had 30-60 *more* days of the customer-who-searched-them-and-found-nothing booking the competitor — the cost-of-inaction is no longer hypothetical, it's a bill they've lived. (3) **the founding window is SHOWN, not asserted.** This is the panel-fix: the prior copy said "almost gone... barely" while the price had not actually moved — to a timeshare-wary skeptic who got the identical "almost gone" line 60 days ago, repeating it trains them that our scarcity is fake. So reactivation now carries a **live counter** (`{{custom_values.spots_remaining}}`) and a **named first founder** (`{{custom_values.first_founder}}`): real proof replaces the unverifiable clock. If a lead's price genuinely hasn't moved, the hook leans on the **lived cost**, not a doubling-price claim. So reactivation copy is **present-tense possession + lived cost + a provable counted window** — never "circling back" or "checking in" (banned, and it signals we forgot them, killing the whole "still yours" frame).

**Channel reality (phone-rich pool):** the pool is **14/742 email**, so reactivation is **call-first** for phone-rich leads (re-queue Mia's dialer with the SPEC reveal — see "Mia reactivation brief" below) and **one email/SMS touch** when the number's exhausted but email exists. Email/SMS reactivation is **a single touch, not a ladder** (graph §4 step 4) — a dormant lead gets one strong reason to look, not a re-run of the nurture.

**Goal/exit:** booking OR approval OR DND. A positive outcome re-opens the **same** opportunity (never duplicate) and rejoins the funnel at the matching stage.

**GHL wiring:** **WF-6 "Reactivation"** — trigger tag `reactivation:round-{N}`. If phone-textable → SMS-only touch. If email exists → email + SMS. Always: re-open existing opportunity, move to **Site Link Sent** (or **Dialed** if re-calling). Round 2 fires only if round 1 got no engagement after 14 days.

---

## REA-1 — Email reactivation (single touch)

- **Purpose:** the one-shot "your site's still live" jolt — pattern-break a dormant lead by reminding them they own something, not by re-pitching. Lead with the asset, attach the lived cost and the closing window, exit on strength.
- **Trigger:** `reactivation:round-{N}` added, email on file.
- **Delay:** immediate on enrollment.
- **Channel:** Email (+ SMS twin REA-1s). Use round-1 variation A, round-2 variation B (or A/B split within a round).

### Variation A — "still live" (consequence-forward, the standing/lived cost)
**Subject:** it's still live

That website we built {{contact.company_name}} a while back is still up, and it still hasn't cost you a dime: {{contact.draft_site_url}} You own it.

And here's what it cost you: every week since, the guy whose site loaded got the customer who went looking for you. That bill's been running the whole time.

{{custom_values.spots_remaining}} of the ten founding spots are left at $450 before it's $700. {{custom_values.first_founder}} took one. Fifteen minutes locks yours: {{custom_values.booking_link}}

— Alex Rojko, We Did It For You

*(Voss: accusation audit — "And here's what it cost you" names the cost before they can dismiss the email. ~62 words. Sign-off uses the FULL name (stress-test face+proof fix #1) so the reactivation touch establishes a verifiable human. De-patterning pass: the "still up. You still own it. It still hasn't…" triple-"still" anaphora was the most detector-flaggable rhythm in the file — broken to one "still" pair plus a flat "You own it." And the "Here's the part that stings" stem was retired (the "Here's the [X]" hinge was becoming a campaign signature). The three reactivation forces in order: possession ("still up / you own it"), lived cost ("running the whole time" — the lever this hook now leans on hardest), and a PROVEN window — `{{custom_values.spots_remaining}}` is a real live counter (GHL custom value driven by the won-founding count, §3) and `{{custom_values.first_founder}}` names a real founding client, so scarcity is shown not asserted. No "almost gone" / "barely" claim a skeptic can't verify. "a while back" reads natural at any age. Never "checking in / circling back.")*

### Variation B — "before it's gone" (possession-forward, the closing window)
**Subject:** before the spot's gone

The site we built {{contact.company_name}} is still up and still yours to keep, free: {{contact.draft_site_url}}

The founding price is real and it's counted: {{custom_values.spots_remaining}} of ten spots left at $450, then it's $700 for everyone after. {{custom_values.first_founder}} grabbed one already.

Would it be a mistake to lock yours before they're gone? {{custom_values.booking_link}}

— Alex Rojko, We Did It For You

*(Voss: no-oriented question — "Would it be a mistake to..." ~57 words. Sign-off uses the FULL name (stress-test face+proof fix #1) so the reactivation touch establishes a verifiable human. Leads with possession, closes on a SHOWN window: `{{custom_values.spots_remaining}}` is the live GHL counter and `{{custom_values.first_founder}}` is a named real client, so the scarcity is provable, not the "barely" assertion a burned skeptic reads as the timeshare clock. De-patterning pass: the "still up, still yours, still free" triple-still anaphora was broken to one "still" pair. Survives empty company_name. Filler "Quick one." opener cut.)*

### REA-1s — SMS twin (reactivation, phone-first majority)
- **First SMS to a re-engaged number → full compliance line.**

> From We Did It For You: that site we built {{contact.company_name}} is still live and still yours: {{contact.draft_site_url}} {{custom_values.spots_remaining}} of 10 founding spots left at $450. Lock it in 15: {{custom_values.booking_link}} Reply STOP to opt out

*(~2 segments. Carries the business name + STOP — this may be the first contact in 30-60 days. Worded apart from both email variations.)*

---

## REA-2 — "the quiet weeks" (alternate single touch, softer angle)

- **Purpose:** an alternate reactivation hook for the **walked-away** lead (3.9) specifically — someone who *liked* the site and chose timing/budget, not someone who never engaged. For them, the lever isn't the price clock, it's the felt cost of the quiet weeks they chose. Use this instead of REA-1 when reason = walked-away.
- **Trigger:** `reactivation:round-{N}` + Lost reason = walked-away, email on file.
- **Delay:** immediate.
- **Channel:** Email (+ SMS twin).

### Variation A — consequence-forward
**Subject:** how's the phone

How's the phone been ringing?

You looked at the site, liked it enough to keep the draft, and decided the timing wasn't right, which was your call to make. That was two months ago. Two months of someone else picking up the calls that had your name on them. That's the real bill, and you've been paying it.

Your site's exactly where you left it: {{contact.draft_site_url}}
Pick up the fifteen minutes: {{custom_values.booking_link}}

— Alex Rojko, We Did It For You

*(Voss: no-oriented framing via the opener — "How's the phone been ringing?" invites them to admit the quiet without being told. 64 words. Sign-off uses the FULL name (stress-test face+proof fix #1) so this reactivation path establishes a verifiable human. Acknowledges their earlier no with respect ("which was your call to make" — the standalone "Fair." hedge was cut so the respect-the-no beat doesn't repeat the same softener tic that appears in post-call). Leans the whole hook on the LIVED cost ("two months of someone else picking up the calls that had your name on them") — and crucially DROPS the "searched you → found nothing → booked the guy whose site loaded" skeleton, which is now used at most once per workflow per the cross-file mold fix. De-patterning pass: the earlier "60-odd days ago… that's two months" said the same span twice in one sentence; now "That was two months ago. Two months of…" makes the repetition intentional and rhetorical. The cost is the lived two-month bill, not a price clock the lead would smell as fake if it never moved. Only fires for leads who actually saw the site, so "liked it enough to keep the draft" is always true.)*

### Variation B — possession-forward
**Subject:** still where you left it

One line, then I'm gone: the site you kept is still live and still yours, finishable in fifteen minutes: {{contact.draft_site_url}}

You walked the first time and that was the right call if the timing was off. Two months on, the founding price still holds at $450, and {{custom_values.spots_remaining}} of the ten spots are open. If it's less off now: {{custom_values.booking_link}}

— Alex Rojko, We Did It For You

*(Voss: label — "still where you left it." 58 words. Sign-off uses the FULL name (stress-test face+proof fix #1) so this reactivation path establishes a verifiable human. Honors the prior walk-away as legitimate ("the right call") so re-engaging costs them no face — the #1 unlock for a lead who said no once. Opener rewritten: the old "No pitch you haven't heard" sat one phoneme from the banned "no pitch no pressure" and planted the negated word — replaced with "One line, then I'm gone" (a positive frame-set). Scarcity is the SHOWN counter `{{custom_values.spots_remaining}}`, not "just barely," so it reads true even though the price hasn't moved since their last touch.)*

### REA-2s — SMS twin
> You kept the draft but the timing wasn't right last time — fair. Site's still live and yours if it's less off now: {{contact.draft_site_url}} {{custom_values.booking_link}} — alex's team. Reply STOP to opt out

---

## Mia reactivation brief (for the phone-rich majority — call-first, graph §4 step 3)

Reactivation is **call-first** because the pool is email-poor. When WF-6 re-queues a number into Mia's dialer, she runs the **SPEC reveal in present tense** — not a cold opener, because the site already exists. This is copy direction for the dialer, not a GHL email; included so the reactivation set is complete across channels.

**Opener (present-tense, possession-led):**
> "Hey — {{contact.first_name}}? This is {agent_name} with We Did It For You. Bit of a random one: a while back we built {{contact.company_name}} a website, and it's *still* live, still got your name on it. Did you ever get a chance to actually look at it?"
> *(STOP. Wait. The "still" is the whole pattern-break — they expect a pitch, they get a reminder they own something.)*

**The lived-cost line (their cost has been running):**
> "Here's the thing — it's been sitting there working for free, but it's still the rough version on our address. The whole time it's not finished, the customer who looks you up finds nothing and books the guy whose site loads. That's been true every week since we built it."

**The close (a counted window + a named founder — provable, not asserted):**
> "And the reason I'm calling and not just letting it sit — the founding price, the $450, there's {spots_remaining} of the ten spots left before it's $700. {first_founder} already grabbed one. How would you feel about fifteen minutes with Alex to lock yours before they're gone?"

*(Re-uses the Hybrid's proof-then-loop logic from OFFER-AB §4, shifted to present-tense possession. Mia's outcome re-enters the §3 state machine exactly as a first call. The Voss opener line "Did you ever get a chance" is acceptable spoken on a *reactivation* call because it's literal — they were sent a link and may genuinely not have looked — but it stays OUT of all email/SMS where it reads as the banned "did you get a chance" beg.)*

---

# WHY THE TWO SETS ARE SHAPED DIFFERENTLY (the load-bearing distinction)

The nurture and the reactivation copy look similar but are tuned to two different psychological states, and conflating them is the easy mistake:

1. **Nurture = a warm lead cooling; reactivation = a cold lead re-warmed.** The LGN lead just engaged days ago — they remember the offer, so the job is *patience under standing pressure* (slow cadence, alternate the two losses, never beg). The REA lead forgot — so the job is *a single pattern-breaking jolt* ("still live") that re-triggers endowment from scratch. That's why LGN is a 5-touch arc and REA is one strong touch.

2. **The closing window means different things at the two timescales — and it must be SHOWN, never asserted.** In nurture (week 1-4), "$450 → $700" is a *soft* deadline introduced gently at LGN-3 — pushing it harder early reads as fake urgency to a skeptic. In reactivation (month 2+), the window is led with, but **only as a live count** (`{{custom_values.spots_remaining}}` of 10) plus a **named founder** (`{{custom_values.first_founder}}`), never as "almost gone... barely." The panel caught the original contradiction: repeating an unverifiable "almost gone" line to the same lead 60 days later, while the price never moved, trains them that our scarcity is fake (the timeshare tell the personas flag). Fix: show the real number, name the real client, and if the price genuinely hasn't moved, lean the hook on the lived cost instead. Same fact, opposite weight, by design — but always provable.

3. **Both refuse the two banned reflexes** — never reference the silence ("checking in"), never beg ("no pressure", "would you be open"). Every touch in both sets leads with the **gift** (the live draft they own) and attaches exactly one **loss** (jobs leaking, or the price closing), per copy law. The walk-away (LGN-5) and the honored-no (REA-2) are the highest-trust moves precisely because they *remove* pressure from a buyer whose core fear is being cornered.

4. **A/B is consequence-forward (loss-aversion lead) vs possession-forward (asset-you-own lead)** — a real test of which pressure converts THIS buyer, not cosmetic wording swaps. MiroFish/OFFER-AB predicts possession-forward wins for the skeptic (endowment > fear for the not-yet-ready), but consequence-forward should win for the money-timing staller — so we split and let the data decide, then retire the loser per arm. This is the Amodei loop: every send produces the data that sharpens the next.

---

## Import checklist (GHL)

1. Add **WF-2b "Long-Game Nurture"** — trigger tag `nurture:long-game` (WF-2 applies it at ladder-end instead of moving straight to Lost). Steps: LGN-1 (+0) → LGN-2 (+5d) → LGN-3 (+6d) → LGN-4 (+6d) → LGN-5 (+7d). Goal events identical to WF-2. Each step: send email if email on file, always send SMS twin if phone-textable.
2. Add **WF-6 "Reactivation"** — trigger tag `reactivation:round-{N}` (monthly Smart List per graph §4). Steps: REA-1 (or REA-2 if reason=walked-away) email + SMS twin, OR re-queue Mia's dialer (phone-rich). Cap 2 rounds. Re-open existing opportunity, never duplicate. **Gate every REA send on `{{custom_values.spots_remaining}}` and `{{custom_values.first_founder}}` being set** (GHL-BUILD-SPEC §7) — the scarcity counter and named founder make the founding clock provable, not asserted (the panel scarcity fix). If `spots_remaining` = 0, the price has flipped to $700: retire the "$450 founding" REA copy and stop the reactivation clock entirely.
3. Wire the **A/B split** in GHL workflow's email step (50/50), tag the arm (`ab:consequence` / `ab:possession`) so the winner is measurable. Retire the loser after ~40 sends/arm.
4. All sends: **plain text, no HTML, no images, signed `— alex`** (LC Email only). Re-run **/panel** on this file before go-live (touchpoint graph §4/§8 instruction), log the verdict in `../PANEL-VERDICTS.md`.
5. **Suppression:** every SMS honors STOP → GHL DND → tag `sms-optout` → suppress across dialer + all sequences (graph 3.10). A DNC is **never** `reactivation:eligible`.
