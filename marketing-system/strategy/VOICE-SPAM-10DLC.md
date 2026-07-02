# Voice Calls, 10DLC & "Spam Likely" — WDIFY / Mia Cold-Caller

**Question:** Is 10DLC verification needed for voice calls, and for them to not come up as potential spam?

**Stack in scope:** 5 SignalWire numbers (Chicago / Nashville / Dallas / Houston / Phoenix) on a Full/active SignalWire account (`wedidit4you.signalwire.com`), placing AI cold calls (Mia) to US small-business owners, geo-matched (Phoenix leads called from the Phoenix number). Separate want: text a link via SMS.

---

## 1. The clean answer

**No. 10DLC verification is NOT required to place outbound voice calls in the US.** And **no, 10DLC does NOT stop your calls from being labeled "Spam Likely."**

This is definitive, verified against Twilio, SignalWire, The Campaign Registry, and carrier docs:

- A2P **10DLC = a text-messaging standard, full stop.** Twilio (verbatim): *"A2P 10DLC is the standard that US telecom carriers have put in place to ensure that **SMS traffic** to US end users through long code numbers is verified and consensual."* The registration trigger is messaging only.
- SignalWire's own docs scope it the same way: *"Using 10DLC numbers **for messaging** requires mandatory registration with The Campaign Registry."* Voice is never mentioned as a registration trigger.
- The Campaign Registry (TCR) itself is *"the US carrier-led system used to register A2P 10DLC **messaging**."* There is no voice equivalent in TCR.

A 10DLC number can carry both SMS and voice — that's a property of the *number*, not a registration requirement. Marketing copy that says "same number for calls or texts" describes the number's dual capability; it does NOT mean the 10DLC registration covers voice. Voice is governed by an entirely different regime (STIR/SHAKEN at the carrier layer + TCPA/DNC for conduct), covered in Section 3.

**Bottom line:** Mia can place calls right now with zero 10DLC registration. Spam labeling is a *separate problem* with a *separate fix* — and 10DLC is not that fix.

---

## 2. What 10DLC IS actually for — and why it blocks your SMS link, not your calls

10DLC (Brand + Campaign registration with The Campaign Registry) is the gate for **Application-to-Person SMS/MMS** to US mobile numbers. Its job is to record *who* is sending texts and *what* the texts say, so carriers can throttle/block unregistered or spammy senders.

**This is exactly what's blocking the "text a link" idea — and only that.**

- The moment WDIFY wants to **SMS a link** (e.g. an after-call follow-up text with a booking/demo URL), those texts require **10DLC registration**: a **Brand** (legal name, address, EIN) plus a **Campaign** (use-case + sample message content) registered with TCR through SignalWire.
- Until that's registered and approved, US carriers will heavily filter or silently drop the texts — and **link-bearing messages are the single most-filtered SMS category** (carriers treat unknown short-links as the #1 phishing signal). So even after registration, expect link scrutiny.
- **Voice calls are completely unaffected by this.** You can call today; you just can't reliably text until 10DLC is approved.

**Practical split for WDIFY:**

| Channel | 10DLC needed? | Action |
|---|---|---|
| **Mia voice calls** | **No** | Place calls now. Do the *voice* anti-spam work (Section 3–4). |
| **SMS the link** | **Yes** | Register Brand + Campaign in SignalWire (EIN required). 1–3 weeks. Use a branded link (own domain), not a bare bit.ly. |

Treat SMS as a parallel workstream. Do not let it hold up the calling launch.

---

## 3. What ACTUALLY prevents "Spam Likely" on voice — ordered by leverage

Two independent systems govern an outbound call. People conflate them; don't.

1. **STIR/SHAKEN attestation** — proves the number genuinely belongs to you (anti-spoofing). Assigned by your *originating provider* (SignalWire), not by you and not by the receiving carrier.
2. **Carrier spam analytics** — the "triopoly" that actually prints the "Spam Likely" label: **AT&T → Hiya**, **Verizon → TNS**, **T-Mobile → First Orion (Scam Likely)**. Each runs its own model on call volume, duration, answer rate, complaints, and number reputation.

**Critical fact:** an A-attested call is **not** guaranteed to be delivered clean. Attestation *helps* (B/C calls get flagged far more often) but the spam label comes from the analytics engines. So the real fix is a *stack*, ordered here by leverage:

### Leverage tier 1 — do these first (highest impact, low/no cost)

