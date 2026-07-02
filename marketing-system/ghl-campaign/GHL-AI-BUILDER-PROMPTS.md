# WDIFY — GHL AI-BUILDER PROMPT PACK (turnkey, paste-and-go)

**What this is:** a finish-the-build pack for GoHighLevel's **AI workflow builder** ("What do you want to
automate?"). The pipeline, 18 custom fields, tags, custom values, and the "15-min Site Walkthrough with Alex"
calendar already exist (see `01-GHL-BUILD-SPEC.md` §3–§7). This file gives you, per workflow, three things you
paste in order: (1) a single AI-builder **PROMPT** that builds the structure, (2) a **COPY MAP** telling you
exactly which subject + body to drop into each node (cited to the `produce/*.md` source), and (3) a **POST-BUILD
CHECKLIST** for the things GHL's AI can't set (the `ab_lane` If/Else, recipient-TZ quiet hours, the STOP gate,
the sender identity).

**Copy law:** never reword copy in GHL. Paste verbatim from `produce/*`. Edit the source, re-run `/panel`,
re-sync. Sender on every email = **"Alex at We Did It For You" / info@wedidit4you.com** (location default).

---

## HOW TO USE THIS PACK (read once, ~6 lines)

1. Open GHL → **Automation → Workflows → + Create Workflow → "Start with AI"** (the "build by chatting" box).
2. **Paste the PROMPT** for one workflow. Let the AI build the trigger + steps. Name it exactly as titled here.
3. **Open each email/SMS node** the AI created and **paste the mapped subject + body** from the COPY MAP (copy
   verbatim from the cited `produce/*.md` file — do not retype, do not edit).
4. **Run the POST-BUILD CHECKLIST** for that workflow (set the `ab_lane` If/Else, quiet hours, STOP gate,
   sender, goal event, "Skip if DND"). The AI cannot do these — they are mandatory.
5. **Save → toggle ON** only when its STEP-0 gate is clear (10DLC approved for SMS, footer+DMARC for email,
   warm-domain ramp). WF-D stays **OFF**.
6. Build in the order below (money path first). Each one takes ~10–15 min. Smoke-test with a test contact.

> **Two gates the AI builder genuinely cannot do — you wire them by hand in every workflow that sends:**
> **(A) A/B lane** — GHL's native per-step "A/B split" re-randomizes each step and breaks frame congruence.
> Instead use an **If/Else on `contact.ab_lane` (`a` vs `b`)** and put Variation A under the `a` branch,
> Variation B under `b`. **(B) Recipient-TZ quiet hours + STOP gate** — described once in the GLOBAL RULES
> below; apply to every SMS node. Tell the AI to "add a wait-until-window step before each SMS" and it gets
> you 80% there; verify the field is `contact.timezone`, not the location TZ.

---

## GLOBAL RULES (apply to EVERY workflow — paste the relevant ones into the AI prompt too)

- **Sender (email):** From name `Alex at We Did It For You`, From/Reply-to `info@wedidit4you.com` (location
  default — confirm it's selected on each email node).
- **Email footer (CAN-SPAM):** append `{{custom_values.email_footer}}` **below the `— alex` sign-off** on EVERY
  email node, and enable GHL's built-in unsubscribe element so it injects `List-Unsubscribe` headers. (WF-D
  Email 1 is the one exception — plain-text footer, no hyperlink. See WF-D.)
- **SMS quiet-hours (TCPA):** every SMS node is preceded by a **Wait-until-window** computed on
  **`contact.timezone`** (8am–9pm recipient-local, 9am floor for safety). Do **not** use GHL's "send within
  business hours" (it keys off the location TZ). Appointment-anchored SMS (1h reminder, no-show T+1h) are NOT
  exempt — wrap them in an If/Else: if recipient-local < 8am or ≥ 9pm, hold to next 9am local.
- **STOP gate (first-SMS disclosure):** before each SMS SEND, add an If/Else on `contact.stop_disclosed`. If
  `false` → prepend `We Did It For You — ` and append ` Reply STOP to opt out`, then **set `stop_disclosed = true`**.
  If `true` → send body as written. (The produced first-touch SMS already carry the line; this gate guarantees
  it on any path where their SMS happens to be the first.)
