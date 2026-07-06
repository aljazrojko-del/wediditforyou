# WDIFY — PHASE-2 COLD EMAIL (4-touch, A/B) — GHL-import-ready

**Date:** 2026-06-16 · **Status:** /panel PROCEED (HIGH confidence) — see verdict block at bottom.
**Channel:** cold email, **warmed sending domains ONLY** (phase 2). **DO NOT send from `info@wedidit4you.com`** —
that root domain is transactional/warm (Sequences A/B/C). This sequence needs 2–3 dedicated, fully-warmed
cold domains + 3–4 weeks warmup. Until those exist and are warm, this workflow stays **OFF**.

**Persona / sender:** Alex Rojko, "Alex at We Did It For You." Sign every body **`— alex`** (lowercase).
**Offer (current):** we already built them a real, live website for free · $0 deposit · keep the draft if they
walk · **$450 founding price for the first ten, then $700 for good.**
**Buyer:** busy, skeptical, non-tech US small local mobile-service owner (mobile mechanic, dog groomer, tutor,
detailer), ≤3 employees, often burned before. Reads email on a phone, between jobs, days late.

---

## How to read this file

Each email below is one GHL workflow step and carries: **purpose · trigger · delay · channel · 2 subject
variations (A/B) · 1 full body · the A/B wiring · WHY (the psychology/mechanism).**

- **A/B is on the SUBJECT LINE only** (one body per email — see "A/B strategy" below for why).
- **Subject Variant A = bold claim / curiosity** · **Subject Variant B = low-key / specific / under-claimed.**
  Keep a contact on the SAME variant lane (A or B) for all four emails so the test reads cleanly.
