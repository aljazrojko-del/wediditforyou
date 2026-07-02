# We Did It For You — Marketing & Campaign System

This folder is the full marketing/campaign build for **We Did It For You (WDIFY)** — the strategy, the AI-caller (Mia) flow, all the copy, and the CRM/automation build. It's here so you can see everything that's been built around the product.

> Credentials are intentionally shown as `[REDACTED]` — never commit live API keys/tokens to a repo. The setup docs describe *what* is configured on your SignalWire/Smartlead/GHL, without the raw keys.

---

## The offer (what we sell)
A **build-first website**: we build the site *before* we reach out, show it live, and only then talk price. **$0 deposit · $450 one-time founding price (first 10) → $700 after · no monthly · 30-day guarantee** (land a paying job or full refund, keep the site either way). Target: US local service businesses with **no website** (mobile mechanics, dog groomers, tutors, plumbers, detailers).

## How a lead moves through it
```
Find a no-website business  →  auto-build their site live  →  reach out (cold email + Mia call)
   →  Mia reveals the site + texts the live link  →  books a 15-min call
   →  Mia showcases + captures their edits + closes $450  →  site goes live in 24h
```

## The channels
- **Cold email — Smartlead** (`strategy/SMARTLEAD-SETUP.md`): 3 niche campaigns, dedicated warmed domains, the real 4-email sequence loaded.
- **Mia (AI voice caller) — SignalWire** (`mia-call-scripts/`): the two-call "Proof-Then-Loop" flow (`strategy/MIA-FUNNEL-FLOW.md`).
- **GHL (CRM + nurture)** (`ghl-campaign/`): pipeline, fields, tags, calendar, and the email/SMS nurture workflows.
- **The site build-ahead** (`strategy/SITE-PIPELINE.md`): sites are built + live *before* any call — the whole flow depends on it.

---

## Table of contents

### strategy/
- **STRATEGY.md** — the master strategy + launch plan
- **CONTEXT.md** — the project context + lead pool reality
- **MIA-FUNNEL-FLOW.md** — ⭐ the two-call Mia flow (both call scripts, objection banks, the $450 close)
- **OFFER-AB-PREDICTION.md** — the offer A/B test + prediction (why "Proof-Then-Loop" won)
- **PANEL-VERDICTS.md** — advisor-panel review of the campaign
- **EMAIL-QUALITY-GATE.md** — the copy quality gate (why the emails are best-in-class)
- **SITE-PIPELINE.md** — the build-ahead site pipeline
- **SMARTLEAD-SETUP.md** — the cold-email setup (domains, inboxes, sequences)
- **REPO-INTEGRATION-MAP.md** — how the marketing system connects to your app
- **VOICE-SPAM-10DLC.md** / **WHATSAPP-OUTBOUND-GOAROUND.md** — deliverability + channel notes

### mia-call-scripts/
- **CALL-SCRIPTS.md** — Mia's call scripts + objection handling
- **REVEAL-OPENERS.md** — the reveal openers (present-tense "it's live" + honest cold fallback)

### ghl-campaign/
- **00-TOUCHPOINT-GRAPH.md** — the full touchpoint state machine
- **01-GHL-BUILD-SPEC.md** — the GHL build spec (fields, tags, pipeline, calendar, workflows)
- **BUILD-ORDER.md** — the step-by-step build order
- **CAMPAIGN-MASTER.md** — the master campaign doc
- **CONTINGENCY-A-Z.md** — the A-to-Z contingency plan
- **GHL-AI-BUILDER-PROMPTS.md** — the workflow build prompts
- **COPY-ADVISORS-AUDIT.md** — advisor audit of all copy
- **HUMAN-STRESS-TEST.md** — real-prospect walkthrough of the whole funnel + fixes
- **produce/** — the final email/SMS copy: `cold-email` · `post-call` · `booking` · `inbound-form` · `nurture-react` · `postsale`

### email/ · sms/
- **email/SEQUENCES.md** · **sms/SMS-COPY.md** — the sequence + SMS copy references
