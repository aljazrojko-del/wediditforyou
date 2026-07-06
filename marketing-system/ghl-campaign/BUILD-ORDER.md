# WDIFY — GHL BUILD ORDER (click-by-click, executable now)

Exact order to stand up the WDIFY GHL machine. Each step is flagged **[API]** (scriptable via the
LeadConnector v2 API) or **[UI]** (must be done in the GHL interface — no public create endpoint).
Dependencies run top-to-bottom: do not reorder. Copy is pasted **verbatim** from `produce/*.md` — never
reworded in GHL. Full detail per step lives in `01-GHL-BUILD-SPEC.md` (section refs below).

**Location:** `[REDACTED]` (or the new location ID). **API base:**
`https://services.leadconnectorhq.com` · headers `Authorization: Bearer $GHL_WDIFY_API_KEY`,
`Version: 2021-07-28`, `Content-Type: application/json`.

---

## PHASE 0 — STEP-0 HARD GATES (start these FIRST; they run in parallel and block SENDING, not building)

| # | Step | API/UI | Blocks |
|---|---|---|---|
| 0.1 | **Register A2P 10DLC brand + campaign at TCR** (Aljaz/WDIFY EIN; use-case = mixed marketing/customer-care; submit opt-in language + 2-3 sample SMS). Wait for `approved`. | UI (TCR/provider) | **ALL SMS sends** |
| 0.2 | **Secure a valid US postal address** for CAN-SPAM (registered-agent or virtual mailbox preferred). | external | **ALL email sends** |
| 0.3 | **Plan the warm-domain ramp** (10-14 day: 20→50→100/day, seed-engagement first). | planning | **volume email sends** |

> These do not block the build. Build the whole machine now; flip sending on only after 0.1-0.3 clear.

---

## PHASE 1 — LOCATION FOUNDATION [UI]

| # | Step | API/UI | Ref |
|---|---|---|---|
| 1.1 | Confirm agency reactivated; open location `[REDACTED]`. | UI | §1 |
| 1.2 | **Settings → Business Profile → Timezone:** `Europe/London` → **`America/Chicago`**. Do this BEFORE the calendar or every Wait-until time is wrong. | UI | §1.2 |
| 1.3 | **Settings → Email Services** → confirm SMTP = LeadConnector → **Dedicated Domain** → add `mail.wedidit4you.com` (subdomain, never root). | UI | §2 |
| 1.4 | Add the 5 GoDaddy DNS records GHL displays (SPF TXT, DKIM TXT, tracking CNAME, 2× MX). | UI (GoDaddy) | §2 |
| 1.5 | Set **Sender default:** From `Alex at We Did It For You` / `info@wedidit4you.com`. | UI | §2 |
| 1.6 | **VERIFY DMARC, do not assert:** send a seed to Gmail, open raw headers, confirm `spf=pass` + `dkim=pass` + **`dmarc=pass`**. If dmarc fails, add `_dmarc.mail` record and re-seed. Enroll Google Postmaster Tools. | UI | §2 |
| 1.7 | **Create Private Integration token** (Settings → Private Integrations → "WDIFY Push") with the §11.0 scopes. Export `GHL_WDIFY_API_KEY` + `GHL_WDIFY_LOCATION_ID`. | UI → enables API | §11.0 |

---

## PHASE 2 — CUSTOM FIELDS (×16) [API]

`POST /locations/{id}/customFields` — script all 16 from §3. Includes the **new panel field**:

| Field | dataType | Note |
|---|---|---|
| Niche, City, Site URL, Call Outcome, Call Status, Call Recording URL, Founding Spot Number, Lead Source, Google Rating, MNS Lead ID, Walkthrough Datetime, Live Domain, First Job Reported, Reactivation Round, AB Lane | per §3 | the existing 15 |
| **Timezone** (`contact.timezone`, TEXT) | TEXT | **NEW — TCPA fix.** IANA tz; SMS window gates on this, not location TZ. |

```bash
curl -s -X POST "$BASE/locations/$GHL_WDIFY_LOCATION_ID/customFields" \
  -H "Authorization: Bearer $GHL_WDIFY_API_KEY" -H "Version: 2021-07-28" -H "Content-Type: application/json" \
  -d '{"name":"Timezone","dataType":"TEXT","model":"contact"}'
```

---

## PHASE 3 — TAGS [API optional / auto]

Tags auto-create on first contact write. Optional pre-seed via `POST /locations/{id}/tags`. Taxonomy in §4
(`niche:*`, `city:*`, `source:*`, `status:*`, plus control tags: `nurture:long-game`,
`reactivation:eligible`, `reactivation:round-1/2`, `sms-optout`, `confirmed-once`, `cold-suppress`,
`ab:consequence`/`ab:possession`, `lane:a`/`lane:b`).

---

