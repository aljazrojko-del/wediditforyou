# Outreach templates — Hormozi voice

Written to maximize: specific $ outcomes, pain anchored, risk reversed, single CTA, brutal brevity. No "I hope this finds you well." No softeners.

---

## 🟡 Pricing exceptions & special offers (use ONLY when triggered)

### Split-payment offer — $225 × 2

**When to offer:** Only when the prospect explicitly raises a money/cash-flow
objection ("I don't have the money right now", "it's too much upfront",
"can you do payment plans", etc.).

**Never lead with this.** Offering split-pay proactively trains every prospect
to expect it and erodes the $450 anchor.

**How it works (implemented as a Stripe subscription, auto-charged):**
- ONE payment link: `STRIPE_STARTER_SPLIT_PAYMENT_LINK` ($225/week, limit 2 cycles)
- Customer's card auto-charges $225 today + $225 in 7 days = $450 total
- Subscription auto-cancels after the 2nd charge (no surprise charge 3)
- Site goes live after the FIRST $225 clears
- If their card fails on day 7: Stripe auto-retries 3 times over 2 days,
  then emails them. You don't manage it manually.
- If they refund or chargeback the second $225: do nothing — the site stays
  live, log them as a partial-pay client, move on.

**Risk:** ~5-10% of split-pay clients will dispute or fail the second
$225 charge. Accepted cost of widening the funnel — Stripe handles
collection retries automatically.

**Difference from full-pay:** none — split-pay totals exactly $450 over 7 days
vs $450 today. No rounding loss to the customer.

### Referral discount — $50 off, retroactive

**When to offer:** Mention it AFTER a client pays $450 in full. NEVER mention
during the initial sales call (dilutes the offer).

**How it works:**
- Existing paying client refers a fellow {niche} (mobile mechanic / groomer / tutor)
- The referred business goes through the normal funnel (preview → call → approve)
- ONLY when the referred business actually pays $450 → original client gets
  $50 refund applied to their Stripe transaction (or PayPal sent separately)
- Discount is **retroactive**, not upfront — eliminates farming/abuse

**Why this structure:** No incentive for fake referrals or "I have a friend
who's interested" tire-kicks. Real money only changes hands when real money
comes IN.

**Tracking:** Add `referred_by` column to `leads` table in Supabase. When a
new lead comes in via referral, fill it with the referring client's ID/email.
On payment success, query for `referred_by` and trigger the $50 refund.

---

**Placeholders to replace before sending:**
- `{first_name}` — owner's first name (from enrichment or Google reviews)
- `{business_name}` — from Supabase `leads.name`
- `{niche}` — "mobile mechanic" / "mobile dog groomer" / "tutor"
- `{city}` — from Supabase `leads.city`
- `{site_url}` — from Supabase `leads.site_url`
- `{cal_url}` — `https://cal.com/brooke-wedidit4you/website-review`
- `{stripe_url}` — `https://buy.stripe.com/8x2dR84Uc7kJ7o4dbo5J600`
- `{N}` — current founding spots taken (start at 2, increment as clients pay)

---

## 1. Cold email — initial outreach (polite, ~200 words) — DEFAULT

**Subject options (test these):**
- A: `We built you a preview website — would you like a look?`
- B: `A free website preview for {business_name}`
- C: `Built a preview for {business_name} — yours to keep`

**Body:**

```
Hello {first_name},

We came across your business and noticed you don't have a website yet — would you like one?

We took your public Google business data and built you a preview, free of charge. You can see it here:

{site_url}

If you like what you see, we can either jump on a quick 15-minute call to walk through any changes you'd want, or you can simply reply to this email with edits, photos to add, or anything you'd like adjusted.

This preview is completely free. If you decide you want it live, we'll register your domain and prepare the final website within 24 hours. The price is $450 one-time — we're running a founding-client offer for our first 10 paying customers ({N} of 10 spots still open). After that, the price goes back to $700.

Why we're doing this: most {niche_plural} without a website lose roughly {volume_loss} — around {money_loss}/month — to competitors who show up on Google when customers search. The website fixes that. And if you don't get a single customer inquiry from it in the first 30 days, we'll refund your $450 and you can keep the site.

No pressure, no deposit, no commitment. Just take a look and let me know what you think.

— Alex
wedidit4you.com
```

**Why this version (polite, not Hormozi):**
- Trust-first tone matches an unknown brand reaching out cold
- Two response paths (call OR email) reduce commitment friction
- Founding-price urgency present but soft ("spots still open")
- Risk reversal at the end, not lead — feels like reassurance, not a hard sell
- Dollar-quantified pain still there ($1,200/mo, customizable per niche)
- 30-day refund + keep-the-site guarantee unchanged

**Per-niche economics** (auto-injected by `npm run draft-emails`):
| Niche | Plural | Volume loss | $ loss / month |
|---|---|---|---|
| mobile mechanic | mobile mechanics | 3-5 jobs a week | $1,200 |
| mobile dog groomer | mobile groomers | 3-5 appointments a week | $1,000 |
| tutor | tutors | 2-3 students a month | $800 |
| plumber | plumbers | 3-5 jobs a week | $1,500 |
| hair stylist | hair stylists | 5-8 walk-ins a week | $1,500 |
| landscaper | landscapers | 2-4 jobs a week | $1,500 |
| barber | barbers | 5-8 walk-ins a week | $1,200 |

