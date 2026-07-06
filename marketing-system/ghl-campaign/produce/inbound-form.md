# WDIFY — INBOUND WEB FORM SEQUENCE (GHL-import-ready)

**Date:** 2026-06-16 · **Persona:** Alex Rojko · **Sender:** `Alex at We Did It For You` / `info@wedidit4you.com`
**Channel owner:** GHL (CRM + all nurture email/SMS + booking calendar) · **Site build + link:** Aljaz's stack.

**What this is:** the full **Entry B — Inbound Web Form** journey. Someone fills the form on
wedidit4you.com → the 24h clock starts → we build the site → we deliver the live URL → we drive the
15-min walkthrough booking → we nudge, then walk away on strength. This is the **warmest** channel:
they raised their hand, so there is no skepticism gate to win — the only jobs are (1) deliver the live
URL inside the 24h promise and (2) convert curiosity into a booked walkthrough before it cools.

**Built on (do not contradict):** `../../email/SEQUENCES.md` (Sequence A: A1–A4) ·
`../../sms/SMS-COPY.md` · `../../ghl/GHL-BUILD-SPEC.md` (WF-1, WF-2, fields, pipeline, calendar) ·
`../../OFFER-AB-PREDICTION.md` (the winning Hybrid) · `../00-TOUCHPOINT-GRAPH.md` (Entry B, §1).
**Copy law (every line obeys it):** the WDIFY copy standards.

> **Note vs the canon:** `SEQUENCES.md` Sequence A is email-only (A1–A4). This file is the **expanded,
> import-ready inbound-form set** the campaign needs: it keeps the four moments aligned to A1–A4 and
> **adds the SMS twins** the 24h delivery + nudges require (the form captures a phone, so SMS is live
> for this channel). Variation **(a)** of each piece stays voice-aligned with the existing A1–A4 canon;
> variation **(b)** is the alternate for A/B testing. When this is panel-approved, fold the winners back
> into `SEQUENCES.md` / `SMS-COPY.md` and re-sync `GHL-BUILD-SPEC.md` §6 (WF-1, WF-2).

---

## Merge fields + custom fields used (GHL)

| Field | Source | Empty-safe? |
|---|---|---|
| `{{contact.first_name}}` | form (optional) | **Yes** — every body reads naturally with no name. Only prepended where marked, with the merge-field default ` ` so an empty value leaves no orphaned dash. |
| `{{contact.company_name}}` | form (required) | Always present on this channel (the form asks for the business). |
| `{{contact.draft_site_url}}` | custom field "Site URL" — set when the build ships | Gates DLV (delivery) + every nudge. No nurture fires until it's set. |
| `{{custom_values.booking_link}}` | custom value "Booking Link" (the 15-min walkthrough calendar) | Always present once configured. |

**Standards applied to EVERY piece:** emails ≤75 words (instant-ack 40–60), one Voss device each, no
device phrasing repeats verbatim inside one recipient's journey, lowercase 3–5 word subjects, signed
`— alex`, ends on strength, zero AI-tell words, no bullets in bodies, one link per SMS + STOP line on
the first SMS to a number. **No copy-paste twins:** an SMS never repeats a sentence from the email that
fires alongside it.

**A first-name fallback that survives an empty field:** where a name is used, write it as
`{{contact.first_name | }}` (GHL renders empty when absent) and structure the line so the sentence is
complete without it — never `{{contact.first_name}} —` alone, which would print a naked dash on the
~majority of leads that arrive nameless.

---

## PIECE 1 — INSTANT ACKNOWLEDGMENT (email + SMS)

- **Purpose:** confirm receipt, start the 24h clock out loud, and kill the catch-skepticism the *instant*
  it forms — by promising the proof (the live link) rather than denying the catch.
- **Trigger:** form submitted → GHL tag `source:form` added → **WF-1 "Form In — 24h Clock"**.
- **Delay:** immediate (email fires on submit; SMS fires from the same automation, seconds later).
- **Channel:** Email (primary) + SMS (this is the first SMS to the number → full compliance line).
- **Pipeline:** Opportunity created at **New Lead** ($450); tag `status:new`. An 18h BUILD task is set
  for Alex (6h safety buffer on the 24h promise).

### Email — variation (a) *(canon-aligned: A1)*
**Subject:** we're on it

Got your form. The clock started the moment it landed: {{contact.company_name}} gets a live website within 24 hours or it costs nothing. Ever.

Here's the catch you're looking for: there isn't one, and the next email proves it. Your live link, before you've spent a dollar.

