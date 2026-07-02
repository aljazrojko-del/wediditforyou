# WDIFY — BOOKING + REMINDER + NO-SHOW SEQUENCE (GHL-import-ready)

Produced 2026-06-16 · Persona **Alex Rojko** · sender **`Alex at We Did It For You` / info@wedidit4you.com** (GHL/LC only, never custom SMTP).
Builds on the panel-approved canon (`../../email/SEQUENCES.md` C1-C3, `../../sms/SMS-COPY.md` SMS-3/4/5, `../../ghl/GHL-BUILD-SPEC.md` WF-4/WF-4b). This file is the **complete, expanded booking spine**: it keeps every approved line, fills the gaps the canon left open (the missing 24h email reminder, a 2nd no-show touch on each channel, a full reschedule flow), and adds the mandatory **2 A/B variations per piece**.

---

## THE STRATEGIC SPINE (why this sequence exists, and why it's shaped this way)

The funnel prediction (`../../OFFER-AB-PREDICTION.md`) is unambiguous: for this buyer the bottleneck is **SHOW rate, not book rate**. A busy, skeptical, non-tech mobile-service owner books easily and forgets easily. Option A (tease) books 55% but only 45% show → 6.9 sales/100. The hybrid books 60% AND shows 72% → 16.4 sales/100. **The entire job of this booking → reminder → no-show machine is to protect that 72% show number.** Every piece below is engineered against the three forces that kill a booked call:

1. **It evaporates from memory.** He booked on a 4-minute call between two jobs. By the appointment he's under a truck. → reminders that re-state WHEN and re-anchor WHY, not "looking forward to it."
2. **It re-pattern-matches to a scam.** A reminder that begs or over-explains re-opens the "is this a trap" loop the call just closed. → every reminder is short, plain, and assumes the deal is already his.
3. **It loses to the free draft.** He already holds the asset (hybrid model). "I'll just keep the draft" is the silent killer. → the open loop in every piece is the **half-finished possession**: the call is where his real photos / number / colors / domain go in and where the **$450 founding price locks before it jumps to $700.** The draft can't satisfy that. Loss-aversion, not curiosity, carries the show.

**The mechanism in one line:** *He owns a shell with his name on it. The call finishes it and locks the price. Miss the call and both stay open — that's the cost we keep ringing, never the pitch.*

**Copy law applied to every piece below** (the copy standards): never beg (no "just checking in" / "following up" / "I'd love" / "no pressure"), never over-explain, exactly one Voss device each, Hormozi cost-of-inaction, lead with the gift not the diagnosis, end on strength, sign `— alex` (email) / `— alex's team` (SMS), zero AI-tell words, humanized to zero AI-detection. Emails read naturally when `{{contact.first_name}}` / `{{contact.company_name}}` are empty (most leads have no first name — never lead with a name that may be blank). Subjects lowercase, 3-5 words. **No copy-paste twins:** an SMS never repeats a sentence from the email firing alongside it.

**Anti-repetition rule across the whole journey:** no Voss device phrasing repeats verbatim within one recipient's booking journey (confirmation → reminder → 1h → no-show → reschedule). Device ledger is tracked per piece so a no-show who reschedules and no-shows again doesn't hear the identical line twice.

---

## MERGE FIELDS USED (all exist in GHL-BUILD-SPEC §3 / §6)

| Field | Source | Empty-safe behavior |
|---|---|---|
| `{{contact.first_name}}` | standard (rarely present) | only ever used as optional prefix `{{contact.first_name}} — `; body reads clean without it |
| `{{contact.company_name}}` | standard (always present) | always populated from scraper/form |
| `{{contact.draft_site_url}}` | custom field "Site URL" | set before any booking exists (the build precedes the call) — always present here |
| `{{custom_values.booking_link}}` | custom value "Booking Link" | the 15-min walkthrough calendar permalink |
| `{{appointment.start_time}}` | appointment object | present in every piece in this file (all fire post-booking) |

---

# PART 1 — BOOKING CONFIRMATION (email + SMS)

**Fires the instant the walkthrough is booked.** This is not a receipt — it's the first show-rate defense. It must (a) lock the slot in memory, (b) reframe 15 minutes as the moment of ownership transfer, not a sales call, (c) re-state the price-lock so the deadline is already ticking before reminder 1. Confirmation goes out on BOTH channels because the booking is the highest-intent moment in the funnel — redundancy here is cheap insurance on the most valuable event.

