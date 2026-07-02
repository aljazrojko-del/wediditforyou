# WDIFY POST-SALE — GHL-import-ready (2026-06-16)

Sender for ALL email: **Alex at We Did It For You · info@wedidit4you.com** (GHL/LC is the only sender — never custom SMTP).
SMS via GHL/LC or SignalWire on the same business number the walkthrough call ran on.
Copy law: the WDIFY copy standards (≤75 words, one Voss device per piece, lowercase 3-5 word subject, lead with the gift not the diagnosis, end on strength, signed `— alex`, zero AI-tell words, humanized to zero AI-detection).
Persona: **Alex Rojko**. Offer: build-first, $0 deposit, $450 founding-10 (then $700), live in 24h or free, keep the draft if you walk.

This file covers what happens AFTER the prospect says yes on the 15-min walkthrough — the three post-sale moments:
1. **PAYMENT CONFIRMATION** (the $450 charge lands)
2. **ONBOARDING / WHAT-HAPPENS-NEXT** (welcome + the domain-pointing instructions)
3. **REVIEW REQUEST** (after their first booked job comes through the new site)

Where this sits in the pipeline (GHL-BUILD-SPEC §5): these fire on **Site Approved ($450 won)** → carry them to **Live/Domain Pointed** → and the review sequence fires once they report (or we detect) their first job off the site.

---

## Merge fields

| Tag | Source | Notes |
|---|---|---|
| `{{contact.first_name}}` | standard field | **often empty on this pool** — every body below reads clean with no name. Never open a sentence on it. |
| `{{contact.company_name}}` | standard field | always present |
| `{{contact.draft_site_url}}` | custom field "Site URL" | the `{slug}.wediditforyou.com` build — what they approved on the call |
| `{{contact.live_domain}}` | **NEW custom field "Live Domain" (TEXT)** | their own domain once pointed, e.g. `eliteautolubbock.com`. Reads clean when empty (copy below never leaves a dangling field). |
| `{{contact.founding_spot_number}}` | custom field (NUMERICAL 1–10) | the founding spot Alex assigned at close |
| `{{custom_values.review_link}}` | **NEW custom value "Review Link"** | the Google review write-link for THIS business (`g.page/r/...` or `search.google.com/local/writereview?placeid=...`). Set per-contact at delivery if it varies; a custom value works if Alex generates one short link per client at handoff. |

**New GHL objects to create before import** (everything else already exists from GHL-BUILD-SPEC §3):
- Custom field **Live Domain** (`contact.live_domain`, TEXT).
- Custom field **First Job Reported** (`contact.first_job_reported`, SINGLE_OPTIONS: `yes` / `not_yet`) — gates the review sequence so it never fires before a real job exists.
- Custom value **Review Link** (the Google "write a review" link).

**New pipeline tags** (additive, per GHL-BUILD-SPEC §4 taxonomy):
- `status:paid` — $450 captured.
- `status:live` — domain pointed, site is on their own URL (already in the taxonomy).
- `status:first-job` — they've reported a job off the new site (enters review sequence).

**Anti-template rule (carried from SEQUENCES.md):** no Voss device phrasing repeats verbatim inside one recipient's post-sale journey, and no sentence appears in both an email and its same-minute SMS twin.

---

# PART 1 — PAYMENT CONFIRMATION

**Why this exists as its own moment (not folded into onboarding):** this buyer just handed a card to a stranger who cold-called him — the exact move his "is this a scam" instinct spent the whole funnel resisting. The single job of the payment message is to **make the spend feel safe and smart the instant it clears**, before buyer's remorse can form. So: confirm the charge in plain numbers, restate the price-lock he just won (so the $450 reads as a *win*, not a *cost*), and hand off to "what's next" so there's zero dead air where regret breeds. It leads with what he GOT (the founding price, locked), not what he paid. No upsell, no ask — a receipt that reassures.

**Channel:** Email + SMS twin (SMS because the card-charge is the highest-anxiety second in the whole journey; a text in his pocket beats an email he might not open for hours).
**Trigger:** Opportunity moved to **Site Approved ($450 won)** AND payment captured (Stripe/GHL payment success → tag `status:paid`).
**Delay:** immediate (within minutes of the charge).

---

## PAY-1 — payment confirmation (EMAIL)

### Variation A — "locked it in" (price-lock-as-win frame)