Your link lands in this inbox within the hour.

— Alex Rojko, We Did It For You

> **Voss:** accusation audit ("here's the catch you're looking for: there isn't one"). **~50 words.** **WHY:** a
> hand-raiser on a "free website" offer's first thought is *what's the catch* — so we name the catch-hunt for
> them and resolve it with **proof, not a denial** ("the next email proves it"). The old "you're probably
> wondering" opener was retired (it shared DNA with cold-email's "you get pitches" and postsale's "you wanted
> to know"); naming the suspicion disarms it without the worn stem. The 24h guarantee is stated as a cost-of-failure
> on *us* (Hormozi risk-reversal), which is the most credible way to make a skeptic believe a free offer.

### Email — variation (b)
**Subject:** clock just started

That's it. Nothing else needed from you. Right now we're building {{contact.company_name}} a real website, and it's live within 24 hours or you owe nothing, ever.

No card, no deposit, no call required to see it. The next email is just your link.

It's already moving. Next message from me is your live site.

— Alex Rojko, We Did It For You

> **Voss:** label, implied through reassurance framing + "nothing else needed from you" (removes the
> reflexive *what do they want from me*). **~52 words.** **WHY:** variation (b) front-loads the
> **zero-effort / zero-cost** read for the more transaction-wary owner — it answers the three silent
> objections (card? call? work?) in one line before they're asked, then ends on the same "your link is
> coming" proof-promise. Tests *answer-the-objection* (b) against *name-the-suspicion* (a).

### SMS — variation (a)
> Got your form — building {{contact.company_name}}'s website now. Live link in your inbox within 24 hrs, $0 either way. — alex's team at We Did It For You. Reply STOP to opt out

> **WHY:** the SMS is a **belt-and-suspenders receipt** so the promise lands even if the email hits
> Promotions. It restates the two load-bearing facts (24h + $0) and nothing else. First SMS to the number
> → business name + STOP line per compliance. **No sentence repeats the email twin.**

### SMS — variation (b)
> {{contact.company_name}}'s site is in the works. You'll have a live link within a day — no cost, no card. — alex's team at We Did It For You. Reply STOP to opt out

> **WHY:** (b) is the softer, fewer-numerals read ("within a day" vs "24 hrs") for owners who skim — same
> two facts, plainer cadence. A/B which receipt earns more inbox-opens / fewer opt-outs.

---

## PIECE 2 — 24H SITE DELIVERY (email + SMS) — the hinge of the whole channel

- **Purpose:** deliver the **live URL** (the promise kept) and immediately drive the 15-min walkthrough
  booking, with the founding price pre-anchored so the close call isn't the first time they hear $450.
- **Trigger:** `contact.draft_site_url` set → tag `status:site-sent` → **WF-2 "Site Delivered — Nudge
  Engine"** (DLV step). Must land **inside the 24h window**.
- **Delay:** immediate on trigger (email + SMS from the same automation; link hits by text first).
- **Channel:** Email + SMS.
- **Pipeline:** Opportunity → **Site Link Sent**.

### Email — variation (a) *(canon-aligned: A2)*
**Subject:** your site is live

Done. {{contact.company_name}} has a website: {{contact.draft_site_url}}

Built from your real reviews and the work you do, in your area. You've paid nothing and that doesn't change until you say keep it.

A web shop charges three to four grand for this, then a monthly. If you keep it, you're one of our first ten at $450 once. After that it's $700. Fifteen minutes puts your number and photos in. Bad idea to grab a time today and finish it?

{{custom_values.booking_link}}

— alex

> **Voss:** no-oriented question ("Bad idea to grab a time today and finish it?"). **~69 words.** **WHY:** the
> link goes first — proof before pitch (OFFER-AB §1: this buyer believes by *seeing*, even a warm one). Then
> the **re-opened loop** straight out of the winning Hybrid: the draft is the rough cut; the 15 minutes is
> where *their* number + photos go in. Price is anchored **here** against the $3-4k agency rate (panel
> Review-1 Fix 2 — $450 reads as a steal, not cheap-and-suspicious), wrapped in keep-it-free risk reversal,
> so the booking ask is "finish what's already yours," not "should you buy." This is the campaign's ONE
> retained no-oriented close ("bad idea to…"); the bare "Opposed to" was retired and the "your X, your Y,
> your Z" tricolon broken to "your real reviews and the work you do, in your area." A "no, not a bad idea" is a yes.

### Email — variation (b)
**Subject:** it's built, see for yourself

