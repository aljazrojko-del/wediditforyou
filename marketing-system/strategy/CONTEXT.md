# WDIFY LAUNCH CONTEXT — single source of truth (2026-06-12)

Read this fully before producing ANY artifact. Every fact below is verified from the live site,
the VPS, or the deal memory this session. Do not invent facts not present here.

## The business
- **Brand:** We Did It For You — `wedidit4you.com` (live, Next.js). Public founder persona: **"Alex Rojko"**
  (Aljaz Rojko Kam, Slovenian engineer).
- Public email: **info@wedidit4you.com**. Site line: "I answer every email myself."
- **What it sells:** custom websites for tiny local service businesses (≤3 employees) that have NO website.

## The offer (verbatim from the live site — this is the CURRENT offer, supersedes all older docs)
1. **Build-first:** "We build before we ever charge." Site is researched + designed from public info
   (Google, reviews, social) BEFORE any contact/payment.
2. **No deposit. $0 until you approve it.** Walk away keeping the draft if you don't want it.
3. **Live URL within 24 hours of the form landing, or it's free.**
4. **Founding-10 pricing: $450** (then moves to **$700** permanently after first ten paying clients).
   "Less than what most charge for a logo." No monthly fee mentioned for year 1.
5. **Niche-rebuilt, not template:** "Mobile mechanic, dog groomer, tutor — every site is rebuilt from
   the niche up. No two of our sites look the same."
6. Pain frame: "Mobile-service businesses lose an average of **3–5 jobs a week** to competitors who
   show up on Google."
7. Focus niches on site: **mobile mechanics (focus), mobile dog groomers, tutors** — form also accepts
   plumber/trades, hair/salon, landscaper, personal trainer.
8. Demo builds live (subdomains of wediditforyou.com): bellahair (Brooklyn salon), diazmobile
   (Houston mobile mechanic), greenline (Austin landscaper), reyesplumbing (Phoenix plumber),
   Bright Path Tutoring (Cedar Rapids).
9. **Two spec builds already SHIPPED for real businesses, pending owner review — owners to be called:**
   - **Elite Mobile Tire & Brake** — Lubbock, TX (tires/brakes/mobile service)
   - **Buddy's Mobile Spa** — Lubbock, TX (mobile dog groomer)
   The site literally says "owners get a call this week" and "Spot 3 of 10: Open".
10. Flow: form (60s) → we build in 24h → email live URL → quick review call (their colors/phone/photos)
    → if they keep it, point domain + go live; if not, they keep the draft.

## The lead pool (verified in postgres `our lead database`, (WDIFY), today)
- **742 unique phone numbers** (10,894 raw rows — heavy scraper duplicates; ALWAYS dedupe by contact_phone).
- Only **14 have emails** → **calling is the primary channel.** Email = follow-up + inbound only, until
  cold-email infra exists (domains never bought).
- Niche split (unique): dog groomer 186 · mobile mechanic 153 · auto detailing 113 · handyman 107 ·
  mobile barber 84 · house cleaner 48 · mobile car wash 45.
- Cities: Phoenix AZ, Houston TX, Dallas TX, Miami FL (scraper queries).
- Lead fields available: company_name, contact_phone, website (null = no site), tags
  (niche:…, city:…, rating:…, industry:…), notes. NO owner first names in most rows.
- Scraper cron adds ~10-99 new/day (automated scraper).

## Mia (the AI cold caller) — infra facts
- The AI voice caller runs on SignalWire + Gemini Live, NEPQ engine built in.
- Campaign API: `POST /api/v1/campaigns` with `{leads: [...], client_config: {...}}`.
  client_config keys seen in prod: `agent_name`, `company_name`, `service_description` (+ free-form
  keys the prompt builder consumes: pitch, offer, objection notes, booking instructions).
- Example config shape: `{"agent_name": "Mia", "company_name": "We Did It For You", "service_description": "..."}`
- Voicemail detection: 9s. Calling hours respected (start 9am local).
- Agent persona for WDIFY: female AI caller calling **on behalf of We Did It For You / Alex**.

## Channel strategy constraints
- **GHL agency account is currently INACTIVE** ("Company is not active") — being resolved separately.
  All GHL artifacts must be **ready-to-import/ready-to-push** the moment it reactivates:
  build specs, sequences as plain text + merge tags, contact import CSV mapping. GHL = the ONLY
  email sender (the standing rule: never custom SMTP).
- Warm/transactional email from info@wedidit4you.com is fine (inbound form replies, post-call
  follow-ups, booking confirmations). **Cold email at volume = phase 2** (needs 2-3 sending domains
  + Smartlead/GHL warmup, 3-4 weeks — domains NOT yet bought).
- SMS: via GHL/LC or SignalWire after a call connects (B2B numbers). Post-call link drop is the killer
  move: "here's the site we built you".
- TCPA: B2B cold calls to business numbers; accepted risk posture (project decision).
  Respect DNC requests, calling hours 9am–6pm local, identify the business.

## Copy standards (MANDATORY — full rules at the WDIFY copy standards)
- NEVER: "I would love", "would you be open to", "no pitch no pressure", "did you get a chance",
  "just checking in", "following up", "hope this helps", "I'd appreciate", self-introductions.
- Every outbound piece uses ONE Voss device (no-oriented question / label / accusation audit /
  "I'd feel weird not sending this") + Hormozi cost-of-inaction framing.
- Cold emails ≤75 words (email 1: 40-60 words, NO links). Subject lines lowercase, 3-5 words,
  like a text from a friend. End on strength (link or name), never "let me know".
- Humanize: varied sentence length, contractions, casual sign-off "— alex", zero AI-tell words
  (unlock/leverage/streamline/revolutionize/game-changer), no bullet lists in emails, no em-dash rhythm.
- Target: zero AI detection. Mia speaks like a sharp, warm human — short turns, asks more than tells.

## Voice/call style references on disk
- Old 4-email brain rules: ~/projects/wediditforyou/EMAIL-BRAIN-GUIDE.md (cadence/scoring logic still
  valid; PRICE/OFFER in it is OUTDATED — $297 is wrong, current = $450 founding-10).
- Old HTML templates: ~/projects/wediditforyou/email-templates/*.html (visual reference only; copy outdated).

## What good looks like (targets)
- 742 dials over week 1 (Mia 100-150/day) → ~20% connect → ~10% of connects book the 15-min
  walkthrough → first 10 founding clients at $450 = $4,500 + price unlock to $700.
- The 2 Lubbock spec-build owners get the FIRST calls: strongest possible pitch ("your site is already
  live, want the link?").
- Every connect ends with: SMS link drop + email follow-up (if email captured on call) + GHL pipeline stage.
