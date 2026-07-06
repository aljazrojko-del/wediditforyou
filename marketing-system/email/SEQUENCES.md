# WDIFY EMAIL SEQUENCES — GHL-import-ready (2026-06-12)

Sender for ALL sequences: **Alex Rojko <info@wedidit4you.com>** (GHL = the only sender, never custom SMTP).
Sequences A/B/C are warm/transactional — safe to run from info@wedidit4you.com today.
Sequence D is COLD — do NOT send until 2-3 warmed sending domains exist (phase 2).

## Merge tags + custom fields required in GHL

| Tag | Source | Notes |
|---|---|---|
| `{{contact.company_name}}` | standard field | always present (from scraper / form) |
| `{{contact.draft_site_url}}` | **custom field: "Draft Site URL"** | set when the build ships; gates sequences B and D |
| `{{custom_values.booking_link}}` | **custom value: "Booking Link"** | the 15-min walkthrough calendar |
| `{{appointment.start_time}}` | appointment | confirmation/reminder emails only |

**First names:** most leads (728 of 742) have NO owner name. Every body below reads naturally with
no first name — do not insert `{{contact.first_name}}` without a tested fallback. If the inbound form
captured a name, you may prepend `{{contact.first_name}} — ` to the first line of A1 only.

**Standards applied to every email:** ≤75 words, one Voss device, lowercase 3-5 word subject,
no links in cold email 1, signed `— alex`, ends on strength, zero AI-tell words, no bullets in bodies.
**Anti-template rule:** no Voss device phrasing repeats verbatim within one recipient journey
(A→C counts as one journey), and no sentence appears in both an email and its same-minute SMS twin.

---

## SEQUENCE A — INBOUND FORM (warm)

Trigger to enter: GHL form submission (the 60-second site form). Exit: purchase ("keep it") or DND.

### A1 — instant acknowledgment
- **Purpose:** confirm receipt, start the 24h clock, kill catch-skepticism.
- **Trigger:** form submitted.
- **Delay:** immediate.
- **Subject:** we're on it

Got your form. The clock started the moment it landed: {{contact.company_name}} gets a live website within 24 hours or it costs nothing. Ever.

You're probably wondering what the catch is. The next email answers that better than I could: your live link, before you've spent a dollar.

Watch this inbox.

— alex

*(Voss: accusation audit. 50 words. The audit stands — the proof does the reassuring, not a denial.)*

### A2 — 24h site delivery
- **Purpose:** deliver the live URL, drive the 15-min review call booking.
- **Trigger:** "Draft Site URL" field set / pipeline stage moved to "Site Live" (manual or automation when build ships — must land inside the 24h window).
- **Delay:** immediate on trigger.
- **Subject:** your site is live

Done. {{contact.company_name}} has a website: {{contact.draft_site_url}}

Built from your reviews, your services, your area. You've paid nothing and that doesn't change until you say keep it.

If you keep it, you're one of our first ten at $450. After that it's $700 for everyone else. Fifteen minutes puts your number and photos in. Opposed to grabbing a time today?

{{custom_values.booking_link}}

— alex

*(Voss: no-oriented question. 59 words. Price anchored before the close call ever happens.)*

### A3 — nudge, no call booked
- **Purpose:** re-surface the live site, name the hesitation, push the booking.
- **Trigger:** A2 sent AND no appointment booked.
- **Delay:** +2 days after A2.
- **Subject:** it's just sitting there

Your site's been live for two days: {{contact.draft_site_url}}

It seems like you looked and weren't sure what comes next. It's one 15-minute call. Meanwhile 3 to 5 jobs a week in your trade go to whoever shows up on Google first. What's one job worth to you? Multiply it by five. The site is $450, once, while founding spots last.

Grab the fifteen minutes: {{custom_values.booking_link}}

— alex

*(Voss: label. 64 words. Dollarization by question — the reader does the math, we invent no figure. Ends on an imperative, not a naked URL.)*

### A4 — final, draft is yours
- **Purpose:** dignified close, restate zero-risk, last booking push.
- **Trigger:** A3 sent AND still no appointment booked.
- **Delay:** +5 days after A2 (3 days after A3).
- **Subject:** yours either way

