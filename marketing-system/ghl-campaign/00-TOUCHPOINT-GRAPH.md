# WDIFY — MASTER TOUCHPOINT + AUTOMATION GRAPH (the A–Z state machine)

**Purpose:** one document a reader can use to trace ANY lead, from ANY entry point, to ANY terminal
state, and know exactly what GHL (and Mia, and Aljaz's stack) does at each step. This is the
contingency plan — every call outcome, every lead state, every branch, every message, every timing,
every exit/re-entry rule, end to end.

**Date:** 2026-06-16 · **Built on (do not contradict):**
`../CONTEXT.md` · `../email/SEQUENCES.md` (A1–A4, B1–B3, C1–C3, D1–D4) · `../sms/SMS-COPY.md` (SMS-1…5) ·
`../ghl/GHL-BUILD-SPEC.md` (WF-1…WF-5, pipeline, fields, calendar) · `../OFFER-AB-PREDICTION.md` (the
winning Hybrid pitch) · `../mia/CALL-SCRIPTS.md` (Mia's 12 objections + dispositions) ·
`../REPO-INTEGRATION-MAP.md` (Supabase write-back + Aljaz's `/api/outreach/send-link`).

**Copy law (every message in this graph obeys it):** the WDIFY copy standards.
Never reword copy here — the canon files own the words; this file owns the **wiring + branching logic**.

---

## 0. THE CAST — who owns what (so a branch never fires the wrong system)

| System | Owns | Never does |
|---|---|---|
| **Mia** (the AI voice caller (SignalWire + Gemini Live, NEPQ)) | Every outbound *call*; the live reveal pitch (Hybrid); books the walkthrough; fires `send_materials` for the on-call link drop | Never sends email; never edits the GHL pipeline directly — it writes **tags + call_outcome** and GHL reacts |
| **Aljaz's stack** (`/api/outreach/send-link`, `generate-sites.ts`, Supabase `public.leads`) | Builds the site (`slug`+content), the immediate post-call SMS/email link delivery, inbound-SMS logging, Stripe + welcome flows | Never owns the CRM pipeline, nurture cadence, or booking calendar |
| **GHL** | The **CRM record**, the **WDIFY Sales pipeline** (single source of truth for "where is this deal"), ALL nurture email/SMS sequences, the **booking calendar + reminders**, every trigger/workflow, DND/suppression | Never places calls; never builds sites; never custom-SMTP (LC Email only) |

**The contract in one line:** Mia + the web form + the reactivation list FEED GHL (via tags/fields/form);
GHL runs the long game (nurture, no-show recovery, reactivation, post-sale). Mia writes `call_*` to
Supabase; Aljaz writes `slug`/`sms_*`/`inbound_*`; GHL owns `status:*` tags + opportunity stage.

**WHY this separation:** dedicated-per-project + zero column-write collisions (REPO-INTEGRATION-MAP §5C).
One writer per resource = no races, no phantom conflicts, clean rollback. GHL is the brain of the long
game *because* it's the only place that can see a lead across all three entry points and every prior touch.

---

## 1. ENTRY POINTS (the three ways a lead enters the machine)

Every lead enters through exactly one of these. Each entry sets `source:*` (immutable origin) and drops
the lead onto the board at a specific stage. `status:*` tags are **additive history** (never removed);
the **opportunity stage is the single source of truth** for current position.

### Entry A — Mia cold call (the PRIMARY channel; 742-lead pool, ~14 have email)
- **Pre-condition (the whole hook):** the site must be **built BEFORE the dial** (SITE-PIPELINE.md).
  Batch-build the day's list → `sites.wedidit4you.com/{slug}` → only then route Mia to that lead.
  A lead whose site isn't built yet gets the COLD safety-net opener (future-tense gift), and graduates
  to the full Hybrid reveal automatically once `slug` lands (REPO-INTEGRATION-MAP §3).
- **Enters GHL via:** Mia post-call webhook → `POST /contacts/upsert` with `call_outcome`,
  `call_recording_url`, captured email (if any), tags `source:mia` + `status:dialed` (+ the outcome
  tag). First dial creates the opportunity at **Dialed** (or **Connected** on a live answer).
- **Board entry:** **New Lead** (pre-dial, if pre-loaded) → **Dialed** on first dial.
- **WHY primary:** only 14/742 have email, so the *voice connect is the scarce resource*. The call is
  where trust is won (skeptic buyer, OFFER-AB-PREDICTION §1) and where the link drop + booking happen.

### Entry B — Inbound web form (the WARM channel; highest intent)
- **Trigger:** GHL form submission (the 60-second site form) OR the site backend upserts the contact with
  tag `source:form` (works no matter where the form lives).
- **Enters GHL via:** WF-1 "Form In — 24h Clock". Creates opportunity at **New Lead** ($450), tag
  `status:new`, sends **ACK-1 (=A1)** instantly, sets an 18h BUILD task for Alex (6h safety buffer on
  the 24h promise), internal notification.
- **Board entry:** **New Lead**.
- **WHY warm:** they raised their hand — they already believe the premise. The only job is to deliver the
  live URL inside 24h (the promise) and convert curiosity into a booked walkthrough. No skepticism gate.

### Entry C — Reactivation of old/cold leads (the RECYCLING channel)
- **What it is:** leads that already ran the machine and reached a non-terminal dead end — **gone-cold**
  (no-answer exhausted, never connected), **showed-not-closed** (walked with the draft), or aged
  **Site Link Sent** with no booking — pulled back in after a cooldown.
- **Trigger:** monthly reactivation run. A Smart List selects `status:lost` (reason ≠ dnc) OR opportunity
  in **Site Link Sent**/**Connected** with no stage change in **30 days**, AND `DND = false`. The
  reactivation either (i) re-queues the phone into Mia's dialer with the SPEC reveal (their site already
  exists → present-tense "it's still live, still yours"), or (ii) fires a single reactivation email/SMS.
- **Enters GHL via:** tag `reactivation:round-N` added → WF-6 (below). Re-opens the SAME opportunity
  (don't create a duplicate) and moves it back to **Dialed**/**Site Link Sent** as appropriate.
- **Board entry:** re-entry to **Dialed** (if re-called) or a one-touch nudge that can move it to
  **Walkthrough Booked**.
- **WHY recycle, not discard:** the asset (a live, personalized-able draft with their name on it) already
  exists and cost nothing to keep alive. A cold lead from 60 days ago is a warm lead today if "your site
  is *still* live" — loss-aversion compounds over time (the founding price is the clock). The only leads
  we never recycle are `status:dnc` (legal) and hard-bad-number.

> **Entry-point de-dupe rule:** GHL upserts dedupe by phone/email server-side. If a form lead (Entry B)
> already exists as a Mia lead (Entry A), it is ONE contact — the form trigger still fires WF-1, but the
> opportunity is reused, not duplicated. `source:*` records the *original* origin; a second origin adds a
> second `source:*` tag (history) without changing the first.

---

## 2. THE PIPELINE — "WDIFY Sales" (the spine of the state machine)

Nine stages. The opportunity stage is the **single source of truth** for current position. Below: the
exact **entry condition** (what moves a lead IN) and **exit condition** (what moves it OUT) for each.

| # | Stage | ENTRY condition (moves in) | EXIT condition (moves out) | Opp value | Terminal? |
|---|---|---|---|---|---|
| 1 | **New Lead** | Form submit (WF-1) OR lead pre-loaded before first dial | First dial placed → Dialed; or form lead's site delivered → Site Link Sent | $450 | no |
| 2 | **Dialed** | Mia places first call (any non-connect outcome, or pre-connect) | Live answer → Connected; DNC → Lost/DNC; bad number → Lost/DNC; no-answer attempts exhausted → Lost/DNC (gone-cold) | $450 | no |
| 3 | **Connected** | Mia call disposition = `connected` (live human, engaged) | Link sent on/after call → Site Link Sent; hard "never contact" → Lost/DNC; flat refusal (not DNC) → stays, recycle later | $450 | no |
| 4 | **Site Link Sent** | `contact.draft_site_url` set AND link delivered (SMS/email) — by WF-3 (post-connect) or WF-2 (form/build-ready) | Booking made → Walkthrough Booked; nurture exhausted + no booking → Lost (gone-cold, recyclable) | $450 | no |
| 5 | **Walkthrough Booked** | Appointment created on the 15-min Site Walkthrough calendar (WF-4) | Attended → Showed; marked No-Show → stays at Walkthrough Booked (WF-4b recovery) until rebooked or exhausted | $450 | no |
| 6 | **Showed** | Appointment marked "Showed/Completed" by Alex | Says yes → Site Approved; says no but keeps draft → Lost (walked-away, recyclable); wants to think → stays, nurture | $450 | no |
| 7 | **Site Approved ($450 won)** | Owner approves on the walkthrough → **mark opportunity WON**, value $450 (founding) / $700 (post-10) | Always exits forward → Live/Domain Pointed (fulfillment) | **$450 WON** | won |
| 8 | **Live/Domain Pointed** | Domain pointed + site live on their domain (fulfillment complete) | Terminal-positive: enters post-sale (onboarding/welcome/review-request) | $450 | **yes (won)** |
| 9 | **Lost/DNC** | DNC, bad number, exhausted no-contact, or explicit walk-away | DNC = permanent terminal; Lost (non-dnc) = recyclable → can re-enter Dialed via WF-6 | $0 | **yes** |

**WHY this stage order:** it mirrors the buyer's psychological journey for a *skeptic*
(OFFER-AB-PREDICTION §1): Dialed/Connected = win the trust gate; Site Link Sent = the proof landed (B's
move); Walkthrough Booked = the re-opened loop (your photos/number/domain + price-lock); Showed = the
moment commitment is highest; Site Approved = loss-aversion closes it. Each stage has exactly one "soft
spot" the nurture is designed to defend — **Show-rate** (defended by reminders + no-show recovery) and
**book-rate** (defended by the re-armed loop, not curiosity). The board never has two truths: stage =
where it is; tags = how it got there.

**Default opp value $450** while founding-10 is open; flip default to **$700** the moment the 10th WON
opportunity lands (manual or a Smart-List counter). The `founding_spot_number` field (1–10) is assigned
at delivery; spot 10 closing is the trigger to change the calendar/email price language to $700.

---

## 3. THE STATE MACHINE — every call outcome + lead state → branch → what fires

Below, each row is a **state**. For each: the trigger that detects it, the pipeline move, the
message(s) that fire (with the canon ID), the timing, and the exit/re-entry rule. This is the part a
reader traces. Mia's dispositions map to the `call_outcome` custom field
(`connected / voicemail / no_answer / bad_number / callback / dnc`) which Mia's webhook writes
(GHL-BUILD-SPEC §8.5), and to the `status:*` tags that fire the workflows.

### 3.1 — ANSWERED + INTERESTED (the happy path: live connect, positive reaction)
- **Detect:** `call_outcome=connected`, Mia ran the Hybrid (proof → re-open loop → price → book).
  Webhook adds `status:connected` → **WF-3 fires**.
- **Pipeline:** Dialed → **Connected**. Then, the instant the link is delivered → **Site Link Sent**.
- **Fires (in order, all within ~2 min of hang-up):**
  1. **If `draft_site_url` exists** (built lead — the designed-for case):
     - Mia already texted the link live on the call via `send_materials` → Aljaz's
       `/api/outreach/send-link` (city-routed SMS-first, email fallback). This is the *on-call* drop.
     - GHL WF-3 then sends **LNK-1 (=SMS-1)** [spec-build owners get **SMS-2**] as the belt-and-suspenders
       text, and **LNK-2 (=B1 email)** if an email was captured. Adds `status:site-sent` → enrolls WF-2
       (which **skips DLV-1** because `status:connected` is present — no duplicate "your site is live").
  2. **If `draft_site_url` is empty** (un-built lead slipped through — COLD path): Mia ran the future-tense
     gift opener and captured the email/permission. WF-3 creates a **HOT BUILD task** for Alex (due 12h),
     internal notification. Once Alex builds + sets `draft_site_url`, the lead graduates: `status:site-sent`
     added → WF-2 sends **DLV-1 (=A2)** as the "your site is live" reveal (now a true SPEC second touch).
- **Then:** if Mia **booked** on the call → see 3.5. If Mia got the link out but **no time pinned**
  (the "half-win") → the lead sits in **Site Link Sent** and the WF-2 nudge engine takes over (3.4).
- **Exit/re-entry:** exits to Walkthrough Booked on a booking, or to Lost (gone-cold, recyclable) if
  nurture exhausts with no booking. **WHY:** the link is the trust-purchase; the booking is the real
  asset (OFFER-AB §4). We deliver proof instantly (kill scam fear) then let the open loop + nurture pull
  the booking — never let "interested" sit without the link in their pocket within 2 minutes.

### 3.2 — ANSWERED + OBJECTION (live connect, friction before/around the reveal)
- **Detect:** still `call_outcome=connected` (a live, handled objection is still a connect). Mia runs the
  exact counter from CALL-SCRIPTS §4 (the 12). Outcome splits by where the objection lands:
  - **Objection handled → reaction → link out:** treat as **3.1 ANSWERED+INTERESTED**. Same wiring.
  - **"Send me something" / "I'm driving" / "call me later" → callback agreed:** `call_outcome=callback`.
    Tag `status:dialed`, add **Task (Alex/redial queue):** redial at the agreed time; capture email if
    offered. **Stays at Connected** (don't advance — no link consumed yet) OR if a link WAS texted, advance
    to Site Link Sent + WF-2. **WHY:** a callback is a soft-yes, not a loss — keep it warm, don't burn it
    into nurture prematurely.
  - **"Is this a scam/robot?" handled, they relax → link out:** 3.1. (The site IS the scam-killer —
    OFFER-AB §1; the script's job is to earn the 10 seconds to get the link onto their phone.)
  - **Flat "not interested" (NOT a DNC request):** `call_outcome=connected` but no link wanted. Tag
    `status:dialed`; **leave the opportunity at Connected**; add to the **reactivation pool** (recyclable
    in 30–60d with "your site's still live"). Do NOT mark Lost yet — a soft no from a skeptic on the first
    touch is not a permanent no. No nurture sequence fires (we don't have a link-delivered hook). **WHY:**
    respect the no without discarding the asset; the draft outlives the mood.
- **Exit/re-entry:** callback → re-dial loop; flat-no → 30–60d reactivation (Entry C); any link-out →
  merges into the Site Link Sent nurture.

### 3.3 — NO-ANSWER and VOICEMAIL (no live human)
- **NO-ANSWER (`call_outcome=no_answer`):** ring-out, no pickup, no VM. Tag `status:dialed`; opportunity
  stays at **Dialed**. **Re-dial cadence (Mia/dialer, not GHL nurture):** attempt up to **4 times** across
  **business hours over ~5 business days** (vary time-of-day: AM, midday, PM). No SMS/email yet (no
  consent captured, B2B cold). After 4 no-answers with no VM contact → **gone-cold** → opportunity →
  **Lost/DNC** (reason: no-contact), tagged `reactivation:eligible`. **WHY:** spacing across dayparts
  catches a mobile owner between jobs; 4 is the point of diminishing returns before it reads as harassment.
- **VOICEMAIL (`call_outcome=voicemail`, 9s detection):** Mia leaves the ~19s VM (spec-build or cold,
  CALL-SCRIPTS §6) which *promises a text*. Tag `status:dialed`; stays at **Dialed**.
  - **If the lead is a BUILT spec lead** and a number is textable post-VM: fire **SMS-2** (spec) /
    **SMS-1** (built cold) as the promised link drop → advance to **Site Link Sent** + WF-2 nurture
    (the VM + text becomes a legitimate one-two). **WHY:** the VM script explicitly says "I'm texting the
    link the second I hang up" — honor it; the text does the selling the VM can't.
  - **If un-built:** VM only, no text (nothing to send). Continue the no-answer re-dial cadence; build the
    site in parallel so the next attempt is a full SPEC reveal.
- **Exit/re-entry:** voicemail-that-texted → Site Link Sent nurture; pure no-answer/VM → re-dial loop →
  gone-cold → Lost (recyclable).

### 3.4 — SITE LINK SENT, NO BOOKING (the nurture engine; WF-2)
- **State:** link is in their pocket (`draft_site_url` set, `status:site-sent`), opportunity at **Site
  Link Sent**, but no appointment. This is the lead state where the long game lives.
- **Fires (WF-2 "Site Delivered — Nudge Engine"), with the duplicate-guard:**
  - If they reached here via WF-3 (connected) → **skip DLV-1** (they already have the link from the call).
  - **NDG-1 (=A3)** — **+2 days** after link: "it's just sitting there" (label + dollarize-by-question).
  - **NDG-2 (=A4)** — **+5 days** after link (3 days after NDG-1): "yours either way" (walk-away, draft is
    theirs, founding price ends at ten).
  - Form-origin leads that never connected by call get the full **DLV-1 (=A2) → NDG-1 → NDG-2** ladder.
- **Goal/exit (WF-2 stops the moment any of these is true):** `status:booked` OR `status:approved` OR
  opportunity ≥ Walkthrough Booked OR DND. **WHY a goal, not a fixed length:** the second they book, every
  remaining nurison auto-skips — no "your site is just sitting there" email after they've already booked
  (the #1 way automation looks broken and kills trust).
- **End of nurture, still no booking:** opportunity → **Lost** (reason: gone-cold), `reactivation:eligible`.
  The draft stays live. **WHY stop at NDG-2:** beyond a dignified walk-away, more emails beg — and begging
  is banned (copy law). Recycle in 30–60d instead of nagging now.

### 3.5 — BOOKED (appointment created; WF-4)
- **Detect:** appointment created on the **15-min Site Walkthrough** calendar (booked by Mia on the call,
  or self-booked from a nurture link). **WF-4 fires.**
- **Pipeline:** → **Walkthrough Booked**; tag `status:booked`.
- **Fires:**
  - **BKG-1 (=C1 email)** "you're locked in" + **BKG-2 (=SMS-3)** immediately on booking.
  - **RMD-1 (=SMS-4)** at **T-1 hour** before the slot.
  - (Optional, recommended: a T-24h email/SMS reminder for next-day-or-later slots — same RMD copy family;
    keep total reminders ≤2 to avoid reminder fatigue.)
- **Calendar config that makes this safe:** native calendar confirmations/reminders **OFF** (WF-4 owns ALL
  comms — prevents double-texting), auto-confirm ON, 15-min slots, 10-min buffer, 2h min notice, max
  12/day, location "Phone — I call you" → `{{contact.phone}}`, Mon–Fri 09:00–15:00 CT.
- **Exit:** attended → **Showed** (3.6); missed → **No-Show** (3.7). **WHY the spot-hold language in
  C1/C3:** the $450 founding spot "holds through this call" reframes the reminder as free no-show
  insurance (loss-aversion), not a nag.

### 3.6 — SHOWED, NOT CLOSED (attended walkthrough, no yes yet)
- **Detect:** Alex marks the appointment **Showed/Completed**; outcome ≠ approved. Pipeline →
  **Showed**.
- **Branches:**
  - **"Yes, I want it" →** 3.8 SITE-APPROVED (won).
  - **"Let me think / talk to my partner":** stays at **Showed**; add **Task (Alex):** personal follow-up
    in 48h; enroll a **short think-it-over nurture** (1 email at +2d that restates the loss — founding
    price clock + the now-personalized site — using the A4/B3 walk-away tone, NOT a "just checking in").
    Cap at one nurturing touch + one Alex task. **WHY:** they've seen the finished, personalized thing —
    this is the warmest a lead ever gets; one consequence-framed nudge converts, a second begs.
  - **"No, but I'll keep the draft":** → **walked-away** (3.9) → Lost (recyclable).
- **Exit/re-entry:** yes → won; think → 48h Alex touch then either won or → walked-away; explicit no →
  walked-away → 30–60d reactivation.

### 3.7 — NO-SHOW (booked, didn't attend; WF-4b)
- **Detect:** Alex marks appointment **No Show**. **WF-4b fires.** Opportunity **stays at Walkthrough
  Booked** (it's a delay, not a loss — OFFER-AB §5).
- **Fires:**
  - **NSH-1 (=SMS-5)** + **NSH-2 (=C3 email "have you given up")** at **+1 hour** after the missed start.
  - **Task (Alex):** redial tomorrow 9am their time.
- **Recovery loop:** rebooks → back to **Walkthrough Booked** + WF-4 (3.5). Up to **2** no-show recovery
  cycles. After the 2nd no-show with no rebooking → opportunity → **Lost** (reason: no-show-exhausted),
  `reactivation:eligible`, draft stays live. **WHY recoverable:** unlike a curiosity-only booking, the
  link + a real SMS/email sequence are already in their hands — a missed slot is a delay; the proof
  already landed. **WHY cap at 2:** past two misses, the calendar slot cost outweighs the conversion odds;
  recycle later instead.

### 3.8 — SITE APPROVED ($450 WON) — the close
- **Detect:** owner approves on the walkthrough (or via Stripe/payment). Alex moves opportunity to **Site
  Approved ($450 won)** → **mark WON**, value $450 (or $700 post-10), assign `founding_spot_number`.
- **Fires:** immediate internal "WON" notification; **stops all nurture** (goal met). Hands off to
  fulfillment (3.10 post-sale path).
- **Exit:** always forward → **Live/Domain Pointed**. **WHY mark WON here, not at go-live:** revenue is
  committed at approval; fulfillment is execution. Keeps pipeline forecasting honest and triggers post-sale.

### 3.9 — WALKED AWAY (keep the draft) — the dignified loss
- **Detect:** explicit "no thanks, I'll keep the draft" (on the call or after the walkthrough).
- **Pipeline:** → **Lost/DNC** (reason: walked-away — NOT dnc). Tag `reactivation:eligible`.
- **Fires:** the walk-away email if not already sent (**B3** for connected leads / **A4** for form leads) —
  ends on strength, draft stays theirs, door open. NO further nurture.
- **Exit/re-entry:** 30–60d → Entry C reactivation ("your site's *still* live, founding price's almost
  gone"). **WHY keep them warm:** they liked it enough to take the draft; the only missing piece is timing
  or budget — both change. The kept draft is a standing, zero-cost ad for the offer.

### 3.10 — DNC / STOP — the legal terminal (WF-5)
- **Detect (any):** (a) SMS reply contains `stop`/`unsubscribe`/`remove`/`quit`/`don't call` (GHL
  auto-DNDs standard STOP; WF-5 catches variants); (b) tag `status:dnc` (Mia disposition `dnc`); (c) email
  unsubscribe. **WF-5 "STOP/DNC Guard" fires.**
- **Fires:** enable **DND — all channels**; tag `status:dnc` + `sms-optout`; **remove from ALL other
  workflows**; opportunity → **Lost/DNC**; internal notification to Alex.
- **Suppression (critical, cross-system):** weekly export DND contacts → feed **Mia's suppression list**
  AND **Sequence D suppression** so a DNC number never re-enters ANY campaign (dialer, SMS, email).
  `reactivation:eligible` is **never** set on a DNC.
- **Exit:** **permanent terminal. No re-entry, ever.** **WHY:** TCPA — honor every DNC instantly, no
  counter, no last pitch (CALL-SCRIPTS §7). This is the one branch with zero recovery path by design.

### 3.11 — GONE COLD — the recyclable terminal
- **Detect:** no-answer cadence exhausted (3.3), or Site-Link-Sent nurture exhausted (3.4), or no-show
  recovery exhausted (3.7) — all with no booking and no DNC.
- **Pipeline:** → **Lost** (reason recorded: no-contact / nurture-exhausted / no-show-exhausted), tag
  `reactivation:eligible`. Draft stays live.
- **Exit/re-entry:** monthly **WF-6 reactivation** (Entry C) re-opens the SAME opportunity. **WHY a
  recyclable terminal, not a dead one:** the site exists and costs nothing to keep alive; "your site is
  *still* live" + a shrinking founding window is a stronger pitch in 60 days than the first cold call was.

### 3.12 — BAD NUMBER — the hard-fail terminal
- **Detect:** `call_outcome=bad_number` (disconnected / not in service / wrong business).
- **Pipeline:** → **Lost/DNC** (reason: bad-number). Tag `bad-number`. **No SMS/email** (would bounce or
  hit a stranger). **Not** `reactivation:eligible` for re-dialing (the number's dead) — but flag for
  **re-enrichment**: if a better phone/email surfaces (re-scrape, owner enrichment), it becomes a
  fresh Entry-A/B lead. **WHY:** never burn deliverability or risk texting a stranger on a dead number;
  fix the data, then re-enter clean.

---

## 4. THE REACTIVATION WORKFLOW — WF-6 (closes the recycling loop; new in this graph)

> Not in GHL-BUILD-SPEC's WF-1…WF-5 — add this as the 6th workflow so Entry C is fully automated.

- **Trigger:** monthly cron (or manual run). Smart List membership: opportunity in **Lost** with reason ∈
  {walked-away, gone-cold, nurture-exhausted, no-show-exhausted} AND `DND = false` AND last stage change
  ≥ **30 days** ago AND `reactivation:eligible`.
- **Actions:**
  1. Tag `reactivation:round-{N}` (N increments each round; **cap at 2 rounds** then permanent Lost).
  2. **Re-open the existing opportunity** (never create a duplicate) → move to **Site Link Sent** (their
     site still exists) OR **Dialed** if re-queuing the dialer.
  3. **If re-calling (preferred for phone-rich, email-poor pool):** re-queue the phone into Mia's dialer
     with the **SPEC reveal** (present-tense: "your site's *still* live, your name's still on it, and the
     founding price is almost gone"). Mia's outcome re-enters the §3 state machine exactly as a first call.
  4. **If email-only touch (when a number's exhausted but email exists):** ONE reactivation email — the
     B3/A4 walk-away family re-pointed at the live link + the closing founding window. No ladder.
  5. **Goal/exit:** booking OR approval OR DND.
- **Exit/re-entry:** any positive outcome rejoins the main funnel at the matching stage. After round 2
  with no engagement → opportunity stays **Lost**, remove `reactivation:eligible` (permanent, but never
  DND — they just never bit). **WHY cap at 2:** beyond that it's noise; the founding-price scarcity is
  spent and the data's stale — better to re-enrich and re-enter clean than to keep poking.

---

## 5. POST-SALE PATH — fulfillment, onboarding, review request (the won branch)

After **Site Approved ($450 won)**, the lead is a *customer* — the funnel's job flips from convert to
deliver + delight + extract referral/review. Aljaz's Stripe/welcome automations own the mechanics; GHL
owns the relationship comms and the pipeline reflection.

### 5.1 — Onboarding (Site Approved → Live/Domain Pointed)
- **Trigger:** opportunity marked WON. Tag `status:approved`.
- **Fires:**
  - **Welcome email + SMS** (Aljaz's `welcome_*` automation post-Stripe; GHL sends a branded welcome from
    info@ on the relationship side) — confirms the $450, the founding spot number, and the single next
    step: "send us your domain login (or buy one, we point it) + your real photos + your number."
  - **Task (Alex):** point the domain + swap in real photos/number/colors (the deliverable promised on the
    walkthrough). The walkthrough *is* the onboarding intake — collect domain/photos/number there.
  - **Internal:** mark `founding_spot_number`; if it's #10, trigger the **price-flip** (default opp value,
    calendar copy, email copy → $700).
- **Pipeline:** stays at **Site Approved** until the site is live on their domain → move to **Live/Domain
  Pointed**. **WHY a separate stage:** "paid" ≠ "delivered." Live/Domain Pointed is the proof of
  fulfillment and the gate for the review request (you can't ask for a review before they have the thing).

### 5.2 — Domain pointing + go-live
- **Trigger:** domain pointed, site resolves on their own domain.
- **Fires:** **"you're live" email + SMS** — the URL on their own domain, a "here's how to share it" line,
  and set the expectation for the review ask after their first job. Pipeline → **Live/Domain Pointed**
  (terminal-positive). **WHY mark the go-live explicitly:** it starts the review-request clock and is the
  cleanest signal for a "delivered founding client" Smart List (social proof + the next price tier).

### 5.3 — Review request (after the first job)
- **Trigger:** `last_job_completed_at` set (owner reports a job done) OR **+14 days** after go-live as a
  fallback (Aljaz's review-request automation: `review_request_sent_at` → `review_received_at`).
- **Fires:** ONE review-request SMS/email with the Google review link (`google_review_url`) — framed
  around the *result* ("did the site bring you a job yet? a one-line review puts you above the next guy on
  Google"), Voss label, no begging. If no review in 7 days → ONE polite re-ask, then stop.
- **WHY after a job, not after go-live:** a review lands best right after the customer felt the value (a
  booked job from the site). Asking before the value shows = a weak review or none. This also closes the
  Amodei loop — a founding client's review becomes the social proof that converts the next cold call
  ("we just did this for X, here's what they said").
- **Exit:** review received → tag `review:done`, customer enters a low-touch "founding client" list
  (referral asks, upsell to a monthly/maintenance tier later — the $700 era expansion path).

---

## 6. THE FULL GRAPH (every state, every edge) — trace any lead here

```
                                 ┌─────────────────────────────────────────────────────────┐
   ENTRY A (Mia call)            │                                                         │
   ENTRY B (web form, WF-1) ─────┼──► [New Lead] ──(first dial)──► [Dialed]                │
   ENTRY C (reactivation, WF-6) ─┘        │                          │                     │
                                          │(form lead's site         ├─ connected ───────► [Connected]
                                          │ delivered, WF-2)          ├─ voicemail ─┐       │
                                          ▼                           ├─ no_answer ─┤       │
                                   [Site Link Sent] ◄────────────────┐│             │       │
                                          ▲                          ││ (VM+text on │       │
                          (link delivered │  link drop: Mia send_    ││  built lead)│       │
                           WF-3 / WF-2)   │  materials + LNK-1/2)    │└──► re-dial ◄┘       │
                                          │                          │   (≤4 attempts)      │
                                          │                          │       │              │
   ANSWERED+INTERESTED (3.1) ─────────────┘                          │   exhausted          │
   ANSWERED+OBJECTION (3.2):                                         │       ▼              │
     • handled → link out ──────────────► [Site Link Sent]          │  GONE COLD ──────────┤
     • callback ─────────────► [Connected] (redial task)            │  [Lost: no-contact]  │
     • flat-no (not DNC) ────► [Connected] → reactivation pool       │  reactivation:elig    │
     • scam/robot handled → link out ───► [Site Link Sent]          │       ▲              │
                                          │                          └──────┘ (WF-6)        │
                          WF-2 nurture:   │  NDG-1 (+2d), NDG-2 (+5d)                        │
                          goal=booked/approved/DND; else:                                    │
                                          │                                                  │
                            no booking ───┴──► GONE COLD [Lost] ──(WF-6, 30-60d)──► [Dialed]│
                                          │                                                  │
                            booking ──────▼                                                  │
                                   [Walkthrough Booked] ◄──(rebook)──┐                       │
                                    WF-4: BKG-1+BKG-2, RMD-1 (T-1h)  │                       │
                                          │                          │                       │
                            ┌─────────────┼──────────────┐          │                       │
                         showed        no-show        (≤2 cycles)   │                       │
                            │          WF-4b: NSH-1+NSH-2 (+1h) ─────┘                       │
                            ▼          exhausted → GONE COLD [Lost: no-show-exhausted]       │
                        [Showed]                                                             │
                            │                                                                │
                ┌───────────┼────────────────┐                                              │
              yes        think (48h)      no/keep draft                                      │
                │           │                 │                                              │
                │      win or walk            ▼                                              │
                ▼           ▼            WALKED AWAY                                          │
        [Site Approved ($450 WON)]      [Lost: walked-away] ──(WF-6, 30-60d)──► reactivate ──┘
                │                         (B3/A4 walk-away, draft stays live)
                ▼  (post-sale §5)
        [Live/Domain Pointed] ──► welcome ──► go-live ──► review request (after 1st job) ──► founding-client list

   ── ANY STATE ──(STOP / DNC / unsub, WF-5)──► [Lost/DNC] ── DND all channels ── PERMANENT, no re-entry
   ── ANY DIAL ──(bad_number)──► [Lost: bad-number] ── no SMS/email ── re-enrich → fresh Entry A/B
```

---

## 7. TIMING TABLE (every automated touch, at a glance)

| Trigger | Channel | Message (canon) | Timing | Workflow |
|---|---|---|---|---|
| Form submit | Email | ACK-1 (A1) | immediate | WF-1 |
| `draft_site_url` set (form lead, no connect) | Email | DLV-1 (A2) | immediate | WF-2 |
| DLV-1 sent, no booking | Email | NDG-1 (A3) | +2 days | WF-2 |
| NDG-1 sent, no booking | Email | NDG-2 (A4) | +5 days (day 5) | WF-2 |
| Call connected, link exists | SMS | LNK-1 (SMS-1) / SMS-2 spec | immediate (≤2 min) | WF-3 |
| Call connected, email captured | Email | LNK-2 (B1) | immediate | WF-3 |
| Site-sent (connected), no booking | Email | NDG-1 (A3) → NDG-2 (A4) | +2d, +5d (DLV-1 skipped) | WF-2 |
| Appointment booked | Email+SMS | BKG-1 (C1) + BKG-2 (SMS-3) | immediate | WF-4 |
| Before appointment | SMS | RMD-1 (SMS-4) | T-1 hour | WF-4 |
| No-show | SMS+Email | NSH-1 (SMS-5) + NSH-2 (C3) | +1 hour | WF-4b |
| Walked away | Email | B3 (connected) / A4 (form) | on disposition | manual/WF |
| STOP/DNC/unsub | — | DND all channels, no message | immediate | WF-5 |
| Reactivation (Lost, 30-60d, eligible) | Call or 1 Email | SPEC reveal / B3-A4 family | monthly | WF-6 |
| Won → onboarding | Email+SMS | welcome | on WON | WF-7 (post-sale) |
| Domain pointed | Email+SMS | go-live | on go-live | WF-7 |
| First job done (or +14d) | SMS/Email | review request | on `last_job_completed_at` / +14d | WF-7 (Aljaz `review_*`) |

---

## 8. WHY THE WHOLE DESIGN IS SHAPED THIS WAY (the load-bearing logic)

1. **The buyer is a skeptic, not a curiosity-seeker** (OFFER-AB §1). So the graph is built to **deliver
   proof first** (kill scam-fear in 10 seconds via the live link) and **re-open the loop** (your
   photos/number/domain + founding price) — never to withhold and make a burned owner chase, which reads
   as the exact con grammar. Every nurture message restates a *loss* (jobs to competitors, the founding
   price closing), never begs — because begging confirms the scam hypothesis and is banned by copy law.

2. **The connect is the scarce resource, not the build** (CONTEXT, SITE-PIPELINE). So sites are built
   *ahead* of the dial, and the entire state machine optimizes the stages that actually leak —
   **show-rate** (defended by WF-4 reminders + WF-4b no-show recovery) and **book-rate** (defended by the
   re-armed loop in Mia's pitch + the WF-2 nurison). Booking a lot of calls is vanity; *shown, closed*
   calls bank revenue.

3. **One writer per resource = no races** (REPO-INTEGRATION §5C). Mia writes `call_*`; Aljaz writes
   `slug`/`sms_*`/`inbound_*`; GHL owns `status:*` + opportunity stage + nurture. The opportunity stage is
   the single source of truth so the board never shows two conflicting positions. This is why every branch
   moves the **stage** explicitly and uses **tags** only as additive history + workflow triggers.

4. **Goals, not fixed-length sequences** (WF-2/WF-4 goal events). The instant a lead books or buys, every
   downstream nurison auto-skips. A "your site is just sitting there" email after they've booked is the #1
   way automation looks broken and torches trust — the goal events prevent it categorically.

5. **Nothing valuable is ever discarded except a DNC.** Walked-away, gone-cold, no-show-exhausted all keep
   a **live draft** with the owner's name on it and become `reactivation:eligible` — recyclable via WF-6
   for two rounds because "your site is *still* live" + a shrinking founding window is a *stronger* pitch
   in 60 days. Only DNC (legal) and bad-number (dead data) have no recovery path. This is the never-stop
   loop made concrete: the lead pipeline keeps producing value until the lead either buys, opts out, or
   the data dies.

6. **The won path closes the Amodei loop.** A founding client's first-job result → a review → social proof
   that makes the *next* cold call convert ("we just did this for X in Lubbock; here's what they said").
   Every close feeds the next open. That's why the post-sale path is in the graph, not bolted on — the
   review request is a lead-gen input, not an afterthought.

---

## 9. PREREQUISITES THIS GRAPH ASSUMES (the unblock checklist)

This state machine is fully buildable the moment these land (all tracked in the source docs):
- **GHL agency reactivated** + location `[REDACTED]`, TZ → America/Chicago (GHL-BUILD-SPEC §1).
- **Custom fields** (×8) + **custom value Booking Link** + **pipeline "WDIFY Sales"** (9 stages) +
  **15-min Walkthrough calendar** built (GHL-BUILD-SPEC §3,§5,§7).
- **WF-1…WF-5 imported** from GHL-BUILD-SPEC §6 + **WF-6 (reactivation)** and **WF-7 (post-sale)** added
  per §4 and §5 of this graph.
- **Mia ↔ GHL webhook** wired (`call_outcome`, tags → workflows) (GHL-BUILD-SPEC §8.5).
- **Aljaz unblocks** (REPO-INTEGRATION §6): Supabase creds, `generate-sites` cron, `OUTREACH_AUTH_TOKEN`,
  the `call-status-webhook` PR, A2P 10DLC status. None block the *graph design* — they block go-live.

> Add WF-6 and WF-7 to GHL-BUILD-SPEC §6 when implementing — this graph defines their exact
> triggers/actions; the spec file should carry the copy blocks (re-run /panel on any new copy first).
