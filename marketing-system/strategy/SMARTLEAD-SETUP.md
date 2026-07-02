# WDIFY Smartlead Setup — Cold Email Campaigns

**Date:** 2026-06-28
**Source copy:** `launch/ghl-campaign/produce/cold-email.md` (de-patterned 4-touch A/B cold sequence)
**API:** `https://server.smartlead.ai/api/v1/` · auth via `?api_key=...` query param
**Status after this run:** all 3 campaigns DRAFTED, 0 leads, **sending OFF** (not enabled). Copy + settings updated only.

---

## What changed per campaign

| Campaign ID | Niche | Before | After |
|---|---|---|---|
| 3457301 | mobile mechanic | generic 3-step, no A/B, `max/day=100`, `plain_text=false` | real 4-email WDIFY sequence w/ A/B subjects, `max/day=25`, `plain_text=true` |
| 3457302 | mobile dog groomer | same generic 3-step | same real 4-email sequence |
| 3457303 | tutor | same generic 3-step | same real 4-email sequence |

The old generic copy ("A free website preview for {{business_name}}" with `{{first_name}}`) was fully replaced. A `POST /sequences` replaces the entire sequence array, so the 3 old steps are gone, replaced by 4 fresh steps each (verified by GET — see below).

### The sequence now live in all 3 (identical copy — bodies are niche-agnostic by design)

| Seq | Delay | Subject A (bold) | Subject B (low-key) | Links |
|---|---|---|---|---|
| 1 | Day 0 | `i built you a website` | `quick thing about your shop` | **0 (verified link-free)** — **E1 body re-synced 2026-06-29**: adds human-identity + callback line "I'm Alex Rojko, a real person. That's my number if you'd rather hear a voice: 713-352-2542." (phone is plain text, NOT a link — E1 stays zero-link). Subjects unchanged. |
| 2 | +2 days | `did this land in spam` | `the link i mentioned` | 1 (`{{site_url}}`) |
| 3 | +3 days | `the jobs you're losing` | `about that founding price` | 1 (`{{site_url}}`) — **E3 body re-synced 2026-06-28**: dollarized cost-of-inaction ($100/job → $1,500/mo), recurring-bill contrast ($450 once, nothing monthly ever), + 30-day refund guarantee. Subjects unchanged. |
| 4 | +3 days | `i'll stop here` | `last note from me` | 1 (`{{site_url}}`) |

- One body per email; A/B is on the **subject line only**, via Smartlead `seq_variants` (variant_label A/B), exactly per the doc's lane strategy.
- Email 1 carries NO link (asserted in code + re-verified on read for all 3). Emails 2–4 each carry exactly one bare `{{site_url}}`.
- Bodies are verbatim from `cold-email.md`, sign-off `— alex`, em-dash preserved.

> Note: the doc's Email-1 wiring describes a per-lane GHL If/Else; in Smartlead the native A/B mechanism is `seq_variants`, which is the cleaner equivalent (one step, two subject variants, same body). Lane discipline (A-subjects vs B-subjects across all 4) is preserved because variant_label is consistent A/B across all steps. Smartlead distributes A/B per its variant engine — confirm 50/50 distribution in the UI before enabling if strict lane-purity matters.

### Merge-field mapping applied (GHL → Smartlead)
| GHL | Smartlead | Notes |
|---|---|---|
| `{{contact.company_name}}` | `{{company_name}}` | used in Email 1 + 2 |
| `{{contact.draft_site_url}}` | `{{site_url}}` | **custom field — must exist on the lead/account.** Used Emails 2–4 |
| `{{contact.first_name}}` | — | NOT used in any body (by design; 728/742 have no name) |
| `{{custom_values.booking_link}}` | — | absent from cold sequence by design |

**Action for you:** when loading leads, ensure each lead has a `company_name` and a `site_url` custom field populated. A lead with no `site_url` would render Emails 2–4 with a broken/empty link — the GHL entry gate ("site built first") must be enforced on the lead list before import.

---

## Settings applied (all 3 campaigns)

| Setting | Value | Endpoint |
|---|---|---|
| `send_as_plain_text` | **true** | `POST /campaigns/{id}/settings` |
| `stop_lead_settings` | `REPLY_TO_AN_EMAIL` (stop on reply) | `POST /campaigns/{id}/settings` |
| `track_settings` | `DONT_TRACK_EMAIL_OPEN`, `DONT_TRACK_LINK_CLICK` (read back as `DONT_EMAIL_OPEN`/`DONT_LINK_CLICK`) | `POST /campaigns/{id}/settings` |
| `max_leads_per_day` (new leads) | **25** | `POST /campaigns/{id}/schedule` |
| `min_time_btwn_emails` | **20 min** | `POST /campaigns/{id}/schedule` (field name `min_time_btw_emails`) |
| Schedule | **Mon–Fri 09:00–17:00 America/New_York** | `POST /campaigns/{id}/schedule` |
| Status | **DRAFTED** (unchanged — sending OFF) | — |