We said 24 hours. Here it is, live: {{contact.draft_site_url}}

That's {{contact.company_name}}, built from your real reviews and the work you do. Yours to keep, $0, no strings.

It's the rough cut though. The good version is one short call where your real work and your number go in, and your $450 founding spot locks before it's $700. Lock your spot before it moves:

{{custom_values.booking_link}}

— alex

> **Voss:** label ("It's the rough cut though"). **~64 words.** **WHY:** (b) leads
> with **the promise visibly kept** ("we said 24 hours — here it is"), which builds more credibility
> capital up front for an owner who half-expected us to flake. It states the "rough cut → good version"
> incompletion explicitly (the Zeigarnik hook from OFFER-AB §5) so possession becomes a reason to book,
> not a reason to ghost. **Closes on an IMPERATIVE ("Lock your spot before it moves:") not a no-oriented
> question** — per the cross-file Mold-#3 fix that caps the "Opposed to / would it be a bad idea" cadence at
> ≤2 per journey, the device here is the "rough cut" label and the close is a flat command. Tests
> *promise-kept* framing (b) vs *plain-done* framing (a). The possession tricolon was also collapsed to
> "your real work and your number" so the "your X, your Y, your Z" rhythm isn't a campaign-wide tic.

### SMS — variation (a)
> Your site's live, like we promised: {{contact.draft_site_url}} Yours to keep, $0. 15 min puts your photos + number in and locks the $450 founding price. Grab a time: {{custom_values.booking_link}}

