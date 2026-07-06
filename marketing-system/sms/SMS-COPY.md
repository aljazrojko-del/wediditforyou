# WDIFY SMS COPY — GHL/LC-ready (2026-06-12)

Channel: GHL/LC SMS (or SignalWire) — sent AFTER a call connects (B2B numbers). The post-call
link drop is the killer move: the prospect just heard "I'll text you the link" and the site lands
in their pocket while Mia's voice is still in their ear.

## Merge tags required

| Tag | Source |
|---|---|
| `{{contact.company_name}}` | standard field |
| `{{contact.draft_site_url}}` | custom field "Draft Site URL" |
| `{{custom_values.booking_link}}` | custom value "Booking Link" |
| `{{appointment.start_time}}` | appointment |

## Compliance (non-negotiable)

1. **First SMS to any number includes the business name** ("We Did It For You") and **"Reply STOP to opt out"**.
2. **STOP is honored immediately** — GHL DND auto-flags on STOP; never override, never re-message.
3. Send window: 9am–6pm recipient local time, matching calling hours.
4. One link per message (carrier filtering). Never shorten links with public shorteners.
5. These go to business numbers after a live connect — not cold blasts.
6. **No copy-paste twins:** an SMS never repeats a sentence from the email that fires alongside it (the C1/SMS-3, C2/SMS-4, C3/SMS-5 pairs are deliberately worded apart).

---

## SMS-1 — Post-call link drop (standard)
- **Trigger:** call disposition = connected, "send the link" agreed on call.
- **Delay:** immediate (within 2 minutes of hang-up).
- **First SMS to this number → full compliance line.**

Here's your site, like we said on the call: {{contact.draft_site_url}} Keep it or toss it, $0 either way. — alex's team at We Did It For You. Reply STOP to opt out

*(~140 chars + URL, 2 segments. Freedom device: keep it or toss it.)*

## SMS-2 — Post-call link drop (spec-build owner variant)
- **Use for:** Elite Mobile Tire & Brake and Buddy's Mobile Spa (Lubbock) — sites already shipped before the first call. Any future pre-built spec lead uses this too.
- **Trigger:** the first-call connect with a spec-build owner.
- **Delay:** immediate.

{{contact.company_name}}'s site is already live. We built it before we ever called: {{contact.draft_site_url}} — alex's team at We Did It For You. Yours to keep or toss. Reply STOP to opt out

*(~160 chars + merge fields, 2 segments.)*

## SMS-3 — Walkthrough booking confirmation
- **Trigger:** appointment booked on the walkthrough calendar.
- **Delay:** immediate.

You're on the books for {{appointment.start_time}}. 15 min and the site's yours for real. Miss it and it stays a draft. — alex's team at We Did It For You. Reply STOP to opt out

*(Keep the compliance line if this is the first SMS to the number; otherwise it may be dropped.)*

## SMS-4 — 1-hour walkthrough reminder
- **Trigger:** 1 hour before appointment start.
- **Delay:** appointment time minus 1 hour.

One hour out: {{appointment.start_time}}. Won't take long. Day blew up? Is it crazy to move it instead? {{custom_values.booking_link}} — alex's team

## SMS-5 — No-show recovery
- **Trigger:** appointment marked no-show.
- **Delay:** +1 hour after the missed start time.

We missed you. No harm. The site's not going anywhere, you owe nothing, and your $450 founding spot is still open. New time: {{custom_values.booking_link}} — alex's team

---

## Wiring notes

- SMS-1/SMS-2 fire from the same automation that drops email B1 (when an email was captured) — link hits by text first, email seconds later.
- After SMS-1/SMS-2, move the contact to pipeline stage "Link Delivered". Booking moves them to "Walkthrough Booked".
- STOP reply → GHL DND → also tag `sms-optout` so Mia's recall queue and sequence D suppress the contact everywhere, not just SMS.