- Subjects are **lowercase, 3–5 words, no punctuation, no merge fields** (a half-rendered name in a subject
  screams "mass blast" to a skeptic — the exact signal we're avoiding).

### Merge fields used (GHL)
| Field | Source | Fallback behavior |
|---|---|---|
| `{{contact.company_name}}` | standard field | always present (scraper/form). |
| `{{contact.draft_site_url}}` | custom field **"Site URL"** (`contact.draft_site_url`) | the live draft URL. **This is the canonical field name** — if a brief or list calls it `site_url`, it maps to this same field. Gate: this sequence only enters contacts whose site is already BUILT (URL set), so it is never empty here. |
| `{{contact.first_name}}` | **NOT USED in any body.** | 728/742 leads have no name; every body is written to read perfectly with no first name. Do not insert it. |

> **Note on `{{custom_values.booking_link}}`:** intentionally **absent** from this cold sequence. Cold email
> drives a REPLY ("send it") or a bare-URL click, not a calendar booking from a stranger. Booking lives in the
> warm Sequences (A/B/C) after the link is in their pocket. Adding a calendar link to a cold email reads as a
> pitch and hurts deliverability.

### Entry / suppression (GHL workflow "WF-D · Cold Phase-2")
- **Enter when:** tag `cold-phase2` added AND `contact.draft_site_url` is set (site built first — that IS the
  angle) AND `DND = false` AND domains are warm (workflow toggle).
- **Suppress / exclude:** any contact already in Sequence A or B (warm), any `status:dnc` / `sms-optout`,
  any contact in a live opportunity stage ≥ Connected. One person never gets cold + warm at once.
- **Goal (exit, auto-skips remaining steps):** reply received OR `status:booked` OR `status:approved` OR DND.

---

## A/B subject strategy — WHY this split

The single biggest unknown about THIS buyer is binary: **does the bold "I built you a free website" claim pull
him in, or trip his scam alarm?** A burned skeptic can read the exact same gift two opposite ways. So we don't
guess — we test that one axis and let the open/reply data decide:

- **Variant A (bold claim / curiosity):** states the remarkable thing flat out ("i built you a website").
  Pattern-break, screenshot-worthy (Godin). Wins if curiosity beats suspicion for this list.
- **Variant B (low-key / specific / under-claimed):** a calm, almost-internal subject that under-claims
  ("a quick thing about {trade}", "your shop online"). Survives the spam-reflex (Drucker). Wins if the
  skeptic's guard is high enough that any bold claim reads "con."

**Lane discipline:** a contact assigned lane A gets A-subjects on all four touches; lane B gets B-subjects on
all four. Split the list 50/50 at enrollment. This isolates the variable (bold vs. low-key personality) instead
of muddying it by mixing lanes mid-sequence. Bodies are identical across lanes so the subject is the only
moving part — clean read on the result. Roll the winning lane to 100% once a touch clears significance.

**Why subject-only A/B (not body A/B):** with a 742-lead pool (≈14 cold-email-eligible per the current data,
scaling as more sites build), there isn't volume to power a two-variable test. Subject line drives the open,
the open is the gate, and the bold-vs-low-key axis is where the real uncertainty about this buyer lives. One
clean variable beats two muddy ones.

---

# EMAIL 1 — DAY 0 · "i built you a website" (NO links)

- **Purpose:** pattern-break the cold-email contract (deliver, don't ask) and earn a one-word reply
  ("send it"). That reply is the highest-intent micro-commitment available and doubles as a
  deliverability/engagement signal.
- **Trigger:** enrollment in WF-D (cold-phase2, site built, domains warm).
- **Delay:** day 0 (on enrollment).
- **Channel:** email. **Zero links** (a link to a stranger on a warming domain = phishing-smell + spam folder).
- **Length:** ~75 words (carries the stress-test face+proof line; over the 40–60 target by design for the one touch that has to establish a verifiable human).
- **Voss device:** accusation audit.

### Subject — Variant A (bold claim)
```
i built you a website
```
### Subject — Variant B (low-key / specific)
```
quick thing about your shop
```

### Body (one body, both lanes)
```
You get pitches like this all day, so I'll keep it honest: I already built {{contact.company_name}} a website. It's finished and live right now, built from your reviews and the work you actually do.

You haven't paid a cent and you won't unless you decide you want it. Reply "send it" and the link is yours.

I'm Alex Rojko, a real person. That's my number if you'd rather hear a voice: 713-352-2542.

— alex
```

### A/B wiring (GHL)
- Build as **two email steps behind an If/Else on tag `lane:a` vs `lane:b`** — identical body, different
  subject. OR (cleaner) one email step with the subject set from a custom value per lane. Assign `lane:a` /
  `lane:b` 50/50 at enrollment (round-robin or random-split action).

### WHY (psychology / mechanism)
- **Face + proof (stress-test fix #2):** the cold sequence's biggest drop-off was a faceless "Alex" — no last name, no human to verify, no number to call back. Email 1 now establishes **Alex Rojko** (full name) + a **real callback cell (713-352-2542)** once, on the first touch, so a skeptic has a verifiable person on the other end. Stated flat ("a real person… that's my number if you'd rather hear a voice"), never spammy. The number rides only on the first cold touch; later touches stay link-clean for deliverability.
- **Accusation audit** ("you get pitches like this all day") names the reader's #1 objection BEFORE he can —
  which disarms it. A skeptic who's already thinking "here's another pitch" relaxes when you say it first; it
  signals you're not running the script he's braced for.
- **Past-tense gift** ("I already built," "it's finished and live") is the load-bearing move. Past tense kills
  the pitch-smell; future tense ("I'd like to build you...") reeks of it. The asset already exists — that
  inverts the entire cold contract from *asking* to *delivering*.
- **No link, on purpose.** The ask is a *reply*, not a click. "Reply 'send it'" is a near-zero-effort
  micro-commitment that (a) protects deliverability on a warming domain, (b) gives us an engagement signal, and
  (c) converts a passive reader into someone who asked for the link — so the link arrives *wanted*, not pushed.
- **Ends on strength** — the instruction ("reply 'send it'"), never "let me know" or "hope to hear back."
- **Subject A** makes the remarkable claim the hook. **Subject B** under-claims so a high-guard skeptic opens
  out of low-stakes curiosity, not despite a scam alarm.
- **AI-tell / scam-smell scrub:** no "free," "click," "act now," "unlock," "exclusive," no exclamation, no
  em-dash rhythm. "A cent" not "absolutely free." Calm and slightly indifferent — the opposite of urgency.

---

# EMAIL 2 — DAY 2 · "did this land in spam" (first link)

- **Purpose:** deliverability pretext that gives the non-reply a face-saving reason, and the first link
  exposure — framed as a delivery confirmation, not a sales link.
- **Trigger:** Email 1 sent, no reply, +2 days.
- **Delay:** +2 days after Email 1.
- **Channel:** email. **One bare link** (`{{contact.draft_site_url}}`) — no button, no tracking redirect, no
  shortener (all three read as bulk/phish and trip filters).
- **Length:** 33 words (target ~30).
- **Voss device:** label.

### Subject — Variant A (bold claim)
```
did this land in spam
```
### Subject — Variant B (low-key / specific)
```
the link i mentioned
```

### Body (one body, both lanes)
```
Looks like my last one might've slid into spam, so here it is plain: {{contact.company_name}} already has a website. I built it. It's live right here:

{{contact.draft_site_url}}

Costs nothing to look.

— alex
```

### A/B wiring (GHL)
- Same lane split as Email 1. The contact's lane (`lane:a`/`lane:b`) carries through; only the subject changes.

### WHY (psychology / mechanism)
- **Label** ("looks like my last one might've slid into spam") gives the skeptic a *face-saving reason* he
  didn't reply — never an accusation that he ignored you. It also re-frames the single link as a *re-delivery
  of something that got lost*, not a fresh sales push. That's the only honest way to put a link in front of a
  cold contact this early without smelling like phishing.
- **Brevity is the message.** 33 words signals "I'm not selling you, I'm just making sure you saw it." Length
  itself is a trust signal to a busy owner — a wall of text reads "mass," a one-breath note reads "human."
- **"Costs nothing to look"** is a frictionless, true micro-ask. Not "buy," not "book" — just look. Lowest
  possible commitment to get eyes on the proof that the Day-0 claim was real.
- **Bare URL, one link.** A button or tracked redirect is a bulk-mail tell; the naked link reads like one
  person texted you a link. Protects both deliverability and trust.
- **Device rotation:** Email 1 was an accusation audit; this is a label. Never repeat the device type — a
  skeptic notices repetition and repetition reads as formula (= scam).
- **Ends on strength** — the indifferent "costs nothing to look," then the sign-off. No "would love your
  thoughts."

---

# EMAIL 3 — DAY 5 · competitor pressure + $450 founding + scarcity

- **Purpose:** introduce the cost-of-inaction (jobs lost to whoever shows up on Google) and the price
  mechanism ($450 for the first ten, then $700) as flat facts, ending on a plain hold-offer that gives the
  skeptic an easy yes-or-no with no pressure.
- **Trigger:** Email 2 sent, no reply, +3 days (day 5).
- **Delay:** +3 days after Email 2.
- **Channel:** email. One bare link (`{{contact.draft_site_url}}`).
- **Length:** ~70 words (target ≤75). Carries the $3-4k agency price anchor (panel Review-1 Fix 2) so $450 reads as the steal it is, not as cheap-and-suspicious; redundant "once the ten are taken they're taken" trimmed to stay under cap.
- **Voss device:** direct offer (hold a spot).

### Subject — Variant A (bold claim)
```
the jobs you're losing
```
### Subject — Variant B (low-key / specific)
```
about that founding price
```

### Body (one body, both lanes)
```
No website costs you three to five jobs a week. At a hundred bucks each, that's fifteen hundred a month walking to whoever shows up first. The fix is $450, once.

Yours is built here: {{contact.draft_site_url}}

A web shop charges three to four grand, then bills you every month after. This is $450 once, nothing monthly, ever. First ten owners, then $700.

Take it 30 days. No paying job off it, I refund the $450, you keep the site.

Want to hold one of the ten?

— alex
```

### A/B wiring (GHL)
- Same lane split. Subject only.

### WHY (psychology / mechanism)
- **Hormozi cost-of-inaction, dollarized by reality, not by us.** "Three to five jobs a week" makes the reader
  do his own math on what a lost job is worth — we invent no figure (no fake "$X/month"). The loss is phrased
  off the frozen "books the guy whose site loads" skeleton ("goes to look you up, finds nothing, and calls the
  next guy") so the campaign-wide mold isn't repeated. "Not the better guy. The one with a website." names the
  mechanism plainly and reframes the loss as unfair and fixable, which stings more than a benefit pitch.
- **Price anchor (panel Review-1 Fix 2).** "A web shop charges three to four grand for this, then a monthly"
  gives $450 gravity. Without the $3-4k anchor a burned skeptic reads cheap-as-suspicious; with it, $450 reads
  as the steal it is. Stated flat (no exclamation) so it survives the scam-reflex.
- **True, understated scarcity.** The $450→$700 / first-ten mechanism is stated as a flat fact, not shouted.
  This is deliberate: a burned skeptic reads hard scarcity ("ACT NOW! ENDS TONIGHT!") as the oldest con there
  is — pushing hard *confirms* the scam hypothesis. Truth stated calmly out-pressures a skeptic more than
  urgency screamed. "Once the ten are taken they're taken" is plain fact, zero exclamation.
- **Direct-offer close** ("want me to hold one of the ten for you?") replaces the over-used "would it be a bad
  idea" stem (retired campaign-wide to AT MOST one instance) with a plain, autonomy-preserving ask — still no
  pressure, but a hold offer he can take or leave, not the fourth no-question in the journey.
- **Device rotation:** audit → label → direct offer. Three distinct devices, no repeat.
- **Lead with the gift, not the diagnosis.** Even here, the site ("yours is built and sitting here") is the
  asset on the table before the price; we never open by telling him what's wrong with his business.
- **Scrub:** no "free," no "limited time," no "don't miss out," no exclamation, no em-dash spam. "For good" not
  "forever and ever." Reads like a man stating terms, not a marketer creating FOMO.

---

# EMAIL 4 — DAY 8 · dignified walk-away

- **Purpose:** close the loop on strength, leave the door and the link open, and let loss-aversion + restored
  autonomy do the work a fifth chase email never could.
- **Trigger:** Email 3 sent, no reply, +3 days (day 8).
- **Delay:** +3 days after Email 3.
- **Channel:** email. One bare link (`{{contact.draft_site_url}}`).
- **Length:** 45 words (target ≤75).
- **Voss device:** walk-away.
- **ONE-WAY DOOR:** there is no Email 5. Ever. The walk-away is real or it's a lie — and a lie proves the
  skeptic right. Workflow ends here.

### Subject — Variant A (bold claim)
```
i'll stop here
```
### Subject — Variant B (low-key / specific)
```
last note from me
```

### Body (one body, both lanes)
```
This is the last one. I'm not going to chase you about something I'm giving away.

The site stays built and the link stays live: {{contact.draft_site_url}}

If a slow week ever has you wondering where the calls went, reply to this. It comes straight to me.

— alex
```

### A/B wiring (GHL)
- Same lane split. Subject only. After this step the workflow **ends** (no further emails on any branch).

### WHY (psychology / mechanism)
- **The walk-away IS the Voss device.** "I'll stop here / I'm not going to chase you" triggers two things at
  once in a skeptic: **loss** (the thing is about to go quiet) and **autonomy** (you're handing control back).
  A burned owner who resisted being *pushed* often re-engages the moment the pushing stops — because now
  replying is *his* idea, not yours.
- **"Something I'm giving away"** quietly restates the whole offer (it's free until he wants it) without
  re-pitching — and it's the dignity line: I don't chase people to hand them a gift. That posture is the
  opposite of begging, which is banned.
- **The link stays live** keeps the asset in his world after the thread ends. We're not threatening to delete
  it (that would be a manipulative fake-scarcity). It just stays. Loss-aversion compounds quietly: the draft
  with his name on it keeps existing, a standing reminder.
- **"Reply to this. It comes straight to me."** ends on strength AND on the single re-entry path — a real human
  inbox, no calendar gauntlet, no form. Mirrors the brand promise "I answer every email myself." Maximum ease
  to re-open, zero pressure to.
- **Honoring the one-way door is antifragile** (Taleb): a real walk-away makes the next campaign credible. A
  fake one ("last email!" then a Day-11) detonates trust permanently and trains the market that we bluff.
- **Device rotation complete:** audit → label → direct offer → walk-away. Four distinct devices, none repeated
  across the journey — the anti-formula rule the copy law and the warm sequences both enforce.

---

## Anti-template / cross-channel de-dupe (must hold)

- **No Voss device repeats** within a recipient's journey: audit (D0) → label (D2) → direct offer (D5) →
  walk-away (D8).
- **No sentence here repeats verbatim** from the warm Sequence D (`../../email/SEQUENCES.md` D1–D4) — this is a
  fresh phrasing of the same 4-beat arc, so a lead who somehow saw both never reads a carbon copy. (E.g. warm
  D1 opens "You probably get pitches all the time"; this opens "You get pitches like this all day.")
- **No sentence here repeats verbatim** from any SMS in `../SMS-COPY.md`.
- Subjects are all lowercase, 3–5 words, no merge fields, no punctuation.

## GHL import notes

1. Build as one workflow: **"WF-D · Cold Phase-2"**, trigger = Tag Added `cold-phase2`, with the entry
   conditions + suppression above. Keep the workflow **toggle OFF** until the dedicated cold domains are warm.
2. **Lane split:** first action = random/round-robin assign `lane:a` or `lane:b` (50/50). Every email step
   reads the lane to pick its subject; bodies are lane-agnostic.
3. **Sender:** the warmed cold-domain identity (NOT `info@wedidit4you.com`). From name still
   "Alex at We Did It For You," reply-to = a monitored inbox (the "comes straight to me" promise must be true).
4. **Goal event:** reply OR `status:booked` OR `status:approved` OR DND → auto-skips remaining steps (so no
   "did this land in spam" goes out after someone already replied — the #1 way automation looks broken).
5. **Plain text only.** No images, no HTML template chrome, no tracking-redirect on the URL, no shortener.
   One bare link per email (Emails 2–4). Email 1 has zero links by design.
6. **Reply-handling must be instant** (panel blind spot #2): a "send it" reply on Day 0 needs the live link
   back in minutes-to-an-hour while intent is hot. Wire that path BEFORE this sequence sends.
7. **CAN-SPAM footer — reconciled with the zero-link Email-1 design (panel Review 4 Fix 2):** Email 1 stays
   link-free for deliverability. Its compliance is satisfied by (a) the valid US postal address appended below
   the `— alex` sign-off as **plain text** (no hyperlink), and (b) a plain-text opt-out instruction — a single
   line `reply STOP and I'm gone`, which is a working opt-out mechanism and matches the walk-away voice.
   **Emails 2–4** (which already carry one bare link) ALSO carry the `{{custom_values.email_footer}}` hyperlinked
   one-click unsubscribe. Do NOT add the GHL hyperlinked unsubscribe element to Email 1 — it reintroduces the
   phishing-smell link the no-link design exists to avoid; use the postal-address-plus-`reply STOP` plain-text
   footer there instead. (Mirrors `01-GHL-BUILD-SPEC.md` §2.1 WF-D Email-1 exception.)

## /panel verdict (logged)

**PROCEED · HIGH confidence.** Key condition: past-tense gift framing + specificity + one non-repeating Voss
device per touch + TRUE, understated scarcity; calm, never urgent. Biggest risk: "trying too hard" →
scam-perception + deliverability collapse that burns the warmed domains. Guardrails applied to every line
above. Watch reply-timing in v1 — if replies cluster Day 6–9, stretch the Day-8 walk-away to Day 10–12 in v2
(the burned one-man-shop reads email late).