## PHASE 4 — PIPELINE [UI-ONLY]

| # | Step | Ref |
|---|---|---|
| 4.1 | Opportunities → Pipelines → **Create** → `WDIFY Sales`. | §5 |
| 4.2 | Add the 9 stages IN ORDER: New Lead → Dialed → Connected → Site Link Sent → Walkthrough Booked → Showed → Site Approved ($450 won) → Live/Domain Pointed → Lost/DNC. | §5 |
| 4.3 | Set **default opportunity value $450** (flip to $700 when the 10th founding deal is WON). | §5 |
| 4.4 | After creating: **[API]** `GET /opportunities/pipelines` → record `pipelineId` + stage IDs (the push script + Mia webhook need them). | §11.4 |

---

## PHASE 5 — CALENDAR [UI-ONLY]

| # | Step | Ref |
|---|---|---|
| 5.1 | Calendars → Create → **`15-min Site Walkthrough with Alex`**. 15-min slots, business hours, 14-day booking window. | §6 |
| 5.2 | **Reschedule/Cancel links ON** (native `{{appointment.reschedule_link}}`). | §6 |
| 5.3 | Copy the calendar permalink (needed for the Booking Link custom value next). | §6 |

---

## PHASE 6 — CUSTOM VALUES (location globals) [UI]

| Custom value | Set to | Ref |
|---|---|---|
| **Booking Link** | the §5 calendar permalink | §7 |
| **Review Link** | the Google write-review link (`g.page/r/...`) | §7 |
| **Email Footer** | `We Did It For You · <valid US postal address> · {{unsubscribe_link}}` (**CAN-SPAM blocker**) | §2.1 / §7 |
| **Spots Remaining** | `10 − (won founding deals)` — update at each close (**replaces "almost gone"**) | §7 |
| **First Founder** | the named first founding client (set on first close) | §7 |

> Enable GHL's built-in **unsubscribe element** so `List-Unsubscribe` + `List-Unsubscribe-Post` (one-click)
> headers are injected. Append `{{custom_values.email_footer}}` below `— alex` in EVERY email template.

---

## PHASE 7 — EMAIL/SMS TEMPLATES [UI] (paste verbatim from produce/*)

Build each saved template per the §9.1 map. **Paste bodies verbatim** — append the email footer; keep the
`— alex` sign-off. Templates (A/B subjects in §9.1):

- **Inbound (WF-1/2):** Form Ack, Site Delivery, Nudge +2d, Final +5d (+ SMS twins) — `inbound-form.md`
- **Post-call (WF-3):** Link drop E1, +1d E2, Re-loop +3d E3 (**carries guarantee**), Walk-away +6d E4 (+ SMS-B1..B4) — `post-call.md`
- **Booking (WF-4):** Confirm 1A (**carries guarantee**), 24h reminder, 1h reminder SMS, No-show recover ×2, Reschedule confirm — `booking.md`
- **Nurture (WF-2b):** LGN-1..5 (+ SMS twins) — `nurture-react.md`
- **Reactivation (WF-6):** REA-1, REA-2 (+ SMS twins) — `nurture-react.md` (use `spots_remaining`/`first_founder`)
- **Post-sale (WF-7):** PAY-1 (**carries guarantee**), WELCOME-1, WELCOME-2, REVIEW-1, REVIEW-2 (+ SMS twins) — `postsale.md`
- **Cold (WF-D, held off):** Email 1-4 — `cold-email.md`

---

## PHASE 8 — WORKFLOWS [UI-ONLY] (build from §8, paste copy verbatim)

**Global rules on EVERY workflow** (§8): footer on every email · SMS window gates on `contact.timezone`
(8am-9pm recipient-local, 9am floor) · "Skip if DND" ON · goal events auto-skip downstream · A/B via
If/Else on `contact.ab_lane`. **All SMS steps stay OFF until 10DLC `approved`.**