1. **Free Caller Registry — `freecallerregistry.com`** *(the single highest-leverage free move).*
   One free submission that feeds **all three** engines (Hiya/AT&T, TNS/Verizon, First Orion/T-Mobile) at once. US numbers only, voice only. You submit: company name, address, website, email, the **5 numbers**, call category, and preferred display name. Each engine reviews independently and emails back; flags typically clear in **~2–5 business days**. Re-submittable if a number gets re-flagged. **Hiya explicitly says: don't pay a vendor for this — use the free registry.** GoHighLevel "Voice Integrity," CallRail, etc. are just paid front-ends to this same portal.

2. **STIR/SHAKEN A-level attestation via SignalWire** *(open a support ticket).*
   SignalWire signs all outbound calls, but **numbers bought on the platform default to attestation level C** (gateway — the weakest, most-flagged level). To get to **A** (full) you must complete SignalWire's vetting: **open a support ticket** (Dashboard → Support → Create a ticket) and request attestation review. SignalWire-native numbers + verified business identity + calls originating on their network = the three conditions for A. **There is no self-serve toggle** — the ticket is mandatory. This is the second-biggest lever after FCR.

3. **Call-pattern hygiene** *(this is what keeps a registered number clean — registration without it still gets flagged).*
   - **Volume per number:** keep each of the 5 DIDs to roughly **50–100 dials/day** (industry guidance; >150/day "almost guarantees" a flag). With 5 numbers that's ~250–500 dials/day of clean capacity. **Ramp gradually** — sudden spikes read as robocalls.
   - **Call duration:** avoid the sub-30-second hang-up signature of auto/parallel dialers. Mia holding a real conversation actually *helps* here — long average duration is a positive signal.
   - **Answer/complaint rate:** keep answer rate up and complaints/blocks near zero. Watch for declines as an early warning.
   - **List hygiene:** scrub against **federal + state DNC**, honor opt-outs immediately, drop dead numbers. (B2B small-business owners on their business lines is lower DNC-risk than B2C cell, but still scrub.)
   - **Rotate before decay:** treat numbers as long-term assets; rotate one out *before* its reputation degrades, don't churn disposable DIDs.

### Leverage tier 2 — do these next (improves answer rate, not strictly anti-spam)

4. **CNAM (Caller ID Name) on each number** *(SignalWire support ticket).*
   Registers your business name (≤15 chars incl. spaces) to display on caller ID. Won't strip a spam label, but lifts answer rates and signals legitimacy. Local DIDs only (works on all 5), ~24–48h to propagate. Set via support ticket with the number + desired name + business docs.

