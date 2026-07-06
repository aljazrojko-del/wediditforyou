# WDIFY — CAMPAIGN MASTER (the irresistible-campaign A-Z)

**Product:** "We Did It For You" — we build a real one-page website FIRST (free, already live at
`sites.wedidit4you.com/{slug}`), then call the owner and reveal it. $0 deposit, live in 24h or free,
**$450 founding price** (first ten, then $700), keep the draft if you walk.
**Founder persona:** Alex Rojko ("Alex"). **Voice caller:** Mia (the AI voice caller).
**Buyer:** busy US small local mobile-service owner (mobile mechanic, dog groomer, tutor), ≤3 employees,
skeptical, not tech-savvy, lives on texts, burned once before.
**Date:** 2026-06-16 · **Status:** panel-fixed, build-ready (gated on the Step-0 deliverability prereqs).

---

## 0. THE ONE-LINE STRATEGY

> We don't sell a website. We hand them a finished one with their name on it, then make the only open
> question "do you want it on your own domain?" — and we put a concrete 30-day guarantee on the $450
> (at least one paying job in 30 days or full refund, keep the site) so saying no means "I'd rather stay
> invisible for free-to-try."

Everything downstream is machinery to protect that single move: **proof first, re-open one loop, time-box
the loss, guarantee the purchase, walk away on strength, never beg.**

### The bonus stack (included, not upsold — panel Review-1 Fix 5)
The core offer is clean; two bonuses make $450 feel like a mistake in our favor, and each
kills a specific objection. Both are stated as INCLUDED in the founding deal, never as add-ons:
- **(a) Google profile setup** — "I set up your Google profile so the site and your listing point at each
  other." Kills the silent "but how do people actually find the site." Product-true and free to deliver (a
  Google Business Profile is free to claim/configure) — unlike any SEO-ranking claim, which the offer never makes.
- **(b) First 30 days of changes on me** — "new photos, new prices, whatever, just text me." Kills "what if I
  need to change it / what if I get stuck," the #1 post-purchase stall for a non-tech owner.
Surfaced in booking 1A and PAY-1 (where the money decision lands), and available to Mia at Beat 5. Two bonuses
move the offer from a clean single item to a stack — the "feel-stupid-to-say-no" threshold.

---

## 1. CHANNEL ARCHITECTURE (who owns what)

| System | Owns | Notes |
|---|---|---|
| **Mia** (the AI voice caller) | the live reveal call — hybrid pitch + book | runs Beats 1-6 (OFFER-AB). Texts the live link mid-call. |
| **Aljaz's stack** | builds the sites + the immediate post-call link delivery | `/api/outreach/send-link` (SMS+email). Sites at `sites.wedidit4you.com/{slug}`. |
| **GHL** | the CRM + the SALES PIPELINE + ALL email/SMS nurture + the BOOKING CALENDAR + reminders + every trigger/workflow | the long game: nurture, no-show recovery, reactivation, post-sale onboarding, review requests. Mia's outcomes + inbound web form FEED GHL. |