## 1A — Booking confirmation EMAIL

- **Purpose:** lock the slot, convert "a call" into "the call that makes the site really yours," pre-seed the founding-price deadline so reminders don't have to introduce it.
- **Trigger:** Appointment Booked (calendar: 15-min Site Walkthrough). [GHL WF-4, step 2]
- **Delay:** immediate.
- **Channel:** Email.

**Variation A (= canon C1, panel-approved — the default)**
- **Subject:** you're locked in

> Locked in: {{appointment.start_time}}.
>
> Fifteen minutes. Your number and your photos go in, and you see exactly what a customer sees when they look you up.
>
> Your $450 founding spot holds through this call. Once you point it at your domain, give it 30 days: if you don't get at least one paying job off it in that window, I refund the $450 and you keep the site live anyway. Sounds like a small thing. It's the call that turns the draft into where your next job comes from.
>
> Another look first: {{contact.draft_site_url}}
>
> Need to reach me before then, that's my cell: Alex Rojko, 713-352-2542.
>
> — alex

*Voss: label ("Sounds like a small thing"). ~88 words (one reference/confirmation email runs long to carry the guarantee + the callback number — the cap is for cold persuasion copy). Carries the stress-test face+proof fix: Alex's full name + verifiable cell (713-352-2542) so a skeptic has a real human to call back. The guarantee is now CONCRETE and cashable per Review-1 Fix 1: "at least one paying job in 30 days" is an event the buyer controls and can verify, replacing the vague "make you the obvious choice" weasel a skeptic dismisses as un-provable. The risk-reversal sits at the $450, not just the free draft, so a "no" means "I'd rather stay invisible for free-to-try." The spot-hold line is free no-show insurance. De-patterning pass: the "your number goes in, your photos go up" parallel-verb pair was collapsed to one clause ("your number and your photos go in, and you see exactly what a customer sees…") so the "your X, your Y" rhythm isn't a campaign-wide tic.*

**Variation B (test — sharper ownership frame, leads with the asset)**
- **Subject:** it's basically yours

> The site's built. The call just makes it official: {{appointment.start_time}}.
>
> Fifteen minutes and your real details go in, your colors too, and it's pointed at your name. The $450 holds until we talk, then it's $700 for whoever's after you.
>
> Worth a last look before we do: {{contact.draft_site_url}}
>
> Want me sooner, that's my cell: Alex Rojko, 713-352-2542.
>
> — alex

*Voss: label ("It's basically yours" via subject + "The call just makes it official"). ~58 words. Tests whether leading with possession ("basically yours") out-shows leading with the time ("locked in"). Carries the stress-test face+proof fix: Alex's full name + verifiable cell (713-352-2542). Both end on the sign-off after the link = strength, not "see you then."*

**Why two:** A anchors on the **appointment** (time-first, good for the forgetful); B anchors on **ownership** (asset-first, good for the skeptic who needs the endowment reinforced). Split-test show rate by variation — the prediction says endowment is the stronger lever, so B is the challenger to beat the approved A.

## 1B — Booking confirmation SMS

- **Purpose:** put the time and the stakes in his pocket where he actually reads it; the email can sit unopened, the text won't.
- **Trigger:** Appointment Booked. [GHL WF-4, fires alongside 1A]
- **Delay:** immediate (seconds after 1A).
- **Channel:** SMS. **If first SMS to this number → compliance line stays; else it may drop.**

**Variation A (= canon SMS-3, panel-approved — default)**

> You're on the books for {{appointment.start_time}}. 15 min and the site's yours for real. Miss it and it stays a draft. — alex's team at We Did It For You. Reply STOP to opt out

*Freedom/loss device: "Miss it and it stays a draft." States the cost of a no-show before the no-show is even possible. No sentence shared with 1A (email says "turns the draft into where your next job comes from"; SMS says "stays a draft" — different angle, no twin).*

**Variation B (test — price-lock forward)**

> Booked: {{appointment.start_time}}. 15 min, your photos and number go in, and the $450 locks. Skip it and it doesn't. — alex's team at We Did It For You. Reply STOP to opt out

