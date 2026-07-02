# WDIFY — GHL BUILD SPEC (click-by-click execution checklist)

**Date:** 2026-06-16 · **Sub-account (location):** `[REDACTED]` — "We Did It For You"
**Persona:** Alex Rojko · **Sender:** `Alex at We Did It For You` / `info@wedidit4you.com` (GHL LC Email only — never custom SMTP)
**Status:** READY TO EXECUTE the moment the GHL agency reactivates.

**This file is the BUILD CHECKLIST someone executes click-by-click.** It is the concrete, exhaustive
companion to two design docs that already exist — do not re-derive them, build from them:
- **WIRING + BRANCHING LOGIC:** `00-TOUCHPOINT-GRAPH.md` (the A–Z state machine — every call outcome,
  every branch, every exit/re-entry rule). This spec implements that graph as GHL objects.
- **COPY (verbatim, panel-approved):** `produce/inbound-form.md` · `produce/post-call.md` ·
  `produce/booking.md` · `produce/nurture-react.md` · `produce/postsale.md` · `produce/cold-email.md`,
  which expand the canon `../email/SEQUENCES.md` + `../sms/SMS-COPY.md`. **Never reword copy in GHL** —
  paste the bodies from those files; edit the source, re-run `/panel`, then re-sync.

**Supersedes/extends** the earlier `../ghl/GHL-BUILD-SPEC.md` (WF-1…WF-5). This file carries the full set
the campaign now needs: WF-1…WF-7 + WF-2b + WF-4b, the expanded calendar, the A/B harness, and the exact
custom-field/tag/pipeline definitions that match the produced content and the Aljaz Supabase contract
(`../REPO-INTEGRATION-MAP.md`).

**Copy law (every message obeys it):** the WDIFY copy standards.

---

## 0. WHY THIS DESIGN (the load-bearing logic, in one screen)

Everything below is shaped by five facts from `CONTEXT.md` + `OFFER-AB-PREDICTION.md`:

1. **The buyer is a skeptic, not a curiosity-seeker.** So GHL delivers **proof first** (the live link in
   their pocket within 2 min of a connect) and never begs. Every nurture restates a *loss*, never a plea.
2. **The connect is the scarce resource AND the consent gate** (742 leads, only ~14 have email). Calling is
   primary; GHL's job is the long game *around* the call — link delivery, booking, reminders, no-show recovery,
   nurture, reactivation, post-sale. **SMS carries the phone-rich majority — but ONLY after consent.** The 742
   are scraped (no prior consent); a cold SMS to them is a TCPA violation + 10DLC brand-suspension risk. So the
   **Mia voice connect is re-cast as the consent-capture event**: the first SMS to any scraped number fires only
   after Mia captured verbal opt-in on a live call (`sms_consent_at` set, tag `sms-consent`). `source:form` leads
   consent at the form. **No pure-cold SMS to an un-connected scraped number — ever** (§8 SMS-consent gate).
3. **One writer per resource = no races** (`REPO-INTEGRATION-MAP §5`). **Mia writes `call_*`** to Supabase;
   **Aljaz writes `slug`/`sms_*`/`inbound_*`**; **GHL owns `status:*` tags + the opportunity stage + all
   nurture + the calendar.** The **opportunity stage is the single source of truth** for "where is this
   deal." Tags are *additive history* + workflow triggers — never the source of truth for position.
4. **Goals, not fixed-length sequences.** Every nurture workflow has a **goal event** (booked/approved/
   stage-advanced/DND). The instant it fires, all remaining steps auto-skip. A "your site is just sitting
   there" email after they booked is the #1 way automation looks broken and torches a skeptic's trust.
5. **Nothing valuable is discarded except a DNC.** Walked-away / gone-cold / no-show-exhausted all keep a
   live draft and become `reactivation:eligible` (WF-6, 2 rounds). Only `status:dnc` (legal) and bad-number
   (dead data) have no recovery path.

---

## 1. SUB-ACCOUNT (LOCATION) — first-login fixes

| Step | Action | Why |
|---|---|---|
| 1.1 | Reactivate agency → confirm location **`[REDACTED]`** ("We Did It For You", [REDACTED], [REDACTED]) reappears. | The spec is keyed to this ID; the push script reads it from `GHL_WDIFY_LOCATION_ID`. |
| 1.2 | **Settings → Business Profile → Timezone:** change `Europe/London` → **`America/Chicago`**. | Leads are TX/AZ/FL; TX dominates + both Lubbock spec builds. Calendar + quiet-hours + reminder math all run in location TZ. **Do this before building the calendar** or every Wait-until time is wrong. |
| 1.3 | Business profile: We Did It For You · wedidit4you.com · info@wedidit4you.com · industry **Marketing/Web**. | Sender identity + LC Email domain verification depend on it. |
| 1.4 | **Fallback only if location unrecoverable:** create a new location, same name, **TZ America/Chicago**, same profile. Nothing else depends on the old ID — set `GHL_WDIFY_LOCATION_ID` to the new one and every artifact below rebuilds from this file. | This file IS the snapshot. |

---

## 2. LC EMAIL — dedicated sending domain (transactional + warm ONLY)

GHL is the only sender (the standing rule). **Cold volume stays OFF this domain** (WF-D is phase-2 on separate
warmed domains). These workflows are form acks, link drops, booking comms, post-call follow-ups,
nurture, reactivation, post-sale — all warm/transactional, < 100/day by design.

**Build in GHL UI:** Sub-account → **Settings → Email Services** → confirm SMTP provider = **LeadConnector
Email** → **Dedicated Domain (and IP)** → add **`mail.wedidit4you.com`** (subdomain, NOT root — root MX is
Google Workspace and carries the info@ inbox; never touch root MX/SPF).

**DNS host = GoDaddy** (ns51/ns52.domaincontrol.com → dcc.godaddy.com → wedidit4you.com → DNS). GHL shows
the exact values after you add the domain; the record shapes:

| Type | Host ("Name") | Value | Note |
|---|---|---|---|
| TXT | `mail` | `v=spf1 include:mailgun.org ~all` | SPF for the sending subdomain only |
| TXT | `<selector>._domainkey.mail` | `k=rsa; p=<DKIM key GHL displays>` | copy selector + key verbatim from GHL |
| CNAME | `email.mail` | `mailgun.org` | open/click tracking |
| MX | `mail` | `mxa.mailgun.org` (priority 10) | bounce/reply — subdomain only |
| MX | `mail` | `mxb.mailgun.org` (priority 10) | |

**Verify, do NOT change (already at root):** root MX → Google Workspace; root SPF macro; root DMARC
`p=quarantine; adkim=r; aspf=r` (relaxed alignment means DKIM `d=mail.wedidit4you.com` aligns with
`From: info@wedidit4you.com` — no DMARC change needed).

**Sender identity (set as LOCATION DEFAULT):** From name **`Alex at We Did It For You`** · From/Reply-to
**`info@wedidit4you.com`** (replies land in Google Workspace — matches "I answer every email myself").

**DMARC alignment — VERIFY, do not assert (panel deliverability fix).** The claim "no DMARC change needed"
above is a hypothesis until proven. Before any real send: fire ONE seed to a Gmail address, open the raw
headers, and confirm the `Authentication-Results` line shows **all three**: `spf=pass`, `dkim=pass`
(`d=mail.wedidit4you.com`), and **`dmarc=pass`** under relaxed alignment against `From: info@wedidit4you.com`.
If `dmarc=pass` does NOT appear, the subdomain selector is not covered by root DMARC — add a subdomain DMARC
record `_dmarc.mail` (`v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc@wedidit4you.com`) and re-seed.
**Do not go live on the assertion.** Enroll the root domain in **Google Postmaster Tools** and hold the
spam-complaint rate **< 0.1%** (hard ceiling 0.3% per Gmail bulk-sender rules).

### 2.1 CAN-SPAM + one-click unsubscribe footer (BLOCKER — every email, warm AND cold)