**The brain/body split:** Mia and the site-builder are the body that creates the first proof; GHL is the
brain that runs every relationship from that moment forward. A lead enters GHL from one of two doors
(Entry A = Mia's connected call · Entry B = inbound web form) and never leaves the machine until won, dead,
or opted out.

---

## 2. THE FUNNEL A-Z (every state, every sequence)

```
                       ┌─────────────────────── ENTRY A: Mia connected call ──────────────────────┐
                       │                                                                            │
  DIAL → CONNECT → [Mia hybrid: prove (text link) → re-loop → price+guarantee → book] → BOOKED ─────┤
                       │            │ no book (half-win)                                            │
                       │            ▼                                                               │
                       │   POST-CALL NURTURE (WF-3): E1 link drop → E2 +1d → E3 +3d re-loop ────────┤
                       │            → E4 +6d walk-away  (SMS twin rides each)                        │
                       │                                                                            │
  ENTRY B: web form → ACK (WF-1, 24h clock) → SITE DELIVERY (WF-2) → +2d nudge → +5d final ─────────┤
                       │                                                                            │
                       │   long stall → LONG-GAME NURTURE (WF-2b): LGN-1..5 over ~24d ──────────────┤
                       │                                                                            │
                       ▼                                                                            ▼
                    BOOKED ──► CONFIRM (WF-4) ──► 24h reminder ──► 1h reminder SMS ──► WALKTHROUGH ─► SHOWED
                       │                                                                            │
                       │  NO-SHOW (WF-4b): +1h recover ×2 channels → +2d walk-away ×2                │
                       │  RESCHEDULE (WF-4r): affirm + re-lock, re-anchor all waits                  │
                       ▼                                                                            ▼
                   $450 WON ──► POST-SALE (WF-7): PAY-1 (guarantee restated) → WELCOME-1 (domain ask)
                       │            → WELCOME-2 (live on own domain) → REVIEW-1 (on first job) → REVIEW-2
                       ▼
   any dead-but-recyclable state ──► 30-60d ──► REACTIVATION (WF-6): "still live" + lived cost + counted spots
                                                  (call-first for phone-rich; 1 email/SMS touch if email exists)

   ANY state ──► STOP/unsubscribe ──► WF-5 DNC guard (legal terminal, cross-system suppression)
```

**Source-of-truth files (copy lives here, never reworded downstream):**
`produce/post-call.md` · `produce/inbound-form.md` · `produce/booking.md` · `produce/nurture-react.md` ·
`produce/postsale.md` · `produce/cold-email.md` (WF-D, held off). Wiring: `01-GHL-BUILD-SPEC.md`.

---

## 3. PREDICTED FUNNEL MATH (from the 4-persona simulation + OFFER-AB hybrid)

The simulation ran four buyer personas (Dale, Marcus ×2, Earl — all phone-only mobile-service skeptics).
The consensus model, traced from a **revealed/connected call** (the link is on their screen):

### Per 100 CONNECTS (live, still-on-the-line after Mia's opener)

| Stage | Conv. | Survivors | Driver |
|---|---|---|---|
| Connect → positive reaction (site loads, name on it) | **~78%** | 78 | The live link with their name kills scam fear. The single strongest moment in the funnel. (Personas: 75-90%; docs' 100% optimistic.) |
| Positive reaction → book on call | **~58%** | 45 | Re-opened loop (your photos/domain) + $450-before-$700 clock + the new 30-day guarantee. Matches hybrid 60%. |
| Of non-bookers, SMS re-loop rebooks | ~12% of the 33 → +4 | 49 booked | SMS-B3 carries it; email near-zero on this pool. |
| Book → show | **~68%** | 33 shown | Entirely dependent on the 1h SMS + no-show recovery (without them ~45%). The true bottleneck. |
| No-show → rebook | ~40% | (feeds back) | Zero-shame +1h SMS recovers ~half. |
| Show → close $450 | **~42%** | **~14 sales** | Walkthrough = co-finishing a thing they already own; loss-aversion + guarantee replace "should I buy." |

**Net: ~14-16 founding sales per 100 connects** (the OFFER-AB hybrid predicts 16.4). The phone-only
sub-segment models slightly lower (~13-14) purely on weaker show-rate (they miss the email reminder ladder).

### Traced to dials (CONTEXT targets ~20% connect)

742 dials × ~20% connect ≈ **148 connects week 1** → **~9-10 founding sales** → clears the 10-client unlock
to flip the price to $700. Plus **+8-15% recovered over time** by SMS nurture, walk-away, and reactivation
(mostly by text, not email — only 14/742 have email).

### The two numbers copy cannot fully control (every persona flagged these)

1. **Does Mia's voice survive the telemarketer reflex in the first 5 seconds?** ~30-40% of answers survive
   the robot-read open; a human-sounding voice would push past 60%. The whole funnel is gated behind this.
2. **Does the booked owner actually show?** Defended only by the 1h SMS + no-show stack. This is where the
   model is most fragile for a phone-only buyer.

**Predicted close rate:** **~14-16 closes per 100 connects** (≈ **9-10 per 100 dials × 20% connect**, i.e.
~1.5-2 closes per 100 dials), rising with reactivation recovery.

---

## 4. THE PANEL VERDICT + WHAT WE FIXED

### Round 1 (4 reviewers)

| Reviewer lens | Score | Core finding | Status after fixes |
|---|---|---|---|
| **Offer irresistibility (Hormozi)** | 7/10 | Machine is a 9, offer stack a 6. Three holes: thin stake (Google claim the product can't cash), weak guarantee at the $450, unprovable scarcity. | **Fixed** — cost-of-inaction re-aimed at "the searcher who finds nothing books the competitor" (product-true); 30-day money-back-keep-the-site guarantee added at every money moment; live `spots_remaining` counter + named `first_founder` replace "almost gone." |
| **Copy-law execution (Voss)** | 8/10 | ~9 surgical edits: one hard violation ("see you then"), passive closers, soft-begs, negation frames, filler openers, 2 word-count overruns. | **Fixed** — all 9 applied. |
| **Deliverability / compliance** | 6.5/10 | Blockers: missing CAN-SPAM footer + one-click unsubscribe, 10DLC as footnote, no warm-up ramp, location-TZ quiet hours, no cold reply autopath, ongoing dedupe. | **Fixed in spec** — §2.1 footer, §2.2 ramp, §8 10DLC Step-0 gate + recipient-TZ window, WF-Dr reply autopath, daily dedupe, §13 hard gates. |
| **AI-detection** | 6.5/10 | ~19 mid-sentence em-dashes (false PASS in self-audits), anaphora tricolons, cross-sequence phrase stamps, staccato payment trio. | **Fixed** — em-dashes stripped to 0 in bodies, tricolon capped, staccato trio de-skeletoned, false PASS lines corrected. |

### Round 2 re-score (4 reviewers) + FINAL FIXES (this pass)

| Reviewer lens | R2 score | Remaining hole | Status after this pass |
|---|---|---|---|
| **Offer irresistibility (Hormozi)** | 8.5/10 | Guarantee was un-cashable ("make you the obvious choice" = a vibe a skeptic waves off); no $3-4k price anchor; effort not collapsed AT the money moment; no near-term dream; empty bonus stack. | **Fixed** — guarantee made CONCRETE/cashable ("at least one paying job in 30 days") everywhere (post-call E3, booking 1A, PAY-1 A/B+SMS, nurture, CAMPAIGN-MASTER §5); $3-4k agency anchor added at post-call E3; effort collapsed to zero at the booking ask ("fifteen minutes is the whole job, I do all of it"); vivid near-term dream line added ("the first customer who searches your name this week finds you instead of the guy down the road"); 2-bonus stack added as INCLUDED (Google profile setup + first-30-days-of-changes-free) in §0 + PAY-1. |
| **Copy-law / journey-level (Voss)** | 8.3/10 | Cross-FILE cost-of-inaction phrase stamp (~5x to one contact's path); double-label in post-call Lane A; "junk/bait" scam-words planted in E1; cross-sequence "Fair." hedge; duplicate walk-away subjects across journeys. | **Fixed** — cost-of-inaction capped at ≤1 literal skeleton per workflow with distinct angles (searcher / peer-comparison / unattributed-slow-week / lived-bill); Lane A re-rotated to audit→no-question→label→walk-away (E2-A label→no-oriented Q); E1-A de-junked (names the FEELING not the product); standalone "Fair." cut; post-call walk-away subjects changed (`this is the last one` / `leaving you to it`) so no contact sees a repeat across chained journeys. |
| **AI-detection / structural molds** | 7.5/10 | Four molds repeating at the STRUCTURE level (verbatim-diff misses them): cost-of-inaction skeleton (~15x), possession tricolon (~12x), no-oriented question cadence (~10x), label-opener + "still/still/still" asyndeton. Per-file dedupe is the wrong gate. | **Fixed** — all four molds capped per single-contact journey; restructured to vary grammar not just verbs; "15 minutes" lead-ins varied to "one short call / a quarter-hour / before your next job"; **sentence-skeleton dedupe added to the import gate (§8)** so structure, not strings, is tested going forward. |
| **Deliverability / TCPA + 10DLC** | 8.3/10 | Appointment-anchored 1h reminder bypassed recipient-TZ gate (09:00 CT slot = 06:00 Phoenix = pre-8am TCPA violation); cold Email-1 footer contradiction; 2 SMS em-dashes (false PASS); no per-contact SMS frequency cap; first-SMS STOP relied on a fragile assume-earlier-send. | **Fixed in spec + copy** — calendar floor moved to **10:00 CT** + appointment-anchored If/Else gate on `contact.timezone` (§6/§8); cold Email-1 footer reconciled (plain-text postal + `reply STOP`, no hyperlink) (§2.1, cold-email note 7); 2 SMS em-dashes stripped; hard SMS frequency cap (1/24h, 4/7d) added (§8, `last_sms_at`); STOP-line gate wired on `stop_disclosed` so first message on ANY path carries identity + STOP (§8). |

**Aggregate after this pass: irresistible machine, irresistible offer, detector-clean copy, compliant by
construction.** The Round-2 reviews put the floor at 7.5 (structural molds) with the offer at 8.5 and
compliance at 8.3. Every concrete fix from all four re-scores is now applied: the guarantee is cashable, the
price has an anchor and a bonus stack, the four AI molds are capped at the journey level with a structural
import gate to keep them that way, the TCPA quiet-hours landmine is defused at both the calendar floor and a
recipient-TZ guard, and the SMS frequency cap + STOP-line gate are wired rather than assumed. The "no" is now
the irrational position and the build is compliant before the first send.

---

## 5. WHY EVERYTHING IS THE WAY IT IS (the load-bearing rationale)

### Why build the site FIRST (the whole strategy)
A skeptic believes by **seeing**, not hearing. A claim ("I can build you a site") invites resistance; a
**falsifiable proof** ("it's already live, here's the link, tap it") collapses scam fear. The build-first
reveal converts the call from a pitch into a demonstration. Every persona's guard dropped the instant the
site loaded with their real name and reviews.

### Why the link lands mid-call, never withheld
Withholding the link to force a booking IS the con the buyer is braced for. Putting it on their screen at
zero commitment is the trust purchase. The link is the proof that earns the right to ask for anything.

### Why we re-open a loop the instant the link lands (the anti-ghost mechanism)
The #1 risk is the post-preview ghost: they pocket the free draft, the dopamine loop closes, "I'll think
about it" wins. So the draft is handed over **explicitly unfinished** — it's the rough cut, on our subdomain,
without their photos. Possession becomes a Zeigarnik hook (an open loop on a half-finished thing with their
name on it), and **they literally cannot finish it without the 15-minute call.** Endowment flips from an exit
ramp into the hook.

### Why the cost-of-inaction is "the searcher who finds nothing," NOT "you'll rank on Google" (panel Fix 1)
The product is a one-page site. It does not rank, claim a Google Business Profile, or run an SEO engine. The
original copy sold "get found on Google" — a check the product can't cash, and a half-knowledgeable skeptic
smells it. The honest, lethal cost a one-page site genuinely fixes: **a customer hears your name, looks you
up, finds nothing (or a dead 2019 Facebook page), and books the next guy who looks legit.** True dream
outcome = true cost-of-inaction. Hormozi's test passes.

### Why the $450 carries a 30-day money-back-keep-the-site guarantee (panel Fix 2)
The "24h or free" risk-reversal was spent entirely on the FREE part (which cost them nothing anyway). The
$450 ask was naked. Hormozi: stack the guarantee where the money changes hands AND tie it to a concrete
event the buyer controls. Now: "point it at your domain, give it 30 days; if you don't get at least one
paying job off it in that window, I refund the $450 and you keep the site live." The trigger is concrete and
verifiable (a paying job), not the vague "obvious choice" weasel a skeptic dismisses as un-provable (panel
Review-1 Fix 1) — and it's a bar a real local site clears easily, so it's safe to honor and impossible to
wave off. The only risk left is theirs to lose. Spoken at Mia Beat 5, written into post-call E3, booking 1A,
and PAY-1.

### Why scarcity is a LIVE counter + a named founder, not "almost gone" (panel Fix 3)
"First ten, then it doubles," repeated 20+ times with no visible count, reads as the timeshare "only good
today" trick to a burned skeptic — repetition compounds doubt, not urgency. Worse, the reactivation copy
said "almost gone... barely" at day 60 while the price never moved, training the lead that our scarcity is
fake. Fix: `{{custom_values.spots_remaining}}` is a real GHL counter (10 − won founding deals) and
`{{custom_values.first_founder}}` names the first real client. Scarcity is shown, not asserted. If the count
genuinely hasn't moved between a lead's touches, the reactivation hook leans on the **lived cost** instead.

### Why post-call is a 4-email cadence with SMS twins
The connect bought a sliver of trust; the sequence keeps the loop open and time-boxed. E1 delivers the proof
while Mia's voice is still in their ear. E3 (+3d) is the conversion engine — the re-loop in writing, now
carrying the guarantee. E4 walks away on strength. SMS carries the phone-rich majority (only 14/742 have
email); the email rides behind the text.

### Why booking → reminders → no-show is over-engineered
The prediction is unambiguous: **the bottleneck is SHOW rate, not book rate.** A busy owner books on a
4-minute call between jobs and forgets. The 1h SMS reminder is the single load-bearing touch (every persona:
it's the difference between showing at ~68% and ghosting at ~45%). The reschedule link is the pressure-release
valve that converts a real conflict into a moved slot instead of a silent no-show. No-show recovery gets 2
touches per channel because a no-show is a forgotten "yes," not a "no."

### Why every nurture/reactivation workflow has a hard goal event
The instant a lead books or buys, every remaining "your site's just sitting there" step auto-skips. Emailing
"still the rough cut" to someone who already booked is the #1 way automation looks broken and torches a warm
lead's trust. The goal event is non-negotiable on every workflow.

### Why reactivation is a STRONGER pitch than the first touch
A 30-60 day dead lead is warmer to THIS offer because: (1) the asset still exists ("your site is still live"
is a pattern-break — dead leads expect a re-pitch, not a reminder they own something), (2) the lived cost has
been running the whole time (no longer hypothetical), (3) the founding window is now provably counted. So
reactivation leads with present-tense possession + lived cost + a real counter.

### Why we NEVER beg, introduce ourselves, or over-explain
The buyer reads begging as confirmation of the con. Every email leads with the gift (the live site), attaches
exactly one loss (the searcher who finds nothing, or the price closing), uses exactly one Voss device, ends
on strength, and signs "— alex." A confident plain line out-converts hedged corporate copy and reads as a
human wrote it — which matters because every AI-detector flag costs a reply.

### Why the deliverability layer is a Step-0 gate, not a footnote
SMS is the primary channel and the pool is phone-rich. With no registered A2P 10DLC campaign, carriers block
the messages and the whole channel silently fails. A missing CAN-SPAM footer is a per-email statutory
violation that also tanks the warm domain. A brand-new sending subdomain has zero reputation and lands in
spam even at low volume without a ramp. Quiet hours keyed to the location TZ (Chicago) text Phoenix owners at
7am — a TCPA violation. These are total-channel failure modes; they gate GO-LIVE, not the build.

### Why the appointment-anchored reminder is the last TCPA landmine (panel Round-2 Fix)
The import-time recipient-TZ gate covers nurture sends, but the 1h reminder and the no-show T+1h SMS fire off
`{{appointment.start_time}}`, which bypasses it. A 09:00 CT slot booked by a Phoenix owner is 07:00 local; the
1h reminder then fires at 06:00 Phoenix — a hard pre-8am violation. Two-layer fix: the calendar floor moves to
**10:00 CT** (so the earliest possible 1h-reminder is 08:00 in the worst-case TZ) AND every appointment-anchored
SMS is wrapped in a recipient-TZ If/Else. Belt-and-suspenders, because a single TCPA violation is not a copy
problem — it's a legal one.

### Why SMS has a hard frequency cap and a wired STOP-line gate (panel Round-2 Fix)
Worst-case to one number across all workflows (post-call B1–B4 → book → confirm + 1h → no-show 4A+4C) is ~8
SMS in two weeks — exactly the fatigue that triggers consumer complaints and 10DLC throughput throttling. So a
hard cap (1 marketing SMS / 24h, 4 / rolling 7 days; transactional reminders exempt) is wired at the location
level, and SMS-B2/B4 stay default-OFF. Separately, the first-SMS STOP disclosure was relying on a fragile
"assume an earlier SMS already sent it" — a reactivation text after a 60-day gap or a booking text that happens
to be the first message could go out with no identity + STOP line. Fixed by a `stop_disclosed` gate on every
SMS send: the first message to ANY number on ANY path always carries `We Did It For You` + `Reply STOP to opt
out`, then flips the flag. Guaranteed, not assumed.

---

## 6. 3-CEO GATE

- **Hormozi (money?):** the machine defends the two revenue-leak points (show-rate WF-4/4b, book-rate
  WF-2/WF-3 re-loop) that separate 6.9 from 16.4 sales/100; the offer now has a true stake, a guarantee on
  the money, and provable scarcity. Direct revenue.
- **Amodei (smarter?):** every email/SMS runs an A/B arm (consequence vs possession), per-arm show-rate and
  close-rate logged; the named founding client becomes the social proof that converts the next cold call. The
  loop compounds.
- **Brunson (next step?):** every touchpoint ends on the next action — the link, the booking, the locked
  time, the domain ask, the review — never a dead end. The funnel has no gap (see CONTINGENCY-A-Z.md).

---

## 7. FILE INDEX

| File | What |
|---|---|
| `CAMPAIGN-MASTER.md` | this — the A-Z, the math, the why |
| `BUILD-ORDER.md` | exact click-by-click GHL build order (API-able vs UI-only) |
| `CONTINGENCY-A-Z.md` | every lead state → what GHL does, no gaps |
| `01-GHL-BUILD-SPEC.md` | the full technical spec (fields, tags, pipeline, calendar, workflows, API) |
| `00-TOUCHPOINT-GRAPH.md` | the state machine the workflows implement |
| `produce/*.md` | the panel-approved copy (source of truth) |
| `../OFFER-AB-PREDICTION.md` | the winning hybrid + Mia's call script (Beats 1-6, guarantee at Beat 5) |
