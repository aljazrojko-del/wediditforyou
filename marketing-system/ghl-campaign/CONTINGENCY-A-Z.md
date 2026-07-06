# WDIFY — CONTINGENCY A-Z (every lead state → what GHL does, no gaps)

One page. Every state a WDIFY lead can be in, what fires, and where they go next. If a lead can reach a state,
there is a row for it. No dead ends, no orphaned leads. **Hard global:** any STOP/unsubscribe/DNC at ANY state
→ **WF-5** (legal terminal, cross-system suppression) and the lead exits everything below.

---

## A. ENTRY STATES (how a lead enters the machine)

| State | What GHL does | Next |
|---|---|---|
| **Inbound web form submitted** | WF-1: ack email + SMS, start 24h clock, opportunity at New Lead ($450), 18h build task to Alex | → Site delivered (B1) |
| **Mia dials, no connect** (voicemail/no-answer/busy) | Mia webhook sets `status:dialed`, opportunity → Dialed; re-dial cadence owned by the dialer | → re-dial, or exhausted → Lost (recyclable) |
| **Mia connects, live + engaged** | Mia webhook `status:connected`, opportunity → Connected; WF-3 ready | → link drop (B2) |
| **Mia connects, hard never-contact** | `status:dnc` | → WF-5 (terminal) |
| **Bad/dead number** | tag `bad-number`; NOT `reactivation:eligible` (re-enrich instead) | → Lost (re-enrich queue) |

---

## B. ACTIVE / NURTURE STATES (link is out, no booking yet)

| State | What GHL does | Next |
|---|---|---|
| **B1. Form lead, site delivered** | WF-2: delivery email+SMS (link), opportunity → Site Link Sent | book → D · silent → +2d nudge → +5d final |
| **B2. Connected lead, link sent** | WF-3: E1 link drop + SMS-B1 immediate, opportunity → Site Link Sent | book → D · silent → E2 +1d → E3 +3d re-loop → E4 +6d walk-away |
| **B3. Half-win** (link sent, reacted, no time pinned) | default the call to same-time-tomorrow (Mia says so) + enter WF-3 re-touch | book → D · silent → post-call ladder |
| **B4. WF-2 ladder exhausted, no booking** | tag `nurture:long-game` → WF-2b (NOT straight to Lost) | book → D · silent → LGN-1..5 over ~24d |
| **B5. Shown-not-closed "let me think"** | one think-it-over touch + enter WF-2b long-game | book → D · silent → LGN ladder |
| **B6. Long-game (WF-2b) exhausted** | opportunity → Lost (reason: nurture-exhausted), tag `reactivation:eligible`, draft stays live | → 30-60d → F (reactivation) |
| **B7. Books at ANY point in B** | goal event fires, all remaining nurture steps auto-skip | → D (booked) |

> **Gap guard:** the goal event (`status:booked`/`status:approved`/≥Walkthrough Booked/DND) is set on WF-1,
> WF-2, WF-2b, WF-3 so the instant a lead books or buys, NO "your site's just sitting there" step can fire.

---

## C. COLD STATES (WF-D, held off — but wired)

| State | What GHL does | Next |
|---|---|---|
| **C1. Cold email lead** (held off until domains warmed) | WF-D: Email 1 (no link) → 2 → 3 → 4 walk-away. Suppressed if in any warm sequence or ≥Connected | reply → C2 · silent → ends (no Email 5 ever) |
| **C2. Cold lead replies "send it"** | **WF-Dr** fires the bare draft link instantly + notifies Alex, opportunity → Site Link Sent | → B (warm nurture) |
| **C3. Cold + warm collision risk** | daily dedupe job tags `cold-suppress` if a warm record exists by phone/email | → stays warm-only |

---

## D. BOOKING / SHOW STATES (the show-rate battle)