5. **Verified Caller ID** *(only if you ever call from a number you don't own on SignalWire).*
   Not needed here — all 5 numbers are native SignalWire numbers, which is already the correct, A-eligible setup.

### Leverage tier 3 — premium, optional, later

6. **Branded Calling / Rich Call Data (RCD)** — name + logo + reason-for-call, carrier-verified. **SignalWire does NOT offer this natively** (verified — no RCD/branded-calling product in their catalog as of mid-2026). You'd layer a third-party vendor (Numeracle, First Orion ENGAGE, TNS Branded Caller ID, TransNexus) on top of A-attestation. High cost, high effort — revisit only once volume justifies it.

7. **Continuous reputation monitoring** — Caller ID Reputation / Truecaller / Hiya lookups to detect when any of the 3 engines flags a number, then re-submit to FCR or rotate. Worth automating once Mia is at scale.

---

## 4. Concrete checklist for Aljaz's 5 SignalWire numbers

**Does the geo-matched local caller ID already help?** **Yes — partially, and it's the right call.** Calling Phoenix leads from the Phoenix number (local presence) measurably lifts answer rates and is exactly what legitimate businesses do.

**One caution:** local-presence is only legitimate when you **actually own the numbers you're calling from** — which Aljaz does (5 real SignalWire DIDs). The thing the analytics engines penalize is **neighbor spoofing** (faking a caller ID you don't own to match the lead's prefix). Aljaz is **not** doing that — these are 5 owned, attestable numbers. So the geo-match is a pure positive. Do **not** try to expand "local presence" by spoofing area codes you don't have numbers in; buy/own the number instead.

**Launch checklist (in order):**

- [ ] **Confirm all 5 numbers are native SignalWire numbers** (bought or ported-in on the platform). Ported numbers attest B until the carrier record propagates (~24–72h) — give porting time before judging spam labels. *(Native = A-eligible immediately after vetting.)*
- [ ] **Open ONE SignalWire support ticket** requesting: **(a) STIR/SHAKEN A-level attestation** review for all 5 numbers, and **(b) CNAM** display name (≤15 chars, e.g. "WeDidItForYou") on all 5. Bundle both in the same ticket. *(This is the mandatory, non-self-serve step.)*
- [ ] **Register all 5 numbers at `freecallerregistry.com`** in one submission — company name, address, website, email, the 5 DIDs, call category, display name. Expect clearance in ~2–5 business days. *(Free, hits all 3 engines.)*
- [ ] **Set per-number daily cap ~50–100 dials**, ramp up over the first 1–2 weeks (don't open at full volume). 5 numbers → ~250–500 clean dials/day.
- [ ] **Keep the geo-match** (Phoenix→Phoenix, Dallas→Dallas, etc.). It's a legitimate answer-rate boost. Never spoof a metro you don't own a number in.
- [ ] **Scrub the call list against federal + state DNC**, honor opt-outs, drop dead numbers before dialing.
- [ ] **Monitor:** after ~1 week, dip each number's reputation (Caller ID Reputation / Truecaller / Hiya). If any shows "Spam," re-submit to FCR and/or rotate that DID out.
- [ ] **SMS (separate track):** start SignalWire **10DLC Brand + Campaign** registration now (needs EIN). Use a **branded short-link on your own domain**, not a bare bit.ly. Don't block the voice launch on this.

---

## 5. SignalWire: automatic vs. what Aljaz must set up

| Item | SignalWire does automatically | Aljaz must set up |
|---|---|---|
| **Call signing (STIR/SHAKEN)** | ✅ Signs every outbound call — **but at level C by default** (weakest) | ⚠️ **Open a support ticket** to get vetted up to **A-level** attestation. No self-serve toggle. |
| **CNAM (name display)** | ❌ Not automatic | ⚠️ Support ticket with number + ≤15-char name + business docs (all 5). |
| **Carrier spam-label registration (Hiya/TNS/First Orion)** | ❌ Not done by SignalWire | ✅ **Register the 5 numbers at `freecallerregistry.com`** yourself (free, external). |
| **10DLC SMS registration** | ❌ Not automatic | ⚠️ Brand + Campaign in SignalWire with EIN — required only for **texting**, not calls. |
| **Branded Calling / RCD (logo + reason)** | ❌ Not offered natively | Optional later via 3rd-party vendor (Numeracle / First Orion / TNS / TransNexus). |
| **Number reputation / spam dashboard / Do-Not-Originate tooling** | ❌ Not provided | Use external monitoring (Caller ID Reputation, Truecaller) + re-submit to FCR / rotate. |
| **Call-pattern hygiene (volume, duration, DNC, ramp)** | ❌ Your responsibility | ✅ Enforce in the dialer config + list management. |

**The headline:** SignalWire gives you signed calls (default C), and *can* give you A-attestation + CNAM **only after you file a support ticket**. Everything that actually clears the "Spam Likely" label — Free Caller Registry, call hygiene, monitoring — is **external and on Aljaz to do**. None of it is 10DLC, and none of it requires 10DLC.

---

## Sources (verified this session)
- Twilio — *What is A2P 10DLC* + A2P 10DLC compliance docs (10DLC = SMS only)
- SignalWire — Campaign Registry registration; STIR/SHAKEN guide (default attestation **C**, A/B via ticket); CNAM via ticket; Verified Caller ID; 2026 toll-free messaging changes
- The Campaign Registry — TCR is messaging-only
- FCC — 8th Caller ID Authentication Report & Order (Sept 18 2025: providers own their SPC token + attestation decision)
- Hiya / TNS / First Orion — Free Caller Registry launch + "don't pay a vendor, use FCR"
- Bandwidth / Telnyx / TransUnion / SIPSTACK — attestation A/B/C logic; attestation ≠ spam labeling
- GoHighLevel / PhoneBurner / BatchDialer / Kixie — call-pattern hygiene + per-number volume guidance

*Note: exact carrier spam thresholds are proprietary; per-number volume figures (~50–100/day) are industry guidance, not official carrier limits. SignalWire's exact A/B vetting criteria are unpublished — confirmed only that it's gated behind a support ticket.*