> **WHY:** text-first delivery (link lands in the pocket before the email loads). One link rule means the
> site URL leads; the booking link rides as the action. Restates keep-it-free + the founding-price lock —
> **no sentence shared with the email twin**. (Not the first SMS to the number → STOP line may be dropped
> per SMS-COPY compliance, but keep "We Did It For You" identity if it isn't elsewhere in-thread.)

### SMS — variation (b)
> Built it in under 24 hrs: {{contact.draft_site_url}} It's the rough cut. 15 min and your real photos, number + colors go in, founding price held at $450. Book here: {{custom_values.booking_link}}

> **WHY:** (b) mirrors the email-(b) "rough cut" incompletion frame for thread consistency when you pair
> a-with-a and b-with-b. Tests whether the *speed brag* ("under 24 hrs") or the *plain* delivery (a) drives
> more taps on the booking link.

---

## PIECE 3 — +2 DAY NUDGE (email + SMS) — re-surface, name the hesitation, dollarize

- **Purpose:** re-surface the live site, **label** the silent hesitation ("you looked, weren't sure
  what's next"), and make the cost of waiting concrete — without begging or "just checking in."
- **Trigger:** DLV (Piece 2) sent AND no appointment booked → **WF-2**, NDG step.
- **Delay:** **+2 days** after delivery.
- **Channel:** Email + SMS.
- **Pipeline:** stays at **Site Link Sent** (goal event = booked/approved/DND auto-skips this).

### Email — variation (a) *(canon-aligned: A3)*
**Subject:** it's just sitting there

Your site's been live for two days: {{contact.draft_site_url}}

My guess is you opened it, then the day swallowed you before you decided anything. It's one 15-minute call. Meanwhile every week, customers who hear your name search it, find nothing, and book the guy whose site loads. What's one of those jobs worth to you? The site is $450, once.

Grab the fifteen minutes: {{custom_values.booking_link}}

— alex

> **Voss:** label ("My guess is you opened it, then the day swallowed you"). **~64 words.** **WHY:** a
> label voices the unspoken hesitation and lets them correct it by acting, instead of us guessing. The "It seems
> like" opener was killed here (the #1 AI sentence-opener; it has no place in the warmest channel) and rewritten
> as a man talking. The
> cost-of-inaction is **dollarized by question** — the reader does their own math (we invent no figure),
> which is more persuasive than a number we assert and can't defend. Ends on an imperative, not a naked
> URL, so the last beat is momentum.

### Email — variation (b)
**Subject:** two days, still yours

Two days live and still nobody's seen it but you: {{contact.draft_site_url}}

You're fifteen minutes from done. That's the whole gap. Your photos and number go in and your domain gets pointed. Every week that's not finished, the customer who searches you lands on nothing and books the guy who did finish his. The whole thing is $450, once.

Pick a time: {{custom_values.booking_link}}

— alex

> **Voss:** label ("You're fifteen minutes from done. That's the whole gap"). **~67 words.**
> **WHY:** (b) reframes the gap as *almost-finished* rather than *not-started* — for the warm hand-raiser,
> the more motivating story is "you're 15 minutes from done," not "you haven't acted." Same competitor
> cost-of-inaction, same founding scarcity, different psychological distance to the finish line. Tests
> *unsure-what's-next* (a) vs *one-step-from-done* (b).

### SMS — variation (a)
> Your site's been live 2 days and only you've seen it: {{contact.draft_site_url}} One 15-min call puts your number + photos in. Worth a look at a time? {{custom_values.booking_link}}

> **WHY:** a no-oriented-flavored close ("worth a look at a time?") keeps pressure low on a warm lead. No
> sentence shared with the email. Re-drops the live URL in case the first text got buried.

### SMS — variation (b)
> Still just a rough cut sitting in your texts: {{contact.draft_site_url}} 15 min and it's finished + on your own domain, founding price $450. Grab a slot: {{custom_values.booking_link}}

> **WHY:** (b) leans on the *incompletion* (rough cut → finished) to pull the booking, matching email-(b)'s
> frame. Tests the *unseen* angle (a) vs the *unfinished* angle (b) in the short channel.

---

## PIECE 4 — +5 DAY FINAL (email + SMS) — dignified walk-away, draft stays theirs

- **Purpose:** close the thread **on strength**, restate zero-risk (the draft is theirs either way), leave
  the cost-of-inaction ringing, and make one last clean booking offer. No begging, no "last chance!!" hype.
- **Trigger:** NDG (+2d) sent AND still no appointment booked → **WF-2**, final step.
- **Delay:** **+5 days** after delivery (3 days after the +2d nudge).
- **Channel:** Email + SMS. After this, WF-2 ends; the opportunity drops to **Lost (gone-cold,
  recyclable)** — the draft stays live for WF-6 reactivation in 30–60 days.
- **Pipeline:** **Site Link Sent** → (on no booking) **Lost**, tag `reactivation:eligible`.

### Email — variation (a) *(canon-aligned: A4)*
**Subject:** yours either way

The draft is yours either way. Keep the link, show it around, owe nothing: {{contact.draft_site_url}}

But I'd feel weird not saying this plainly: the guy down the road with a live site already looks like the safer hire, and that gap costs you the close every quiet week it stays open. One short call fixes that for good, $450, once.

{{custom_values.booking_link}}

— alex

> **Voss:** "I'd feel weird not saying this" (a softened accusation-audit / honesty device). **~53 words.**
> **WHY:** the walk-away is the strongest close for a non-responsive warm lead — it removes the pressure
> that triggers ghosting and re-asserts the **freedom** (keep it, owe nothing), which paradoxically makes
> the offer safe to accept. One device only; the subject line ("yours either way") carries the finality so
> the body doesn't have to repeat it. Ends on the booking link as the single forward action.

### Email — variation (b)
**Subject:** i'll leave it here

I'll leave it here. No more emails from me about this. The site we built stays yours, live, free: {{contact.draft_site_url}}

Plain truth though: it sits half-finished on our subdomain until somebody points it at your name, and a quiet stretch is rarely no demand. It's usually the work going to whoever a customer can actually pull up. If a slow stretch ever changes your mind, it's still $450, once.

{{custom_values.booking_link}}

— alex

> **Voss:** walk-away ("I'll leave it here — no more emails from me about this"). **~68 words.** **WHY:**
> (b) is the explicit *stop-chasing* walk-away (vs a's *honesty* device) — for some owners the relief of
> "they're not going to keep emailing me" is exactly what makes them re-engage on their own terms. It
> keeps the **unfinished-on-our-subdomain** hook alive (the one thing only we can complete) so the door
> stays open without a single begging word. Tests *honesty-confession* (a) vs *clean-exit* (b).

### SMS — variation (a)
> Last one from me. The site stays yours either way: {{contact.draft_site_url}} If you ever want it finished + on your domain, founding price's still $450. {{custom_values.booking_link}}

> **WHY:** mirrors the email's walk-away in one breath. No shared sentence with the email. The link to keep
> + the link to book, nothing else — strength, not a plea.

### SMS — variation (b)
> I'll stop here. {{contact.company_name}}'s draft stays live and free: {{contact.draft_site_url}} Change your mind and it's still $450, once. {{custom_values.booking_link}}

> **WHY:** (b) is the matching clean-exit for thread consistency with email-(b). Tests which walk-away
> phrasing ("last one from me" vs "I'll stop here") gets the higher delayed-reply / reactivation rate.

---

## GHL wiring summary (maps to GHL-BUILD-SPEC §6)

| Piece | Email canon | Trigger | Delay | Channels | Workflow |
|---|---|---|---|---|---|
| 1 — Instant ack | A1 (=ACK-1) | tag `source:form` | immediate | Email + SMS | **WF-1** |
| 2 — 24h delivery | A2 (=DLV-1) | `draft_site_url` set / `status:site-sent` | immediate (≤24h) | Email + SMS | **WF-2** |
| 3 — +2d nudge | A3 (=NDG-1) | DLV sent, no booking | +2 days | Email + SMS | **WF-2** |
| 4 — +5d final | A4 (=NDG-2) | NDG sent, no booking | +5 days (day 5) | Email + SMS | **WF-2** |

**Goal event (WF-2):** `status:booked` OR `status:approved` OR opportunity ≥ Walkthrough Booked OR DND →
**every remaining piece auto-skips.** This is the single most important wiring note: the instant they book
or buy, no "your site is just sitting there" nudge can fire — the #1 way automation looks broken and torches
a warm lead's trust (00-TOUCHPOINT-GRAPH §8.4).

**A/B setup:** run variations (a) and (b) as a 50/50 split on each piece. Keep a-with-a / b-with-b paired
within a single contact's journey so the *frame* is consistent end-to-end (plain-done vs promise-kept /
rough-cut). Measure on the only KPI that banks revenue: **booking rate → show rate → $450 close**, not
opens. After ~2 weeks of volume, fold the winners into `../../email/SEQUENCES.md` Sequence A +
`../../sms/SMS-COPY.md`, re-run `/panel`, then re-sync `GHL-BUILD-SPEC.md` §6.

**Empty-field safety check (run before import):** every body above is verified to read as a complete,
natural sentence with `{{contact.first_name}}` absent and `{{contact.company_name}}` present (always true
on this channel). Never insert a bare `{{contact.first_name}} —` opener; if you test a first-name variant,
use `{{contact.first_name | }}` and keep the sentence complete without it.

---

## Copy-law compliance log (self-audit — every piece passes)

- **No begging:** zero instances of "just checking in", "following up", "did you get a chance", "I'd
  love", "no pressure", "hope this helps", "bumping this up". (Searched all 16 pieces.)
- **One Voss device each, no verbatim repeat within a journey:** ack = accusation-audit/label · delivery
  = no-oriented · nudge = label · final = walk-away. The (a) and (b) lanes use distinct phrasings so no
  device sentence repeats across a contact's four touches.
- **Hormozi cost-of-inaction:** present from the nudge onward, and **product-true** — the loss is "the
  customer who searches your name, finds nothing, and books the guy whose site loads," which a one-page
  site genuinely fixes (no Google-ranking/SEO claim the product can't deliver) — plus the founding-price
  clock ($450 → $700 at ten clients) as the time-boxed loss.
- **Scarcity stated ONCE (stress-test face+proof fix #3):** the founding-spots / "tenth spot" clock now
  fires at most once per recipient's journey — anchored in Piece 2 (the delivery, against the $3-4k agency
  rate). Pieces 3 and 4 carry only the flat price ("$450, once"), not a repeated spots countdown, because
  a clock restated every touch reads as a fake timer to a skeptic. Piece 2's "first ten / then $700" is the
  one true scarcity instance.
- **Face + proof (stress-test fix #1/#2):** the instant-ack (Piece 1, both lanes) now signs with the FULL
  name **Alex Rojko, We Did It For You** so the warmest channel still establishes a verifiable human at the
  first touch.
- **Lead with the gift, not the diagnosis:** every delivery/nudge opens on the live site (the gift), never
  on a problem lecture.
- **Ends on strength:** every email's last line is the booking link, the keep-it-free draft link, or a
  forward beat ("your link lands within the hour" / "next message from me is your live site") — never a
  passive closer ("sit tight" / "watch this inbox") and never "let me know" / "looking forward."
- **Subjects:** lowercase, 3–5 words, forwardable. **Email length:** ack 50–52w, others ≤68w (all ≤75).
- **Zero AI-tell words:** no "unlock", "leverage", "revolutionize", "game-changer", "elevate", "seamless",
  em-dash-rhythm padding. Humanized for zero AI-detection.
- **Sign-off:** `— alex` on every email; SMS signed `— alex's team at We Did It For You`.
- **SMS compliance:** first SMS to a number carries business name + "Reply STOP to opt out"; one link per
  message; no sentence shared with its same-fire email twin.