| # | Workflow | Trigger | Held off? |
|---|---|---|---|
| 8.1 | **WF-1 Form In — 24h Clock** | tag `source:form` | no |
| 8.2 | **WF-2 Site Delivered — Nudge Engine** | `draft_site_url` set / `status:site-sent` | no |
| 8.3 | **WF-2b Long-Game Nurture** | tag `nurture:long-game` | no |
| 8.4 | **WF-3 Call Connected — Post-Call Nurture** | tag `status:connected` | no |
| 8.5 | **WF-4 Walkthrough Booked** (3-1-0 reminders; first-booking gate `confirmed-once` NOT present; Allow Re-entry ON) | Customer Booked Appointment | no |
| 8.6 | **WF-4b No-Show Recovery** | Appt → No Show | no |
| 8.7 | **WF-4r Reschedule** (REBUILT — branch `confirmed-once` PRESENT; Allow Re-entry ON) | Customer Booked Appointment | no |
| 8.8 | **WF-5 STOP/DNC Guard** (full FCC opt-out set) | inbound STOP/stopall/unsubscribe/cancel/end/quit/opt-out/revoke/remove / call DNC | no (legal) |
| 8.9 | **WF-PR Positive-Reply Router** (interested-reply → Conversation AI / Alex) | Customer Replied (non-opt-out) | no |
| 8.10 | **WF-6 Reactivation** | `reactivation:round-{N}` (monthly Smart List). **Gate on `spots_remaining`+`first_founder` set.** | no |
| 8.11 | **WF-7 Post-Sale** (Fulfillment paid→live + Review on first-job) | `status:paid` / `status:live` / `status:first-job` | no |
| 8.12 | **WF-SL Smartlead → GHL Cold Handoff** (reply/click → warm, stop cold, enter WF-2) | Inbound Webhook (Smartlead) | no |
| 8.13 | **WF-HC Deliverability Health-Check + Holdout** (weekly complaint/bounce alert; ~10% `holdout`) | scheduled job + `holdout` tag | no |
| 8.14 | **WF-Dr Cold Reply Autopath** (LEGACY — cold now on Smartlead/WF-SL) | Customer Replied (cold domain) contains send/yes/link | **LEGACY — off** |
| 8.15 | **WF-D Cold Phase-2** (LEGACY — superseded by Smartlead) | tag `cold-phase2` + domains warm | **toggle OFF** (legacy) |

> **Audit fixes baked in (see `01-GHL-BUILD-SPEC.md §8/§15` + `GHL-AI-BUILDER-PROMPTS.md`):** WF-4r rebuilt on the
> real "Customer Booked" trigger (no phantom "Rescheduled" trigger); SMS HARD-gated on `source:form` OR
> `sms-consent` (no cold SMS to scraped numbers — TCPA/10DLC); WF-1 speed-to-lead (immediate Mia dial); WF-PR
> positive-reply routing; 3-1-0 reminder cadence + "reply C"; lead score → dial priority; WF-HC deliverability +
> holdout; full FCC STOP set; cold email on Smartlead via WF-SL.

---

## PHASE 9 — DATA PUSH [API]

| # | Step | Ref |
|---|---|---|
| 9.1 | **Custom fields** already done (Phase 2). | §11.1 |
| 9.2 | **Import 742 contacts** `POST /contacts/upsert` (server-side dedupe by phone/email). Each gets `source:scraper`, `status:new`, `niche:*`, `city:*`, 50/50 `ab_lane`, custom fields **incl. `timezone`** (derive from city/area code: TX→Chicago, AZ→Phoenix, FL→New_York). `mns_lead_id` in `mns-{id}` form. | §11.3 |
| 9.3 | **Ongoing dedupe job** (daily scheduled API): match new form/scraper contacts vs cold pool by phone AND email; apply `cold-suppress` if a warm record exists. | §8 / §11 |
| 9.4 | **2 Lubbock spec opportunities** `POST /opportunities/` at Site Link Sent ($450). | §11.4 |
| 9.5 | **Mia webhook** `POST /contacts/upsert` from Mia's post-call handler: `call_outcome`/`call_status`/`call_recording_url` + email if captured + tags `source:mia`, `status:dialed`, `status:connected` (fires WF-3) or `status:dnc` (fires WF-5). | §11.5 |

---

## PHASE 10 — SMOKE TEST [UI] (before GO)

1. Test contact → add `source:form` → WF-1 fires (ack email; SMS held if 10DLC pending).
2. Set `draft_site_url` → WF-2 site delivery fires.
3. Add `status:connected` → WF-3 link drop fires.
4. Book a test slot → WF-4 confirm + reminders schedule (verify the 1h reminder computes off recipient TZ).
5. Mark No-Show → WF-4b recovery fires.
6. Reschedule → WF-4r confirm fires, reminders re-anchor, no duplicate 1A.
7. Reply STOP → WF-5 DNDs + `sms-optout` cross-suppresses.
8. Reply "send it" on cold domain → WF-Dr fires the bare link + notifies Alex.
9. Confirm `spots_remaining` and `first_founder` render in a REA preview.
10. Confirm `{{custom_values.email_footer}}` renders (address + one-click unsubscribe) on every email.

**GO criteria:** all 10 pass AND Phase-0 gates clear (10DLC approved, footer live, DMARC verified, ramp
underway). Then Lubbock owners get the first calls.

---

## API-ABLE vs UI-ONLY (quick reference)

| API-able | UI-only |
|---|---|
| Custom fields, tags (pre-seed), contacts import, opportunities, Mia write-back, pipeline-IDs read, dedupe job, monthly reactivation tagging | Location TZ/profile, dedicated email domain + DNS verify, custom values, pipeline + stages create, calendar, ALL workflows |
