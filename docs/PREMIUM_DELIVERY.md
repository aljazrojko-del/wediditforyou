# Premium Tier — Delivery Spec

Premium tier sells for **$797** and includes **8 components** stacked at
**$2,600 value**. This doc spells out:

- What each component is
- How to deliver it (tools + prompts + steps)
- Realistic delivery time per client
- Which components are already automated, which need manual touch

**Target: total delivery time per Premium client = ~3 hours.** At $500
extra revenue over Starter, that's **$167/hour blended.**

---

## 1. Custom logo + brand identity — $300 value

**What:** Real logo (vs. the orange initial badge from Starter), 3-color
brand palette, font pairing system.

**Tool:** [Ideogram](https://ideogram.ai/) free tier (5/day) or paid plan.
Alternative: DALL-E 3 via OpenAI API ($0.04/image).

**Prompt template:**

```
A flat-style minimalist logo for "[BUSINESS NAME]", a [NICHE] in [CITY].
Bold geometric mark, single accent color, white background, professional
appearance. Suitable for use as a website header logo at small sizes.
```

**Delivery time:** 15-20 min (generate 4 candidates, pick 1, refine with
1-2 follow-up prompts).

**Output:** SVG or PNG dropped into `public/clients/{slug}/logo.svg` and
wired into the lead's site as a header replacement.

---

## 2. Five service-specific pages — $600 value

**What:** Instead of one site page, build five pages — one per primary
service (e.g., oil change, brakes, diagnostics, batteries, pre-purchase).
Each page targets a specific local search query.

**Tool:** Your existing `lib/generate-site.ts` AI generator, with a new
prompt mode for service pages.

**Per-page prompt template:**

```
Write hero copy for the "{service}" landing page of {business_name}, a
mobile mechanic serving {city}. Audience: local drivers searching
"{service} near me" or "mobile {service} {city}". Tone: confident,
specific, no buzzwords.

Generate:
- Headline (max 6 words, focused on {service} outcome)
- Subheadline (1 sentence, names a specific pain or outcome)
- 4 sub-services within {service} (e.g., for "brakes": pads, rotors, fluid flush, brake light fixes)
- 3 reviews specific to {service} customers
- About paragraph

Return JSON only.
```

**Delivery time:** 30-45 min (5 pages × ~7 min each, mostly AI gen).

**Routing:** Add `app/sites/[slug]/[service]/page.tsx` dynamic route. Each
service page links from the main site's services section.

---

## 3. Google Business Profile optimization — $400 value

**What:** Their existing GBP is half-filled. Premium delivery fills it out
properly with photos, service list, products, posts, FAQs, hours.

**Tool:** Manual via [Google Business Profile Manager](https://business.google.com/).
Client gives you Manager access (they invite you as Manager for 5 min, you
do the work, they can remove access after).

**Checklist:**

- ✅ Full business description (750-character pitch, AI-generated from lead data)
- ✅ Services list (use the 5 service-page topics)
- ✅ Products list (if applicable — battery brands, tire brands)
- ✅ Service area (3-5 zip codes around their address)
- ✅ Posts: 3 starter posts (announcement, special, education)
- ✅ FAQs: 5 common questions answered (AI-generated)
- ✅ Photos: pull from their existing GBP + add 3-5 stock-but-targeted

**AI-generated description prompt:**

```
Write a 750-character Google Business Profile description for {business_name},
a {niche} in {city}. Mention: years in business (if known), service area,
2-3 specialties, what makes them different. No exclamation marks. No "we
are passionate about...". Professional, factual, local-flavored.
```

**Delivery time:** 30 min (most of which is AI-generated copy paste).

---

## 4. Five directory listings — $250 value

**What:** Consistent NAP (Name, Address, Phone) across 5 major local
directories. Boosts local SEO via citation consistency.

**Tools (free tier of each):**

- [Yelp for Business](https://biz.yelp.com/) — free claim listing
- [Better Business Bureau](https://www.bbb.org/) — basic listing free, accredited ~$500/yr (skip)
- [Nextdoor for Business](https://business.nextdoor.com/local) — free
- [Bing Places for Business](https://www.bingplaces.com/) — free
- [Yellow Pages](https://www.yellowpages.com/) — free basic listing

**Alternative tool (paid, auto-distributes):** [BrightLocal](https://www.brightlocal.com)
~$29/mo handles 50+ directories. Pays for itself at 3+ Premium clients/mo.

**Delivery time:** 30 min manually, OR 5 min via BrightLocal automation.

---

## 5. Online booking system — $300 value

**What:** Cal.com or Calendly embedded on the site with the business's
service menu + pricing. Customer picks a time, lands directly on the
mechanic's calendar.

**Tool:** [Cal.com](https://cal.com/) free tier (you already pay for one
for wedidit4you — the client gets their own free account).

**Setup steps:**

1. Sign up for Cal.com using the client's business email (or create one)
2. Create event types: 1 per service (15-30 min slots)
3. Wire up calendar integration (Google Calendar or iCal feed)
4. Embed the booking widget in their site's "Book now" CTA
5. Verify a test booking works end-to-end

**Delivery time:** 20-30 min.

---

## 6. Auto-review collection — $250 value (highest LTV impact)

**What:** After a job is done, the customer gets an automated SMS:
*"Hi {first_name}, thanks for choosing {business} today! If you have 30
seconds, here's our Google review link: {URL}. Means a lot. — {Owner}"*

**Code:** Already built in `scripts/send-review-request.ts`. Reads from
Supabase, sends via Quo. Triggers when a job is marked `completed`.

**Delivery time:** 5 min per client (just wire up the trigger logic).

**Setup:**

1. Get the client's Google review URL (format: `https://g.page/r/...`)
2. Store in Supabase `leads.google_review_url`
3. Owner marks job complete in your simple dashboard (or via SMS to you)
4. Script fires SMS 1-2 hours later
5. Track reply rate, review velocity, GBP score impact

**Real-world impact:** Average mobile mechanic gets 1-2 Google reviews a
year. With auto-collection, expect 1-2 a WEEK. Compounds rapidly.

---

## 7. Monthly performance report — $200 value

**What:** Email sent on the 1st of each month with: site visits, top
pages, button clicks, form submissions, calls received, bookings made.
Plain English summary at the top, charts below.

**Tools:**

- [Plausible Analytics](https://plausible.io/) — free for <10k pageviews,
  privacy-friendly, 5 min setup
- [Vercel Analytics](https://vercel.com/analytics) — already on your stack
  if Vercel-deployed
- Email delivery via Mailgun (already wired)

**Implementation:** New script `scripts/monthly-report.ts`:

1. Run on the 1st of each month via cron (GitHub Actions or Vercel Cron)
2. For each Premium client: pull last-30-days metrics
3. AI-generate a 3-paragraph summary
4. Email via Mailgun

**Delivery time:** Per-client setup once = 5 min (add to cron list).

---

## 8. 90-day priority support — $300 value

**What:** Vs. 30-day support on Starter. Premium clients get a dedicated
Slack channel (or WhatsApp thread) for content tweaks, photo updates,
copy edits.

**Tools:** Slack Connect channels (free if you use Slack), OR WhatsApp
Business (free).

**Process:**

- One channel per Premium client
- Batch responses 2x/week (Tue + Fri)
- 24-hour first-response SLA on weekdays
- Hard cap: 1 hour of work/month included, additional billed at $50/hr

**Delivery time:** ~30 min/week of batched responses across all Premium
clients.

---

## Per-client delivery checklist (use for every Premium sale)

Copy-paste this into a Google Doc or Notion when a Premium sale closes:

```
[ ] 1. Stripe payment confirmed
[ ] 2. Starter site live (automated, 24h)
[ ] 3. Custom logo generated + dropped in
[ ] 4. 5 service pages built + linked
[ ] 5. GBP Manager access invited
[ ] 6. GBP description + services + posts + FAQs added
[ ] 7. 5 directory listings created
[ ] 8. Cal.com booking widget embedded
[ ] 9. Auto-review SMS pipeline wired (google_review_url stored)
[ ] 10. Plausible analytics added to monthly cron
[ ] 11. Slack/WhatsApp support channel opened
[ ] 12. "Done" email sent to client with all the links
```

---

## Cost stack — what each Premium client costs YOU

| Cost | Per client |
|---|---|
| Anthropic AI gen (extra pages + copy) | ~$0.02 |
| Ideogram logo gen | $0 (free tier) or $0.04 (DALL-E) |
| Domain registration | $12/yr (passed through to client) |
| Vercel hosting | $0 (free tier handles many sites) |
| BrightLocal (if using) | $29/mo amortized across all clients |
| Mailgun (monthly reports) | $0.001/email |
| Quo SMS (review requests) | $0.01-0.02 per customer SMS |
| **Total marginal cost** | **<$1 per Premium client** |

Gross margin per Premium sale (after Stripe fee):
- $797 - $25 (Stripe) - $1 (tools) = **$771 = 96.7% margin**

---

## When to scale this beyond solo

**You hit the wall at ~30 Premium sales/month** (3 hrs each = 90 hrs of
delivery work). That's roughly month 4-6 of full ramp.

At that point:

1. Hire a VA at $8-12/hr to handle the manual parts of items #3, #4, #5,
   #7, #8 (GBP, directories, booking, reports, support). Cost: ~$10/hr ×
   2hrs/client × 30 clients = $600. Net per client: $797 - $26 (Stripe) -
   $1 (tools) - $20 (VA) = **$750 = 94% margin**.

2. Keep items #1, #2, #6 in-house (all AI-driven, fully automated).

3. Eventually productize: spin up `https://wedidit4you.com/premium-setup`
   self-serve wizard. Reduces VA need.
