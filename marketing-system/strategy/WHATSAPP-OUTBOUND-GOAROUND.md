# Outbound WhatsApp AI Voice (Mia) to US Small-Biz — Honest Go-Around Assessment

**Date:** 2026-06-13
**Question:** Can we place OUTBOUND WhatsApp AI voice calls (Mia) to US small-business owners, going *around* Meta's US business-initiated-calling block, by running our OWN stack (GOWA/whatsmeow + a Gemini Live audio bridge) instead of Meta's official Business Calling API?
**Owner:** WDIFY (Alex/Aljaz) · lead pool: 742 US phone-only leads, voice is the primary channel.

---

## TL;DR (read this, skip nothing else if you're busy)

**The "our own stack" go-around does not exist as a working thing.** No open-source WhatsApp library
(whatsmeow, Baileys, GOWA) can place an outbound call *and* stream live audio on its own — the in-process
media path (SDP + SRTP over WhatsApp's relay) is not shipped by any maintained project. Everything that
"works" today either (a) hands your WhatsApp credentials to a closed paid cloud that does the audio
(Wavoip, GREEN-API), or (b) drives a **rooted phone farm** with hooked-mic injection. Both are
reverse-engineered, both carry a **15–30% account-ban rate for proactive/outbound cold contact**, and
cold-WhatsApp-calling is literally the single most ban-prone use pattern that exists.

**There IS a clean, legal go-around to the US block — but it's not "our own stack," it's a non-US sender
number on Meta's OFFICIAL API.** The US restriction keys off the *business number's country*, not the
recipient's. A **Slovenia number (Alex is Slovenian) → US customer is ALLOWED** on Meta's sanctioned
Business Calling API. The catch: the US recipient must first tap "allow calls" (an in-app permission
opt-in) before you may call — so it can't be a true cold dial.

**Best move for WDIFY:** Do **NOT** build the unofficial WhatsApp voice go-around. Keep cold *voice* on
**SignalWire** (already live, 5 numbers, zero ban risk) and use WhatsApp only as a **message-then-inbound**
channel: text the link/offer over WhatsApp, let interested owners call/voice-note *back* (inbound is
unrestricted and ban-safe). If you ever want true outbound WhatsApp voice, do it the official way with a
**Slovenia sender + permission opt-in** — a warm-list tool, not a cold dialer.

---

## The four paths, scored

| # | Path | Verdict | One-line reason |
|---|------|---------|-----------------|
| 1 | whatsmeow / Baileys native call + audio (our own stack) | **DEAD** | No OSS lib streams call audio in-process; "Calls" is on whatsmeow's *not-implemented* list, Baileys closed it *not-planned*. |
| 2 | Non-US sender number (Slovenia/Mexico) within Meta's official rules | **VIABLE** | US block is on the *sender* country; a Slovenia number → US is allowed — but needs per-user opt-in, so not a cold dial. |
| 3 | Automate the real WhatsApp Android app + audio bridge | **PARTIAL** | Each half is proven (Appium tap, scrcpy/BCR capture, PhantomMic mic-inject) but it's a rooted phone-farm, real-time AI streaming is unproven, 15–30% ban risk. |
| 4 | Unofficial gateways (Wavoip / GREEN-API) | **PARTIAL** | Real two-way audio exists (GREEN-API WebRTC, single vendor) but QR-linked = high ban risk, undisclosed calling price, unverified at scale. |

---

## PATH 1 — whatsmeow / Baileys native call + audio ("our own stack")  →  **DEAD**

**One-line reason:** No open-source WhatsApp library places an outbound call and streams audio by itself —
the signaling is reverse-engineered but the in-process media path (SDP/SRTP over WhatsApp's relay) is
shipped by *nobody*.

**What the source actually proves:**
- **whatsmeow** (the library under GOWA): `call.go` has receive-only event handling + exactly one outbound
  action — `RejectCall`. There is **no place-call function, no SDP, no RTP/SRTP, no pion/webrtc, no STUN**.
  "Calls" is explicitly under *"Things that are not yet implemented."* Issue #555 (VoIP) open & unresolved
  since 2024; #1114/#1115 (WebRTC audio) filed and closed-as-duplicate in minutes — still just a request.
- The community fork (arugaz) people point to is **identical signaling + RejectCall** — grep for
  sdp/rtp/srtp/pion/webrtc/stun returns nothing. The "I made an offer func on my fork" claim is **not in
  the published code.**
- **Baileys** (JS): receive/reject events only. The calling ask (issue #40) was **closed "not planned."**
  `CALL_AUDIO_PREFIX` is just a constant URL string, not a media implementation.
- The two devs who *claimed* full audio on private forks (dannywynn, Manjit2003) **refused to publish** —
  unverified, no reproducible code.

**Concrete build (if you insisted):** Fork whatsmeow's signaling, bolt on **pion/webrtc** (Go), and
implement WhatsApp's STUN/relay handshake + SRTP key exchange yourself per the `bhavya32/WA-Calls` spec
(the protocol *is* documented: offer with 4× 32-byte SRTP keys/device, offer-ack with relay IP/port+token,
preaccept, 5× relaylatency STUN pings, transport node, accept → p2p tunnel). **No public reference
implementation exists to copy.** This is multi-week protocol RE work with no guarantee, on a moving target.

**Exact UNBLOCK:** There isn't a near-term one — this is "write the WhatsApp media stack from scratch."
The honest unblock is *don't*: route to Path 2 (official, non-US sender) or to SignalWire voice.

**Ban / legal risk:** N/A for the library itself (it can't call), but anything you build on top is
reverse-engineered access to WhatsApp = ToS violation + ban exposure the moment it works.

---

## PATH 2 — Non-US sender number within Meta's OFFICIAL rules  →  **VIABLE** (with a consent gate)

**One-line reason:** WhatsApp's US block on business-initiated calling is keyed to the **sender business
number's country**, not the recipient's — so a **Slovenia** (Alex is Slovenian) or Mexico number can
legitimately call US customers on Meta's *official* Business Calling API, no go-around needed.

**What the source actually proves (high confidence — Twilio + Infobip + 8x8 all quote Meta verbatim):**
- Business-initiated calling is available for senders in **all** Cloud-API countries **except senders
  whose number is US, Canada, Egypt, Nigeria, Turkey, Vietnam.**
- Quoted across providers: *"The business phone number's country code must be in this supported list. The
  consumer phone number can be from any country where Cloud API is available."*
- Therefore: **Slovenia → US customer = ALLOWED.** Mexico → US = ALLOWED. US number → anyone = BLOCKED.
- This is fully official → **zero ban risk**, real SDP/SRTP audio (Meta sends the OFFER, your AI returns
  the ANSWER), works via Twilio / Telnyx / 360dialog / Infobip / Pipecat BSP wrappers and bridges over
  **SIP to Gemini Live / Mia / Mia** cleanly.

**The catch that makes this not-a-cold-dialer:** Business-initiated calls require the customer to **first
grant in-app call permission** (a WhatsApp "call permission request" template), valid ~1 call / 72h, max
1 request/24h. You **cannot cold-call a US WhatsApp user out of the blue** even from a Slovenia number —
you must get the opt-in first. Plus eligibility: the WABA number needs Business verification + a messaging
tier of ≥2,000 business-initiated conversations/24h.

**Concrete build:**
1. Register a **Slovenia** WhatsApp Business number (Alex's real geography — clean, not a workaround optics
   problem) on a BSP that exposes Business Calling over SIP (Twilio or Telnyx are turnkey to an AI agent).
2. Complete Meta Business verification; get the number to the 2,000/24h tier.
3. Send the **call-permission request template** to a lead (this is a *message*, so it rides 10DLC-style
   messaging consent, not voice).
4. On permission grant → place the call → bridge Meta's SIP leg to **Mia (Gemini Live)**. Real two-way
   audio, fully sanctioned.

**Exact UNBLOCK:**
- (a) A **non-US WhatsApp Business number** (Slovenia via Alex) + Meta Business verification on it.
- (b) A BSP account with Business Calling enabled (Twilio/Telnyx) — *this is the API key/credential
  blocker; everything else is buildable around it.*
- (c) Accept that step-1 is always a **WhatsApp message asking permission**, so the funnel is
  message → opt-in → call, **not** cold dial.

**Ban / legal risk:** **None** on the WhatsApp side (official API). TCPA/consent still applies to US
recipients as conduct, but the opt-in step gives you a clean consent trail (arguably *better* TCPA posture
than the SignalWire cold dial).

---

## PATH 3 — Automate the real WhatsApp Android app + audio bridge  →  **PARTIAL** (rooted phone-farm, grey)

**One-line reason:** Every individual piece is proven to work, and one real service (siptowhatsapp) shows
the full chain *can* run — but it requires **ROOT + Xposed on physical phones** (not a clean emulator),
real-time AI streaming into the hooked mic is engineering-not-turnkey, and it's a 15–30%-ban, ToS-breaking
play.

**What the source actually proves:**
- **Tap the call button:** Appium/ADB driving real `com.whatsapp` — VERIFIED trivial.
- **Capture the other party's audio (downlink):** scrcpy 2.x `voice-call`/`voice-call-downlink` sources —
  VERIFIED in a real-call test; **but** the *default* scrcpy path dies the instant a call starts (Android
  gives VoIP apps exclusive audio focus), so you must use the **privileged VOICE_\* sources = root**.
  `chenxiaolong/BCR` proves rooted call capture works.
- **Inject Mia's voice (uplink/mic):** the hard wall. No public Android API replaces the call mic; scrcpy
  is output-only. The working solution is **PhantomMic** (LSPosed/Xposed module that native-hooks
  `AudioRecord`) — README lists **WhatsApp ✔ Working** — but it's designed to feed a **pre-recorded file
  one-way**; continuous real-time AI streaming into it is *your* engineering, not proven turnkey.
- **Full chain proof:** `assegaf/siptowhatsapp` = a SIP↔WhatsApp bridge on cheap rooted phones, both
  directions. But it's sold as a managed per-minute service, ~2020-era, and the author **prohibits
  voice-broadcast/IVR/automation** (i.e. exactly cold-calling) due to ban risk, and demands a 1-month-old
  "normally used" account.

**Concrete build:** A rack of cheap **rooted physical Android phones** (not emulators — emulator
fingerprint = ban + the privileged audio path is unreliable), each running Magisk + LSPosed + PhantomMic
(modded to stream from Mia instead of a file) + scrcpy VOICE_DOWNLINK capture + Appium to tap the call
button, all bridged to Gemini Live. One warmed WhatsApp account per phone, number-rotation pool.

**Exact UNBLOCK:**
- Rooted physical-phone farm + Magisk/LSPosed flashed.
- **Engineering work to convert PhantomMic from file-playback to a real-time audio sink fed by Mia** — this
  is the make-or-break, unproven component.
- A pool of warmed, aged WhatsApp accounts on residential/mobile IPs (datacenter IPs = instant flag).

**Ban / legal risk:** **HIGH.** Proactive bots contacting new numbers = **15–30% ban over 12 months**
(measured for messaging; calling is "high by strong analogy"). Cold automated *calling* hits every flag —
high report velocity, location/number mismatch, low answer rate. Driving the real app avoids *mod-APK*
bans but not *behavioral/report* bans. Plus ToS violation. Not worth it for a legit brand (WDIFY).

---

## PATH 4 — Unofficial gateways (Wavoip / GREEN-API)  →  **PARTIAL** (works, single-vendor, high ban risk)

**One-line reason:** Real two-way WhatsApp audio to arbitrary numbers genuinely exists in the grey market —
but effectively only **one** credible vendor (GREEN-API), on a QR-linked personal account = high ban risk,
undisclosed calling price, and unverified at scale.

**What the source actually proves:**
- **GREEN-API** publishes `whatsapp-api-calls-client-js` (WebRTC + WebSockets, encrypted, low-latency).
  `startCall('<number>')` to an arbitrary number, `remote-stream-ready` event gives you the callee's audio
  stream → you can pipe **Mia TTS in / STT the remote out**. This is *genuine two-way audio*, not signaling
  only. **Auth = scan a QR to link a normal WhatsApp mobile account** (the unofficial reverse-engineered
  path). Status: real architecture (open code + demos), **not independently verified at scale**, calling
  price **undisclosed**.
- **Wavoip + voice-calls-baileys** is the other one, but its library is **not a media stack** — it
  RPC-proxies your WhatsApp creds to **Wavoip's closed paid cloud**, which does the actual SDP/SRTP audio.
  Per-channel paid, closed, ban-prone.
- The big OSS libs (Baileys/whatsmeow/WAHA/Evolution) are **messaging-only** — "send audio" there = a voice
  *note* (a file), **not a call.** Don't confuse the two.
- **Jan 15, 2026 ToS update explicitly bars third-party AI chatbot distribution on WhatsApp** — adds a
  *policy* ban vector on top of the technical one.

**Concrete build:** Burner number → GREEN-API control panel → QR-link it → run the calls-client demo →
bridge its local/remote WebRTC streams to **Gemini Live (Mia)** instead of an `<audio>` element. Plan for
**number churn**: warming + a rotation pool, because QR-linked accounts get banned in ~2–8 weeks and cold
outbound calling is the fastest ban path.

**Exact UNBLOCK:**
- A **burner WhatsApp number** to QR-link (never a number you care about).
- **A written calling tariff from GREEN-API** (price is the unknown — get the quote before committing).
- A pilot: place 10 real test calls, confirm audio both ways + connect rate before scaling.
- A number-rotation/warming pool to survive the 2–8wk ban expectancy.

**Ban / legal risk:** **HIGH and inherent** (QR-linked personal account is exactly what Meta hunts), made
worse by cold-outbound-calling (top report-velocity pattern) and the Jan-2026 chatbot ToS ban. Fine for a
*disposable pilot*, **not** a stable production caller for a brand you're building.

---

## RECOMMENDED PATH (don't end on "no" — here's the best available)

### The honest verdict
**Outbound WhatsApp voice to US cold leads via "our own stack" is not worth building.** Path 1 is dead,
Path 3/4 are rooted-phone-farm / single-vendor grey plays with 15–30% ban rates that would torch the WDIFY
brand, and the only *clean* path (Path 2) requires a per-user opt-in — so it's never a true cold dial.
Meanwhile we already have a **zero-ban, live, working cold-voice channel: SignalWire** (5 numbers, geo-matched).

### The best available path = the SignalWire-voice + WhatsApp-message-then-inbound combo

1. **Cold voice stays on SignalWire.** Mia cold-calls the 742 US leads from the matched-metro SignalWire
   number. No WhatsApp, no ban risk, already deployed. (Spam-labeling is a *separate* fix — see
   `VOICE-SPAM-10DLC.md` — but it's a known, solvable carrier problem, not a ToS landmine.)

2. **WhatsApp is a MESSAGE + INBOUND channel, never an outbound cold dialer.**
   - Send the offer/site-link over WhatsApp (text), which rides messaging consent (10DLC-style), not the
     voice block.
   - **Inbound is unrestricted and ban-safe:** an interested owner who *calls or voice-notes you back* on
     WhatsApp is 100% fine — receive/answer is exactly what the OSS libs (whatsmeow/GOWA) *can* do. Wire
     Mia to *answer* inbound WhatsApp interest. This flips the one thing the libraries genuinely support
     into the value path.

3. **If/when you want true outbound WhatsApp voice → do Path 2 the official way.** Register a **Slovenia**
   WhatsApp Business number (Alex's real nationality — clean, not a dodge), get Meta verification +
   Business Calling via Twilio/Telnyx over SIP to Mia, and run it as a **warm-list / opt-in caller**: send
   the WhatsApp call-permission request, and the moment an owner taps "allow," Mia calls. That's a
   *re-engagement / booked-callback* tool, not a cold dialer — and it's fully legal with a clean consent
   trail.

**Why this is the right call (3-CEO gate):**
- **Hormozi (money):** SignalWire cold-voice is already producing — don't stall revenue chasing a grey
  build with a 1-in-4 ban rate. WhatsApp-message + inbound-answer *adds* a free channel today.
- **Amodei (smarter):** the opt-in WhatsApp path (Path 2) gives a clean consent + intent signal per lead —
  better data than a cold blast, and it compounds into the lead-quality model.
- **Brunson (next step):** every touch has a clear next action — cold call (SignalWire) → if no answer,
  WhatsApp the link → interested owner messages/voice-notes back → Mia answers. Funnel intact, no dead end.

---

## The single UNBLOCK that matters
If you want to keep WhatsApp purely as message-then-inbound (recommended now): **nothing is blocked** — the
GOWA/whatsmeow stack already *answers* inbound and *sends* messages. Ship it.

If you want true official outbound WhatsApp voice later: the blocker is **(a) a non-US (Slovenia) WhatsApp
Business number + Meta Business verification, and (b) a BSP (Twilio/Telnyx) Business-Calling credential** —
that's the API-key/account gate. Build the SIP→Mia bridge and the permission-request template *around* it
now so it's plug-and-play the day those land.

*Never the cold dial. Always the opt-in. Always SignalWire for the cold reach.*