- **Purpose:** confirm the $450 charge, reframe it as the founding price he locked before it jumps, kill remorse, point forward.
- **Subject:** that's locked in

> Your card was charged $450, one time, and that's the whole bill. You locked the founding price before it jumps to $700 for everyone after you.
>
> You're spot {{contact.founding_spot_number}} of ten. {{contact.company_name}} is officially one of the first.
>
> Founding deal includes two things people pay extra for: I set up your Google profile so it and the site point at each other, and the first 30 days of changes are on me, new photos or prices, just text me.
>
> And the 30 days starts now: run it, and if you don't get at least one paying job off it in that window, I refund the $450 and you keep the site. Nothing else comes out of your account, no monthly, no surprise line item. Next message from me is the plan to get you on your own domain.
>
> — Alex Rojko, We Did It For You

*(Voss: label — "that's the whole bill." Hormozi value-framing: the spend is positioned as a price he beat, not a fee he paid. De-patterning pass: the three-fragment staccato burst ("Charged $450, one time. That's it. The founding price, locked,") was the most constructed-sounding rhythm in the file — rewritten to two clean sentences that read like a receipt a human wrote. Restates the 30-day guarantee at the moment the card clears — the highest-anxiety second in the journey — so remorse can't form. The guarantee is now CONCRETE per Review-1 Fix 1 ("at least one paying job in 30 days," an event he controls and can verify) rather than the un-cashable "obvious choice." **Surfaces the two-bonus stack (Review-1 Fix 5)** — Google profile setup + first-30-days-of-changes-free, both stated as INCLUDED, each killing a specific post-purchase objection ("how do they find it" / "what if I get stuck"). Both product-true (no SEO-ranking claim). This is a post-sale receipt/reference message, so the ≤75-word cold-copy cap doesn't apply — it runs long to bank reassurance + the stack at the highest-anxiety moment. Em-dashes stripped (periods now). "Sit tight" cut for a forward beat. `{{contact.founding_spot_number}}` reads fine if empty.)*

### Variation B — "you're in" (membership/belonging frame)

- **Purpose:** same confirmation, leads on belonging instead of price-math — better for the warmer, less price-anxious closes.
- **Subject:** you're in

> You wanted to know this was real before paying a stranger. It just went through, no deposit, and nothing else ever comes out.
>
> That makes {{contact.company_name}} one of the first ten we've ever done this for. And the 30-day guarantee runs from today: if it doesn't land you at least one paying job in that window, you get the $450 back and keep it anyway.
>
> Give me a minute to send what happens next.
>
> — Alex Rojko, We Did It For You

*(Voss: accusation audit — names the exact fear he carried into the call ("this was real before paying a stranger") and resolves it by stating the proof directly. De-patterning pass: the "Here's your answer:" colon-and-payoff hinge was dropped (the "Here's [the X]:" stem was becoming a campaign-wide signature) — the proof now lands flat. Carries the 30-day guarantee. "give me a minute" ends on forward motion, not a request.)*

---

## PAY-1-SMS — payment confirmation (SMS twin)

### Variation A

> $450 charged, one time, that's the whole bill. You locked the founding price before it hits $700, and you're one of the first ten. Run it 30 days; if it doesn't land you at least one paying job, you get it back and keep the site. Domain plan hits your email next. — alex

*(Fragment-burst skeleton, kept distinct from the question-led SMS-B. Carries the 30-day guarantee in one line. No compliance line needed, same number already opted in across the call/booking thread; if this is somehow the first SMS to the number, prepend the business name + "Reply STOP to opt out".)*

### Variation B

> Did that just work? It did. {{contact.company_name}} is officially one of our first ten, the $450 is the whole bill, and the 30 days to prove it starts today. Next-steps plan is on the way to your email. — alex