- **SMS CONSENT GATE (HARD — the legal one, audit BLOCKER #2):** the 742 are SCRAPED = no prior consent. Before
  ANY SMS SEND, add a **hard** If/Else: send ONLY IF (`source:form` present) OR (`sms-consent` present). If
  neither → **do not send, skip the SMS branch entirely** (never queue, never "send later"). `sms-consent` is set
  by Mia's webhook the moment she captures verbal opt-in on a live call (stamps `sms_consent_at`). **Pure-cold SMS
  to an un-connected scraped number is REMOVED — a cold SMS without consent is a per-message TCPA violation + a
  10DLC brand-suspension risk that can nuke the whole SignalWire account.** This gate sits OUTSIDE/before the STOP
  gate above. (WF-3 SMS already sit behind the connect = compliant; WF-2/WF-2b/WF-6 SMS only fire for
  `source:form` OR `sms-consent`.)
- **LEAD SCORE → dial priority:** keep a numeric `contact.lead_score`. Wire triggers: **Email Link Clicked** on
  the draft-site URL → set `lead_score` ≥ 50 + tag `engaged:clicked`; **Email Opened** → ≥ 20; **Customer Replied**
  → +60. The Mia dialer reads `lead_score` DESC. Score ranks calls; it never triggers a send.
- **Skip if DND = ON** on every send action (belt-and-suspenders against WF-5).
- **SMS frequency cap:** 1 marketing SMS / contact / 24h, max 4 / rolling 7d. The 1h reminder and STOP/confirm
  texts are transactional and exempt. SMS-B2/B4 (post-call) stay **OFF** by default. Every marketing SMS SEND
  sets `contact.last_sms_at`.
- **Goal event:** set each nurture workflow's Goal (per workflow below) so remaining steps auto-skip the instant
  it fires. Non-negotiable.
- **A/B = If/Else on `contact.ab_lane`** for all warm sequences (NOT native split). One lane per contact, set
  once at creation.
- **All email is PLAIN TEXT** — no images, no HTML chrome. One link per SMS.

---

# BUILD ORDER (money path first)

1. **WF-3** Post-Call Nurture — the connect is the scarce resource; this banks it
2. **WF-4** Booking Confirm + 3-1-0 Reminders (+ **WF-4r** Reschedule — REBUILT)
3. **WF-2** Site Delivered — Nudge Engine
4. **WF-1** Form In — 24h Clock (+ **speed-to-lead** immediate Mia dial)
5. **WF-4b** No-Show Recovery
6. **WF-PR** Positive-Reply Router (interested-reply routing) — build early; it catches money
7. **WF-6** Reactivation
8. **WF-5** STOP/DNC Guard
9. **WF-7a/7b** Post-Sale (Fulfillment + Review)
10. **WF-2b** Long-Game Nurture
11. **WF-SL** Smartlead → GHL Cold-Email Handoff (cold runs on Smartlead, not GHL)
12. **WF-HC** Deliverability Health-Check + Holdout
13. **WF-D / WF-Dr** Cold Phase-2 (**LEGACY — superseded by Smartlead/WF-SL; keep OFF**)

---

## 1 · WF-3 — "Call Connected — Post-Call Nurture"

> Money path #1. Fires the moment Mia connects. Delivers the proof link by SMS+email, then a 4-touch arc
> (immediate → +1d → +3d re-loop → +6d walk-away). Source: `produce/post-call.md`.

### PASTE THIS PROMPT
```
Create a workflow named "WF-3 Call Connected — Post-Call Nurture". Trigger: Contact Tag Added, tag
"status:connected". No entry filters. Steps in order:
1. Update Opportunity stage to "Connected" in pipeline "WDIFY Sales".
2. Add tag "status:dialed".
3. If/Else condition: contact field "Site URL" (draft_site_url) is not empty.
   YES branch (the built-lead case):
     a. Send SMS (the post-call link drop). [I will paste copy]
     b. If/Else: contact email is not empty -> Send Email (post-call link email). [I will paste copy]
     c. Add tag "status:site-sent", then Update Opportunity stage to "Site Link Sent".
     d. Wait 1 day. Then If/Else (goal not met) -> Send Email (post-call +1 day). [I will paste copy]
     e. Wait 2 days. Then If/Else (goal not met) -> Send Email (post-call re-loop) and Send SMS (re-loop SMS). [I will paste copy]
     f. Wait 3 days. Then If/Else (goal not met) -> Send Email (post-call walk-away). [I will paste copy]
     g. Update Opportunity stage to "Lost/DNC" with lost reason "nurture-exhausted"; add tags "status:lost" and "reactivation:eligible".
   NO branch (un-built lead): Create Task assigned to Alex "HOT - build now: {{contact.company_name}} asked on a live call", due in 12 hours; send internal notification to Alex.
Set the workflow Goal to: tag "status:booked" added OR tag "status:approved" added OR opportunity stage is at or beyond "Walkthrough Booked" OR contact marked DND. Enable "Skip if DND" on every send.
```

### COPY MAP (open each node, paste verbatim)
| Node | Source → label | Subject (A / B by `ab_lane`) | Body |
|---|---|---|---|
| 3a SMS (link drop) | `post-call.md` → **SMS-B1** | n/a | A = "Variation A (standard built lead)"; B = "Variation B (spec-build owner)" — use **B** for Elite Mobile Tire & Brake / Buddy's Mobile Spa / any pre-built spec lead. First SMS to number → keeps the `— alex's team at We Did It For You. Reply STOP to opt out` line. |
| 3b Email (link from call) | `post-call.md` → **Email 1** | `the link from the call` / `told you it was real` | E1 Variation A body (a-lane) · E1 Variation B body (b-lane). |
| 3d Email (+1d) | `post-call.md` → **Email 2** | `did the link work` / `open it one more time` | E2 Variation A / Variation B body. |
| 3e Email (+3d re-loop) | `post-call.md` → **Email 3** | `it's still the rough cut` / `whose name is on it` | E3 Variation A / Variation B body. **This runs long by design — paste the full body.** |
| 3e SMS (+3d re-loop, default ON) | `post-call.md` → **SMS-B3** | n/a | SMS-B3 Variation A / Variation B. Uses `{{custom_values.booking_link}}` (the booking link, not the site link). |
| 3f Email (+6d walk-away) | `post-call.md` → **Email 4** | `this is the last one` / `leaving you to it` | E4 Variation A / Variation B body. |

**Merge fields used:** `{{contact.company_name}}`, `{{contact.draft_site_url}}`, `{{custom_values.booking_link}}`,
`{{custom_values.email_footer}}` (footer line on every email). `{{contact.first_name}}` is never sentence-loaded.

### POST-BUILD CHECKLIST
- [ ] **Holdout exit at the top:** If/Else `holdout` present → exit before any send (incremental-lift control).
- [ ] Replace each "Send Email" step with an **If/Else on `contact.ab_lane`** → A body under `a`, B body under `b`.
- [ ] Same for the two SMS steps (B1 standard/spec is a separate If/Else on the spec-lead flag, not `ab_lane`).
- [ ] **SMS-consent:** WF-3 SMS (B1/B3) sit behind a connected call → Mia captured consent (`sms-consent` set) → compliant. Still confirm the consent gate If/Else is present for belt-and-suspenders.
- [ ] Quiet-hours **Wait-until-window on `contact.timezone`** before SMS-B1 and SMS-B3.
- [ ] STOP gate on `contact.stop_disclosed` before each SMS; sets `last_sms_at` on send.
- [ ] SMS-B2 and SMS-B4 (+1d / +6d twins) **left OFF** (high-value niches only).
- [ ] Goal event set (above). "Skip if DND" ON on all sends. Sender = Alex / info@wedidit4you.com.
- [ ] No-email leads: confirm the SMS-only path (B1 + B3) still fires via the "email not empty" If/Else.

---

## 2 · WF-4 — "Walkthrough Booked" (confirm + reminders)  ·  + WF-4r Reschedule

> Money path #2. Protects the show rate (72% vs 45% — the whole revenue delta). Source: `produce/booking.md`.

### PASTE THIS PROMPT (WF-4 · 3-1-0 reminder cadence)
```
Create a workflow named "WF-4 Walkthrough Booked". Trigger: Customer Booked Appointment on calendar "15-min Site
Walkthrough with Alex". In the trigger settings, turn Allow Re-entry ON (so a reschedule can re-enter and
recompute reminders against the new slot — the reschedule confirm itself lives in WF-4r). Entry filter: contact
does NOT have tag "confirmed-once" (this makes WF-4 fire ONLY on a first booking; a reschedule re-fires this same
"Customer Booked" trigger but has "confirmed-once" present, so it is handled by WF-4r instead and the 1A/1B
confirm never double-fires). Steps in order:
1. Update Opportunity stage to "Walkthrough Booked" in "WDIFY Sales". Add tags "status:booked" and "confirmed-once".
2. Set contact field "Walkthrough Datetime" = {{appointment.start_time}}.
3. Send Email (booking confirmation). [I will paste copy]
4. Send SMS (booking confirmation, ending "reply C to confirm"). [I will paste copy]
5. Wait until {{appointment.start_time}} minus 72 hours. If/Else: if the booking was made under 72h out this
   auto-skips; otherwise Send Email (3-day reminder) and Send SMS (3-day reminder, "reply C to confirm"). [I will paste copy]
6. Wait until {{appointment.start_time}} minus 24 hours (if booked under 24h out, this step auto-skips). Then
   Send Email (1-day reminder) and Send SMS (1-day reminder, "reply C to confirm"). [I will paste copy]
7. Wait until 9am recipient-local on the day of {{appointment.start_time}}. Then Send SMS (same-day morning
   reminder, "reply C to confirm"). [I will paste copy]
8. Wait until {{appointment.start_time}} minus 1 hour. Then Send SMS (1h reminder). [I will paste copy]
9. Wait until {{appointment.start_time}} minus 2 hours. If/Else: tag "confirmed:yes" is NOT present -> add tag
   "likely-no-show" and create a Task for Alex "proactive confirm call: {{contact.company_name}} hasn't confirmed".
Set the workflow Goal to: tag "status:approved" added OR contact marked DND. Enable "Skip if DND" on every send.
```

> **Note for the builder:** wire a side trigger "Customer Replied where SMS body = C (or 'confirm')" -> add tag
> "confirmed:yes". That tag is the show-intent signal step 9 checks; its absence triggers the proactive Alex call.

### COPY MAP (WF-4)
| Node | Source → label | Subject (A / B) | Body |
|---|---|---|---|
| 3 Email confirm | `booking.md` → **1A** | `you're locked in` / `it's basically yours` | 1A Variation A / Variation B (A runs ~80 words by design — paste full). |
| 4 SMS confirm | `booking.md` → **1B** | n/a | 1B Variation A / Variation B. Append "reply C to confirm". First SMS may carry the compliance line. |
| 5 Email/SMS 3-day reminder | `booking.md` → **Part 2 (3-day variant)** | `three days out` / `your site, this week` | Part 2 Variation A / Variation B, retimed for the 3-day slot. SMS appends "reply C to confirm". Only fires when the slot is >3 days out. |
| 6 Email/SMS 1-day reminder | `booking.md` → **Part 2** | `tomorrow, fifteen minutes` / `your site, tomorrow` | Part 2 Variation A / Variation B. Uses `{{custom_values.booking_link}}` for the reschedule line. SMS appends "reply C to confirm". |
| 7 SMS same-day morning | `booking.md` → **Part 3 (same-day variant)** | n/a | Same-day "today, {{appointment.start_time}}" + "reply C to confirm". **Transactional, but respect quiet hours (9am floor).** |
| 8 SMS 1h reminder | `booking.md` → **Part 3 (SMS-4)** | n/a | Part 3 Variation A / Variation B. **Transactional — exempt from frequency cap, NOT from quiet hours.** |

### PASTE THIS PROMPT (WF-4r — separate workflow · REBUILT, audit BLOCKER #1)
```
Create a workflow named "WF-4r Reschedule". Trigger: Customer Booked Appointment on calendar "15-min Site
Walkthrough with Alex". In the trigger settings, turn Allow Re-entry ON (the same contact must be able to pass
through again each time they rebook). Entry filter: contact HAS tag "confirmed-once" (this is what distinguishes a
RESCHEDULE from a first booking — when someone reschedules, GHL deletes the old appointment and creates a new one,
which re-fires this same "Customer Booked Appointment" trigger; the "confirmed-once" tag, set on the first booking
in WF-4, is present only on a re-booking). Steps in order:
1. Set contact field "Walkthrough Datetime" = {{appointment.start_time}} (the new slot).
2. Remove contact from workflow "WF-4b No-Show Recovery" (a reschedule means the no-show recovery goal is met).
3. Send Email (reschedule confirmation). [I will paste copy]
4. Send SMS (reschedule confirmation, ending "reply C to confirm"). [I will paste copy]
5. Remove tags "likely-no-show" and "confirmed:yes" (the new slot needs a fresh confirmation).
6. If/Else: contact has rescheduled twice or more -> add tag "status:reschedule-2x" and send internal notification
   to Alex (a 2x-rescheduler is a soft-decline -> Alex calls).
No new reminders are built here: because a reschedule ALSO re-enters WF-4 on this same "Customer Booked" trigger
(WF-4 has Allow Re-entry ON and its filter "confirmed-once NOT present" blocks the 1A/1B first-booking confirm
from re-firing), WF-4's 3-day/1-day/same-day/1-hour reminder Waits — all anchored to {{appointment.start_time}} —
recompute automatically against the new slot. Goal: tag "status:approved" OR DND.
```

> **Why this is the fix:** the old WF-4r triggered on "Appointment Status -> Rescheduled", **a GHL trigger that
> does not exist.** GHL handles a reschedule as delete-old + create-new, re-firing "Customer Booked Appointment".
> So both first-booking and reschedule share ONE trigger, split by the `confirmed-once` tag: WF-4 fires when it's
> ABSENT (first booking -> 1A/1B), WF-4r fires when it's PRESENT (reschedule -> 5.2 confirm). Allow Re-entry ON on
> both lets the same contact rebook repeatedly and recompute reminders each time.

### COPY MAP (WF-4r)
| Node | Source → label | Subject (A / B) | Body |
|---|---|---|---|
| 3 Email reschedule confirm | `booking.md` → **5.2-EMAIL** | `new time's set` / `locked for {{appointment.start_time}}` | 5.2-EMAIL Variation A / Variation B. |
| 4 SMS reschedule confirm | `booking.md` → **5.2-SMS** | n/a | 5.2-SMS Variation A / Variation B. Append "reply C to confirm". |

### POST-BUILD CHECKLIST (WF-4 + WF-4r)
- [ ] **Calendar setting (critical):** native confirmations/reminders **OFF** on the calendar — WF-4 owns all comms.
- [ ] **Trigger is "Customer Booked Appointment" with Allow Re-entry ON** on BOTH WF-4 and WF-4r (NOT the
      non-existent "Appointment Status → Rescheduled" — audit BLOCKER #1). WF-4 filter = `confirmed-once` NOT
      present (first booking); WF-4r filter = `confirmed-once` PRESENT (reschedule). This branching is the whole fix.
- [ ] **3-1-0 cadence built:** 3-day (only fires when slot >3d out, auto-skips otherwise) → 1-day → same-day 9am
      → 1-hour, each SMS ending "reply C to confirm".
- [ ] **"reply C" capture wired:** side trigger Customer Replied body = C/confirm → tag `confirmed:yes`. Step 9
      (T−2h) checks for it; absence → `likely-no-show` + Alex proactive-confirm task.
- [ ] A/B: If/Else on `contact.ab_lane` for the confirm email, 3-day email, 1-day email, reschedule email.
- [ ] **SMS-consent gate** before EVERY SMS (`source:form` OR `sms-consent`) — booked leads from the scraped pool
      consented on the Mia call; form leads consented at the form.
- [ ] Quiet-hours window on `contact.timezone` before every SMS (confirm, 3-day, 1-day, same-day, 1h, reschedule).
- [ ] Appointment-anchored SMS (same-day, 1h reminder): add the recipient-TZ If/Else (hold to next 9am local if it
      would fire pre-8am). The 10:00 CT calendar floor is the belt; this is the suspenders.
- [ ] STOP gate before each SMS. "Skip if DND" ON. Sender default confirmed.

---

## 3 · WF-2 — "Site Delivered — Nudge Engine"

> The delivery + nudge ladder for form/build-ready leads. Skips the "your site is live" step if the lead already
> got the link on a connected call. Source: `produce/inbound-form.md` Pieces 2–4.

### PASTE THIS PROMPT
```
Create a workflow named "WF-2 Site Delivered — Nudge Engine". Trigger: Contact Tag Added, tag "status:site-sent".
Entry filter: contact field "Site URL" (draft_site_url) is not empty. Steps in order:
1. Update Opportunity stage to "Site Link Sent" in "WDIFY Sales".
2. If/Else: contact HAS tag "status:connected".
   YES -> skip the delivery step (go straight to the Wait).
   NO  -> Send Email (site delivery) and Send SMS (site delivery). [I will paste copy]
3. Wait 2 days. If/Else (goal not met) -> Send Email (+2d nudge) and Send SMS (+2d nudge). [I will paste copy]
4. Wait 3 days (day 5 total). If/Else (goal not met) -> Send Email (+5d final) and Send SMS (+5d final). [I will paste copy]
5. End-of-ladder: add tag "nurture:long-game" (this hands the lead to WF-2b instead of dropping to Lost).
Set the workflow Goal to: tag "status:booked" OR tag "status:approved" OR opportunity stage at/beyond
"Walkthrough Booked" OR DND. Enable "Skip if DND" on every send.
```

### COPY MAP
| Node | Source → label | Subject (A / B) | Body |
|---|---|---|---|
| 2 Email delivery | `inbound-form.md` → **Piece 2** | `your site is live` / `it's built, see for yourself` | Piece 2 email variation (a) / (b). |
| 2 SMS delivery | `inbound-form.md` → **Piece 2 SMS** | n/a | Piece 2 SMS (a) / (b). |
| 3 Email +2d nudge | `inbound-form.md` → **Piece 3** | `it's just sitting there` / `two days, still yours` | Piece 3 email (a) / (b). |
| 3 SMS +2d nudge | `inbound-form.md` → **Piece 3 SMS** | n/a | Piece 3 SMS (a) / (b). |
| 4 Email +5d final | `inbound-form.md` → **Piece 4** | `yours either way` / `i'll leave it here` | Piece 4 email (a) / (b). |
| 4 SMS +5d final | `inbound-form.md` → **Piece 4 SMS** | n/a | Piece 4 SMS (a) / (b). |

### POST-BUILD CHECKLIST
- [ ] **Holdout exit at the top:** If/Else `holdout` present → exit before any send.
- [ ] A/B: If/Else on `contact.ab_lane` on each email AND SMS step (pair a-with-a / b-with-b).
- [ ] The `status:connected` If/Else MUST sit before the delivery step (prevents a duplicate "your site is live" after a call already delivered it).
- [ ] **SMS-consent gate before EVERY SMS** (`source:form` OR `sms-consent`): a scraped lead that reached `status:site-sent` without a connect (e.g. Alex set the link manually) has NOT consented → its SMS must NOT fire; the email path still runs. No cold SMS to un-connected scraped numbers (audit BLOCKER #2).
- [ ] Quiet-hours window + STOP gate before every SMS; sets `last_sms_at`.
- [ ] Goal event set. "Skip if DND" ON. Sender default. Footer on every email.
- [ ] Confirm step 5 adds `nurture:long-game` (do NOT also move to Lost here — WF-2b does that at its own end).

---

## 4 · WF-1 — "Form In — 24h Clock"

> The warm inbound entry. Creates the opportunity, acks, sets the 18h build task. Source: `produce/inbound-form.md` Piece 1.

### PASTE THIS PROMPT (with SPEED-TO-LEAD, audit #3)
```
Create a workflow named "WF-1 Form In — 24h Clock". Trigger: Contact Tag Added, tag "source:form" (secondary
trigger: Form Submitted, if a GHL-native form is used). No entry filters. Steps in order:
1. If contact field "AB Lane" is empty, set it to a random value "a" or "b" (50/50); add tag "ab:possession" for a or "ab:consequence" for b to match.
2. Create Opportunity in pipeline "WDIFY Sales", stage "New Lead", value 450, status open.
3. Add tag "status:new".
4. SPEED-TO-LEAD (do this FIRST, before the email): create a HIGH-PRIORITY Mia call task / auto-dial assigned to the dialer, due immediately ("now"), and send an internal notification to Alex "INBOUND — call within 5 min: {{contact.company_name}}". An inbound form-fill is the hottest lead in the system; do not let it sit. (A form lead is source:form = SMS-consented, so the dial + texts are compliant from minute one.)
5. Send Email (form acknowledgment). [I will paste copy]
6. Send SMS (form acknowledgment). [I will paste copy]
7. Create Task assigned to Alex: "FAST-LANE BUILD: {{contact.company_name}} ({{contact.niche}}, {{contact.city}}) — inbound, build within 1 hour (SLA); 24h-or-free is the ceiling" due in 1 hour.
8. Send internal notification to Alex and to info@: "24h clock started + 1h fast-lane: {{contact.company_name}}".
Set the workflow Goal to: tag "status:booked" OR tag "status:approved" OR DND. Enable "Skip if DND" on sends.
```

### COPY MAP
| Node | Source → label | Subject (A / B) | Body |
|---|---|---|---|
| 5 Email ack | `inbound-form.md` → **Piece 1** | `we're on it` / `clock just started` | Piece 1 email variation (a) / (b). |
| 6 SMS ack | `inbound-form.md` → **Piece 1 SMS** | n/a | Piece 1 SMS (a) / (b). **First SMS to number → carries business name + STOP line** (already in the body). |

### POST-BUILD CHECKLIST
- [ ] **Speed-to-lead step 4 is FIRST** (before email): immediate Mia dial/call-task + "call within 5 min" notify. This replaces the old 18h silence that let hot inbound go cold.
- [ ] **Fast-lane build SLA = 1 hour** (step 7 task due in 1h), NOT 18h. Inbound earns priority over scraped-pool builds; 24h-or-free is the ceiling.
- [ ] Step 1 sets `ab_lane` ONCE here so the lead stays congruent through WF-1 → WF-2 → WF-4.
- [ ] A/B: If/Else on `contact.ab_lane` for the ack email + SMS.
- [ ] **SMS-consent gate** before the SMS — passes because `source:form` is present (form = express consent). Quiet-hours window + STOP gate too (it is the first SMS to the number).
- [ ] Goal set. Sender default. Footer on the email.

---

## 5 · WF-4b — "No-Show Recovery"

> A no-show is a buried "yes." 2 touches per channel, then walk away. Opportunity STAYS at Walkthrough Booked
> (a delay, not a loss). Source: `produce/booking.md` Part 4.

### PASTE THIS PROMPT
```
Create a workflow named "WF-4b No-Show Recovery". Trigger: Appointment Status changed to "No Show" on calendar
"15-min Site Walkthrough with Alex". Entry filter: contact is not DND. Do NOT change the opportunity stage (it
stays at "Walkthrough Booked"). Steps in order:
1. Wait 1 hour. Then Send SMS (no-show recovery touch 1). [I will paste copy]
2. If/Else: contact email is not empty -> Send Email (no-show recovery touch 1). [I will paste copy]
3. Create Task assigned to Alex: "redial {{contact.company_name}} tomorrow 9am their time".
4. Wait 2 days. If/Else (no rebook AND not DND) -> Send SMS (no-show walk-away) and Send Email (no-show walk-away). [I will paste copy]
5. After the 2nd no-show with no rebook: Update Opportunity stage to "Lost/DNC", lost reason "no-show-exhausted",
   add tags "status:lost" and "reactivation:eligible".
Set the workflow Goal to: Customer Booked Appointment OR tag "status:approved" OR DND (a rebook re-fires the
"Customer Booked" trigger — that exits this workflow and re-enters WF-4/WF-4r, since a reschedule is also a new
booking in GHL). Enable "Skip if DND" on every send.
```

### COPY MAP
| Node | Source → label | Subject (A / B) | Body |
|---|---|---|---|
| 1 SMS touch 1 | `booking.md` → **4A (SMS-5)** | n/a | 4A Variation A / Variation B. |
| 2 Email touch 1 | `booking.md` → **4B (C3)** | `have you given up` / `still yours` | 4B Variation A / Variation B. |
| 4 SMS walk-away | `booking.md` → **4C** | n/a | 4C Variation A / Variation B. |
| 4 Email walk-away | `booking.md` → **4D** | `last one from me` / `i'll stop here` | 4D Variation A / Variation B. |

### POST-BUILD CHECKLIST
- [ ] **Holdout exit at the top:** If/Else `holdout` present → exit before any send.
- [ ] A/B: If/Else on `contact.ab_lane` (pair 4A-A with 4B-A, 4C-A with 4D-A, etc.).
- [ ] **SMS-consent gate** before each SMS (`source:form` OR `sms-consent`) — a booked lead consented at booking (form) or on the Mia call, so this normally passes; the gate is the belt-and-suspenders.
- [ ] T+1h SMS is appointment-anchored — add the recipient-TZ If/Else (hold to next 9am local if pre-8am).
- [ ] STOP gate + quiet-hours window before each SMS.
- [ ] **Recovery cap = 2 cycles:** a rebook re-enters WF-4; after the 2nd no-show with no rebook, step 5 moves to Lost. Confirm the goal (rebook) exits cleanly.
- [ ] "Skip if DND" ON. Sender default. Footer on both emails.

---

## 6 · WF-6 — "Reactivation"

> The recycling loop. Trigger is a tag added by a monthly Smart List (built separately — see note). Call-first
> for the phone-rich pool; ONE email/SMS touch when the number's exhausted. Source: `produce/nurture-react.md` Part 2.

### PASTE THIS PROMPT
```
Create a workflow named "WF-6 Reactivation". Trigger: Contact Tag Added, tag "reactivation:round-1" OR
"reactivation:round-2". Entry filter: contact field "Site URL" is not empty AND contact is not DND. Steps in order:
1. Re-open the EXISTING opportunity (do not create a new one); move it to stage "Site Link Sent" in "WDIFY Sales".
2. If/Else: contact is phone-textable (has a valid mobile).
   YES -> (this is handled by re-queuing Mia's dialer outside GHL; in GHL just) Send SMS (reactivation). [I will paste copy]
   plus If/Else email is not empty -> Send Email (reactivation). [I will paste copy]
3. Wait 14 days. If/Else (round-1 got no engagement) -> the monthly Smart List will add "reactivation:round-2";
   if this is already round-2 with no engagement -> remove tag "reactivation:eligible" (permanent Lost, never DND).
Set the workflow Goal to: tag "status:booked" OR tag "status:approved" OR DND. Enable "Skip if DND" on sends.
```

### COPY MAP
| Node | Source → label | Subject (A / B) | Body | Use when |
|---|---|---|---|---|
| 2 Email reactivation (standard) | `nurture-react.md` → **REA-1** | `it's still live` / `before the spot's gone` | REA-1 Variation A / Variation B | Lost reason = gone-cold / nurture-exhausted / no-show-exhausted |
| 2 Email reactivation (walked-away) | `nurture-react.md` → **REA-2** | `how's the phone` / `still where you left it` | REA-2 Variation A / Variation B | Lost reason = **walked-away** (use this instead of REA-1) |
| 2 SMS reactivation | `nurture-react.md` → **REA-1s / REA-2s** | n/a | REA-1s (standard) or REA-2s (walked-away). **First SMS in 30–60d → full compliance line** (already in body). |

**Merge fields:** REA copy uses `{{custom_values.spots_remaining}}` and `{{custom_values.first_founder}}` —
**gate every REA send on both being non-empty** (the scarcity must be provable). If `spots_remaining = 0`, the
price has flipped to $700 — retire the "$450 founding" REA copy and stop reactivation.

### POST-BUILD CHECKLIST
- [ ] **Holdout exit at the top:** If/Else `holdout` present → exit before any send.
- [ ] Build the **monthly "Reactivation Eligible" Smart List** (stage = Lost/DNC, lost reason in {walked-away, gone-cold, nurture-exhausted, no-show-exhausted}, DND=false, `reactivation:eligible` present, last stage change ≥ 30 days, `reactivation_round < 2`). Run monthly → bulk-add `reactivation:round-{N}` and increment `reactivation_round`. GHL has no native monthly-list trigger — this is a recurring manual/scripted action.
- [ ] Reason-based If/Else: walked-away → REA-2; everything else → REA-1.
- [ ] Add a gate: hold the send if `custom_values.spots_remaining` or `custom_values.first_founder` is empty.
- [ ] **SMS-consent gate before the REA SMS** (`source:form` OR `sms-consent`): a scraped lead reactivates via the DIALER (re-queued to Mia) — its REA SMS fires only if Mia previously captured consent. No cold reactivation SMS to a never-connected scraped number.
- [ ] Quiet-hours window + STOP gate before the SMS (likely the first text in 30–60 days). "Skip if DND" ON.
- [ ] Re-open the existing opportunity — never create a duplicate. Round cap = 2. Sender default. Footer on emails.

---

## 7 · WF-5 — "STOP/DNC Guard"

> Legal terminal. Fires from any state, removes the contact from everything. No copy nodes. Source: control logic.

### PASTE THIS PROMPT
```
Create a workflow named "WF-5 STOP/DNC Guard". Triggers (any one): (a) Customer Replied where the inbound SMS
body contains any of the full FCC-recognized opt-out set, case-insensitive, matched anywhere in the body: "stop"
or "stopall" or "unsubscribe" or "cancel" or "end" or "quit" or "opt out" or "optout" or "revoke" or "remove" or
"don't call"; (b) Contact Tag Added "status:dnc"; (c) Email unsubscribe / opt-out event. No filters. Steps in order:
1. Enable DND for all channels (Email, SMS, Calls).
2. Add tags "status:dnc" and "sms-optout".
3. Remove the contact from ALL other workflows.
4. Update Opportunity stage to "Lost/DNC" in "WDIFY Sales".
5. Send internal notification to Alex.
This workflow sends no marketing messages.
```

### COPY MAP
None — WF-5 sends no prospect-facing copy.

### POST-BUILD CHECKLIST
- [ ] Confirm "Remove from all other workflows" is enabled (prevents a queued nurture step firing post-opt-out).
- [ ] `reactivation:eligible` must NEVER be set on a DNC (this is terminal). Verify no other workflow can re-add it.
- [ ] **Full FCC opt-out keyword set** in trigger (a): stop/stopall/unsubscribe/cancel/end/quit/opt out/optout/revoke/remove/don't call (audit #8).
- [ ] **Weekly cross-system suppression:** export a Smart List `DND = true` → feed Mia's suppression list AND the Smartlead suppression. (Manual/scripted weekly job — GHL won't push it for you.)
- [ ] Internal notification routes to Alex. No quiet-hours/STOP/sender steps needed (no sends).

---

## 7.1 · WF-PR — "Positive-Reply Router" (real-time interested-reply routing · audit #4)

> An *interested* reply currently hits nothing — only STOP (WF-5) is handled. This catches every non-opt-out
> inbound and routes it to an instant answer (Conversation AI for FAQ intents, a human for hot/ambiguous ones).
> Build it EARLY — it's catching money that's otherwise ghosted.

### PASTE THIS PROMPT
```
Create a workflow named "WF-PR Positive-Reply Router". Trigger: Customer Replied (inbound SMS or email). Allow
Re-entry ON. Entry filter: the inbound body does NOT contain any opt-out keyword (stop, stopall, unsubscribe,
cancel, end, quit, opt out, optout, revoke, remove, don't call) — those go to WF-5 and must never land here. First
action: bump contact field "Lead Score" by 60 (a reply is the strongest engagement signal). Then an If/Else
intent branch on the inbound body, evaluated in order:
1. If body contains "scam" or "real" or "legit" or "who is this" or "is this" -> add tag "intent:trust"; route to
   GHL Conversation AI (trust-objection intent) OR create a high-priority Task for Alex "skeptic reply — answer in
   5 min". The reply leads with the proof (their live link), never a pitch.
2. Else if body contains "price" or "cost" or "how much" or "$" -> add tag "intent:pricing"; route to GHL
   Conversation AI (pricing intent: $450 founding price, what's included, the booking link) OR Alex task.
3. Else if body contains "yes" or "interested" or "book" or "call me" or "send it" or "let's" -> add tag
   "intent:hot"; immediately send the booking link {{custom_values.booking_link}}; move Opportunity to "Site Link
   Sent" if earlier; send internal notification to Alex "HOT reply — call now".
4. Else (any other non-opt-out reply) -> add tag "intent:unclassified"; create a Task for Alex "inbound reply —
   read + respond" and notify. Never leave an interested human unanswered.
Set the workflow Goal to: tag "status:booked" OR tag "status:approved" OR DND. Every Conversation AI reply and
send respects DND and the SMS-consent gate.
```

### COPY MAP
None — WF-PR routes to Conversation AI / human tasks; it does not send a fixed marketing template. (The hot-branch
booking-link text is a one-line "here's the link to lock your time: {{custom_values.booking_link}}".)

### POST-BUILD CHECKLIST
- [ ] **Runs AFTER WF-5's opt-out filter** — an opt-out reply must hit WF-5 (DND), never WF-PR. The "body does NOT contain opt-out keyword" entry filter enforces this.
- [ ] Conversation AI configured for the trust + pricing intents (or fallback Alex tasks if Conversation AI isn't enabled).
- [ ] Reply bumps `lead_score` +60 so the dialer re-prioritizes them.
- [ ] Hot branch sends the booking link + notifies Alex to call. "Skip if DND" + consent gate respected on any send.

---

## 7.2 · WF-SL — "Smartlead → GHL Cold-Email Handoff" (channel orchestration · cold-email)

> **Cold email runs on SMARTLEAD, not GHL** (shared-pool/ToS + warm-domain protection). GHL is the hub; Smartlead
> is the cold-email spoke. This workflow is the bridge: a Smartlead reply/click webhook turns a cold lead warm in
> GHL, stops the cold campaign, and drops them into the warm nurture. See `01-GHL-BUILD-SPEC.md §15`.

### PASTE THIS PROMPT
```
Create a workflow named "WF-SL Smartlead Cold Handoff". Trigger: Inbound Webhook (copy the generated webhook URL —
you will paste it into Smartlead's reply + click webhook settings so Smartlead calls it on engagement). The
payload carries the contact email + event type (reply or click). Steps in order:
1. Find or create the contact by the email in the webhook payload (if new: add tag "source:scraper", set Lead
   Source = "smartlead").
2. Add tag "warm". Bump contact field "Lead Score" by 60 if event = reply, else by 50 if event = click.
3. Call Smartlead's API to PAUSE/REMOVE this contact from the cold campaign (use a GHL outbound webhook / custom
   HTTP action with the Smartlead API key + the lead's Smartlead id/email) — so they never get cold + warm at once.
4. Update Opportunity stage to "Site Link Sent" in "WDIFY Sales". Add tag "status:site-sent" (this drops them into
   the warm post-delivery nurture, WF-2).
5. Send internal notification to Alex "cold reply went warm — {{contact.email}}" so a human can ride a hot reply.
Set the workflow Goal to: tag "status:booked" OR tag "status:approved" OR DND.
```

### COPY MAP
None — WF-SL is orchestration; the warm copy is delivered by WF-2 once `status:site-sent` lands.

### POST-BUILD CHECKLIST
- [ ] **Smartlead side:** point Smartlead's reply + click webhooks at this workflow's Inbound Webhook URL.
- [ ] **Step 3 (Smartlead campaign-stop) MUST succeed before WF-2's first send** — or rely on the daily warm+cold dedupe job to apply `cold-suppress` as backstop. One person never gets Smartlead-cold + GHL-warm simultaneously.
- [ ] Cold email is NEVER sent from GHL/LC Email (warm domain protection). WF-D (in-GHL cold) stays LEGACY/OFF.
- [ ] Confirm `status:site-sent` correctly enrolls WF-2 (warm nurture) for the now-warm lead.

---

## 7.3 · WF-HC — "Deliverability Health-Check + Holdout" (measurement · audit #7)

> Protects the warm domain's reputation proactively and measures the machine's true incremental lift with a clean
> holdout control. GHL has no native scheduled-job trigger, so the health-check half is a recurring scripted job;
> the holdout half is a tag + an If/Else at the top of every nurture workflow.

### PASTE THIS PROMPT (the holdout gate — add to GHL; the weekly stats job is scripted, see checklist)
```
Create a workflow named "WF-HC Holdout Gate". Trigger: Contact Tag Added "holdout". Steps:
1. (No sends.) This workflow exists only to document the holdout; the actual enforcement is an If/Else at the TOP
   of every nurture workflow (WF-2, WF-2b, WF-3, WF-6, WF-7a/b): IF contact has tag "holdout" -> exit the workflow
   before any send (they stay in the pipeline and receive nothing, as the incremental-lift control group).
Add an internal note: "~10% of contacts are tagged holdout at import; compare their booked/closed rate against the
treated group weekly to measure true lift."
```

### COPY MAP
None.

### POST-BUILD CHECKLIST
- [ ] **Holdout If/Else added to the TOP of every nurture workflow** (WF-2, WF-2b, WF-3, WF-6, WF-7a/b): `holdout` present → exit before any send. (Add this gate when building each of those workflows.)
- [ ] `holdout` tag applied to a random ~10% at import (§11.3 of the build spec).
- [ ] **Weekly deliverability job (scripted, not GHL):** read the warm domain's spam-complaint + bounce rate (Google Postmaster Tools + GHL email stats); alert Alex (notification + Telegram) the instant complaint rate nears **0.1%** (hard ceiling 0.3%) or bounce spikes >2%; auto-pause volume sends if a threshold is crossed.
- [ ] **Weekly lift report (scripted):** booked/closed rate of treated vs `holdout` → the delta is the machine's real incremental lift.

---

## 8 · WF-7a / WF-7b — "Post-Sale" (Fulfillment + Review)

> Two workflows for clean goal separation. Source: `produce/postsale.md`.

### PASTE THIS PROMPT (WF-7a Fulfillment)
```
Create a workflow named "WF-7a Post-Sale Fulfillment". Trigger: Contact Tag Added, tag "status:paid". Steps:
1. Send Email (payment confirmation) and Send SMS (payment confirmation). [I will paste copy]
2. Wait 15 minutes. Send Email (welcome / what happens next + domain ask). [I will paste copy]
3. Wait 2 days. If/Else (no inbound reply AND tag "status:live" not present) -> Send SMS (onboarding nudge). [I will paste copy]
4. Create Task assigned to Alex: "point domain + swap real photos/number/colors for {{contact.company_name}};
   if founding_spot_number = 10, trigger the price-flip to $700".
5. On tag "status:live" added: Send Email (live announcement) and Send SMS (live announcement). [I will paste copy]
Set the workflow Goal to: tag "status:live" added. Enable "Skip if DND" on every send.
```

### COPY MAP (WF-7a)
| Node | Source → label | Subject (A / B) | Body |
|---|---|---|---|
| 1 Email pay confirm | `postsale.md` → **PAY-1** | `that's locked in` / `you're in` | PAY-1 Variation A / Variation B (runs long — paste full). |
| 1 SMS pay confirm | `postsale.md` → **PAY-1-SMS** | n/a | PAY-1-SMS Variation A / Variation B. |
| 2 Email welcome | `postsale.md` → **WELCOME-1** | `what happens next` / `your site, your name` | WELCOME-1 Variation A / Variation B. |
| 3 SMS onboarding nudge | `postsale.md` → **WELCOME-1-SMS** | n/a | WELCOME-1-SMS Variation A / Variation B. |
| 5 Email live announce | `postsale.md` → **WELCOME-2** | `it's live, it's yours` / `go check it` | WELCOME-2 Variation A / Variation B. |
| 5 SMS live announce | `postsale.md` → **WELCOME-2-SMS** | n/a | WELCOME-2-SMS Variation A / Variation B. |

### PASTE THIS PROMPT (WF-7b Review)
```
Create a workflow named "WF-7b Post-Sale Review". Triggers (either): Contact Tag Added "status:first-job"; OR
Wait 14 days after tag "status:live" was added, then proceed only if contact field "First Job Reported" is not
"yes". Steps:
1. Send Email (review ask) and Send SMS (review ask). [I will paste copy]
2. Wait 4 days. If/Else (no review AND no reply) -> Send Email (review nudge). [Email only — I will paste copy]
3. End.
Set the workflow Goal to: a review is left OR any reply is received (so the nudge auto-skips).
```

### COPY MAP (WF-7b)
| Node | Source → label | Subject (A / B) | Body |
|---|---|---|---|
| 1 Email review ask | `postsale.md` → **REVIEW-1** | `that first one` / `first one come through yet` | REVIEW-1 Variation A (self-report) / Variation B (fallback check-in). |
| 1 SMS review ask | `postsale.md` → **REVIEW-1-SMS** | n/a | REVIEW-1-SMS Variation A / Variation B. Single CTA = `{{custom_values.review_link}}`. |
| 2 Email review nudge | `postsale.md` → **REVIEW-2** | `thirty seconds` / `last nudge on this` | REVIEW-2 Variation A / Variation B. **Email only — no second review SMS.** |

### POST-BUILD CHECKLIST (WF-7a + WF-7b)
- [ ] A/B: these post-sale pieces are single-decision enough that **native GHL A/B split is acceptable** here (per spec §9.2) — or keep the `ab_lane` If/Else for consistency. SMS twin follows whichever email arm fired.
- [ ] Quiet-hours window + STOP gate before every SMS (PAY-1, WELCOME-1, WELCOME-2, REVIEW-1).
- [ ] Review link `{{custom_values.review_link}}` must be set before WF-7b can fire its CTA.
- [ ] WF-7a goal = `status:live`; WF-7b goal = review/reply (so REVIEW-2 auto-skips). "Skip if DND" ON. Footer on all emails.
- [ ] Step 4 price-flip: if `founding_spot_number = 10`, flip default opp value + calendar/email copy to $700.

---

## 9 · WF-2b — "Long-Game Nurture"

> The patient 5-touch arc (~24 days) for a not-yet-ready lead handed over by WF-2. Source: `produce/nurture-react.md` Part 1.

### PASTE THIS PROMPT
```
Create a workflow named "WF-2b Long-Game Nurture". Trigger: Contact Tag Added, tag "nurture:long-game". Entry
filter: contact field "Site URL" is not empty AND NOT tags "status:booked"/"status:approved"/"status:dnc". Steps:
1. Send Email (LGN-1) and Send SMS (LGN-1s). [I will paste copy]
2. Wait 5 days. If/Else (goal not met) -> Send Email (LGN-2) and Send SMS (LGN-2s). [I will paste copy]
3. Wait 6 days (day 11). If/Else (goal not met) -> Send Email (LGN-3) and Send SMS (LGN-3s). [I will paste copy]
4. Wait 6 days (day 17). If/Else (goal not met) -> Send Email (LGN-4) and Send SMS (LGN-4s). [I will paste copy]
5. Wait 7 days (day 24). If/Else (goal not met) -> Send Email (LGN-5 walk-away) and Send SMS (LGN-5s). [I will paste copy]
6. End branch (no booking): Update Opportunity stage to "Lost/DNC", lost reason "nurture-exhausted", add tags
   "status:lost" and "reactivation:eligible". Keep the draft live.
Set the workflow Goal to: tag "status:booked" OR tag "status:approved" OR opportunity at/beyond "Walkthrough
Booked" OR DND. Enable "Skip if DND" on every send.
```

### COPY MAP
| Node | Source → label | Subject (A consequence / B possession) | Body |
|---|---|---|---|
| 1 Email LGN-1 | `nurture-react.md` → **LGN-1** | `still losing the jobs` / `you already own this` | LGN-1 Variation A / Variation B. |
| 1 SMS LGN-1s | `nurture-react.md` → **LGN-1s** | n/a | LGN-1s (shared SMS, pick by arm). |
| 2 Email LGN-2 | `nurture-react.md` → **LGN-2** | `what's one job worth` / `the small part` | LGN-2 Variation A / Variation B. |
| 2 SMS LGN-2s | `nurture-react.md` → **LGN-2s** | n/a | LGN-2s. |
| 3 Email LGN-3 | `nurture-react.md` → **LGN-3** | `the price moves soon` / `lock it before it jumps` | LGN-3 Variation A / Variation B. |
| 3 SMS LGN-3s | `nurture-react.md` → **LGN-3s** | n/a | LGN-3s. |
| 4 Email LGN-4 | `nurture-react.md` → **LGN-4** | `three weeks, zero dollars` / `yours the whole time` | LGN-4 Variation A / Variation B. |
| 4 SMS LGN-4s | `nurture-react.md` → **LGN-4s** | n/a | LGN-4s. |
| 5 Email LGN-5 (walk-away) | `nurture-react.md` → **LGN-5** | `last one, then quiet` / `keeping it simple` | LGN-5 Variation A / Variation B. |
| 5 SMS LGN-5s | `nurture-react.md` → **LGN-5s** | n/a | LGN-5s. |

### POST-BUILD CHECKLIST
- [ ] **Holdout exit at the top:** If/Else `holdout` present → exit before any send.
- [ ] A/B: If/Else on `contact.ab_lane` — A = consequence-forward, B = possession-forward (the LGN-1s…5s SMS are shared; pick by the same lane).
- [ ] **SMS-consent gate before every SMS** (`source:form` OR `sms-consent`) — a long-game lead that never connected/consented gets the email arm only, no SMS.
- [ ] Quiet-hours window + STOP gate before every SMS; `last_sms_at` set on send.
- [ ] Cadence: +0 / +5d / +11d / +17d / +24d. Goal event set (auto-skips remaining touches on book/buy).
- [ ] End step moves to Lost + `reactivation:eligible` (draft stays live for WF-6). "Skip if DND" ON. Footer on emails.

---

## 10 · WF-D / WF-Dr — "Cold Phase-2"  (LEGACY — superseded by Smartlead/WF-SL; KEEP OFF)

> **⚠️ LEGACY.** Cold email now runs on **Smartlead**, NOT GHL (shared-pool/ToS + warm-domain protection) —
> the live cold→warm bridge is **WF-SL** (§7.2). WF-D/WF-Dr are kept here as the in-GHL fallback design only and
> **stay toggled OFF.** If ever revived: phase 2 only — needs 2–3 warmed cold domains + 3–4 week warmup, A2P
> 10DLC approved, and WF-Dr (the reply autopath) built + smoke-tested first. Source: `produce/cold-email.md`.

### PASTE THIS PROMPT (WF-D)
```
Create a workflow named "WF-D Cold Phase-2" and LEAVE IT TOGGLED OFF. Trigger: Contact Tag Added "cold-phase2".
Entry filter: contact field "Site URL" is not empty AND contact is not DND. Suppress/exclude: any contact in
WF-1/WF-2/WF-3 (warm), any "status:dnc"/"sms-optout", any opportunity stage at/beyond "Connected", any contact
tagged "cold-suppress". Steps in order:
1. First action: randomly assign tag "lane:a" or "lane:b" (50/50).
2. Send Email 1 (no links). [I will paste copy] Subject by lane.
3. Wait 2 days. If/Else (goal not met) -> Send Email 2 (one bare link). [I will paste copy]
4. Wait 3 days (day 5). If/Else (goal not met) -> Send Email 3 (one bare link). [I will paste copy]
5. Wait 3 days (day 8). If/Else (goal not met) -> Send Email 4 (walk-away, one bare link). [I will paste copy]
6. End. There is no Email 5, ever.
Set the workflow Goal to: reply received OR tag "status:booked" OR tag "status:approved" OR DND. Sender = the
warmed cold-domain identity (NOT info@wedidit4you.com); From name "Alex at We Did It For You"; reply-to a
monitored inbox.
```

### COPY MAP (WF-D)
| Node | Source → label | Subject (lane A bold / lane B low-key) | Body |
|---|---|---|---|
| 2 Email 1 (no links) | `cold-email.md` → **Email 1** | `i built you a website` / `quick thing about your shop` | Email 1 single body (lane-agnostic). |
| 3 Email 2 (1 link) | `cold-email.md` → **Email 2** | `did this land in spam` / `the link i mentioned` | Email 2 single body. |
| 4 Email 3 (1 link) | `cold-email.md` → **Email 3** | `the jobs you're losing` / `about that founding price` | Email 3 single body. |
| 5 Email 4 (walk-away) | `cold-email.md` → **Email 4** | `i'll stop here` / `last note from me` | Email 4 single body. |

### PASTE THIS PROMPT (WF-Dr — build + smoke-test BEFORE WF-D ever toggles on)
```
Create a workflow named "WF-Dr Cold Reply Autopath". Trigger: Customer Replied (inbound email on the cold
domain) where the body contains "send it" or "send" or "yes" or "link" or "sure". Steps:
1. Send Email containing the bare link {{contact.draft_site_url}} (the link Email 1 withheld).
2. Send internal notification / Task to Alex so a human can ride the hot reply.
3. Update Opportunity stage to "Site Link Sent"; add tag "status:site-sent" (re-enters the warm post-delivery nurture).
```

### POST-BUILD CHECKLIST (WF-D + WF-Dr)
- [ ] **WF-D stays OFF** until: cold domains warm, WF-Dr built + smoke-tested (reply → link fires in seconds).
- [ ] A/B = SUBJECT ONLY by `lane:a`/`lane:b` (bodies identical) — If/Else picks the subject; keep the lane through all 4.
- [ ] **Email 1 footer exception:** plain-text postal address + `reply STOP and I'm gone` under `— alex`. Do NOT add the hyperlinked unsubscribe element to Email 1. Emails 2–4 carry the normal `{{custom_values.email_footer}}` one-click footer.
- [ ] Sender = warmed cold-domain identity (NOT info@), reply-to a monitored inbox (the "comes straight to me" promise must be true).
- [ ] One bare link per email (Emails 2–4); no buttons, no tracking redirects, no shorteners. Plain text only.
- [ ] Goal event set so no "did this land in spam" fires after a reply. Ongoing warm/cold dedupe (`cold-suppress`) job running.

---

## FINAL PRE-LAUNCH GATE (do not toggle ON until clear)

- **SMS consent gate wired (audit BLOCKER #2):** every SMS step begins with the `source:form` OR `sms-consent`
  hard If/Else; NO SMS to a scraped number without Mia-captured verbal consent (`sms_consent_at` set). Pure-cold
  SMS to un-connected scraped numbers is REMOVED — a cold SMS = per-message TCPA + 10DLC-suspension exposure.
- **All SMS:** A2P 10DLC brand + campaign **`approved`** at TCR, on a **DEDICATED WDIFY SignalWire number**
  (dedicated to WDIFY only), **registered honestly as voice-captured-consent** (opt-in =
  verbal phone consent; sample = the real Mia call-script opt-in line). Until then run email-only and HOLD SMS.
- **All email:** CAN-SPAM footer live (booking/pay emails carry founding-price + guarantee = commercial, so footer
  REQUIRED) + `List-Unsubscribe` headers injecting + **DMARC verified** by a real seed (`dmarc=pass`, not asserted)
  + the 10–14 day warm-domain ramp (20→50→100/day) cleared.
- **Cold email:** runs on **Smartlead**, not GHL. **WF-SL (Smartlead→GHL handoff) built + smoke-tested** (a test
  reply tags `warm`, stops the cold campaign, enters WF-2). WF-D stays LEGACY/OFF.
- **WF-PR Positive-Reply Router live** (+ Conversation AI or Alex-task routing) so an interested reply gets a
  real-time answer — never silence.
- **WF-HC:** deliverability health-check job scheduled (weekly complaint/bounce alert + auto-pause) and `holdout`
  ~10% tagged at import for incremental-lift measurement.
- **Reactivation (WF-6):** `custom_values.spots_remaining` + `custom_values.first_founder` set.
- **Mia webhook** wired (`call_outcome`/`sms_consent_at`/tags → WF-3/WF-5). **Smoke test** each workflow with a
  test contact before real traffic: add `source:form` (WF-1 fires + speed-to-lead dial), add `status:connected` +
  `sms-consent` (WF-3 SMS), book a slot (WF-4 3-1-0), reschedule it (WF-4r fires, NOT WF-4 re-confirm), mark
  No-Show (WF-4b), reply "interested" (WF-PR routes), reply STOP (WF-5 DNDs), fire a Smartlead test webhook (WF-SL).

> Any copy change → edit the `produce/*` source → re-run `/panel` → re-paste. Never edit copy in the GHL node.