---

## 1-ALT. Cold email — Hormozi style (~75 words) — USE LATER

**Switch to this version once you have 2-3 paying clients + testimonials.** The Hormozi punch only works when you have social proof behind it. Until then, polite outperforms it.

**Subject options:**
- A: `Built you something.`
- B: `Built {business_name} a site (47 sec).`
- C: `{first_name} — your website is already built.`

**Body:**

```
{first_name},

Built you a website. 47 seconds. Used your Google data.

Live: {site_url}

Look at it. Hate it? Walk away — owe nothing. Love it? $450 (founding price, {N} of 10 left), I register your domain, ship it live in 24 hours.

The math: {niche}s without a site lose ~$1,200/month to the competitor who shows up on Google. The site fixes that — or you get a full refund AND keep the site. 30-day guarantee.

— Alex
wedidit4you.com
```

---

## 2. Reply — when they respond "interesting" / "tell me more"

```
{first_name},

15-min call. I walk you through the site, you tell me what to change, we figure out if this is for you.

Book it: {cal_url}

If you're a "let me think about it" — keep the site URL, sit with it as long as you want. No follow-up from me unless you ask.

— Alex
```

**Why it works:**
- One question = one answer = one CTA (book the call)
- Anticipates the "let me think" objection and disarms it
- Doesn't beg, doesn't pitch, doesn't oversell

---

## 3. Reply — when they ask "how does this work?" or general questions

```
{first_name},

1. You see the site I built ({site_url})
2. 15-min call — we tweak anything off ({cal_url})
3. If you love it → $450, I register your domain, live in 24 hours
4. If you don't → walk away, site is yours to keep, owe nothing

30-day guarantee: zero customer inquiries from the site = full refund + you keep it.

Questions? Hit reply. Otherwise: {cal_url}.

— Alex
```

---

## 4. Reply — when they ask about price ("how much?")

```
$450, one-time. Founding price for first 10 clients ({N} of 10 left). After that $700 — permanently.

You don't pay until you approve the site. Refund + keep the site if no customer inquiries in 30 days.

So worst case: free website. Best case: ~$1,200/mo back in your pocket.

{cal_url}

— Alex
```

---

## 5. Reply — when they go silent for 3+ days (one-time bump)

**Subject:** `Re: Built you something.`

```
{first_name},

Quick bump. Your site is still here: {site_url}

Founding price ({N} of 10 left). If slot 10 fills before you decide, it's $700 forever.

No pressure. Just didn't want you to miss it.

— Alex
```

**Send this ONCE. Never bump twice.** If they don't respond after 1 bump, mark dead and move on.

---

## 6. 15-min review call script

Run it like clockwork. 13 min of structure + 2 min buffer.

### 0:00 - 1:00 — Frame the call

> "Hey {first_name}, Alex from wedidit4you. We've got 15 min — I'll walk you through the site I built, you tell me what to change, then we figure out if this is for you. Cool?"

(Wait for yes. Don't continue without it.)

### 1:00 - 4:00 — Discovery (3 questions, no more)

> Q1: "Quick number — what does an average {niche} job pay you?"
> Q2: "How many jobs do you book in a typical week?"
> Q3: "Where do most customers find you right now?"

(Note the answers. Listen for "word of mouth / Facebook / referrals" — almost never "Google" or "website".)

### 4:00 - 5:00 — Anchor the GAIN (not the loss)

**Gain-framing converts 30-40% better than loss-framing in cold sales.**
Lead with the money they'd MAKE, not what they're losing.

> "OK so right now you're at roughly ${job_price} × {jobs_per_week} new
> customers/week = ${weekly_revenue}/week from new business — mostly
> word of mouth, since you don't currently show up on Google.
>
> A working website typically catches **3-5 additional new customers/week**
> — the ones searching '{niche} {city}' on Google who currently find your
> competitors instead of you.
>
> Conservative number: even if just 2 of those 5 convert, that's
> **2 × ${job_price} = ${2 × job_price}/week extra** = ~${8 × job_price}/month
> in new revenue.
>
> The site costs $450 one-time. It pays for itself after about 1.5 new
> customers through it. Everything after that is profit."

(Pause. Let the number sit. Don't rush to fill the silence.)

### 5:00 - 9:00 — Show the site

> "Let me share my screen."

[Open {site_url} on screen share]

> "Three things I want you to look at:
> 1. The hero — designed to get the call
> 2. The services — pulled from your Google reviews
> 3. The trust bar — your real Google rating + review count
>
> What needs to change?"

(Note 2-3 specific edits. **Don't argue. Don't defend. Just write them down.**)

### 9:00 - 11:00 — Risk reversal (the offer)

> "Three things I want clear:
>
> 1. **You don't pay until you approve the site.** I send you the link after this call, you sit with it, if it's not right you walk away — site is yours to keep.
>
> 2. **Price is $450 one-time.** Founding price for first 10 clients. After that $700 forever. Currently {N} of 10 claimed.
>
> 3. **30-day guarantee.** If the site doesn't get you a single customer inquiry in 30 days, I refund the $450 AND you keep the site. Worst case for you: free website."

### 11:00 - 13:00 — Close (four doors — split-pay option included)

> "So four options:
>
> A) You walk away — fine. Site is yours, owe nothing.
> B) You want to think — fine. I send you the link, you sit with it, no follow-up unless you want one.
> C) You're in — I text you the $450 payment link now, you pay in full, I register your domain tonight, live tomorrow.
> D) You want it but $450 upfront is a stretch — I can split it. $225 now, $225 in 7 days. Site goes live after the first $225, no waiting.
>
> What feels right?"