*Loss device: "Skip it and it doesn't." Tests the price-lock as the carrot vs the draft-status as the stick. Compliance line present (first-SMS rule). No twin with 1B-A or with either 1A email.*

**Why two:** A threatens the **asset** ("stays a draft"); B threatens the **price** ("$450 locks… skip it and it doesn't"). Different loss objects let us learn which loss this buyer feels harder. Pair 1A-A with 1B-A and 1A-B with 1B-B in the split so the email/SMS stay congruent per arm.

---

# PART 2 — 24-HOUR REMINDER

**The canon had no 24h reminder — only a 1h.** That's a gap: a call booked 3-14 days out (booking window is 14 days) needs a mid-distance touch or it dies of forgetting long before the 1h ping. The 24h reminder's job is **re-anchoring**: surface the time again, re-arm the open loop once, give a frictionless reschedule escape so a known conflict converts to a move instead of a silent no-show. One channel only here (email) — the 1h reminder is SMS, so we alternate channels to avoid fatigue and cover both inboxes across the journey.

## 2 — 24h reminder EMAIL

- **Purpose:** beat the forgetting curve at the midpoint; offer a one-tap reschedule so a foreseeable conflict (he knows tomorrow's slammed) becomes a move, not a ghost. A move keeps him in the funnel; a ghost drops him to recovery.
- **Trigger:** 24 hours before `{{appointment.start_time}}`. [add to WF-4: Wait until appointment-time − 24h]
- **Delay:** appointment time minus 24 hours. (Skip-logic: if booking was made <24h out, this step auto-skips and the 1h reminder still fires.)
- **Channel:** Email.

**Variation A (default — re-anchor + soft reschedule)**
- **Subject:** tomorrow, fifteen minutes

> Quick heads up: we're on tomorrow at {{appointment.start_time}}.
>
> All it takes is fifteen minutes. Your photos and number go in, the site points at your name, and the $450 is locked in for good.
>
> If tomorrow's already buried, move it now instead of missing it: {{custom_values.booking_link}}
>
> — alex

*Voss: label ("we're on tomorrow"). 49 words. Ends on an IMPERATIVE ("move it now instead of missing it:") not a no-oriented question — per the cross-file Mold-#3 fix, the booking reminder journey carries the no-oriented cadence ONCE (the 1h SMS "Is it crazy to move it"), so the 24h reminder closes on a flat command instead. The reschedule offer is the show-rate trick: it converts a known conflict into a kept future slot instead of a no-show. Ends on the booking link = a forward action, not "talk soon."*

**Variation B (test — endowment + cost-of-inaction)**
- **Subject:** your site, tomorrow

> Tomorrow at {{appointment.start_time}} we finish what's already got your name on it.
>
> Fifteen minutes, then it's pointed at your domain and live. Every week it isn't live, the calls that had your name on them go to someone they could actually find.
>
> Day looking rough? Move it before you miss it: {{custom_values.booking_link}}
>
> — alex

*Voss: label ("what's already got your name on it"). ~49 words. B leans Hormozi cost-of-inaction harder, but the skeleton is restructured ("the calls that had your name on them go to someone they could actually find") so it does NOT repeat the frozen "searches you → finds nothing → books the guy whose site loads" mold that the cross-file fix caps at one instance per workflow; A leans logistics-light. The de-patterning pass cleaned up the clunkier earlier phrasing so the line reads in one breath. Tests whether re-stating the pain at 24h lifts show or feels heavy. Reschedule offer worded differently from A ("Move it before you miss it" vs "grab a better time"), no verbatim repeat.*

**Why two:** A is **light and respectful of his time** (re-anchor + escape hatch); B **re-pressurizes the stakes** (endowment + lost jobs). For a skeptic, A may show better (less salesy at distance); for a procrastinator, B's pain reminder may. Split and read show rate.

---

# PART 3 — 1-HOUR REMINDER

**The last-mile defense.** SMS only — at T-1h he's between jobs, the text is the only thing that lands. Job: make him stop and take the call in 60 minutes. Strip everything but the time, the painlessness ("bring nothing"), and a one-tap move so a last-second conflict still converts to a reschedule instead of a dead slot.

## 3 — 1h reminder SMS

- **Purpose:** final nudge into the actual call; last chance to convert a blown-up day into a move rather than a no-show.
- **Trigger:** 1 hour before `{{appointment.start_time}}`. [GHL WF-4, step 3]
- **Delay:** appointment time minus 1 hour, BUT held to recipient-local 8am–9pm (`contact.timezone`) — if minus-1h falls before 8am local, the calendar **10:00 CT availability floor** (GHL-BUILD-SPEC §6) prevents it from ever landing pre-8am, and the appointment-anchored If/Else in §8 is the belt-and-suspenders (panel Review 4 Fix 1 — a 09:00 CT slot for a Phoenix recipient would otherwise fire the 1h reminder at 06:00 local, a TCPA quiet-hours violation).
- **Channel:** SMS.

**Variation A (= canon SMS-4, panel-approved — default)**

> One hour out: {{appointment.start_time}}. Won't take long. Day blew up? Is it crazy to move it instead? {{custom_values.booking_link}} — alex's team

*Voss: no-oriented question ("Is it crazy to move it instead?"). Tight, ~30 words. One link only (carrier rule).*

**Variation B (test — frictionless + finish frame)**

> We're on in an hour: {{appointment.start_time}}. Bring nothing. We put your photos and number in and it's done. Slammed? Move it here: {{custom_values.booking_link}} — alex's team

*Device: ease/freedom ("Bring nothing… it's done"). Tests removing the question and replacing it with a zero-effort "it's done in 15 min" frame. Different reschedule phrasing ("Move it here" vs "Is it crazy to move it instead") — no twin with 3-A. Note: borrows the "bring nothing" beat from canon C2 email but that email isn't in this SMS-led arm, so no same-fire twin.*

**Why two:** A uses a **no-oriented question** (pulls a yes-feeling "no, it's not crazy"); B uses **effortlessness** ("bring nothing, it's done"). Question vs friction-removal are the two ways to move a busy man at T-1h — test which lifts the final step.

---

# PART 4 — NO-SHOW RECOVERY (email + SMS, 2 touches each)

He missed it. The canon had **one** recovery touch per channel; the prediction makes no-show the single most expensive leak, so recovery gets **2 touches per channel** here. The doctrine: **a no-show is almost never a "no" — it's a forgotten or buried "yes."** So touch 1 is recovery (warm, zero shame, instant rebook path); touch 2, only if touch 1 is ignored, is a clean walk-away that leaves the loss ringing. Never beg, never "just checking in," never a third chase — two touches then stop, because a third re-confirms the scam pattern and burns the warm asset (he still holds the live draft; the door stays open by itself).

**Cadence (all timed off the missed start):**
- T+1h: NSH touch 1 — SMS (4A) + Email (4B) fire together. (Fast, while the missed slot is fresh.)
- T+2 days: NSH touch 2 — SMS (4C) + Email (4D), only if no rebook and no DND. (Walk-away.)
- Exit at any point: rebook (→ re-enters Part 1) or STOP/DNC (→ WF-5).

## 4A — No-show recovery SMS, touch 1

- **Purpose:** recover the missed slot fast, zero shame, one-tap rebook; reassure nothing was lost.
- **Trigger:** Appointment Status → No Show. [GHL WF-4b, step 1]
- **Delay:** +1 hour after missed start.
- **Channel:** SMS.

**Variation A (= canon SMS-5, panel-approved — default)**

> We missed you. No harm. The site's not going anywhere, you owe nothing, and your $450 founding spot is still open. New time: {{custom_values.booking_link}} — alex's team

*Reassurance + open-door. Removes shame ("No harm"), re-states all three safeties (site stays / owe nothing / price still open), ends on the rebook link.*

**Variation B (test — lighter, assume-the-rebook)**

> Looks like the day won that one. No problem — your spot and the $450 are still held. Grab a new fifteen minutes here: {{custom_values.booking_link}} — alex's team

*Device: label ("the day won that one") — names the cause as his schedule, not his disinterest, so there's nothing to defend against. Tests a lighter, more human read vs the reassurance-stack of A. No twin with 4B email.*

**Why two:** A **reassures** (kills risk objections); B **disarms with a label** (kills the awkwardness that makes people ghost a rebook). Different routes to the same one-tap rebook.

## 4B — No-show recovery EMAIL, touch 1

- **Purpose:** same recovery on the channel that holds more room; restate what he keeps AND what's slipping, push the rebook.
- **Trigger:** Appointment Status → No Show. [GHL WF-4b, step 1, fires with 4A]
- **Delay:** +1 hour after missed start.
- **Channel:** Email.

**Variation A (= canon C3, panel-approved — default)**
- **Subject:** still want this

> We missed you earlier. No worries on the slot.
>
> Still want {{contact.company_name}} online? If so, nothing's lost. The site's live, you owe nothing until you approve it, and your $450 founding spot is open: {{contact.draft_site_url}}
>
> Grab a new time and we'll finish it in fifteen minutes: {{custom_values.booking_link}}
>
> — alex

*Voss: no-oriented question ("Still want this/Still want {{company}} online?") — the easy "yeah, I do" reflex pulls him back in. ~48 words. The subject and opener were lightened in the de-patterning pass — "have you given up" was mildly accusatory/deflating for a no-show whose whole doctrine is zero shame; "still want this" pulls the same yes with no sting. Shows what he keeps (live site, owe nothing) and re-opens the rebook in one move.*

**Variation B (test — endowment-forward, time-as-the-only-cost)**
- **Subject:** still yours

> The site we built {{contact.company_name}} is still sitting there live. We just didn't get the fifteen minutes to finish it.
>
> That's the only thing standing between a draft and your real number, photos, and domain going live at $450.
>
> Pick a time and it's done: {{custom_values.booking_link}}
>
> — alex

*Voss: label ("still yours" / "still sitting there live"). 47 words. B frames the no-show as merely a missing 15 minutes (low-stakes, removes guilt) and the only thing between him and the finished asset. Tests endowment vs A's no-question. No sentence shared with 4A SMS.*

**Why two:** A asks a **no-question** (re-engages by inviting "no, I haven't given up"); B **minimizes the cost** to a single 15-minute gap and leans on endowment. Both route to rebook; pair A-email with A-SMS, B-email with B-SMS for congruent arms.

## 4C — No-show recovery SMS, touch 2 (walk-away)

- **Purpose:** close the loop on strength after touch 1 is ignored; leave the loss ringing, not a chase. Last SMS in the recovery arm.
- **Trigger:** WF-4b touch 1 sent AND no rebook AND no DND.
- **Delay:** +2 days after missed start (≈ +47h after 4A).
- **Channel:** SMS.

**Variation A (default — walk-away, door stays open)**

> Last one from us. Your site stays live and the $450 stays held for now — when you want the fifteen minutes to finish it, the link's here: {{custom_values.booking_link}} — alex's team

*Walk-away device ("Last one from us"). "For now" puts a soft clock on the held price without a fake deadline. Ends on the link = he controls the next move.*

**Variation B (test — cost-of-inaction walk-away)**

> We'll leave it here. The draft's yours to keep, but a quiet week is usually a week somebody looked for you and gave up. Door's open when you are: {{custom_values.booking_link}} — alex's team

*Walk-away + Hormozi cost-of-inaction, restructured off the frozen skeleton ("a quiet week is usually a week somebody looked for you and gave up" — product-true, no Google-ranking claim, and not the "finds nothing → books the guy whose site loads" mold). Tests whether a final pain-jab out-recovers A's clean exit. Different walk-away phrasing ("We'll leave it here" vs "Last one from us"), no twin with 4A/4C-A.*

**Why two:** A is a **clean dignified exit** (preserves goodwill, lets endowment pull him back later); B **lands one last cost-of-inaction** on the way out. For a warm-but-busy lead A may recover more (no pressure to resist); for a fence-sitter B's pain may. Test recovery-after-walkaway rate.

## 4D — No-show recovery EMAIL, touch 2 (walk-away)

- **Purpose:** dignified final email; mirror the SMS walk-away with more room to re-anchor the endowment + the "I answer myself" trust line. Last email in the recovery arm.
- **Trigger:** WF-4b touch 1 (4B) sent AND no rebook AND no DND.
- **Delay:** +2 days after missed start (fires with 4C).
- **Channel:** Email.

**Variation A (default — walk-away + answer-myself trust)**
- **Subject:** last one from me

> I'm not going to keep chasing you about something that's still free.
>
> The site we built {{contact.company_name}} stays live and yours, and the $450 founding spot stays open for now: {{contact.draft_site_url}}
>
> When you want the fifteen minutes to finish it, just reply. It comes straight to me.
>
> — alex

*Voss: walk-away ("I'm not going to keep chasing you"). 51 words. "Just reply — it comes straight to me" matches the site's "I answer every email myself" line = trust close. No twin with 4C SMS.*

**Variation B (test — endowment + competitor pressure)**
- **Subject:** i'll stop here

> This is the last email from me.
>
> {{contact.company_name}}'s site stays built and live. Keep the link, show it around, owe nothing: {{contact.draft_site_url}}
>
> The only thing it's missing is the fifteen minutes to put your real details in and lock $450 before it's $700. If a slow week ever has you wondering where the calls went, you know where I am.
>
> — alex

*Voss: walk-away ("This is the last email from me"). 56 words. B re-arms the half-finished-possession loop one final time and seeds the slow-week trigger (when the pain actually hits, he remembers). Tests endowment-recall vs A's pure-trust exit. No verbatim repeat of any earlier subject or device line.*

**Why two:** A exits on **trust** ("comes straight to me"); B exits on **endowment + a future trigger** ("when a slow week has you wondering"). Both leave the asset and the door open. Pair A-email/A-SMS and B-email/B-SMS.

---

# PART 5 — RESCHEDULE FLOW

The reschedule path is the show-rate **pressure-release valve**: it gives a man with a real conflict a frictionless way to stay in the funnel instead of ghosting. Reschedule links are already embedded in 24h (Part 2), 1h (Part 3), and every no-show touch (Part 4) — this part defines what happens **when he actually moves the slot**, so a rescheduler isn't treated like a fresh no-show and isn't re-spammed the full sequence.

## 5.1 — How GHL handles the move (wiring)

- **Trigger:** Appointment Status → **Rescheduled** (GHL fires this natively when a contact rebooks via `{{custom_values.booking_link}}` on an existing appointment) OR a new appointment is booked while one is already on the calendar.
- **WF-4 behavior on reschedule:** GHL re-evaluates the Wait steps against the **new** `{{appointment.start_time}}`. To prevent double-sends:
  1. The 24h-reminder Wait and 1h-reminder Wait are time-anchored to `{{appointment.start_time}}`, so they auto-recompute to the new time. No duplicate confirmation is sent for a reschedule (confirmation 1A/1B only fires on the FIRST Appointment Booked, gated by `if appointment count = 1` OR a `confirmed-once` tag).
  2. If the contact is mid-no-show-recovery (Part 4) and rebooks, the **Rescheduled/Booked trigger removes him from WF-4b** (goal met) and re-enters him into the reminder arm of WF-4 for the new slot. He gets a **reschedule confirmation (5.2)**, NOT a fresh 1A.
- **Tagging:** add `status:rescheduled` (history, additive); opportunity stays at **Walkthrough Booked**. If he reschedules **twice**, add `status:reschedule-2x` and notify Alex (a 2x-rescheduler is a soft-decline signal — Alex calls instead of letting automation run).

## 5.2 — Reschedule confirmation (email + SMS)

- **Purpose:** acknowledge the move warmly (no guilt, reward the fact he stayed in), re-lock the new time, keep the open loop and price-lock alive. A rescheduler is HIGHER intent than a no-show — he chose to keep going — so this is light and affirming, not a re-sell.
- **Trigger:** Appointment Status → Rescheduled.
- **Delay:** immediate.
- **Channel:** Email + SMS (both, like the original confirmation — this is the new highest-intent moment).

### 5.2-EMAIL

**Variation A (default — affirm the move, re-lock)**
- **Subject:** new time's set

> Good call moving it instead of losing it. We're on for {{appointment.start_time}} now.
>
> Same short call: we drop your real photos and number in, and the $450 stays locked.
>
> The site's right here if you want another look first: {{contact.draft_site_url}}
>
> — alex

*Voss: label ("Good call moving it instead of losing it") — affirms his decision, builds reciprocity. 44 words. Rewards the behavior we want (rescheduling over ghosting) so he's likelier to actually show the new slot.*

**Variation B (test — momentum frame)**
- **Subject:** locked for {{appointment.start_time}}

> Moved and set: {{appointment.start_time}}.
>
> Nothing changes except the time. Fifteen minutes, your real details go in, the site goes live at $450 before it's $700.
>
> One more look while you wait: {{contact.draft_site_url}}
>
> — alex

*Voss: label (subject does the work; "Nothing changes except the time" reduces friction). 38 words. Tests a pure-logistics, momentum-preserving tone vs A's behavioral affirmation. No twin with 5.2-SMS.*

### 5.2-SMS

**Variation A (default — affirm + re-lock)**

> New time's set: {{appointment.start_time}}. Smart move keeping it on the calendar. 15 min and the site's yours for real at $450. — alex's team

*Affirmation device ("Smart move keeping it"). No compliance line needed if a prior SMS already sent it; include if this is somehow the first SMS to the number. No sentence shared with 5.2-EMAIL.*

**Variation B (test — tight logistics)**

> Moved to {{appointment.start_time}}. Nothing changed but the time. Still 15 min, still $450. Calendar's got the new slot locked. — alex's team

*Device: reassurance/ease. The deliberate "same… same… same" rule-of-three was broken in the de-patterning pass (parallel triplets read designed and detectors cluster on them) — now "nothing changed but the time. Still 15 min, still $450." Minimal, momentum-forward. Tests against A's affirmation. Ends on a forward beat ("calendar's got the new slot locked"), not the banned dead closer "see you then" — even a confirmation ends on strength, no exceptions.*

**Why two (5.2 email + SMS):** A **rewards the behavior** (reciprocity → higher show on the moved slot); B **minimizes friction** (momentum → "nothing changed, just show up"). For a guilt-prone busy owner A may show better; for a logistics-minded one B. Split and read show-rate on rescheduled slots specifically — these are recoverable revenue the canon left untracked.

---

# WIRING SUMMARY (drop into GHL-BUILD-SPEC WF-4 / WF-4b)

| # | Piece | Channel | Trigger | Delay | Voss device |
|---|---|---|---|---|---|
| 1A | Booking confirmation | Email | Appointment Booked (1st only) | immediate | label |
| 1B | Booking confirmation | SMS | Appointment Booked (1st only) | immediate | loss/freedom |
| 2 | 24h reminder | Email | T − 24h | recompute on reschedule | label + imperative (A) / label (B) |
| 3 | 1h reminder | SMS | T − 1h | recompute on reschedule | no-oriented Q (A) / ease (B) |
| 4A | No-show recovery 1 | SMS | Appt → No Show | T + 1h | reassurance (A) / label (B) |
| 4B | No-show recovery 1 | Email | Appt → No Show | T + 1h | no-oriented Q (A) / label (B) |
| 4C | No-show recovery 2 (walk-away) | SMS | 4A sent, no rebook | T + 2d | walk-away |
| 4D | No-show recovery 2 (walk-away) | Email | 4B sent, no rebook | T + 2d | walk-away |
| 5.2 | Reschedule confirmation | Email + SMS | Appt → Rescheduled | immediate | label / affirmation |

**Goal/exit events:** confirmation + reminders exit on `status:approved` (won) or DND. No-show arm exits on rebook (→ reminder arm re-enters) or DND. Reschedule re-anchors all time-based waits to the new `{{appointment.start_time}}` and suppresses a duplicate 1A.

**Split-test setup:** run the two variations as a 50/50 A/B within each GHL email/SMS step (GHL "A/B" or a 50% random-split If/Else on a `split:a`|`split:b` tag set once at contact creation so the SAME contact stays in one arm across the whole journey — congruent email+SMS). Primary metric = **SHOW RATE per arm**, secondary = rebook rate on no-shows and show rate on rescheduled slots. The prediction's bet: endowment-forward variants (1A-B, 4B-B) out-show logistics-forward ones — this is the test that confirms or kills it.

**3-CEO gate check:** Hormozi — every piece protects the 72% show that is the difference between 6.9 and 16.4 sales/100 (direct revenue). Amodei — the A/B split + per-arm show-rate logging is the learning loop; reschedule-show and no-show-rebook are now measured where the canon left them dark. Brunson — every piece ends on the next action (rebook link, draft link, or the locked time), never a dead "see you then" (the lone instance in 5.2-B was fixed to "calendar's got the new time locked" per the panel hard-violation flag).