CAN-SPAM (15 U.S.C. 7704) requires a **valid physical postal address** AND a **clear opt-out** in every
**commercial** email. **Rationale fix (audit #9):** the booking-confirm and pay-confirm emails are NOT purely
transactional — they carry the **founding-price + the guarantee**, which are *commercial* messaging, so the
footer is **required** on them (not merely "nice to have"). And because the warm sequences interleave
transactional and commercial content across one relationship, the **correct, defensible posture is to carry the
footer on EVERY email** — keeping the footer everywhere is right; the prior note just under-explained *why* the
booking/pay emails need it. (The only exception is WF-D Email 1's plain-text form, reconciled below.) Gmail/Yahoo
2024+ bulk rules additionally require **RFC 8058 one-click `List-Unsubscribe` + `List-Unsubscribe-Post`** headers.
A missing address is a per-email statutory violation; a missing one-click header tanks the warm domain's
reputation fast.

**Build:** create a location-level custom value **`{{custom_values.email_footer}}`** =
`We Did It For You · <valid US postal address — registered-agent or virtual mailbox preferred; any real postal address satisfies CAN-SPAM> · {{unsubscribe_link}}`.
Append `{{custom_values.email_footer}}` **below the `— alex` sign-off** in EVERY email body (warm + WF-D cold),
**with one exception reconciled below.** The `— alex` close stays; the footer sits under it in smaller text. In
GHL LC Email, enable the **built-in unsubscribe element/merge** so GHL injects the `List-Unsubscribe` +
`List-Unsubscribe-Post` (one-click) headers automatically. **WF-5 catches STOP/unsubscribe REPLIES; the footer
link is the separate, mandatory opt-out mechanism — both are required.** No send goes out without an opt-out
mechanism present.

**WF-D Email 1 exception — resolve the link-free-cold vs footer contradiction (panel Review 4 Fix 2).**
`produce/cold-email.md` Email 1 is **zero-links by design** (a hyperlink to a stranger on a warming domain reads
as phishing and tanks deliverability — the whole point of the link-free first touch). For WF-D Email 1 ONLY, the
CAN-SPAM footer is the **plain-text** form: the valid US postal address as plain text under `— alex`, plus a
single plain-text opt-out line (`reply STOP and I'm gone`) — a working opt-out mechanism that matches the
walk-away voice. Do **NOT** inject the GHL hyperlinked one-click element on Email 1 (it reintroduces the exact
phishing-smell link the design exists to avoid). **WF-D Emails 2–4** already carry one bare link, so they ALSO
carry the `{{custom_values.email_footer}}` hyperlinked one-click unsubscribe as normal. Every warm sequence
email carries the full hyperlinked footer. So: full hyperlinked footer everywhere EXCEPT WF-D Email 1, which
uses the postal-address-plus-`reply STOP` plain-text footer.

### 2.2 Warm-domain ramp (treat `mail.wedidit4you.com` like any cold domain)

A brand-new dedicated sending subdomain has **zero reputation** — it will land in spam even at low volume.
The "< 100/day by design" note does NOT make it send-ready on day one. **Graduated ramp before real sends:**
- Days 1–3: ≤ 20 sends/day · Days 4–7: ≤ 50/day · Day 8+: ≤ 100/day.
- **Seed engagement first:** send to 5–10 owned Gmail/Outlook accounts, open + reply, for 3 days before any prospect send.
- **Do NOT burst the 742-import acks.** The form-ack only fires on real inbound; the 742 are a phone-rich cold/scraper
  pool that should NOT receive a mass warm email at all (only 14/742 have email). Drip any warm email touches.
- The §12 runbook **builds** in < 1 hour but **does not send at volume** until the ramp clears — split "build now"
  from "send after 10–14 day ramp."

---

## 3. CUSTOM FIELDS (object: Contact)

Build in **Settings → Custom Fields** (or via API §11.1). The 8 core fields ship first (from the older
spec); the rest are added by the produced content (post-sale, booking, reactivation) and the Supabase
join. **Reuse the existing 8 — never duplicate a field** (two `Call Outcome` fields = silent merge-tag
failures).

| # | Name | fieldKey | dataType | Options / format | Purpose · which workflow uses it |
|---|---|---|---|---|---|
| 1 | Niche | `contact.niche` | TEXT | e.g. `mobile mechanic` | Personalization + `niche:*` tag + reporting. (Reads clean if empty — copy uses "your trade" fallback.) |
| 2 | City | `contact.city` | TEXT | e.g. `Phoenix AZ` | `city:*` tag, area-code routing context, reporting. |
| 3 | Site URL | `contact.draft_site_url` | TEXT | the live draft (`sites.wedidit4you.com/{slug}`) | **Gates every delivery + nurture send.** No nurture fires until this is set. (Canonical name — briefs that say `site_url` map here.) |
| 4 | Call Outcome | `contact.call_outcome` | SINGLE_OPTIONS | `connected`, `voicemail`, `no_answer`, `bad_number`, `callback`, `dnc` | Mia's disposition (webhook §11.5). Drives `status:*` tags that fire WF-3/WF-5 and the re-dial cadence. |
| 5 | Call Status | `contact.call_status` | SINGLE_OPTIONS | `queued`, `ringing`, `in-progress`, `completed`, `busy`, `failed`, `no-answer` | SignalWire `CallStatus` (matches Supabase `007` enum). Telemetry/reporting; distinct from `call_outcome` (the NEPQ disposition). |
| 6 | Call Recording URL | `contact.call_recording_url` | TEXT | from Mia post-call payload | QA + Alex review of connected calls; shown on the opportunity. |
| 7 | Founding Spot Number | `contact.founding_spot_number` | NUMERICAL | 1–10 | Alex assigns at delivery/close. Spot 10 closing → price-flip trigger ($450→$700). Used in PAY-1 copy (parses clean if empty). |
| 8 | Lead Source | `contact.lead_source` | TEXT | `scraper` / `form` / `mia` / `reactivation` / referral text | Origin detail beyond the `source:*` tag; reporting. |
| 9 | Google Rating | `contact.google_rating` | TEXT | e.g. `4.6` | Text not numeric (avoids parse-drop on blanks). Pitch context + reporting. |
| 10 | MNS Lead ID (place_id) | `contact.mns_lead_id` | TEXT | `mns-{id}` | **The Supabase join key** (`place_id`, `REPO-INTEGRATION-MAP §1`). Lets GHL ↔ Supabase ↔ Mia reconcile the same lead. Store the full `mns-{id}` form. |
| 11 | Walkthrough Datetime | `contact.walkthrough_datetime` | DATE | the booked slot (mirror of `{{appointment.start_time}}`) | A queryable copy of the appointment time for Smart Lists/reporting (the appointment object isn't filterable in a Smart List). Set by WF-4. |
| 12 | Live Domain | `contact.live_domain` | TEXT | their own domain, e.g. `eliteautolubbock.com` | Set when Alex points the domain → WELCOME-2 / `status:live`. (Required by `produce/postsale.md`.) |
| 13 | First Job Reported | `contact.first_job_reported` | SINGLE_OPTIONS | `yes`, `not_yet` | Gates the review sequence so it never fires before a real job exists (`produce/postsale.md` Part 3). |
| 14 | Reactivation Round | `contact.reactivation_round` | NUMERICAL | 0,1,2 | WF-6 round counter (cap 2). Smart-List filter for monthly recycling. Mirrors `reactivation:round-N` tag for math. |
| 15 | AB Lane | `contact.ab_lane` | SINGLE_OPTIONS | `a`, `b` | **Set ONCE at contact creation** (§9). Keeps a contact in ONE A/B arm across the whole journey so email+SMS stay congruent and the test reads cleanly. |
| 16 | Timezone | `contact.timezone` | TEXT | IANA, e.g. `America/Phoenix`, `America/Chicago`, `America/New_York` | **TCPA quiet-hours fix (panel).** Derived from `city`/area code at import (§11.3). The SMS send-window gates on THIS, not the location TZ — a 9am Chicago send is 7am in Phoenix (a pre-8am TCPA violation). Mountain-no-DST = `America/Phoenix`. Also gates **appointment-anchored** SMS (1h reminder, no-show T+1h) per §8. |
| 17 | Last SMS At | `contact.last_sms_at` | DATE | timestamp of the last marketing SMS sent | **SMS frequency-cap fix (panel Review 4 Fix 4).** Drives the "1 marketing SMS / 24h, 4 / rolling-7d" cap in §8. Set by every marketing SMS SEND action; transactional sends (1h reminder, STOP/confirm) do not bump it. |
| 18 | Stop Disclosed | `contact.stop_disclosed` | SINGLE_OPTIONS | `true`, `false` (default `false`) | **First-SMS STOP-line gate fix (panel Review 4 Fix 5).** Every SMS SEND action checks this; if `false`, the send prepends `We Did It For You — ` + appends ` Reply STOP to opt out`, then sets it `true`. Guarantees the first message to ANY number on ANY path carries identity + STOP, with no fragile "an earlier SMS already sent it" assumption. |
| 19 | SMS Consent At | `contact.sms_consent_at` | DATE | timestamp Mia captured verbal SMS opt-in on a connected call | **TCPA consent gate (audit BLOCKER #2 — the load-bearing field).** The 742 are a SCRAPED pool with NO prior consent; a cold SMS to them is a per-message TCPA violation ($500–$1,500) + a 10DLC brand-suspension risk that can nuke Aljaz's whole SignalWire account. The **Mia voice connect IS the consent-capture event**: Mia reads the opt-in line on a live call, the owner says yes, the post-call webhook stamps this field + adds tag `sms-consent`. **No SMS fires to a scraped number until this is set.** Mirrored by tag `sms-consent` for fast workflow gating. Inbound `source:form` leads consent at the form (the submit is express written consent — `source:form` itself satisfies the gate). |
| 20 | Lead Score | `contact.lead_score` | NUMERICAL | 0–100 (clicked-site +50, opened-email +20, replied +60, no-engagement 0) | **Dial-priority signal (audit #6).** A lead who clicked the draft-site link is hotter than one who only opened an email, who is hotter than silence. Bumped by the engagement triggers (§8 lead-score rules); read by the Mia dialer queue to sort who gets called first. Pure ranking input — drives no sends on its own. |

> **WHY two call fields (4 + 5):** `call_outcome` is the *NEPQ disposition* (connected/callback/dnc → drives
> the funnel); `call_status` is the *carrier signal* (completed/busy/failed → telemetry). Conflating them
> would make a "busy" carrier result look like a sales disposition. Keep them separate — matches the
> Supabase partition (`call_status` enum) and Mia's two distinct writes.

> **WHY `mns_lead_id` + `walkthrough_datetime` are first-class fields:** GHL Smart Lists can filter on
> custom fields but NOT on the raw appointment object or a Supabase row. `walkthrough_datetime` makes
> "booked but un-shown > 30d" queryable for WF-6; `mns_lead_id` is the only reliable key to reconcile a GHL
> contact with the Supabase/Mia record when phone formatting differs.

---

## 4. TAGS TAXONOMY

GHL lowercases all tags and auto-creates them on first contact write (optional pre-seed via API §11.2).
**Rule:** `status:*` and `source:*` are **additive history — never remove old ones.** The **opportunity
stage is the single source of truth** for current position; tags are triggers + filters only.

### 4.1 `niche:*` (one per lead, from the verified pool)
`niche:dog groomer` · `niche:mobile mechanic` · `niche:auto detailing` · `niche:handyman` ·
`niche:mobile barber` · `niche:house cleaner` · `niche:mobile car wash`
(+ inbound/site niches as they arrive: `niche:tutor`, `niche:plumber`, `niche:landscaper`, …)

### 4.2 `city:*` (one per lead)
`city:phoenix az` · `city:houston tx` · `city:dallas tx` · `city:miami fl` · `city:lubbock tx`
(+ any new city the form/scraper brings)

### 4.3 `source:*` (origin — immutable; a 2nd origin ADDS a tag, never replaces)
Exactly one primary of: `source:scraper` | `source:form` | `source:mia` | `source:reactivation`
(`source:mia` = Mia's dial; `source:reactivation` only as a *second* tag when WF-6 re-touches.)

### 4.4 `status:*` (lifecycle — additive history, mirrors the pipeline)
`status:new` · `status:dialed` · `status:connected` · `status:site-sent` · `status:booked` ·
`status:rescheduled` · `status:paid` · `status:approved` · `status:live` · `status:first-job` ·
`status:lost` · `status:dnc`

### 4.5 Branch / control tags
- `nurture:long-game` — applied by WF-2 at ladder-end (no booking) → fires **WF-2b** (long-game nurture).
- `reactivation:eligible` — set when a lead lands in Lost via a recyclable reason (NOT dnc/bad-number).
- `reactivation:round-1` / `reactivation:round-2` — WF-6 round markers (cap 2, then permanent Lost).
- `bad-number` — dead phone; **never** `reactivation:eligible` (re-enrich instead).
- `sms-optout` — set alongside DND on STOP → cross-system suppression (dialer + email + SMS).
- `sms-consent` — **set by Mia's post-call webhook the moment verbal SMS opt-in is captured on a live call**
  (mirror of the `sms_consent_at` field). This tag is the HARD prerequisite for ANY SMS to a scraped (`source:scraper`)
  number. `source:form` leads are consented at the form and are SMS-eligible without it. **No `sms-consent` (and not
  `source:form`) → no SMS, period** (audit BLOCKER #2).
- `warm` — set by the Smartlead→GHL handoff webhook when a cold-email recipient replies/clicks; stops the cold
  campaign and enters the warm nurture (§8 Smartlead orchestration / WF-SL).
- `ab:consequence` / `ab:possession` — the two nurture/reactivation A/B arms (see §9; lane mirror of `ab_lane`).
- `lane:a` / `lane:b` — the cold-email (WF-D) subject-test arm (§9).
- `confirmed-once` — set on the FIRST appointment booked; gates the booking-confirmation so a *reschedule*
  doesn't re-fire 1A/1B (`produce/booking.md §5.1`) — the branch key in the rebuilt **WF-4r** (§8).
- `holdout` — a random ~10% slice held back from nurture sends for incremental-lift measurement (§8 holdout job).
  Set once at import; `holdout` contacts skip every marketing send but stay in the pipeline for outcome comparison.
- `dnc` rule: a `status:dnc` contact is **never** given `reactivation:eligible` (legal terminal).

---

## 5. PIPELINE — "WDIFY Sales"

> **UI-ONLY (cannot be created via public v2 API):** Opportunities → Pipelines → **Create** → name
> **`WDIFY Sales`** → add the 9 stages below in order. Then `GET /opportunities/pipelines` (§11.4) returns
> the `pipelineId` + stage IDs the push script and Mia's webhook need.

**Default opportunity value: `$450`** while founding-10 is open. Do NOT pre-create 742 opportunities (floods
the board) — opportunities are created by WF-1 (form), Mia's webhook (first dial), or manually (the 2
Lubbock spec builds at **Site Link Sent**). Flip the default to **$700** the moment the 10th WON opportunity
lands (manual, or a Smart-List counter on `founding_spot_number = 10` WON).

| # | Stage | ENTRY (moves IN) | EXIT (moves OUT) | On-entry automation trigger |
|---|---|---|---|---|
| 1 | **New Lead** | Form submit (WF-1) OR lead pre-loaded before first dial | First dial → Dialed; form lead's site delivered → Site Link Sent | WF-1 (form): ACK-1 + 18h build task |
| 2 | **Dialed** | Mia places first call (any pre/non-connect outcome) | Live answer → Connected; DNC/bad/exhausted → Lost/DNC | Mia webhook sets `status:dialed`; re-dial cadence owned by dialer, not GHL |
| 3 | **Connected** | `call_outcome=connected` (live, engaged) | Link sent → Site Link Sent; hard never-contact → Lost/DNC | **WF-3** (link drop) |
| 4 | **Site Link Sent** | `draft_site_url` set AND link delivered (WF-2/WF-3) | Booking → Walkthrough Booked; nurture exhausted → Lost (recyclable) | **WF-2** nudge engine (skips DLV-1 if `status:connected`) |
| 5 | **Walkthrough Booked** | Appointment created on the 15-min calendar | Attended → Showed; No-Show → stays here (WF-4b) | **WF-4** (confirm + reminders) |
| 6 | **Showed** | Appointment marked Showed/Completed by Alex | Yes → Site Approved; think → stays (1 touch); no → Lost (recyclable) | manual + short think-it-over touch |
| 7 | **Site Approved ($450 won)** | Owner approves → **mark WON**, value $450 (or $700 post-10) | Always forward → Live/Domain Pointed | **WF-7** post-sale (PAY-1 + WELCOME-1) |
| 8 | **Live/Domain Pointed** | Domain pointed + site live on their domain | Terminal-positive → review-request loop | WF-7 (WELCOME-2 + review on first job) |
| 9 | **Lost/DNC** | DNC, bad number, exhausted no-contact, walk-away | DNC = permanent; Lost (non-dnc) = recyclable via WF-6 | WF-5 (if DNC) / WF-6 eligibility tag |

> **WHY this stage order:** it mirrors the skeptic's psychological journey (`00-TOUCHPOINT-GRAPH §2`):
> Dialed/Connected = win the trust gate · Site Link Sent = proof landed · Walkthrough Booked = the re-opened
> loop · Showed = peak commitment · Site Approved = loss-aversion closes it. The two leak points the whole
> machine defends are **show-rate** (WF-4 reminders + WF-4b recovery) and **book-rate** (the re-armed loop in
> WF-2/WF-3 copy). The board never has two truths: **stage = where it is; tags = how it got there.**

---

## 6. CALENDAR — "15-min Site Walkthrough with Alex"

**Build in UI:** Calendars → **Create Calendar** → type **Personal / 1-on-1**, assigned user **Alex** ·
name **`15-min Site Walkthrough with Alex`** · slug **`site-walkthrough`**.

| Setting | Value | Why |
|---|---|---|
| Duration | **15 min** | The offer's "15 minutes and it's yours" promise. |
| Slot interval | 15 min | Back-to-back capacity. |
| Buffer | **10 min after** | Breathing room between calls; protects the next slot. |
| Minimum notice | **2 hours** | A skeptic books between jobs; 2h prevents accidental "now" slots Alex can't make. |
| Booking window | **14 days** | Far enough for planners, near enough that scarcity bites. |
| Max per day | **12** | Caps Alex's evening load (Ljubljana). |
| Meeting location | **Phone — "I call you"** → `{{contact.phone}}` | The offer is a phone walkthrough; Alex dials them. |
| **Availability** | **Mon–Fri 10:00–15:00 CT** (= 17:00–22:00 Ljubljana, Alex's evenings = US business hours). Optional **Sat 10:00–12:00 CT**. | **10:00 CT floor is the TCPA fix (panel Review 4 Fix 1):** the 1h reminder fires at `start − 1h`, anchored to the appointment, NOT re-gated to recipient-TZ. A 09:00 CT slot for a Phoenix (UTC-7) owner = 07:00 local → the 1h reminder would fire at **06:00 Phoenix = a pre-8am TCPA violation**. The 10:00 CT floor makes the earliest possible 1h-reminder **08:00 recipient-local** in the worst-case TZ (Phoenix). The recipient-TZ If/Else in §8 is the belt-and-suspenders. |
| Form on booking page | name · phone (prefilled) · **email (ask)** | The booking page is an email-capture moment for the email-poor pool. |
| **Native confirmation/reminder notifications** | **OFF** | **WF-4 owns ALL comms.** Native + workflow = double-texting, which reads as broken automation to a skeptic. This is the single most-missed calendar setting. |
| Auto-confirm | **ON** | No manual accept step; the workflow fires immediately on book. |
| Reschedule/Cancel links | **ON** (default GHL `{{appointment.reschedule_link}}` / native) | Reschedule path is the show-rate pressure-release valve (`produce/booking.md §5`). |

**After creating:** copy the calendar permalink → create the **custom value `Booking Link`** (§7) and set it
to this permalink. Every workflow references `{{custom_values.booking_link}}`.

---

## 7. CUSTOM VALUES (location-level globals)

**Build in UI:** Settings → **Custom Values** → Add.

| Name | Merge tag | Value | Used by |
|---|---|---|---|
| Booking Link | `{{custom_values.booking_link}}` | the §6 calendar permalink | every booking CTA across all workflows |
| Review Link | `{{custom_values.review_link}}` | the Google write-review link (`g.page/r/...` or `search.google.com/local/writereview?placeid=...`) | WF-7 REVIEW-1/2 (`produce/postsale.md` Part 3) |
| **Email Footer** | `{{custom_values.email_footer}}` | `We Did It For You · <valid US postal address> · {{unsubscribe_link}}` (§2.1) | **EVERY email body** (CAN-SPAM blocker) |
| **Spots Remaining** | `{{custom_values.spots_remaining}}` | `10 − (count of WON founding opportunities)` — update at each close (manual, or the §11 Smart-List counter) | **Reactivation (REA-1/2) + Mia reactivation brief** — the LIVE scarcity counter that replaces the unverifiable "almost gone/barely" claim (panel scarcity fix). **Gate reactivation sends on this being non-empty.** |
| **First Founder** | `{{custom_values.first_founder}}` | the named first founding client, e.g. `Elite Mobile Tire & Brake in Lubbock` | **Reactivation (REA-1/2) + Mia brief** — real social proof. Set the moment the first founding close lands; hold REA copy that uses it until then. |

> If the review link must vary per client, store it on a contact field instead; a single custom value works
> if Alex generates one short link per founding client at handoff. Default: one custom value, swapped at scale.

> **Scarcity-counter discipline (panel fix):** `spots_remaining` and `first_founder` make the founding clock
> PROVABLE instead of asserted. The repeated "first ten, almost gone" line to a timeshare-wary skeptic
> compounds doubt, not urgency, unless it's backed by a real number and a named client. Update `spots_remaining`
> the instant a founding opportunity is marked WON; the moment it hits 0, flip the default opportunity value to
> $700 (§5) and retire every "$450 founding" line. If the count genuinely hasn't moved between a lead's touches,
> the reactivation hook must lean on the LIVED cost, not the price clock (`produce/nurture-react.md` REA-2).

---

## 8. WORKFLOWS / AUTOMATIONS

**Global build rules for every workflow below:**
- **Sender:** all emails from `info@wedidit4you.com` / "Alex at We Did It For You" (location default).
- **Copy:** paste bodies **verbatim** from the `produce/*.md` files cited per step. Never reword in GHL.
- **Email footer (CAN-SPAM blocker, §2.1):** append `{{custom_values.email_footer}}` (postal address +
  one-click unsubscribe) **below the `— alex` sign-off** on EVERY email step, warm and cold. Confirm GHL's
  unsubscribe element injects `List-Unsubscribe` + `List-Unsubscribe-Post` headers. No email ships without it.
- **Warm-domain ramp (§2.2):** the warm subdomain has zero reputation — build the workflows now, but do NOT
  send at volume until the 10–14 day ramp clears (20→50→100/day, seed-engagement first).
- **Ongoing warm+cold dedupe (panel fix):** a daily scheduled job (§11-style API) matches new form/scraper
  contacts against the cold pool by phone AND email; when a warm record exists, apply `cold-suppress` so the
  same person never gets cold (WF-D) + warm from two domains at once (reads as coordinated spam to filters).
  Import-time dedupe (§11.3) alone is insufficient — leads created later must be re-checked.
- **SMS CONSENT GATE — HARD, not soft (audit BLOCKER #2, the legal load-bearing rule).** The 742 are a
  **scraped** pool with **no prior consent**. A cold SMS to a scraped number is a per-message TCPA violation
  ($500–$1,500 each) AND the kind of unconsented bulk traffic that gets a 10DLC brand **suspended** — which would
  nuke Aljaz's entire SignalWire account, not just this campaign. **The architecture fix:** the **Mia voice
  connect is the consent-capture event.** On a live call Mia reads the opt-in line ("Can I text you the link to
  the site?"), the owner says yes, and the post-call webhook stamps `sms_consent_at` + adds tag `sms-consent`.
  **Every SMS SEND action begins with a HARD gate If/Else:** allow the send ONLY IF (`source:form` present) OR
  (`sms-consent` present). If neither → **do not send** (skip the SMS branch entirely; never queue, never "send
  later"). **Pure-cold SMS to an un-connected scraped number is REMOVED from the plan.** This is a blocker on
  every SMS step in every workflow that can touch a scraped contact (WF-3 SMS-B1 already sits behind the connect,
  so it's compliant; WF-2 / WF-2b / WF-6 SMS only fire if the lead is `source:form` OR has `sms-consent`).
- **A2P 10DLC — STEP 0, hard gate (panel deliverability fix + audit isolation).** SMS is the PRIMARY channel (the
  pool is phone-rich, 14/742 have email). With **no registered 10DLC campaign**, US carriers (esp. AT&T/T-Mobile)
  filter or hard-block these messages — the entire phone-rich majority is undeliverable. **Before ANY SMS send:**
  (1) **Isolate the WDIFY 10DLC brand on a DEDICATED SignalWire number** (NOT shared with Mastermind/other MNS or
  client traffic — a co-mingled number means one campaign's complaint suspends them all; dedicated-per-project,
  dedicated-per-project). (2) Register the brand (Aljaz/WDIFY EIN) + submit the campaign use-case to TCR
  **registered HONESTLY as voice-captured-consent**: opt-in method = "verbal consent captured on an outbound phone
  call", with the **real Mia call-script opt-in line** as the sample opt-in language, plus 2–3 sample messages (the
  post-call link drop + a nurture SMS). Do NOT register it as a web-form/checkbox opt-in we don't have — a
  mis-registered campaign is itself a suspension trigger on audit. **Block all SMS sends until the campaign shows
  `approved`.** Until then run **email-only** and HOLD every SMS step. Record the approved TPS in the throughput
  plan. (Promoted from the §13 footnote — it is a total-channel failure mode, not a minor prereq.)
- **Quiet hours / send window — gate on RECIPIENT timezone, not location TZ (panel TCPA fix).** In each SMS
  action, gate on **8am–9pm `contact.timezone`** (the new §3 field, derived from `city`/area code at import),
  tightened to a **9am floor** for safety. The location TZ is `America/Chicago`, but a 9am Chicago send is
  **7am in Phoenix** (a pre-8am TCPA quiet-hours violation) and 10am in Miami. Do NOT use GHL's "Send within
  business hours" (it keys off the LOCATION TZ). Instead use a **Wait-until-window step computed against
  `contact.timezone`**, or an If/Else that holds the send until the recipient-local window opens. One link per
  SMS. **First SMS to a number** must carry the business name + "Reply STOP to opt out" — the produced SMS
  bodies already include this where required.
- **APPOINTMENT-ANCHORED SMS are NOT exempt from the recipient-TZ window (panel Review 4 Fix 1).** The 1h
  reminder (WF-4) and the no-show T+1h touch (WF-4b) fire off `{{appointment.start_time}}`, which bypasses the
  import-time recipient-TZ gate. Wrap every appointment-anchored SMS in an If/Else: **IF recipient-local time
  (`contact.timezone`) is < 8am OR ≥ 9pm, hold the SMS to the next 9am recipient-local; otherwise send.** A
  09:00 CT slot for a Phoenix (UTC-7) recipient would fire the 1h reminder at 06:00 their local — a pre-8am
  violation. The **10:00 CT calendar availability floor (§6)** plus this guard makes the earliest possible
  1h-reminder 08:00 recipient-local in the worst TZ (Phoenix). Belt-and-suspenders: the floor prevents it, the
  If/Else proves it.
- **SMS FREQUENCY CAP (10DLC reputation + TCPA fatigue — panel Review 4 Fix 4).** Max **1 marketing SMS per
  contact per 24h** and **max 4 per rolling 7 days across ALL workflows**. Implement as a location-level
  Wait/If-Else checking a contact field `last_sms_at` + a 7-day rolling counter; if exceeded, hold to the next
  eligible window. **SMS-B2 and SMS-B4 (post-call) stay DEFAULT OFF** — flip on only per high-value niche, never
  globally. The **1h reminder and STOP/confirmation messages are transactional and exempt from the cap** but
  still respect quiet hours. Worst-case to one number without the cap (post-call B1–B4 → book → confirm + 1h →
  no-show 4A+4C ≈ 8 SMS in two weeks) is exactly the fatigue the cap prevents.
- **STOP-LINE GATE — wire the first-SMS disclosure, never assume it (panel Review 4 Fix 5).** Every SMS SEND
  action runs through an If/Else on a contact field `stop_disclosed` (boolean). **IF false:** prepend
  `We Did It For You — ` and append ` Reply STOP to opt out`, then set `stop_disclosed = true`. **IF true:** send
  the body as written. This makes the first message to ANY number — on ANY path, including a reactivation SMS
  after a 60-day gap or a booking SMS that happens to be the first text — always carry the identity + STOP line,
  removing the fragile "assume an earlier SMS already sent it" dependency. This single gate lets every per-piece
  "first SMS to this number" caveat be dropped safely.
- **LEAD SCORE → Mia dial-priority (audit #6).** A lightweight score on `contact.lead_score` ranks who the
  dialer calls first: **site-link clicked (+50) > email opened (+20) > nothing (0)**, with a reply worth +60.
  Wire three GHL triggers that bump the field: **Email Link Clicked** on the draft-site URL → set `lead_score`
  to at least 50 (+ tag `engaged:clicked`); **Email Opened** → at least 20; **Customer Replied** → +60. The Mia
  dialer queue reads `lead_score` DESC so hot leads get called before cold silence. Score drives ranking only —
  it never triggers a send.
- **DELIVERABILITY HEALTH-CHECK + HOLDOUT (audit #7).** (a) A **weekly scheduled job** (§11-style API, or the
  GHL email-stats export) reads the warm domain's spam-complaint rate and bounce rate; **alert Alex** (internal
  notification + Telegram) the instant complaint rate nears **0.1%** (hard ceiling 0.3% per Gmail bulk-sender
  rules) or bounce rate spikes above ~2%, and auto-pause volume sends if it crosses. (b) A **HOLDOUT group**:
  tag ~10% of contacts `holdout` at import (random); these stay in the pipeline but receive **no marketing
  sends**, giving a clean incremental-lift read (booked/closed rate of treated vs holdout) so we measure what the
  machine actually adds, not just gross conversions. The holdout If/Else sits at the top of every nurture
  workflow: `holdout` present → exit before any send.
- **DND respect:** every send action has **"Skip if DND" = ON** (belt-and-suspenders against WF-5).
- **Goal events:** set each nurture workflow's **Goal** so downstream steps auto-skip the instant it's met
  (per-workflow below). This is non-negotiable (`00-TOUCHPOINT-GRAPH §8.4`).
- **A/B:** use the native email A/B split on each email step OR an If/Else on `contact.ab_lane`
  (`a`/`b`) — see §9. Keep a contact in ONE lane all journey.
- **SENTENCE-SKELETON DEDUPE before import (panel Review 3 process fix — the real lever).** The per-file
  "no verbatim sentence repeats" self-audit is the WRONG gate: it passes while structural molds saturate the
  set (the same skeleton thesaurus-swapped reads identical to a human ear and is the loudest AI tell). Before
  GHL import, run a STRUCTURE-level dedupe across all six `produce/*` files: strip nouns/verbs to POS templates
  and flag any sentence skeleton used 3+ times across a single contact's possible journey. Four molds were
  caught and capped this pass: (1) the cost-of-inaction skeleton ("[customer] [searches/looks] you up [finds
  nothing] [books the guy whose site loads]") — now ≤1 literal instance per workflow, with distinct cost angles
  (searcher / peer-comparison / unattributed-slow-week / lived-bill) elsewhere; (2) the possession tricolon
  ("your photos, your number, your colors") — capped at 2 per journey; (3) the no-oriented question cadence
  ("Opposed to / would it be a bad idea / is it crazy") — capped at ≤2 per journey, the rest converted to
  imperatives/statements; (4) the "still X, still Y, still Z" asyndeton + "It seems like" label-opener — broken
  into human-staggered sentences in 2+ spots. Re-run this skeleton check after any future copy edit; verbatim
  diffing alone does not satisfy the gate.

The map: produced file → workflow.

| Workflow | Produced source | Touchpoint-graph state |
|---|---|---|
| WF-1 Form In — 24h Clock | `produce/inbound-form.md` Piece 1 | Entry B / §3 (form) |
| WF-2 Site Delivered — Nudge Engine | `produce/inbound-form.md` Pieces 2–4 | 3.4 |
| WF-2b Long-Game Nurture | `produce/nurture-react.md` Part 1 (LGN-1…5) | 3.4 → 3.6/3.11 gap |
| WF-3 Call Connected — Post-Call Nurture | `produce/post-call.md` (E1–E4 + SMS-B1…B4) | 3.1 / 3.2 |
| WF-4 Walkthrough Booked | `produce/booking.md` Parts 1–3, 5 | 3.5 |
| WF-4b No-Show Recovery | `produce/booking.md` Part 4 | 3.7 |
| WF-4r Reschedule (REBUILT) | `produce/booking.md` §5.2 | 3.5 (reschedule) |
| WF-5 STOP/DNC Guard | (control) | 3.10 |
| WF-PR Positive-Reply Router | (control + Conversation AI) | 3.x (inbound reply) |
| WF-SL Smartlead → GHL Handoff | `produce/cold-email.md` (sent via Smartlead) | Sequence D (cold, off-GHL) |
| WF-HC Deliverability Health-Check + Holdout | (control / measurement) | — |
| WF-6 Reactivation | `produce/nurture-react.md` Part 2 (REA-1/2) | §4 / 3.11 |
| WF-7 Post-Sale (Fulfillment + Review) | `produce/postsale.md` Parts 1–3 | §5 |
| WF-D Cold Phase-2 (LEGACY — superseded by Smartlead/WF-SL) | `produce/cold-email.md` | Sequence D (HELD OFF) |

---

### WF-1 · "Form In — 24h Clock"
- **TRIGGER:** Tag Added `source:form` (the site backend upserts the contact with this tag via API — works
  wherever the form lives). **Secondary trigger:** Form Submitted (if a GHL-native form is used later).
- **FILTERS:** none (every form lead enters).
- **GOAL (exit):** `status:booked` OR `status:approved` OR DND.
- **ACTIONS (in order):**
  1. **Set field** `ab_lane` = random `a`/`b` (50/50) **if empty**; add tag `ab:possession`/`ab:consequence` to match. *(Lane is set here so a form lead stays congruent across WF-1→WF-2→WF-4.)*
  2. **Create Opportunity** → WDIFY Sales / **New Lead**, value **$450**, status open.
  3. **Add tag** `status:new`.
  4. **SPEED-TO-LEAD (audit #3) — fire FIRST, before the email:** **Create a HIGH-PRIORITY Mia call task / auto-dial NOW** (assigned Mia/dialer, due **immediately**) and **internal-notify Alex "INBOUND — call within 5 min: {{contact.company_name}}"**. An inbound form-fill is the hottest lead in the system; an 18h silence kills it. The form lead is `source:form` = SMS-consented, so the dial + texts are compliant from minute one.
  5. **Send Email — Piece 1 (= A1 / ACK-1)**, subject `we're on it` *(A lane)* / `clock just started` *(B lane)* — `produce/inbound-form.md` Piece 1.
  6. **Send SMS — Piece 1 SMS** (first SMS → business name + STOP line) — same file.
  7. **Add Task (assigned: Alex):** `FAST-LANE BUILD: {{contact.company_name}} ({{contact.niche}}, {{contact.city}}) — inbound, ≤1h build SLA, 24h promise expires {{trigger date+24h}}` — **due in 1 hour** (the inbound fast-lane SLA; inbound earns priority over scraped-pool builds). The 24h-or-free promise is the ceiling, not the target.
  8. **Internal notification** (app + email to info@): "24h clock started + ≤1h fast-lane: {{contact.company_name}}".
- **WHY:** the warm channel — they raised their hand, so there's no skepticism gate, only three jobs: **call
  them while they're still on the page** (speed-to-lead — the single biggest inbound conversion lever), deliver
  the live URL fast (≤1h fast-lane build, 24h-or-free as the ceiling), and convert curiosity into a booking. The
  immediate Mia dial + 1h task replace the old 18h silence that let hot inbound go cold.

---

### WF-2 · "Site Delivered — Nudge Engine"
- **TRIGGER:** Tag Added `status:site-sent` (applied by Alex/API when `draft_site_url` is set, OR by WF-3 after a connected call).
- **FILTER:** `contact.draft_site_url` **is not empty** (hard gate — no link, no nurture).
- **GOAL (exit):** `status:booked` OR `status:approved` OR opportunity stage ≥ **Walkthrough Booked** OR DND.
- **ACTIONS:**
  1. **Update Opportunity** → **Site Link Sent**.
  2. **If/Else:** contact HAS tag `status:connected`?
     - **YES →** skip step 3 (they already got the link by SMS/email in WF-3) → go to Wait.
     - **NO →** **Send Email — Piece 2 (= A2 / DLV-1)** `your site is live` + **Send SMS — Piece 2 SMS** (`produce/inbound-form.md` Piece 2).
  3. **Wait 2 days.** → If/Else goal not met → **Send Email — Piece 3 (= A3 / NDG-1)** `it's just sitting there` + **SMS — Piece 3 SMS**.
  4. **Wait 3 days (day 5 total).** → If/Else goal not met → **Send Email — Piece 4 (= A4 / NDG-2)** `yours either way` + **SMS — Piece 4 SMS**.
  5. **End-of-ladder branch (no booking):** **Add tag** `nurture:long-game` (→ fires **WF-2b**), instead of dropping straight to Lost.
- **WHY:** the link is the trust-purchase; the booking is the asset. Lead with the gift, restate a loss each
  nudge, never beg. The connected-skip prevents a duplicate "your site is live" after a call already delivered
  it. Handing to WF-2b (not straight to Lost) gives the not-yet-ready lead a patient long arc before recycling.

---

### WF-2b · "Long-Game Nurture"
- **TRIGGER:** Tag Added `nurture:long-game` (set by WF-2 step 5, OR manually for a shown-not-closed "let me think" lead — graph 3.6).
- **FILTER:** `draft_site_url` not empty; NOT `status:booked`/`status:approved`/`status:dnc`.
- **GOAL (exit):** `status:booked` OR `status:approved` OR stage ≥ Walkthrough Booked OR DND.
- **ACTIONS** (5 touches over ~24 days — `produce/nurture-react.md` Part 1; email if email on file, **always** SMS twin if phone-textable):
  1. **LGN-1** (day 0) — email `still losing the jobs` *(consequence)* / `you already own this` *(possession)* + **LGN-1s SMS**.
  2. **Wait 5 days** → **LGN-2** `what's one job worth` / `the small part` + **LGN-2s**.
  3. **Wait 6 days** (day 11) → **LGN-3** `the price moves soon` / `lock it before it jumps` + **LGN-3s**.
  4. **Wait 6 days** (day 17) → **LGN-4** `three weeks, zero dollars` / `yours the whole time` + **LGN-4s**.
  5. **Wait 7 days** (day 24) → **LGN-5 (walk-away)** `last one, then quiet` / `keeping it simple` + **LGN-5s**.
  6. **End branch (no booking):** **Update Opportunity → Lost** (reason `nurture-exhausted`) · **Add tag** `status:lost` + `reactivation:eligible` · keep draft live.
- **WHY:** a lead who survived the WF-2 sprint isn't dead — they're *not-yet-ready*. Frequency is the enemy;
  patience is the weapon. Slow cadence (5–7d gaps), alternate the two losses (standing cost + closing price
  window) around the un-ghostable fact that they *already own* an unfinished thing. The walk-away (LGN-5) is
  the highest-trust touch precisely because it removes pressure.

---

### WF-3 · "Call Connected — Post-Call Nurture" (extends the old WF-3 link-drop)
- **TRIGGER:** Tag Added `status:connected` (Mia's post-call webhook sets `call_outcome=connected`, `call_recording_url`, captured email if any, then adds this tag — §11.5).
- **FILTERS:** none on entry (the link/no-link branch is handled inside).
- **GOAL (exit):** `status:booked` OR `status:approved` OR stage ≥ Walkthrough Booked OR DND.
- **ACTIONS:**
  1. **Update Opportunity** → **Connected** (create at Connected if none exists).
  2. **Add tag** `status:dialed` (history).
  3. **If/Else `contact.draft_site_url` is NOT empty:**
     - **YES (the designed-for built-lead case):**
       a. **Send SMS — SMS-B1** (`produce/post-call.md` Part 2): Variation A (standard) or **Variation B** for spec-build owners (Elite Mobile Tire & Brake, Buddy's Mobile Spa, any pre-built spec lead). *(Mia also dropped the link live on the call via Aljaz's `/api/outreach/send-link` — this is the belt-and-suspenders text.)*
       b. **If/Else email exists →** **Send Email — Email 1** `the link from the call` / `told you it was real` (E1 A/B).
       c. **Add tag** `status:site-sent` → **Update Opportunity → Site Link Sent**. *(This also enrolls WF-2, which sees `status:connected` and SKIPS DLV-1 — no duplicate "your site is live".)*
       d. **Wait 1 day** → goal-gate → **Email 2** `did the link work` / `open it one more time` (+ optional SMS-B2 for high-value niches).
       e. **Wait 2 days** (day 3) → goal-gate → **Email 3 (the re-loop — the conversion beat)** `it's still the rough cut` / `whose name is on it` **+ SMS-B3** (default ON).
       f. **Wait 3 days** (day 6) → goal-gate → **Email 4 (walk-away)** `this is the last one` / `leaving you to it` (+ optional SMS-B4).
       g. **End branch (no booking):** add `nurture:long-game`? **No** — post-call leads that exhaust go to **Lost** (`reason: nurture-exhausted`) + `reactivation:eligible` directly (WF-3 is already a 4-touch arc; WF-2b is for the form/short-ladder leads). Update Opportunity → Lost, tag `status:lost` + `reactivation:eligible`.
     - **NO (un-built lead slipped through — COLD path):** **Add Task (Alex):** `HOT — build now: {{contact.company_name}} asked on a live call` due **12h** · **Internal notification**. *(Once Alex sets `draft_site_url` + `status:site-sent`, WF-2 sends DLV-1 as the true SPEC reveal.)*
- **A/B + no-email note:** lane follows `contact.ab_lane`. If **no email** captured, only the SMS path
  fires (SMS-B1 + SMS-B3); the booking link in SMS-B3 is the conversion path for the email-less majority.
- **WHY:** the call bought a sliver of trust; the link *is* the proof that earns it. Every touch keeps the
  loop **open and time-boxed** — the link never lands naked, it lands welded to an incompletion ("rough cut,"
  "your photos still aren't in"). Email 3 (+SMS-B3) is where most closes are won. A skeptic reads begging as
  con-confirmation, so the arc ends on a dignified walk-away.

---

### WF-4 · "Walkthrough Booked" (confirm + 3-1-0 reminders) — pairs with rebuilt WF-4r
- **TRIGGER:** **Customer Booked Appointment** (calendar: 15-min Site Walkthrough). **Allow Re-entry = ON** (a reschedule re-fires this same trigger — see WF-4r; re-entry lets the reminder ladder recompute against the new slot).
- **FILTER (first-booking gate):** tag `confirmed-once` **NOT present** (so a *reschedule*, which re-fires the same "Customer Booked" trigger after GHL delete+recreates the appt, does NOT re-fire the 1A/1B confirmation — the reschedule path is WF-4r, branched on `confirmed-once` PRESENT). This replaces the non-existent "Appointment Status → Rescheduled" assumption (audit BLOCKER #1).
- **GOAL (exit):** `status:approved` (WON) OR DND.
- **ACTIONS:**
  1. **Update Opportunity** → **Walkthrough Booked** · **Add tag** `status:booked` + `confirmed-once`.
  2. **Set field** `walkthrough_datetime` = `{{appointment.start_time}}` *(queryable mirror for Smart Lists)*.
  3. **Send Email — 1A** `you're locked in` / `it's basically yours` + **Send SMS — 1B** `SMS-3` variant (`produce/booking.md` Part 1). The confirm SMS ends with **"reply C to confirm"** (sets tag `confirmed:yes` on reply — the show-intent signal).
  4. **3-DAY reminder (audit #5 — only fires when the slot is >3 days out):** **Wait until `{{appointment.start_time}}` − 72h** → If/Else: if the booking was made <72h out, **auto-skip** → else **Send Email — 3-day reminder** + **Send SMS** with **"reply C to confirm"**.
  5. **1-DAY reminder:** **Wait until `{{appointment.start_time}}` − 24h** → If booked <24h out, **auto-skip** → **Send Email — Part 2 24h reminder** `tomorrow, fifteen minutes` / `your site, tomorrow` + **Send SMS** with **"reply C to confirm"**.
  6. **SAME-DAY morning reminder:** **Wait until `{{appointment.start_time}}` day, 9am recipient-local** → **Send SMS — same-day "today, {{appointment.start_time}}"** with **"reply C to confirm"**.
  7. **1-HOUR reminder:** **Wait until `{{appointment.start_time}}` − 1h** → **Send SMS — Part 3 1h reminder** `SMS-4` variant.
  8. **NON-REPLY no-show pre-flag (audit #5):** at `{{appointment.start_time}}` − 2h, If/Else `confirmed:yes` NOT present → **add tag `likely-no-show`** + **Add Task (Alex):** "proactive confirm call: {{contact.company_name}} hasn't confirmed — call before the slot." A confirmed lead shows ~2x more often; an unconfirmed one gets a human nudge before the slot is wasted.
- **Reschedule sub-flow:** handled by the **rebuilt WF-4r** below (NOT a non-existent "Rescheduled" trigger).
- **3-1-0 cadence note:** the reminder ladder is now **3-day (slots >3 days out) → 1-day → same-day morning →
  1-hour**, each carrying a "reply C to confirm" capture, all anchored to `{{appointment.start_time}}` so they
  auto-recompute on reschedule. A `confirmed:yes` reply is the cleanest show-intent signal we get; its absence
  proactively triggers an Alex confirm-call instead of a silent no-show.
- **WHY:** for this buyer the bottleneck is **SHOW rate, not book rate** (hybrid: 60% book × 72% show = 16.4
  sales/100 vs 6.9 for tease). The 3-1-0 ladder re-anchors WHEN at every fade-out point + re-arms WHY (the
  half-finished possession + the price-lock), never "looking forward to it," and the "reply C" capture converts
  passive reminders into an active commitment that lifts show-rate further. Reschedule (WF-4r) is the
  pressure-release valve that converts a known conflict into a kept slot instead of a no-show.

---

### WF-4r · "Reschedule" (REBUILT — audit BLOCKER #1)
- **WHY THE REBUILD:** the old WF-4r triggered on **"Appointment Status → Rescheduled" — a GHL trigger that does
  not exist.** When a contact reschedules, GHL **deletes the old appointment and creates a new one**, which
  re-fires the **"Customer Booked Appointment"** trigger (the same one WF-4 uses). So the reschedule path must
  live on that trigger, distinguished from a first booking by the `confirmed-once` tag.
- **TRIGGER:** **Customer Booked Appointment** on calendar "15-min Site Walkthrough with Alex" — **Allow
  Re-entry = ON** (so the same contact can pass through again on each rebooking).
- **FILTER:** tag `confirmed-once` **IS present** (this is what makes it a reschedule, not a first booking —
  WF-4's own filter is the inverse: `confirmed-once` NOT present = first booking, fires 1A/1B).
- **ACTIONS (reschedule branch):**
  1. **Re-set field** `walkthrough_datetime` = `{{appointment.start_time}}` (the new slot).
  2. **Remove the contact from WF-4b No-Show Recovery** (a reschedule means the no-show recovery goal is met).
  3. **Send Email — 5.2 reschedule confirmation** `new time's set` / `locked for {{appointment.start_time}}` + **Send SMS — 5.2** with "reply C to confirm".
  4. **Remove tag** `likely-no-show` and `confirmed:yes` (the new slot needs a fresh confirmation).
  5. If/Else **rescheduled 2×+** (a `reschedule_count` field bumped here, or 2nd pass with `status:reschedule-2x`) → **add tag** `status:reschedule-2x` + **notify Alex** (a 2x-rescheduler is a soft-decline → Alex calls).
- **NO NEW REMINDERS BUILT HERE:** WF-4's 3-day/1-day/same-day/1-hour Waits are all anchored to
  `{{appointment.start_time}}`. Because a reschedule re-enters WF-4 on the same "Customer Booked" trigger
  (Allow Re-entry ON) with the new appointment time, **the reminder ladder recomputes automatically** — WF-4
  re-runs steps 4–8 against the new slot, while its `confirmed-once`-NOT-present filter blocks 1A/1B from
  re-firing. WF-4r owns only the reschedule-specific confirm + cleanup.
- **GOAL (exit):** `status:approved` OR DND.
- **WHY:** this is the fix for the silent failure where a rescheduled appointment either (a) re-fired the full
  booking confirmation (double "you're locked in") or (b) fired nothing at all on a trigger GHL never emits.
  Branching the real "Customer Booked" event on `confirmed-once` is the only correct GHL pattern for
  first-booking-vs-reschedule.

---

### WF-4b · "No-Show Recovery"
- **TRIGGER:** Appointment Status → **No Show** (Alex marks it after a missed call).
- **FILTER:** not DND.
- **GOAL (exit):** rebook (Appointment Booked/Rescheduled) OR `status:approved` OR DND.
- **ACTIONS** (opportunity **stays at Walkthrough Booked** — a delay, not a loss):
  1. **T+1h: touch 1** — **Send SMS — 4A** `SMS-5` variant + **If/Else email exists → Send Email — 4B** `have you given up` / `still yours` (`produce/booking.md` Part 4).
  2. **Add Task (Alex):** `redial {{contact.company_name}} tomorrow 9am their time`.
  3. **Wait 2 days** → If/Else (no rebook AND not DND) → **touch 2 (walk-away):** **Send SMS — 4C** + **Send Email — 4D** `last one from me` / `i'll stop here`.
  4. **Recovery cap:** allow up to **2** no-show cycles (rebook re-enters WF-4). After the **2nd** no-show with no rebook → **Update Opportunity → Lost** (reason `no-show-exhausted`) + `status:lost` + `reactivation:eligible`.
- **WHY:** a no-show is almost never a "no" — it's a forgotten/buried "yes" (the link + a real sequence are
  already in their hands). Touch 1 = warm zero-shame rebook; touch 2 (only if ignored) = clean walk-away. Two
  touches then stop — a third re-confirms the scam pattern and burns the warm asset. Cap recovery at 2 cycles;
  past that, the slot cost outweighs the odds — recycle via WF-6 instead.

---

### WF-5 · "STOP/DNC Guard" (legal terminal — fires from ANY state)
- **TRIGGERS (any one):**
  (a) **Customer Replied** — SMS body contains any FCC-recognized opt-out keyword (audit #8):
      `stop` / `stopall` / `unsubscribe` / `cancel` / `end` / `quit` / `opt out` / `optout` / `revoke` /
      `remove` / `don't call` (GHL auto-DNDs the carrier-standard STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT;
      this catches those PLUS the variants `revoke` / `opt out` / `remove` / `don't call` carriers may not
      auto-handle). Case-insensitive, match the keyword anywhere in the body.
  (b) **Tag Added** `status:dnc` (Mia disposition `dnc`, via webhook);
  (c) **Email unsubscribe** event.
- **FILTERS:** none — DNC overrides everything.
- **ACTIONS:**
  1. **Enable DND — all channels** (Email + SMS + Calls).
  2. **Add tag** `status:dnc` + `sms-optout`.
  3. **Remove from ALL other workflows.**
  4. **Update Opportunity** → **Lost/DNC**.
  5. **Internal notification** to Alex.
- **Cross-system suppression (CRITICAL):** weekly, export a Smart List `DND = true` → feed **Mia's
  suppression list** AND the WF-D (Sequence D) suppression so a DNC number never re-enters ANY campaign
  (dialer, SMS, email). `reactivation:eligible` is **never** set on a DNC.
- **WHY:** TCPA — honor every DNC instantly, no counter, no last pitch. The one branch with zero recovery
  path **by design**. Removing from all workflows prevents a queued nurture step from firing after opt-out
  (the worst trust-and-legal failure).

---

### WF-PR · "Positive-Reply Router" (real-time intent routing — audit #4)
- **WHY THIS EXISTS:** today an *interested* reply hits **nothing** — the only reply handler is WF-5 (STOP). A
  skeptic who finally texts back "is this real?" or "how much?" gets silence, which kills the warmest moment in
  the funnel. This workflow catches every non-opt-out inbound and routes it to an instant answer.
- **TRIGGER:** **Customer Replied** (inbound SMS or email) — **AND the body does NOT contain any WF-5 opt-out
  keyword** (filter those out first so STOP always wins). Allow Re-entry = ON.
- **ACTIONS — intent branch (If/Else on body keywords, in order):**
  1. **"Is this real / scam / legit / who is this"** → route to **GHL Conversation AI** (trust-objection intent)
     OR **Add high-priority Task to Alex** "skeptic reply — answer in 5 min"; add tag `intent:trust`. The
     Conversation AI replies with the proof (the live link is already theirs), never a pitch.
  2. **Pricing question ("how much / price / cost / $")** → **Conversation AI** (pricing intent: the $450
     founding price + what's included + the booking link) OR Alex task; add tag `intent:pricing`.
  3. **Buying signal ("yes / interested / book / call me / let's do it / send it")** → **immediately send the
     booking link** `{{custom_values.booking_link}}` + **notify Alex to call now**; move opportunity →
     **Site Link Sent**/onward; add tag `intent:hot`. A human rides it.
  4. **Fallback (any other non-STOP reply)** → **Add Task to Alex** "inbound reply — read + respond" + notify;
     add tag `intent:unclassified`. Never leave an interested human unanswered.
- **GUARDS:** WF-PR must run AFTER WF-5's opt-out filter (an opt-out reply never lands here). Every Conversation
  AI / send respects DND + the consent gate. Replying bumps `lead_score` +60 (the engagement rule) so the dialer
  re-prioritizes them.
- **WHY:** the reply is the highest-intent micro-commitment in the whole machine; routing it to a real-time
  answer (Conversation AI for FAQ-class intents, a human for hot/ambiguous ones) is the difference between a
  close and a ghost. Brunson gate: every reply now has a defined next step instead of a dead end.

---

### WF-SL · "Smartlead → GHL Cold-Email Handoff" (channel orchestration — cold-email)
- **WHY THIS EXISTS:** **cold email does NOT run in GHL** — it runs on **Smartlead** (dedicated cold infra,
  separate warmed domains/mailboxes; running cold volume through GHL/LC Email violates shared-pool ToS and
  torches the warm domain). GHL is the **hub**; Smartlead, SignalWire, Mia, and the Aljaz app are **spokes**.
  This workflow is the bridge that turns a cold-email engagement back into a warm GHL lead. (See §15 channel-
  ownership map. This supersedes the in-GHL WF-D cold sequence for the actual cold-email channel; WF-D stays
  OFF/legacy.)
- **TRIGGER:** **Inbound Webhook** (GHL "Inbound Webhook" trigger) fired by **Smartlead's reply/click webhook**
  (Smartlead → its webhook → a GHL inbound-webhook URL that carries the contact email + event type).
- **ACTIONS:**
  1. **Find/Upsert the contact** by the email in the webhook payload (create if new, with `source:scraper` +
     `lead_source = smartlead`).
  2. **Add tag `warm`** + bump `lead_score` (+60 reply / +50 click).
  3. **STOP the Smartlead cold campaign for this contact** — call **Smartlead's API** (outbound webhook/HTTP
     action) to pause/remove them from the cold sequence so they never get both cold + warm at once.
  4. **Move opportunity → "Site Link Sent"** and **add tag `status:site-sent`** → this drops them into the warm
     post-delivery nurture (WF-2), exactly like a delivered lead.
  5. **Notify Alex** "cold reply went warm — {{contact.email}}" so a human can ride a hot cold-reply.
- **GUARDS:** the Smartlead-pause call MUST succeed before the warm nurture's first send (or a daily dedupe job
  applies `cold-suppress` as backstop) — one person never gets Smartlead-cold + GHL-warm simultaneously.
- **WHY:** clean channel separation. Smartlead owns cold-email deliverability; GHL owns the warm lifecycle the
  instant a cold lead raises a hand. The webhook is the single seam, and it both *stops* the cold spoke and
  *starts* the warm hub flow in one move.

---

### WF-HC · "Deliverability Health-Check + Holdout" (measurement — audit #7)
- **WHY THIS EXISTS:** sending blind to reputation is how a warm domain silently dies; sending with no holdout is
  how you can't prove the machine adds lift. Both are measurement gaps the audit flags.
- **HEALTH-CHECK (weekly scheduled job — §11-style API or GHL email-stats export):**
  1. Read the warm domain's **spam-complaint rate** + **bounce rate** for the trailing 7 days (Google Postmaster
     Tools + GHL stats).
  2. **Alert Alex** (internal notification + Telegram) the instant complaint rate **nears 0.1%** (hard ceiling
     0.3% per Gmail bulk-sender rules) OR bounce rate spikes above ~2%.
  3. If a threshold is crossed → **auto-pause volume sends** (flip the workflows' send gate off) and require a
     human re-enable. Reputation protection is non-negotiable.
- **HOLDOUT (incremental-lift measurement):**
  1. At import (§11.3), tag a **random ~10%** of contacts `holdout`.
  2. The `holdout` If/Else sits at the top of every nurture workflow: `holdout` present → **exit before any
     send** (they stay in the pipeline, receive nothing).
  3. Weekly, compare **booked/closed rate of treated vs holdout** — the delta is the machine's true incremental
     lift, not gross conversions (which over-credit leads who would've converted anyway).
- **WHY:** Amodei gate made literal — we measure before AND after, with a clean control, and we protect the
  sending asset proactively instead of finding out from a blacklist.

---

### WF-6 · "Reactivation" (the recycling loop — graph §4)
- **TRIGGER:** Tag Added `reactivation:round-1` or `reactivation:round-2`.
- **HOW THE TAG GETS ADDED (the monthly Smart List + a tiny automation):**
  - Build a **Smart List "Reactivation Eligible":** opportunity stage = **Lost/DNC** AND Lost reason ∈
    {walked-away, gone-cold, nurture-exhausted, no-show-exhausted} AND `DND = false` AND `reactivation:eligible`
    present AND **last stage change ≥ 30 days** (use `walkthrough_datetime`/opportunity-updated as the date
    proxy) AND `reactivation_round < 2`.
  - **Monthly:** run the list → bulk-add `reactivation:round-{N}` (N = `reactivation_round` + 1) and set
    `reactivation_round` += 1. *(Bulk action in the UI, or a scheduled API job §11 — GHL has no native
    "monthly Smart List → tag" trigger, so this is a recurring manual/scripted run.)*
- **FILTER:** `draft_site_url` not empty; not DND.
- **GOAL (exit):** `status:booked` OR `status:approved` OR DND.
- **ACTIONS:**
  1. **Re-open the EXISTING opportunity** (never create a duplicate) → move to **Site Link Sent** (site still
     exists) OR **Dialed** if re-queuing the dialer.
  2. **If/Else phone-rich (preferred — pool is email-poor):** the monthly job re-queues the phone into Mia's
     dialer with the **SPEC reveal (present tense)** (`produce/nurture-react.md` "Mia reactivation brief").
     Mia's outcome re-enters the §3 state machine as a first call.
  3. **If/Else email exists (number exhausted):** **ONE** reactivation touch — **REA-1** `it's still live` /
     `before the spot's gone` (or **REA-2** `how's the phone` / `still where you left it` when Lost reason =
     **walked-away**) + **REA-1s/REA-2s SMS** (first SMS in 30–60d → full compliance line). **No ladder.**
  4. **Round-2 gate:** WF-6 round-2 fires only if round-1 got no engagement after 14 days. After round 2 with
     no engagement → opportunity stays **Lost**, **remove** `reactivation:eligible` (permanent, but never DND).
- **WHY:** a 30–60-day-old dead lead is *warmer* to this offer than on day one — the asset still exists ("still
  live" is a pattern-break, not a re-pitch), the standing cost has been running, and the founding window is
  credibly "almost gone." Present-tense possession + lived cost + a near-shut door. Cap at 2 rounds; beyond
  that re-enrich and re-enter clean rather than poke.

---

### WF-7 · "Post-Sale" (Fulfillment + Review — graph §5)
Build as **two workflows** (cleaner goal separation): **WF-7a Fulfillment** (paid → live) and **WF-7b Review**
(gated on first job). Copy from `produce/postsale.md`.

**WF-7a Fulfillment**
- **TRIGGER:** Tag Added `status:paid` (Stripe/GHL payment success → set on the WON opportunity).
- **GOAL (exit):** tag `status:live`.
- **ACTIONS:**
  1. **Send Email — PAY-1** `that's locked in` / `you're in` + **Send SMS — PAY-1-SMS** (immediate).
  2. **Wait 15 min** → **Send Email — WELCOME-1** `what happens next` / `your site, your name` (the domain ask: one binary "have a domain / grab me one").
  3. **Wait 2 days** → If/Else (no inbound reply AND `status:live` not set) → **Send SMS — WELCOME-1-SMS**.
  4. **Add Task (Alex):** point the domain + swap real photos/number/colors; if `founding_spot_number = 10`, **trigger the price-flip** (default opp value + calendar/email copy → $700).
  5. **On `status:live`** (Alex points domain → moves opportunity to **Live/Domain Pointed** → adds tag): **Send Email — WELCOME-2** `it's live, it's yours` / `go check it` + **Send SMS — WELCOME-2-SMS**.
- **WHY:** the card-charge is the highest-anxiety second in the journey — PAY-1 makes the spend feel safe and
  smart before remorse forms (price-lock-as-win, no upsell). WELCOME-1 closes the offer's core open loop (point
  it at THEIR domain) by isolating the one owner decision and removing every excuse to stall. WELCOME-2 delivers
  the dopamine the close promised and seeds the review ask without asking.

**WF-7b Review**
- **TRIGGER:** Tag Added `status:first-job` (self-report) **OR** **Wait 14 days after `status:live`** with `first_job_reported ≠ yes` (fallback check-in).
- **GOAL (exit):** review left (or any reply) → REVIEW-2 auto-skips.
- **ACTIONS:**
  1. **Send Email — REVIEW-1** `that first one` (self-report path) / `first one come through yet` (fallback) + **Send SMS — REVIEW-1-SMS**.
  2. **Wait 4 days** → If/Else (no review, no reply) → **Send Email — REVIEW-2** `thirty seconds` / `last nudge on this` (**email only** — a 2nd review text nags). Then **end**.
- **WHY:** a review ask fired right after the first job (peak belief, reciprocity at its hottest) converts; a
  calendar-timer ask catches them with nothing to say. The "next skeptical guy like you" frame makes the review
  an act of solidarity, not a vendor favor. One follow-up then stop — a founding client's review is the social
  proof that converts the next cold call (the Amodei loop made concrete).

---

### WF-D · "Cold Phase-2" (HELD OFF — toggle stays OFF)
- **TRIGGER:** Tag Added `cold-phase2` AND `draft_site_url` set AND `DND = false` AND **domains warm** (workflow toggle).
- **SUPPRESS/EXCLUDE:** any contact in Sequence A/B (warm); any `status:dnc`/`sms-optout`; any opportunity ≥ Connected. One person never gets cold + warm at once.
- **SENDER:** the **warmed cold-domain** identity (NOT `info@wedidit4you.com`); From name still "Alex at We Did It For You"; reply-to a monitored inbox (the "comes straight to me" promise must be true).
- **GOAL (exit):** reply OR `status:booked` OR `status:approved` OR DND.
- **ACTIONS** (`produce/cold-email.md`; subject-only A/B on `lane:a`/`lane:b`, set 50/50 at enrollment; bodies identical):
  1. **Day 0 — Email 1** `i built you a website` / `quick thing about your shop` (**NO links**).
  2. **Wait 2d** → goal-gate → **Email 2** `did this land in spam` / `the link i mentioned` (one bare link).
  3. **Wait 3d** (day 5) → **Email 3** `the jobs you're losing` / `about that founding price` (one bare link).
  4. **Wait 3d** (day 8) → **Email 4 (walk-away)** `i'll stop here` / `last note from me`. **Workflow ends — there is no Email 5, ever.**
- **WHY:** cold needs warmed domains (phase 2, not bought) — keep OFF until then. Past-tense gift, one
  non-repeating Voss device per touch, TRUE understated scarcity, calm never urgent. A "send it" reply is the
  highest-intent micro-commitment and a deliverability signal — wire instant reply-handling BEFORE this sends.

### WF-Dr · "Cold Reply Autopath" (BUILD + TEST before WF-D ever toggles on — panel fix)
Email-1 has **no link by design**; the whole sequence hinges on driving a "reply send it." That reply path
must be a **built workflow**, not a one-line note — on a warming cold domain a slow/absent reply path kills the
highest-intent micro-commitment AND an unanswered inbound reply is itself a negative deliverability signal.
- **TRIGGER:** Customer Replied (inbound email on the cold domain) where body contains `send it` / `send` /
  `yes` / `link` / `sure`.
- **ACTIONS:** (1) immediately **Send Email** with the bare `{{contact.draft_site_url}}` (the link Email-1
  withheld); (2) **notify Alex** (internal notification/task) so a human can ride a hot reply; (3) move
  opportunity → **Site Link Sent**, tag `status:site-sent` → this re-enters the warm post-delivery nurture.
- **GATE:** WF-D stays OFF until WF-Dr is built AND smoke-tested (send a test reply, confirm the link fires
  within seconds). Keep WF-D off (it already is) until this passes.

---

## 9. EMAIL/SMS TEMPLATES LIST + A/B SPLIT SETUP

### 9.1 Produced-piece → GHL template map (build each as a saved Email Template / SMS snippet)

| GHL template name | Canon ID | Subject(s) (A / B) | Source file |
|---|---|---|---|
| WDIFY · Form Ack | A1 / ACK-1 | `we're on it` / `clock just started` | inbound-form Piece 1 |
| WDIFY · Site Delivery | A2 / DLV-1 | `your site is live` / `it's built, see for yourself` | inbound-form Piece 2 |
| WDIFY · Nudge +2d | A3 / NDG-1 | `it's just sitting there` / `two days, still yours` | inbound-form Piece 3 |
| WDIFY · Final +5d | A4 / NDG-2 | `yours either way` / `i'll leave it here` | inbound-form Piece 4 |
| WDIFY · Post-Call Link | B1 / E1 | `the link from the call` / `told you it was real` | post-call E1 |
| WDIFY · Post-Call +1d | E2 | `did the link work` / `open it one more time` | post-call E2 |
| WDIFY · Post-Call Re-loop +3d | E3 | `it's still the rough cut` / `whose name is on it` | post-call E3 |
| WDIFY · Post-Call Walk-away +6d | E4 | `this is the last one` / `leaving you to it` | post-call E4 |
| WDIFY · Booking Confirm | C1 / 1A | `you're locked in` / `it's basically yours` | booking 1A |
| WDIFY · 24h Reminder | (new) | `tomorrow, fifteen minutes` / `your site, tomorrow` | booking Part 2 |
| WDIFY · No-Show Recover 1 | C3 / 4B | `have you given up` / `still yours` | booking 4B |
| WDIFY · No-Show Walk-away | (new) | `last one from me` / `i'll stop here` | booking 4D |
| WDIFY · Reschedule Confirm | (new) | `new time's set` / `locked for {{...}}` | booking 5.2 |
| WDIFY · LGN-1…5 | (new) | per nurture-react Part 1 | nurture-react LGN |
| WDIFY · REA-1 / REA-2 | (new) | `it's still live` / `before the spot's gone` · `how's the phone` / `still where you left it` | nurture-react Part 2 |
| WDIFY · Pay Confirm | (new) | `that's locked in` / `you're in` | postsale PAY-1 |
| WDIFY · Welcome / Next Steps | (new) | `what happens next` / `your site, your name` | postsale WELCOME-1 |
| WDIFY · Live Announce | (new) | `it's live, it's yours` / `go check it` | postsale WELCOME-2 |
| WDIFY · Review Ask | (new) | `that first one` / `first one come through yet` | postsale REVIEW-1 |
| WDIFY · Review Nudge | (new) | `thirty seconds` / `last nudge on this` | postsale REVIEW-2 |
| WDIFY · Cold D1…D4 | D1–D4 | per cold-email | cold-email (WF-D, OFF) |

**SMS snippets** (same naming, `· SMS` suffix): Form Ack SMS, Site Delivery SMS, Nudge +2d SMS, Final +5d SMS,
SMS-B1…B4, Booking 1B (SMS-3), 1h Reminder (SMS-4), No-Show 4A (SMS-5)/4C, Reschedule 5.2 SMS, LGN-1s…5s,
REA-1s/REA-2s, PAY-1 SMS, WELCOME-1/2 SMS, REVIEW-1 SMS.

> **All templates: PLAIN TEXT, no images, no HTML chrome** (LC Email; the old `email-templates/*.html` are
> visual reference only — copy + $297 price in them are DEAD). One link per SMS; first SMS to a number carries
> the business name + STOP line.

### 9.2 A/B split — three different harnesses (don't mix them up)

| Sequence | A/B axis | How to wire in GHL | Arm field/tag |
|---|---|---|---|
| **Warm email+SMS** (form, post-call, booking, nurture, reactivation, post-sale) | **Two full body variations (a/b)** per piece, paired a-with-a / b-with-b so the *frame* stays congruent end-to-end | **Set `ab_lane` ONCE at contact creation** (WF-1 step 1, or at import §11.3) via random 50/50 → every email step uses an **If/Else on `contact.ab_lane`** to pick the variation. Do NOT use GHL's per-step native split here (it would re-randomize each step and break frame congruence). | `contact.ab_lane` = `a`/`b`; tags `ab:possession`/`ab:consequence` |
| **Cold email** (WF-D) | **Subject line only** (bold-claim vs low-key); identical bodies | random `lane:a`/`lane:b` at enrollment; each email step picks subject by lane via If/Else | `lane:a` / `lane:b` |
| **Single-decision pieces** (where the spec ships only one approved body, e.g. canon C1) | native GHL email A/B is fine | per-step native split | n/a |

**Primary KPI for every warm A/B = the revenue chain, not opens:** **book-rate → show-rate → $450 close**
(booking.md's prediction bet: endowment/possession-forward beats logistics/consequence-forward for the
skeptic). For WF-D the KPI is **open → reply**. Retire the loser per arm after ~40 sends (nurture/react) /
~100 sends (post-call) / a touch clearing significance (cold). Then fold winners back into the canon
(`../email/SEQUENCES.md` / `../sms/SMS-COPY.md`), re-run `/panel`, re-sync this spec.

> **WHY arm-at-creation for warm:** a skeptic's journey is multi-touch (call → link → nudge → booking →
> reminder). If each step re-randomized, the email and its SMS twin could land in different frames ("rough
> cut" email + "promise kept" SMS) — incoherent, and unmeasurable. One lane per contact = congruent voice +
> a clean read on which *frame* converts.

---

## 10. WHAT MUST BE BUILT IN THE GHL UI vs WHAT THE API CAN DO

| Object | UI-only? | API? | Notes |
|---|---|---|---|
| Location TZ / business profile | **UI** | partial | Set TZ on first login (§1.2). |
| LC Email dedicated domain + DNS verify | **UI** (+ GoDaddy DNS) | no | §2; GHL shows DKIM values to paste. |
| **Custom fields** | UI or **API** | **yes** `POST /locations/{id}/customFields` | §11.1 — script the 18 fields. |
| **Tags** | auto-create on write | **yes** (optional pre-seed) `POST /locations/{id}/tags` | §11.2 — no pre-pass needed. |
| **Custom values** (Booking Link, Review Link) | **UI** (set value after calendar exists) | read via API | §7. |
| **Pipeline + stages** | **UI-ONLY** (no public v2 create) | read IDs via `GET /opportunities/pipelines` | §5 / §11.4. |
| **Calendar** | **UI-ONLY** | read/book via API | §6. |
| **Workflows** | **UI-ONLY** (build from this spec) | trigger via tags/API | §8 — paste copy verbatim. |
| **Contacts import** (742) | UI CSV or **API** | **yes** `POST /contacts/upsert` | §11.3 — script it (dedupe server-side by phone/email). |
| **Opportunities** (2 Lubbock specs) | UI or **API** | **yes** `POST /opportunities/` | §11.4. |
| **Mia post-call write-back** | n/a | **yes** `POST /contacts/upsert` from Mia | §11.5 — tags drive everything. |
| **Monthly reactivation tagging** | UI bulk action or **scheduled API job** | **yes** | §8 WF-6 — GHL has no native monthly-Smart-List trigger. |

---

## 11. API PUSH ORDER (run top to bottom)

Base URL `https://services.leadconnectorhq.com` · headers on EVERY call:
`Authorization: Bearer $GHL_WDIFY_API_KEY` · `Version: 2021-07-28` · `Content-Type: application/json`.
Rate limit: 100 req / 10 s burst per location — push script sleeps **0.15 s/request**.

**11.0 — Token.** Sub-account → Settings → **Private Integrations** → create "WDIFY Push", scopes:
`contacts.write, contacts.readonly, locations/customFields.write, locations/customFields.readonly,
locations/tags.write, opportunities.write, opportunities.readonly`. Then:
```bash
export GHL_WDIFY_API_KEY="pit-..."                       # the PIT token
export GHL_WDIFY_LOCATION_ID="[REDACTED]"      # or the new location ID
```

**11.1 — Custom fields** (×18, §3). TEXT example + dropdown example:
```bash
curl -s -X POST "https://services.leadconnectorhq.com/locations/$GHL_WDIFY_LOCATION_ID/customFields" \
  -H "Authorization: Bearer $GHL_WDIFY_API_KEY" -H "Version: 2021-07-28" -H "Content-Type: application/json" \
  -d '{"name":"Site URL","dataType":"TEXT","model":"contact"}'
#  -d '{"name":"Call Outcome","dataType":"SINGLE_OPTIONS","model":"contact",
#       "options":["connected","voicemail","no_answer","bad_number","callback","dnc"]}'
```
(`push_to_ghl.py` resolves field IDs by fieldKey at runtime — no need to record IDs by hand.)

**11.2 — Tags.** No separate pass needed (auto-create on first contact write). Optional pre-seed:
`POST /locations/{id}/tags` `{"name":"status:new"}`.

**11.3 — Contacts import** (742). Generate CSV on the VPS, then push:
```bash
[ export the WDIFY leads from our lead system -> wdify_leads.csv ]
python3 push_to_ghl.py wdify_leads.csv --dry-run     # inspect payloads, no writes
python3 push_to_ghl.py wdify_leads.csv               # ~742 upserts ≈ 2-3 min
```
Endpoint `POST /contacts/upsert` (server-side dedupe by phone/email). Each contact gets tags `source:scraper`,
`status:new`, `niche:*`, `city:*`, a 50/50 `ab_lane`, a random **~10% `holdout`** tag (audit #7 — incremental-lift
control), + custom fields `niche/city/google_rating/lead_source/mns_lead_id` **and `timezone`** (panel TCPA fix —
derive from `city`/area code at import: TX→`America/Chicago`, AZ→`America/Phoenix`, FL/Eastern→`America/New_York`;
default `America/Chicago`, but never leave it empty since the SMS send-window gates on it). **`mns_lead_id` MUST be
the `mns-{id}` form** (the Supabase `place_id` join key — `REPO-INTEGRATION-MAP §1`). **NO SMS-consent is granted at
import** — scraped contacts get NO `sms-consent` tag and NO `sms_consent_at`; they become SMS-eligible only after
Mia captures verbal opt-in on a live call (audit BLOCKER #2). **Scraped numbers receive zero SMS until then.** The
push script also runs the **ongoing-dedupe** pass (§8 global rule): new contacts are matched against existing
records by phone AND email so a later form lead never double-enrolls against the cold pool.

**11.4 — Pipeline IDs + the 2 Lubbock opportunities** (after the pipeline exists in UI):
```bash
curl -s "https://services.leadconnectorhq.com/opportunities/pipelines?locationId=$GHL_WDIFY_LOCATION_ID" \
  -H "Authorization: Bearer $GHL_WDIFY_API_KEY" -H "Version: 2021-07-28"   # grab pipelineId + stage IDs
curl -s -X POST "https://services.leadconnectorhq.com/opportunities/" \
  -H "Authorization: Bearer $GHL_WDIFY_API_KEY" -H "Version: 2021-07-28" -H "Content-Type: application/json" \
  -d '{"locationId":"'$GHL_WDIFY_LOCATION_ID'","pipelineId":"<id>","pipelineStageId":"<Site Link Sent id>",
       "contactId":"<id from upsert>","name":"Elite Mobile Tire & Brake — founding build","monetaryValue":450,"status":"open"}'
```

**11.5 — Mia wiring (post-call webhook → GHL).** Mia's post-call handler calls `POST /contacts/upsert` with
the lead phone + `customFields`: `call_outcome`, `call_status`, `call_recording_url` (+ email if captured),
and adds tags `source:mia`, `status:dialed`, and **`status:connected`** when outcome = connected (fires
WF-3) or **`status:dnc`** (fires WF-5). **CONSENT CAPTURE (audit BLOCKER #2):** when Mia captured verbal SMS
opt-in on the call (the script's "can I text you the link?" → yes), the same webhook stamps
`customFields.sms_consent_at` = the call timestamp **and adds tag `sms-consent`** — this is what unlocks every
SMS to that (scraped) number. **Without that yes, no `sms-consent` is set and the number stays SMS-suppressed.**
That's the whole integration — **tags drive everything.** (Separately, Mia writes `call_*` to **Supabase** via
the `writeback` subcommand + the `call-status-webhook` PR — `REPO-INTEGRATION-MAP §5`. GHL and Supabase are
reconciled by `mns_lead_id`/`place_id`.)

**11.6 — Smartlead → GHL inbound webhook (cold-email handoff, WF-SL / §15).** In Smartlead, set the
reply + click webhooks to POST to a **GHL Inbound Webhook URL** (Automation → create a workflow with the
"Inbound Webhook" trigger = WF-SL; copy its URL). Payload carries the contact email + event type. WF-SL upserts
the contact, tags `warm`, and **calls back to Smartlead's API** (a GHL outbound webhook / HTTP action with the
Smartlead API key) to **pause/remove the contact from the cold campaign** — so cold and warm never overlap.

---

## 12. THE UNDER-1-HOUR RUNBOOK (BUILD only — sending is gated, see note)

> **Panel split (deliverability):** this hour BUILDS the machine. It does NOT authorize volume sending.
> Real sends wait on the Step-0 gates (§13): A2P 10DLC `approved` (all SMS), CAN-SPAM footer + verified DMARC
> (all email), and the 10–14 day warm-domain ramp. Build in the hour; send after the gates clear.


| Min | Step |
|---|---|
| 0–5 | Agency reactivates → confirm location `[REDACTED]` → **fix TZ to America/Chicago** (§1) |
| 5–15 | LC dedicated domain `mail.wedidit4you.com` + 5 GoDaddy records (§2); create PIT token (§11.0) |
| 15–22 | Run §11.1 custom fields (×18); build pipeline in UI (§5); create calendar (§6); set custom values (§7) |
| 22–48 | Build WF-1…WF-7 + WF-2b + WF-4b + **WF-4r (rebuilt: Customer-Booked trigger, `confirmed-once` branch, Allow Re-entry ON)** + **WF-PR (positive-reply router)** + **WF-SL (Smartlead handoff)** + **WF-HC (deliverability/holdout)** in the UI from §8 (paste copy verbatim from `produce/*`); set sender default (§2). WF-D **legacy/OFF** (cold lives on Smartlead). |
| 48–55 | §11.3: SQL export → dry-run → live push of 742 contacts (with `ab_lane` + `mns_lead_id`); spot-check 5 in the UI |
| 55–58 | §11.4: pipelines GET + 2 Lubbock opportunities at Site Link Sent; verify domain "verified" + seed test (SPF/DKIM/DMARC pass) |
| 58–60 | Smoke test: test contact → add `source:form` (WF-1 fires), add `status:connected` (WF-3 SMS fires), book a test slot (WF-4 fires), mark No-Show (WF-4b fires), reply STOP (WF-5 DNDs). Wire Mia webhook (§11.5). **GO** — Lubbock owners get the first calls. |

---

## 13. PREREQUISITES / UNBLOCK CHECKLIST (none block the BUILD; these block GO-LIVE)

**STEP 0 — HARD GATES (no send of any kind until these clear — panel + audit fixes):**
- **SMS CONSENT GATE wired (audit BLOCKER #2)** — every SMS step begins with the `source:form` OR `sms-consent`
  If/Else; no SMS to a scraped number without Mia-captured verbal consent (`sms_consent_at` set). Pure-cold SMS
  to un-connected scraped numbers is REMOVED. A cold SMS without this = TCPA + 10DLC-suspension exposure.
- **A2P 10DLC brand + campaign `approved` at TCR** before ANY SMS send, on a **DEDICATED WDIFY SignalWire number**
  (dedicated to WDIFY only), **registered honestly as voice-captured-consent** (opt-in method =
  verbal phone consent, real Mia script line as the sample). SMS is the primary channel; unregistered traffic is
  filtered/blocked by AT&T/T-Mobile → the phone-rich majority is undeliverable. Email-only until approved.
- **CAN-SPAM footer live** (`{{custom_values.email_footer}}` = valid US postal address + one-click unsubscribe,
  §2.1) on EVERY email + GHL injecting `List-Unsubscribe`/`List-Unsubscribe-Post` headers — before ANY email send.
- **DMARC alignment VERIFIED** by a real seed (`dmarc=pass` in `Authentication-Results`), not asserted (§2).
  Google Postmaster Tools enrolled; complaint rate ceiling < 0.1%.
- **Warm-domain ramp scheduled** (10–14 day, 20→50→100/day, seed-engagement first, §2.2) — build now, send after ramp.

**Standard prereqs:**
- **GHL agency reactivated** + location `[REDACTED]`, TZ → America/Chicago.
- **Per-contact `timezone` field populated** at import (§11.3) so SMS quiet-hours gate on RECIPIENT-local 8am–9pm (TCPA).
- **Mia ↔ GHL webhook** wired (`call_outcome`/`call_status`/tags → workflows) (§11.5).
- **Aljaz unblocks** (`REPO-INTEGRATION-MAP §6`): Supabase creds (`SUPABASE_URL` + `SERVICE_ROLE_KEY`),
  `generate-sites` cron (sites go live), `OUTREACH_AUTH_TOKEN` (Mia's link delivery), the
  `feat/call-status-webhook` PR merged (call outcomes persist), **A2P 10DLC brand+campaign registration** (the Step-0 gate above).
- **`spots_remaining` + `first_founder` custom values set** before reactivation (WF-6) fires — scarcity must be provable, not asserted (§7).
- **Cold email runs on Smartlead, NOT GHL** (§15): Smartlead account + warmed cold mailboxes/domains live;
  the **Smartlead→GHL inbound webhook (WF-SL) built + smoke-tested** (a test reply tags `warm`, stops the cold
  campaign, enters WF-2) before any cold-email send. WF-D (in-GHL cold) stays LEGACY/OFF.
- **WF-PR Positive-Reply Router live** + GHL Conversation AI configured (or Alex task routing) so an interested
  reply gets a real-time answer (audit #4).
- **WF-HC deliverability health-check job scheduled** (weekly complaint/bounce alert + auto-pause) and the
  **`holdout` ~10% tagged at import** for incremental-lift measurement (audit #7).
- **Legacy:** cold domains (2–3, warmed 3–4 weeks) + WF-Dr were the old in-GHL cold plan — superseded by
  Smartlead/WF-SL; keep WF-D OFF.

> **Sync rule:** any copy change happens in the `produce/*` source files → re-run `/panel` → re-sync this
> spec. Never edit copy in the GHL UI or here directly. Log panel verdicts in `../PANEL-VERDICTS.md`.

---

## 14. 3-CEO GATE CHECK (why this build earns its place)

- **Hormozi (does it make money?):** the entire machine defends the two revenue-leak points — show-rate
  (WF-4/WF-4b) and book-rate (WF-2/WF-3 re-loop) — that separate 6.9 from 16.4 sales/100, then WF-7b's review
  loop manufactures the social proof that closes the *next* cold call. First 10 founding clients = $4,500 +
  the unlock to $700.
- **Amodei (is it getting smarter?):** every warm sequence runs a frame-congruent A/B (`ab_lane`), measured on
  book→show→close, with the loser retired per arm and the winner folded back into the canon. WF-6 turns dead
  leads into a measured second swing. Each send produces the data that sharpens the next — the loop is wired in,
  not bolted on.
- **Brunson (where's the next step?):** every touchpoint ends on a single forward action (booking link, draft
  link, the locked time, or the review link) — never a dead "let me know." The pipeline stage IS the funnel
  map; no lead sits without a defined next move except the two legal terminals (DNC, dead number).

---

## 15. CHANNEL OWNERSHIP + ORCHESTRATION (GHL = hub; Smartlead / SignalWire / Mia / Aljaz-app = spokes)

**The model: GHL is the brain/hub of record. Each channel runs on its own dedicated tool (a spoke) and reports
back into GHL via a webhook.** This keeps each channel on the infra it's actually good at, and keeps GHL as the
single source of truth for lead state.

| Channel | Owner (spoke) | Why NOT GHL | How it syncs back to GHL (the seam) |
|---|---|---|---|
| **Cold email** | **Smartlead** (dedicated cold mailboxes/domains, warmup) | Cold volume on GHL/LC Email violates shared-pool ToS + torches the warm domain `mail.wedidit4you.com`. Cold and warm must NEVER share a sending domain. | **Smartlead reply/click webhook → GHL Inbound Webhook → WF-SL:** tags `warm`, STOPS the Smartlead campaign via Smartlead API, moves opp → "Site Link Sent", enters warm nurture (WF-2). |
| **Warm email** (acks, delivery, nurture, booking, post-sale) | **GHL LC Email** (`mail.wedidit4you.com`) | This IS GHL's job — warm/transactional, <100/day. | native (in-GHL workflows). |
| **Voice / dialing** | **Mia** (SignalWire + Gemini Live) | Real-time conversation is its own stack. **Mia is also the SMS-consent capture point** (verbal opt-in on a live call). | **Mia post-call webhook → `POST /contacts/upsert`** (§11.5): writes `call_*`, stamps `sms_consent_at` + tag `sms-consent`, adds `status:connected`/`status:dnc` → fires WF-3/WF-5. |
| **SMS** | **SignalWire via GHL** on a **DEDICATED WDIFY 10DLC number** | Must be dedicated to WDIFY only (a co-mingled number = one complaint suspends all). | native GHL SMS, but **HARD-gated on `source:form` OR `sms-consent`** (§8 consent gate). |
| **Site generation / link delivery** | **Aljaz app** (Supabase) | Owns `slug`/`draft_site_url`/`sms_*`/`inbound_*` (one-writer rule, `REPO-INTEGRATION-MAP §5`). | Aljaz writes `draft_site_url` → GHL gate opens; reconciled by `mns_lead_id`/`place_id`. |

**The cold-email orchestration flow (Smartlead → GHL), step by step:**
1. The scraped cold pool (no consent for SMS) is loaded into **Smartlead**, NOT GHL. Smartlead runs the
   `produce/cold-email.md` sequence on its warmed cold domains.
2. A recipient **replies or clicks** → Smartlead fires its **reply/click webhook**.
3. That webhook hits a **GHL Inbound Webhook URL** → triggers **WF-SL** (§8): the contact is tagged `warm`,
   `lead_score` bumped, the opp moved to "Site Link Sent", `status:site-sent` added.
4. **WF-SL calls back to Smartlead's API to STOP the cold campaign** for that contact — so they're never cold +
   warm at once.
5. The contact is now a **warm GHL lead** in the normal post-delivery nurture (WF-2) + reply routing (WF-PR).

**One-writer / dedupe discipline (unchanged, reinforced):** Mia writes `call_*`; Aljaz writes
`slug`/`sms_*`/`inbound_*`; **Smartlead owns the cold-email send state; GHL owns `status:*` tags, opportunity
stage, warm nurture, calendar, and the `warm`/`sms-consent` flags.** The daily warm+cold dedupe job (§8) +
WF-SL's campaign-stop keep a single person from being hit by Smartlead-cold and GHL-warm simultaneously.

> **Mantra:** GHL is the hub of record; each channel runs on its best-fit spoke and reports back through one
> webhook seam. Cold lives on Smartlead, warm lives on GHL, voice lives on Mia, and the consent that bridges
> cold→warm SMS is captured on the Mia call — never assumed.