| State | What GHL does | Next |
|---|---|---|
| **D1. Walkthrough booked (1st time)** | WF-4: confirm email+SMS (gated `appointment count=1`), tag `confirmed-once`, opportunity → Walkthrough Booked | → 24h reminder |
| **D2. 24h before slot** | WF-4: 24h reminder email (re-anchor + one-tap reschedule). Auto-skips if booked <24h out | → 1h reminder |
| **D3. 1h before slot** | WF-4: 1h reminder SMS (the load-bearing show touch + reschedule out) | → walkthrough |
| **D4. Reschedules (moves the slot)** | WF-4r: removes from no-show recovery if mid-recovery, re-anchors all waits to new time, reschedule confirm email+SMS, NO duplicate 1A. 2nd reschedule → tag `reschedule-2x` + notify Alex (he calls) | → D2/D3 for new slot |
| **D5. Shows for walkthrough** | Alex marks Showed; opportunity → Showed | yes → E · think → one touch, stays · no → Lost (recyclable) |
| **D6. No-shows** | WF-4b: +1h recover SMS (4A) + email (4B), zero shame, one-tap rebook; +2d walk-away SMS (4C) + email (4D) if still silent. Then STOP (2 touches max) | rebook → re-enters D (reminder arm) · silent → Lost (recyclable) → F |

---

## E. CLOSE / POST-SALE STATES (won)

| State | What GHL does | Next |
|---|---|---|
| **E1. Approves on the call ($450 won)** | mark WON, opportunity → Site Approved; WF-7 fires | → PAY-1 |
| **E2. Payment captured** | tag `status:paid`; PAY-1 email+SMS (charge confirmed, **30-day guarantee restated**, no upsell) | → WELCOME-1 +15min |
| **E3. Onboarding** | WELCOME-1 email (domain ask: "have one / grab me one"); +2d SMS nudge if no reply | reply → Alex points domain |
| **E4. Domain pointed, live** | tag `status:live`, opportunity → Live/Domain Pointed; WELCOME-2 email+SMS (live link to share, seeds review) | → review loop |
| **E5. First job off the site** | self-report reply tags `status:first-job` → REVIEW-1 email+SMS (ask at peak belief). Fallback: +14d check-in if no report | review → exit · silent → REVIEW-2 |
| **E6. No review after REVIEW-1** | REVIEW-2 email only (+4d), one dignified nudge, then STOP (a 2nd review text nags) | → exit (relationship intact for referral/renewal) |
| **E7. 10th founding deal WON** | flip default opportunity value → $700, update `spots_remaining` → 0, retire all "$450 founding" copy | → standard pricing |

---

## F. RECYCLE / TERMINAL STATES (dead but maybe not forever)

| State | What GHL does | Next |
|---|---|---|
| **F1. Lost, recyclable** (walked-away / gone-cold / nurture-exhausted / no-show-exhausted, DND=false, ≥30d) | tag `reactivation:eligible`; monthly Smart List pulls into WF-6 | → reactivation |
| **F2. Reactivation round 1** | WF-6: call-first for phone-rich (Mia present-tense "still live" reveal) OR 1 email/SMS touch (REA-1, or REA-2 if walked-away). **Gated on `spots_remaining`+`first_founder` set** — scarcity shown, not asserted | book → D · silent 14d → round 2 |
| **F3. Reactivation round 2** | WF-6: last round (cap 2). Same gating | book → D · silent → F4 |
| **F4. Reactivation exhausted** | permanent Lost (never DND — they just never bit) | → archive (re-enrich later if desired) |
| **F5. STOP / unsubscribe / DNC** (from ANY state) | WF-5: DND + tag `sms-optout` + cross-system suppression (dialer + email + SMS). NEVER `reactivation:eligible` | → terminal (legal) |

---

## THE NO-GAP GUARANTEE

Every lead is always in exactly one row above, and every row has a defined "Next." There is no state where a
lead sits with nothing scheduled and no exit:

- **Booked but forgotten?** → D2/D3 reminders → D6 no-show recovery → F reactivation.
- **Got the free draft and ghosted?** → B nurture ladder → B6 long-game → F reactivation.
- **Said no once?** → F (walked-away REA-2 honors the no, leans on lived cost).
- **Replied to a cold email?** → C2 WF-Dr instant link → B warm nurture.
- **Opted out?** → F5 WF-5, suppressed everywhere, never touched again.
- **Won?** → E onboarding → review → referral/renewal relationship.

**The only true terminals are F4 (never bit, archived) and F5 (legal opt-out).** Everything else loops back
toward a booked walkthrough — the one event that produces revenue.