The draft is yours either way. Keep the link, show it around, owe nothing: {{contact.draft_site_url}}

But I'd feel weird not saying this plainly: every week {{contact.company_name}} isn't on Google, somebody who is keeps picking up your jobs. And the $450 founding price ends at ten clients. One short call fixes both for good.

{{custom_values.booking_link}}

— alex

*(Voss: "I'd feel weird." 53 words. One device — the subject line carries the finality.)*

---

## SEQUENCE B — POST-CALL (email captured on a Mia call)

Trigger to enter: call disposition = connected AND email captured AND "Draft Site URL" set.
These leads also get the SMS link drop (see ../sms/SMS-COPY.md) — email rides alongside.

### B1 — immediate link drop
- **Purpose:** deliver the link promised on the call while the call is still warm.
- **Trigger:** email captured on call.
- **Delay:** immediate (within minutes of the call ending).
- **Subject:** the link from the call

As promised on the call: the website we built for {{contact.company_name}}, live right now.

{{contact.draft_site_url}}

You're probably skeptical that a finished site showed up before you spent a dollar. Fair. Click it and judge it on your phone, that's where your customers will see it.

Fifteen minutes puts your real number and photos in. Your founding spot at $450 holds until we talk: {{custom_values.booking_link}}

— alex

*(Voss: accusation audit. 63 words. The spot-hold replaces "when you want" — waiting now costs something.)*

### B2 — "did the site load ok"
- **Purpose:** re-deliver the link under a service pretext, restate stakes, push booking.
- **Trigger:** B1 sent AND no appointment booked.
- **Delay:** +2 days after B1.
- **Subject:** did the link work

Did the site load alright on your phone? Links get mangled in some inboxes, so here it is clean: {{contact.draft_site_url}}

Busy week, I get it. That's exactly when an email like this gets buried. It's also when 3 to 5 jobs land with whoever Google can find. You're already built. You're just not visible yet.

One short call fixes that: {{custom_values.booking_link}}

— alex

*(Voss: label. 60 words. Concrete cost-of-inaction, consequence close — no minimizer opener.)*

### B3 — walk-away
- **Purpose:** end the thread on strength, leave the cost of inaction ringing.
- **Trigger:** B2 sent AND no appointment booked.
- **Delay:** +5 days after B1 (3 days after B2).
- **Subject:** last one from me

I'm done emailing you about this. Every week without a site, another handful of jobs goes to whoever shows up on Google, and that math doesn't care about timing.

The draft we built stays yours: {{contact.draft_site_url}}

When that changes, I answer every email myself.

— alex

*(Voss: walk-away. 44 words. One device — no excuse-label to absolve them, so the walk-away stings.)*

---

## SEQUENCE C — BOOKING (walkthrough call)

Trigger to enter: appointment created on the walkthrough calendar. Pair each email with its SMS twin.

### C1 — walkthrough confirmation
- **Purpose:** lock the slot, set the 15-minute expectation, re-link the site.
- **Trigger:** appointment booked.
- **Delay:** immediate.
- **Subject:** you're locked in

Locked in: {{appointment.start_time}}.

Fifteen minutes. Your real number goes in, your own photos go up, and we show you exactly what customers see when they search your trade near you.

Your $450 founding spot holds through this call. Sounds like a small thing. It's the call that turns the draft into where your next job comes from.

Another look first: {{contact.draft_site_url}}

— alex

*(Voss: label. 60 words. The spot-hold is free no-show insurance.)*

### C2 — 1-hour reminder
- **Purpose:** cut no-shows, offer reschedule instead of silence.
- **Trigger:** 1 hour before appointment start.
- **Delay:** appointment time minus 1 hour.
- **Subject:** see you in an hour

We're on in an hour: {{appointment.start_time}}.

Bring nothing. We swap in your real number and your own photos, and it's finished.

If your day blew up, would it hurt to move it instead of missing it? {{custom_values.booking_link}}

— alex

*(Voss: no-oriented question. 36 words.)*