Why tracking is OFF: open/click pixels are a bulk-mail tell and contradict the plain-text "one person texted you" design in the doc. With plain-text + no tracking, deliverability is maximized — matches the doc's "no button, no tracking redirect, no shortener" rule.

---

## API shape — confirmed live (the gotchas, for the next run)

These differ from the GET response shape and from intuition. Probed and verified before any bulk write:

1. **Sequences write** — `POST /campaigns/{id}/sequences`, body `{"sequences":[...]}`.
   - Delay field on WRITE is **`seq_delay_details.delay_in_days`** (snake_case). The GET returns it as `delayInDays` (camelCase). Sending `delayInDays` on write → `400 "delay_in_days is required"`.
   - A/B variants key on WRITE is **`seq_variants`** (array of `{subject, email_body, variant_label}`). The GET reads them back as `sequence_variants`. Sending `sequence_variants` or `variants` on write → `400 "not allowed"`.
   - When `seq_variants` is present, do NOT also send a top-level `subject`/`email_body` (→ `400 "not allowed"`). Variants drive the subject; top-level subject reads back as empty string, which is correct.
   - Success response: `{"ok":true,"data":{"sequences":[{"seqNumber":N,"id":...}]}}`.

2. **Settings write** — `POST /campaigns/{id}/settings`. **Replaces, does not merge** — send all desired keys in one call. Accepts only: `send_as_plain_text`, `stop_lead_settings`, `track_settings`. **Rejects** `max_leads_per_day`, `min_time_btwn_emails` (those are schedule fields).

3. **Schedule write** — `POST /campaigns/{id}/schedule`. **`timezone` is required.** Fields: `timezone`, `days_of_the_week` (1=Mon…5=Fri), `start_hour`/`end_hour` (`"HH:MM"`), **`min_time_btw_emails`** (note: `btw`, not `btwn`), **`max_new_leads_per_day"`**, `schedule_start_time` (null = start immediately when enabled). Reads back on the campaign object as `scheduler_cron_value` `{tz,days,startHour,endHour}` + `max_leads_per_day`/`min_time_btwn_emails`.

---

## Warmup health — readiness verdict

12 inboxes total. 1 is the warm root domain (`info@wedidit4you.com`, 25/day, do NOT cold-send from it per doc). The **11 dedicated cold inboxes** across getmysite-now.com / wdify-outreach.com / wediditforyou-biz.com / wedidit4you-mail.com / wdify-sites.com:

| Inbox | Domain | Warmup status | Reputation | SMTP/IMAP |
|---|---|---|---|---|
| brooke@getmysite-now.com | getmysite-now | ACTIVE, not blocked | 100% | OK |
| mia.dawson@getmysite-now.com | getmysite-now | ACTIVE | 99% | OK |
| claire.parker@getmysite-now.com | getmysite-now | ACTIVE | 100% | OK |
| brooke@wdify-outreach.com | wdify-outreach | ACTIVE | 100% | OK |
| kate.warren@wdify-outreach.com | wdify-outreach | ACTIVE | 100% | OK |
| sarah.coleman@wdify-outreach.com | wdify-outreach | ACTIVE | 100% | OK |
| brooke@wediditforyou-biz.com | wediditforyou-biz | ACTIVE | 100% | OK |
| jess@wediditforyou-biz.com | wediditforyou-biz | ACTIVE | 100% | OK |
| kate.spencer@wediditforyou-biz.com | wediditforyou-biz | ACTIVE | 100% | OK |
| brooke@wedidit4you-mail.com | wedidit4you-mail | ACTIVE | 100% | OK |
| brooke@wdify-sites.com | wdify-sites | ACTIVE | 97% | OK |

**Age:** created 2026-06-04 → **24 days ≈ 3.4 weeks** of warmup as of 2026-06-28.

**Per-account warmup internals (sampled):** `status: ACTIVE`, `is_warmup_blocked: false`, `warmup_reputation: 100`, `reply_rate: 38%`, ramp target `max_email_per_day: 50`, SMTP+IMAP both success.