(Then shut up. The silence is the close.)

**Important rule on option D:** NEVER mention split-pay unless the prospect
brings up money as the friction. Leading with split-pay trains every prospect
to expect it and erodes the $450 anchor. Use it as a fallback, not a default.

### Branching from here

**If C (full pay — $450):**
> "Cool. Sending: {stripe_url} — pay any time today. Reply with the domain name you want (e.g., {first_name}mobile.com), I register it tonight, live tomorrow."

**If D (split-pay — $225 × 2, auto-charged 7 days apart):**
> "Sounds good. Payment link: {stripe_split_url}. Pay $225 today, then reply with the domain name you want. Once the first $225 clears, I register your domain tonight and ship the site live within 24 hours. The second $225 auto-charges to the same card 7 days from now — no second link to track, no manual action on your end. Total: $450 over 7 days, then the subscription auto-cancels."

**Rule: only offer D when the prospect raises money/cash-flow as the friction.**
Don't lead with split-pay — it erodes the $450 anchor for everyone else.

**If B (think):**
> "Cool. Sending you the site URL + payment link. No follow-up unless you ask. Quick heads-up: founding price moves to $700 when slot 10 fills — I'll let you know if that's about to happen."

**If A (no):**
> "Cool. Curious — what's the dealbreaker?"

(Listen. Note. **Don't argue. Don't sell.**)

> "Got it. Site's yours either way. Reach out if anything changes."

### Rules — never break these

- Don't apologize for the price
- Don't lower the price
- Don't extend the 24h guarantee or the 30-day refund
- Don't oversell — the site does the selling
- Don't talk past 13 min — respect the calendar block
- Don't email a "just following up" 3 days later — that signals weakness

---

## 7. Post-call email — if they said "C" (yes)

**Subject:** `Pay $450, live tomorrow.`

```
{first_name},

As discussed:

1. Pay: {stripe_url}
2. Reply with the domain you want (e.g., {first_name}mobile.com)
3. I register it tonight, point it at the site
4. You're live within 24h — or it's free
5. 30 days, zero inquiries: full refund + you keep the site

Your site: {site_url}

— Alex
```

---

## 8. Post-call email — if they said "B" (think)

**Subject:** `Sleep on it. Site is yours either way.`

```
{first_name},

Site: {site_url}
Pay if/when you decide: {stripe_url}

Two reminders:
1. Founding price ({N} of 10 left). When slot 10 fills, it's $700 forever.
2. 30-day guarantee. No customer inquiries = full refund, you keep the site.

No follow-up from me. Reach out when you're ready.

— Alex
```

---

## 9. Post-payment email — when Stripe webhook fires

**Subject:** `Got the $450. Domain name?`

```
{first_name},

Payment landed. Now I need one thing:

What domain do you want? (e.g., {first_name}mobile.com, {city}mobiletire.com, etc.)

Reply with it and I'll register it tonight. Site goes live within 24 hours from when you reply — guaranteed or it's free.

— Alex
```

---

## 10. Brooke (AI caller) opening line

If you wire Brooke up before email warms up, this is what she says when the lead picks up:

```
"Hey, is this {first_name}? Quick one — I'm Brooke from wedidit4you, and I'm calling because we already built you a website. You don't have one and you're losing about $1,200 a month to {niche}s with one. The site is live at {site_url} — I can text it to you right now if you want to see it. Should I send it?"
```

If yes → text the URL + Cal.com link.
If "what is this" → "We build websites for {niche}s without one. Yours is already done. Want me to text the URL?"
If "not interested" → "No problem. The site is yours either way if you change your mind. Have a good one." Hang up.

---

## Send-order recommendation

For your first 9 Lubbock leads sitting in Supabase right now:

1. **Send cold email #1 to all 9 from `alex@wedidit4you.com`** today
2. **Wait 24 hours** — check replies
3. **Send bump #5 to anyone who didn't reply** at 72 hours
4. **Run the script #6 on any booked call** within 60 min of seeing the booking notification
5. **Send #7 or #8 within 5 min of ending the call**
6. **Send #9 within 1 min of Stripe payment confirmation**

That's the entire close-loop. Every message is < 100 words. No fluff. No begging. Pure offer.