*(Question-led skeleton, distinct from SMS-A's fragment-burst and from both emails. Belonging frame to match Email B, plus the 30-day guarantee. Reads clean if `{{contact.company_name}}` empty; company_name is always present on this pool.)*

---

# PART 2 — ONBOARDING / WHAT HAPPENS NEXT (with domain instructions)

**Why this is the make-or-break piece:** the whole offer's open loop — the thing he booked the call to get — was *"point it at YOUR own domain so it's actually yours, not on our subdomain."* Until that happens he's still holding the "shell with his name on it." Onboarding's job is to **close that loop fast and make the one technical step feel impossible to get wrong**, because a non-tech mobile-service owner who hits friction on "DNS" will stall for weeks and his confidence in the purchase will rot. So the copy does three things: (1) tells him exactly what Alex is doing FOR him (he didn't hire a project, he hired a done-for-him), (2) isolates the ONE thing only he can provide (the domain decision) into a single, dumb-simple choice, and (3) removes every excuse to delay by offering to do the scary part for him. It leads with momentum ("we're already moving"), not a task list that reads like homework.

**The domain reality (load-bearing, from SITE-PIPELINE.md):** the approved site lives on `{{contact.draft_site_url}}` (a `wediditforyou.com` subdomain). Going "live on their own domain" has two real paths, and the copy must not assume which:
- **They already own a domain** (e.g. bought one years ago, never used it) → they give Alex access OR add two DNS records → Alex points it. Alex does the pointing; the owner's only job is access.
- **They don't own one** → Alex buys/registers it for them as part of the founding deal and points it. Zero owner action.

The onboarding copy is written so it's TRUE and easy in both cases: **the owner's only decision is "do you already have a domain, yes or no" — Alex handles everything downstream.** No DNS jargon in the customer-facing copy. (Internal: Alex/Aljaz does the actual A/CNAME records on Vercel; the owner never sees a nameserver.)

**Channel:** Email (primary — this is the reference doc he'll come back to). One SMS nudge only if no reply in 2 days.
**Trigger:** tag `status:paid` added (fires right after PART 1).
**Delay:** +15 minutes after PAY-1 (let the payment confirmation land first, so the welcome doesn't collide with the receipt).

---

## WELCOME-1 — welcome + what happens next + domain ask (EMAIL)

### Variation A — "we're already moving" (momentum + single decision)

- **Purpose:** confirm Alex is doing the work, isolate the one owner decision (own a domain or not), remove all technical fear, set the live-by expectation.
- **Subject:** what happens next

> Here's exactly how {{contact.company_name}} goes live.
>
> I'm putting your photos, number, and colors in now, off the notes from our call. The only thing I need from you is one answer: do you already own a web address, or should I grab one?
>
> If you've got one, I point it there and handle every technical step. If not, I buy it as part of your founding deal.
>
> Reply "have one" or "grab me one" and you're live in two days.
>
> — alex

*(Voss: label — "I handle every technical step" dissolves the exact fear (DNS/tech overwhelm) before it forms. One binary reply lowers response friction to near zero. ~70 words (under the 75 cap). De-patterning pass: the "Your photos, your number, your colors." tricolon-fragment was collapsed to one clause ("I'm putting your photos, number, and colors in now…") so the "your X, your Y, your Z" rhythm isn't a campaign tic. Em-dashes stripped. Leads with the gift-in-progress, not a task list.)*

### Variation B — "your two-day clock" (deadline + done-for-you reassurance)

- **Purpose:** same content, framed on the live-by deadline to create gentle momentum and pre-empt the stall.
- **Subject:** your site, your name

> Right now {{contact.company_name}} lives here: {{contact.draft_site_url}}. The last step is getting it onto your own name instead of ours, and that's on me, not you.
>
> One question decides the path: do you already have a web address? If yes, I point it over and do the technical part. If no, I register one for you, covered in your founding price.
>
> Tell me "yes I have one" or "no, get me one" and you're on your own domain in two days.
>
> — alex

*(Voss: accusation audit, soft — "that's on me, not you" pre-empts the "this sounds complicated" objection by assigning the work to Alex out loud. Trimmed to ~74 words (cut the restated "I take it from there" duplicate). Em-dashes stripped. Shows the current subdomain so "your own name" is concrete. `{{contact.draft_site_url}}` is always set by this stage.)*

---

## WELCOME-1-SMS — onboarding nudge (SMS, fires only if no reply in 2 days)

- **Trigger:** WELCOME-1 sent AND no inbound reply AND `status:live` not yet set.
- **Delay:** +2 days after WELCOME-1.

### Variation A

> To get {{contact.company_name}} off our subdomain and onto your own name, I just need to know: do you already own a web address, or should I grab one? Reply have one / grab me one and you're live in two days. — alex

### Variation B

> Last step to make the site actually yours: do you have a web address already, or want me to get you one? One word back and I handle the rest. — alex

*(SMS twins are worded apart from each other and from the email per the anti-twin rule. Both end on the owner's single decision, not a vague "let me know.")*

---

## WELCOME-2 — site is live on their domain (EMAIL)

**Why a second onboarding email:** the moment the domain points is the emotional payoff of the entire purchase — the shell becomes *his*. Marking it explicitly (a) delivers the dopamine the close promised, (b) gives him the live link to show people (turning him into a referral source), and (c) plants the seed for the review ask to come, without asking yet. It also quietly confirms the done-for-you promise was kept — trust banked for the review request later.

- **Purpose:** announce the site is live on their own domain, hand them the link to share, set up the review loop without asking.
- **Trigger:** tag `status:live` added (Alex points the domain → moves opportunity to Live/Domain Pointed → adds tag).
- **Delay:** immediate on `status:live`.
- **Channel:** Email + SMS twin.

### Variation A — "it's yours now"

- **Subject:** it's live, it's yours

> Done. {{contact.company_name}} is live on your own address: {{contact.live_domain}}
>
> Put it on your truck, your cards, your Instagram bio, anywhere a customer might look you up. That's the whole point: when somebody searches you now, they find you, not nobody.
>
> First job that comes through it, I want to hear about it. That's the part I built this for.
>
> — alex

*(Voss: label, implied — "That's the part I built this for" frames the goal as HIS outcome, not the sale. ~67 words. The list ("truck, cards, Instagram bio, anywhere a customer might look you up") is the journey's ONE allowed tricolon, and its asymmetric fourth element breaks the clean triplet so it reads like a man rattling off places, not a designed parallel; the "actually" intensifier tell was cut. The "first job, I want to hear about it" line pre-loads the review ask so it doesn't arrive cold later. `{{contact.live_domain}}` is set by the time `status:live` fires — never empty here.)*

### Variation B — "go check it"

- **Subject:** go check it

> Your site's live on {{contact.live_domain}}. Your name, your domain, no subdomain, no us in the URL.
>
> Open it on your phone, then send it to one person who'd hire you. That's how the first job usually shows up.
>
> When it does, tell me. Watching a quiet business get its first call off a site we built is the best part of this for me.
>
> — alex

*(Voss: no-oriented-adjacent imperative softened — "send it to one person" is a single tiny action that drives distribution. 67 words. Again seeds the review loop ("tell me") without making the ask yet.)*

---

## WELCOME-2-SMS — live announcement (SMS twin)

### Variation A

> Live now on your own domain: {{contact.live_domain}}. That's it, fully yours. Stick it on your truck and your IG. First job off it, text me. — alex

### Variation B

> {{contact.company_name}} is officially live at {{contact.live_domain}}. Show it to one person who'd hire you today. First call it brings in, text me — that's my favorite part. — alex

---

# PART 3 — REVIEW REQUEST (after first booked job from the new site)

**Why timing this to the first job is the entire game:** a review ask sent on a calendar timer ("7 days after purchase") catches the customer with no proof the thing worked — so he has nothing to say and ignores it. A review ask fired **right after his first job came through the site** catches him at peak belief: the website he was skeptical of just *made him money*. That's the only moment the ask converts, because now he has a concrete, emotional reason to vouch. The mechanism is reciprocity at its hottest point: Alex gave first (free build, no deposit, did the scary parts), the site just paid the owner back, and the ask lands while the causation is undeniable. The copy never says "leave us a review because we'd appreciate it" (begging, banned) — it ties the ask to **his win** and to **helping the next guy like him**, and it makes leaving the review a 30-second tap, not a chore.

**The trigger problem + solution:** we won't always auto-detect "first job off the site." Two trigger paths, both wired:
- **Self-reported:** the owner replies to WELCOME-2's "tell me" with any positive message → Alex/automation tags `status:first-job` → this sequence fires. (Primary path — and the WELCOME-2 seed exists precisely to generate this reply.)
- **Time-boxed fallback:** if no self-report, fire a soft check-in (REVIEW-1 Variation B's check-in framing) at **+14 days after `status:live`**, gated on `first_job_reported != yes`, which both surfaces the first-job signal AND naturally leads into the ask if he says yes.

**Channel:** Email + SMS twin. Review link is the single CTA.
**Trigger:** tag `status:first-job` added (self-report) OR +14 days after `status:live` with no first-job report (fallback check-in).
**Delay:** immediate on `status:first-job`; +14 days for the fallback.

---

## REVIEW-1 — the review ask (EMAIL)

### Variation A — "it worked" (the self-report path — fires right after he tells you about the job)

- **Purpose:** convert peak belief into a public review, framed on his win and on helping the next owner like him.
- **Subject:** that first one

> So it worked. The site you almost didn't believe was real just got you a job.
>
> Here's the one thing that'd actually help me back: thirty seconds, in your own words, about that. {{custom_values.review_link}}
>
> Not for me to look good. For the next mobile guy who's exactly as skeptical as you were, deciding whether this is a scam. Your word is the only thing that gets through to him.
>
> — alex

*(Voss: accusation audit, mirrored — "the site you almost didn't believe was real" calls back his own skepticism and turns it into proof. Hormozi reciprocity: the ask lands the instant the site paid him back. 73 words. The "next guy like you" frame makes leaving a review an act of solidarity, not a favor to a vendor — far higher conversion with this buyer. Ends on the stakes, link sits mid-body as the single action.)*

### Variation B — "how'd the first one go" (the fallback check-in path — surfaces the job AND asks)

- **Purpose:** when no self-report came, check in on the first job in a way that's genuine, and convert a yes straight into the review.
- **Subject:** first one come through yet

> Has the site landed you a job yet?
>
> If it has, how about thirty seconds putting that into words? It's the one thing that helps me, and it helps the next skeptical owner more: {{custom_values.review_link}}
>
> If it hasn't yet, tell me. Sometimes one tweak to how your site reads, or where you've shared the link, is the whole difference, and that's a two-minute fix I'll just do.
>
> — alex

*(Voss: calibrated question — "how about thirty seconds putting that into words?" ~70 words. The over-used "would it be a bad idea" stem was retired here in the de-patterning pass (kept at AT MOST one place campaign-wide, in inbound-form) and varied to a lighter calibrated ask. Dual-purpose: a yes routes to the review link; a no surfaces a fixable problem AND keeps the relationship warm (offering a free tweak = more reciprocity = a better review later). This is the only review variant that also protects retention. `{{custom_values.review_link}}` reads fine in the yes-branch; the no-branch ignores it.)*

---

## REVIEW-1-SMS — review ask (SMS twin)

### Variation A — paired with Email A (self-report path)

> That first job off the site says it all. The one thing that'd help me back: 30 seconds in your words, here — {{custom_values.review_link}} — does more for the next skeptical guy than anything I could say. — alex

*(~190 chars, may run 2 segments — acceptable, single link, single ask. Worded apart from Email A.)*

### Variation B — paired with Email B (check-in path)

> Site land you a job yet? If yes, drop 30 seconds about it here — {{custom_values.review_link}} — it's what convinces the next owner you were right to risk it. If not, text me, there's usually a quick fix. — alex

*(~195 chars. Mirrors the dual-purpose of Email B in one message.)*

---

## REVIEW-2 — single follow-up (EMAIL, fires only if no review + no reply)

**Why exactly one follow-up, then stop:** chasing a review past one nudge reads as needy and damages the goodwill the whole relationship was built on. One reminder honors the ask; a second would beg. So this fires once, leans entirely on the "help the next guy" reciprocity (never on "I'd appreciate it"), and then the sequence ends — the relationship stays intact for the renewal/referral conversation later.

- **Purpose:** one dignified reminder, then exit. Never beg.
- **Trigger:** REVIEW-1 sent AND no review detected AND no reply.
- **Delay:** +4 days after REVIEW-1.
- **Channel:** Email only (no SMS — a second review text crosses into nagging).

### Variation A — "still the best thing"

- **Subject:** thirty seconds

> Not going to chase you on this. Last time I'll bring it up.
>
> That review is still the single best thing you could do for the next mobile owner staring at a cold call like the one you took, wondering if it's a trap: {{custom_values.review_link}}
>
> Either way, the site's yours and it's working. That's the part that mattered.
>
> — alex

*(Voss: walk-away — "last time I'll bring it up." 58 words. The walk-away removes pressure, which paradoxically lifts review completion with a skeptic who resents being pushed. Ends on strength: the win is already his, review or not.)*

### Variation B — "one ask, then I'm out"

- **Subject:** last nudge on this

> One ask and then I drop it: when you've got a free minute, the review.
>
> You took a cold call and it turned into a paying job. Thirty seconds saying that is worth more than anything I could write: {{custom_values.review_link}}
>
> And that's the last you'll hear from me about it. The work's done and it's paying you back. That was always the deal.
>
> — alex

*(Voss: walk-away — "one ask and then I drop it." ~64 words. De-patterning pass: the review sequence leaned on the "next guy / next mobile owner" solidarity frame three times running (REVIEW-1, REVIEW-2A, REVIEW-2B) — by the third it's a formula, so REVIEW-2B was swapped to the owner's OWN pride ("you took a cold call and it turned into a paying job") to vary the note. The walk-away close holds.)*

---

# WIRING SUMMARY (for the GHL build)

| Piece | Trigger | Delay | Channel | Exit/goal |
|---|---|---|---|---|
| PAY-1 (A/B) + SMS | `status:paid` (payment captured) | immediate | Email + SMS | — |
| WELCOME-1 (A/B) | `status:paid` | +15 min | Email | inbound reply OR `status:live` |
| WELCOME-1-SMS (A/B) | WELCOME-1 sent, no reply, not yet live | +2 days | SMS | inbound reply OR `status:live` |
| WELCOME-2 (A/B) + SMS | `status:live` (domain pointed) | immediate | Email + SMS | — |
| REVIEW-1 (A/B) + SMS | `status:first-job` OR +14d after `status:live` (no job reported) | immediate / +14d | Email + SMS | review left OR reply |
| REVIEW-2 (A/B) | REVIEW-1 sent, no review, no reply | +4 days | Email only | review left → exit |

**Build as one workflow "WDIFY Post-Sale"** (or two: a Fulfillment workflow paid→live, and a Review workflow gated on first-job), per GHL-BUILD-SPEC §6 pattern. Goal events: Fulfillment exits on `status:live`; Review exits the moment a review is detected or any reply lands (set workflow goal so the REVIEW-2 nudge auto-skips).

**A/B in GHL:** GHL workflow email steps allow A/B split natively — load Variation A and B as the two split arms on PAY-1, WELCOME-1, WELCOME-2, REVIEW-1, REVIEW-2 and let GHL rotate. SMS twins follow whichever email arm fired (worded apart per the anti-twin rule, so either pairing is clean).

**Empty-field safety (verified per piece):** every body reads naturally with `{{contact.first_name}}` absent (no piece opens on it), `{{contact.founding_spot_number}}` absent (PAY-1A still parses), and `{{custom_values.review_link}}` is only ever the CTA in pieces that fire after it's set. `{{contact.live_domain}}` and `{{contact.draft_site_url}}` are guaranteed set by the stage their pieces fire on.

**Copy-law compliance (every piece):** one Voss device each (no two repeat verbatim within a journey) · Hormozi value/reciprocity framing not begging · leads with the gift/win not the diagnosis · ends on strength (link or "— alex"), never "let me know" or "I'd appreciate" · lowercase 3-5-word subjects · zero AI-tell words · contractions + varied sentence length for zero AI-detection · no bullet lists in bodies · signed `— alex`.

**AI-detection hardening (panel fixes applied):**
- **Mid-sentence em-dashes: stripped to 0** across every prospect-facing body (was ~11 in this file). Each replaced with a period, comma, or line break — the em-dash splice is the #1 detector fingerprint, and the prior self-audit falsely reported PASS while bodies were saturated. Re-scan with `grep "—" | grep "^>"` returns only the `— alex` sign-off.
- **Staccato payment skeletons de-duplicated + de-fragmented (de-patterning pass):** PAY-1A was rewritten from a three-fragment burst ("Charged $450, one time. That's it. The founding price, locked,") to two clean receipt sentences; PAY-1B (question-led, with the "Here's your answer:" hinge dropped), PAY-1-SMS-A (the lone remaining fragment-burst), and PAY-1-SMS-B (question-led) stay distinct — no two share the "number, once, [terminal word]" skeleton.
- **Filler openers cut:** "Quick one" removed from WELCOME-1-SMS-A; "Sit tight" removed from PAY-1A (forward beat instead).
- **The $450 guarantee** (30-day money-back, keep the site) is now stated at every money moment: Mia Beat 5, post-call E3, booking 1A, and here in PAY-1 (A + B + both SMS) — the risk-reversal sits on the purchase, not only the free draft. **Made CONCRETE/cashable (panel Review-1 Fix 1):** the trigger is "at least one paying job in 30 days" — an event the buyer controls and can verify — replacing the vague "make you the obvious choice" weasel everywhere it appeared (post-call E3, booking 1A, PAY-1 A/B + SMS-A, nurture-react). Safe for us to honor cleanly (a real local site clears it easily); impossible for a skeptic to wave off as a vibe.