**⚠️ One flag worth noting:** the API's `total_sent_count` reads **0** on every cold inbox. This is most likely the known Smartlead API under-reporting quirk for that field (the warmup runs on Smartlead's side; the field often stays 0 in the REST response while the dashboard shows daily warmup volume) — corroborated by `status: ACTIVE`, `is_warmup_blocked: false`, healthy SMTP/IMAP, and 97–100% reputation. **But verify in the Smartlead UI** that each inbox shows a rising daily warmup send count and inbox-placement graph. If `total_sent_count` is genuinely 0 (warmup never actually sent), the reputation numbers are meaningless and these are NOT warm — that's the one thing to eyeball in the dashboard before trusting them.

**VERDICT: NOT cleared to cold-send yet — hold ~4 more days.**
- The doc requires "~4 weeks + healthy reputation." We're at 3.4 weeks. **The 28-day mark lands 2026-07-02 (4 days out).**
- Reputation and connectivity are excellent (97–100%, SMTP/IMAP OK, none blocked), so assuming the UI confirms warmup is actually sending, these clear the **reputation** bar now and clear the **age** bar on/after 2026-07-02.
- Recommendation: keep warmup running, confirm real warmup volume in the UI this week, and don't enable sending until ~2026-07-02. Even then, ramp the cold send cap up slowly (start well under 25/day/inbox; warmup ramp target is 50/day but cold sends should layer on gently).

---

## Reply webhook spec (Smartlead → GHL handoff for WF-SL)

**Current state:** NO webhook is configured on any of the 3 campaigns (`GET /campaigns/{id}/webhooks` → `[]`). One must be created before go-live so a "send it" reply reaches GHL while intent is hot (the doc's panel blind-spot #2: reply-handling must be near-instant).

**What to configure (per campaign, or once at account level if Smartlead supports it):**
- **Endpoint:** `POST /campaigns/{id}/webhooks` (api_key in query).
- **Event type:** `EMAIL_REPLY` (the reply event). Optionally also `LEAD_CATEGORY_UPDATED` if you auto-categorize "Interested".
- **Target URL:** a **GHL inbound webhook URL** — to be created on the GHL side (do NOT invent it). In GHL: create a Workflow with an **Inbound Webhook** trigger; GHL generates the URL. That URL is what Smartlead POSTs to.
- **Webhook name:** e.g. `WDIFY-SL-reply-to-GHL`.
- **Payload:** Smartlead sends lead email, campaign id, reply subject/body, reply timestamp, sequence number, variant. The GHL workflow should: match the lead by email → upsert/find contact → add tag (e.g. `sl-replied` / `cold-phase2-replied`) → set the lead's stage to "Connected/Replied" → notify Alex's inbox so the live link goes back in minutes. Because `stop_lead_settings = REPLY_TO_AN_EMAIL`, Smartlead already auto-stops the sequence for that lead on reply — the webhook is purely to drive the GHL-side handoff/notification.

**Exact call to create it (fill in the GHL URL once it exists):**
```
POST https://server.smartlead.ai/api/v1/campaigns/{CAMPAIGN_ID}/webhooks?api_key=...
{
  "name": "WDIFY-SL-reply-to-GHL",
  "webhook_url": "<GHL_INBOUND_WEBHOOK_URL>",
  "event_types": ["EMAIL_REPLY"],
  "categories": []
}
```
(Confirm the exact field names with a probe before writing, same as we did for sequences — Smartlead's webhook create body may use `webhook_url` + `event_types`; verify the error body if it 400s.)

**Blocker to unblock:** need the GHL inbound-webhook URL (Luka/GHL side). Everything else is ready to wire the moment that URL exists.

---

## Anything that errored (and how it was resolved — all before bulk write)
1. `delayInDays` on sequence write → 400. Fixed: use `delay_in_days`.
2. `sequence_variants` / `variants` on write → 400 "not allowed". Fixed: use `seq_variants`.
3. top-level `subject` + variants together → 400. Fixed: variants only, no top-level subject.
4. `max_leads_per_day` / `min_time_btwn_emails` on `/settings` → 400 "not allowed". Fixed: those go on `/schedule`.
5. `/schedule` without `timezone` → 400 "timezone required". Fixed: full schedule object.
6. `track_settings`-only POST reset `send_as_plain_text` to false (settings POST replaces, not merges). Fixed: re-sent all settings keys in one combined call.

No bulk write was done until the shape was confirmed on a single probe. All 3 campaigns end in a verified-correct state.

---

## NOT done (by instruction — awaiting Luka's go)
- No leads loaded (all 3 at 0 leads).
- No campaign started/enabled (all 3 DRAFTED, sending OFF).
- No webhook created (spec above; needs GHL URL).
- Email accounts not yet attached to campaigns (campaign-scoped `/email-accounts` returns `[]`) — attach the cold inboxes (NOT `info@wedidit4you.com`) when you're ready to enable, after warmup clears 2026-07-02.