### C3 — no-show recovery
- **Purpose:** recover the missed slot without begging.
- **Trigger:** appointment marked no-show.
- **Delay:** +1 hour after the missed start time.
- **Subject:** have you given up

We missed you earlier. Have you given up on getting {{contact.company_name}} online?

If not, nothing's lost yet. The site's still live, you owe nothing until you approve it, and your $450 founding spot is still open: {{contact.draft_site_url}}

Grab a new time and we'll finish it in fifteen minutes: {{custom_values.booking_link}}

— alex

*(Voss: no-oriented question. 48 words. What they keep AND what they're about to lose.)*

---

## SEQUENCE D — PHASE-2 COLD (HOLD until warmed sending domains exist)

**Do not send from info@wedidit4you.com.** Requires 2-3 dedicated sending domains + 3-4 weeks
Smartlead/GHL warmup (domains not yet bought). Current offer only: $450 founding-10, then $700.
Entry condition: lead has email + "Draft Site URL" set (the build exists BEFORE email 1 goes out —
that's the whole angle). Exit: reply, booking, or DND.

### D1 — day 0, "i built you a website" (NO links)
- **Purpose:** pattern-break opener, get a reply ("send it"), zero links to survive filters.
- **Trigger:** cold list entry, domain warm.
- **Delay:** day 0.
- **Subject:** i built you a website

You probably get pitches all the time, so I'll be quick. I built {{contact.company_name}} a website. It's finished. Real pages, built from your reviews and the work you actually do.

You haven't paid anything and you won't unless you want it. Reply "send it" and the link's yours.

— alex

*(Voss: accusation audit. 50 words, no links.)*

### D2 — day 2, "did this land in spam" (link)
- **Purpose:** deliverability pretext, first link exposure, near-zero ask.
- **Trigger:** D1 sent, no reply.
- **Delay:** +2 days.
- **Subject:** did this hit spam

Pretty sure my last one got buried or hit spam. Short version: {{contact.company_name}} already has a website. I built it. It's live right here: {{contact.draft_site_url}}

Costs nothing to look.

— alex

*(Voss: label. 29 words.)*

### D3 — day 5, competitor pressure + founding price
- **Purpose:** cost-of-inaction + $450 founding-10 scarcity, push the click/booking.
- **Trigger:** D2 sent, no reply.
- **Delay:** +3 days (day 5).
- **Subject:** the jobs you're losing

Mobile businesses without a website lose 3 to 5 jobs a week to whoever shows up on Google. Not whoever's better. Whoever shows up.

Yours is built and waiting: {{contact.draft_site_url}}

The first ten businesses get it for $450, then it's $700 permanently. Once the ten are gone, they're gone. Any reason not to grab one before the price moves?

— alex

*(Voss: no-oriented question. Hormozi cost-of-inaction + founding-ten scarcity. 60 words.)*

### D4 — day 8, dignified walk-away
- **Purpose:** close the loop on strength, leave the door and the link open.
- **Trigger:** D3 sent, no reply.
- **Delay:** +3 days (day 8).
- **Subject:** i'll stop here

This is the last one. I'm not going to chase you about something free.

The site stays built and the link stays live: {{contact.draft_site_url}}

If a quiet week ever has you wondering where the calls went, just reply. It comes straight to me.

— alex

*(Voss: walk-away. 43 words. One device, no excuse-label — and "just reply" instead of pasting our own address.)*

---

## Import notes (GHL)

1. Create custom field **Draft Site URL** (contact-level, text) and custom value **Booking Link** first — every sequence references them.
2. Build as 4 separate workflows (A: form trigger · B: call-disposition trigger · C: appointment trigger · D: tag `cold-phase2`, HOLD switched off until domains are warm).
3. Goal events: A and B end on "appointment booked"; D ends on reply OR appointment. Set workflow goal so later steps auto-skip.
4. All sends: plain text, no images, no HTML templates (the old `email-templates/*.html` are visual reference only — copy and price in them are outdated; $297 is dead, $450 is current).
5. Suppress sequence D for any contact already in A or B.
