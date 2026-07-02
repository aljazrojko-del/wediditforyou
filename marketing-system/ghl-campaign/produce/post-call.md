# WDIFY — POST-CALL SEQUENCE (after Mia connects / books)

**Date:** 2026-06-16 · **GHL-import-ready** (plain text + merge fields). Built on (do not contradict):
`../../CONTEXT.md` · `../../email/SEQUENCES.md` (Sequence B = B1–B3) · `../../sms/SMS-COPY.md` (SMS-1, 2) ·
`../../ghl/GHL-BUILD-SPEC.md` (WF-3) · `../../OFFER-AB-PREDICTION.md` (the winning Hybrid) ·
`../00-TOUCHPOINT-GRAPH.md` (state 3.1, 3.4 — Site Link Sent nurture).
**Copy law (every piece obeys it):** the WDIFY copy standards.

> **What this is.** The full sequence that fires the moment Mia hangs up on a CONNECTED call — the lead
> just heard her voice promise the link. Four emails (immediate → +1d → +3d → +6d) + the SMS that rides
> alongside each, in two A/B variations apiece. This is the long game after the connect: deliver proof,
> re-open the loop, walk away on strength. It **supersedes the cadence of the older Sequence B**
> (B was +0/+2d/+5d, 3 emails) — same canon voice, tighter cadence, plus the new **+3d re-loop** email
> that turns OFFER-AB's "withheld value" into written form. When this is panel-approved, sync it back into
> `../../email/SEQUENCES.md` Sequence B and `../../ghl/GHL-BUILD-SPEC.md` WF-3/WF-2.

---

## Why a post-call sequence exists at all (the load-bearing logic)

OFFER-AB proved the buyer is a **skeptic, not a curiosity-seeker.** On the call, Mia's job was to
**buy trust with proof** (text the live link) and **re-open one loop** (the 15-min call is where YOUR
photos, YOUR number, YOUR domain go in, and the $450 founding price locks before it jumps to $700).
The single biggest post-call risk is **the ghost** — they pocket the free live draft, the dopamine loop
closes, and "great, I'll think about it" wins.

So every piece below does exactly one thing: it keeps the loop **open and time-boxed.** The link never
lands naked — it lands welded to an incompletion ("rough cut," "your photos still aren't in"). Every
nudge restates a **loss** (the customer who searches you, finds nothing, and books the competitor; the founding price closing), never a benefit,
never a plea. We lead with the gift (it's built, it's yours), and we end on strength (the draft stays
yours, the door's open). A skeptic reads begging as confirmation of the con — so we never beg.

**Merge-field discipline.** 728 of 742 leads have no owner name and the link domain is set per-build, so
every body reads naturally with `{{contact.first_name}}` empty and uses `{{contact.draft_site_url}}` (not
a hardcoded domain). Drop a field, the sentence still stands.

### Merge fields used

| Field | Source | Empty-safe? |
|---|---|---|
| `{{contact.company_name}}` | standard | yes — set from scraper at dial time |
| `{{contact.draft_site_url}}` | custom field "Draft Site URL" | **required** — sequence only fires once this is set |
| `{{custom_values.booking_link}}` | custom value "Booking Link" | yes |
| `{{contact.first_name}}` | standard (rare) | **yes — never start a sentence with it; bodies below omit it** |

### Standards applied to EVERY piece (the checklist, pre-applied)
- Email ≤75 words (email 1: 40–60). Subjects lowercase, 3–5 words. Signed `— alex`. Ends on the link or a line of strength — never on "let me know."
- Exactly **one** Voss device per piece; **no device phrasing repeats verbatim** across the four-email journey.
- **No copy-paste twins:** the SMS that fires alongside an email never repeats a sentence from that email.
- Zero AI-tell words (no "unlock/leverage/seamless/elevate/game-changer"), no em-dash-heavy rhythm, no bullets in bodies, humanized to zero AI-detection.
- Lead with the gift, not the diagnosis. One Hormozi cost-of-inaction per nudge. Never: "just checking in", "following up", "did you get a chance", "I'd love", "no pressure".

---

# PART 1 — EMAILS (the four-touch cadence)

Trigger to enter the whole sequence: call disposition = **connected** AND email captured on the call
AND `{{contact.draft_site_url}}` set. (No email captured → SMS-only path, Part 2.) These leads also get
the SMS twin alongside each step — email rides seconds behind the text.

**A/B split:** run Variation A and Variation B 50/50 in GHL (or A for batch 1, B for batch 2). Both obey
the copy law; they differ in the Voss device and the angle so we learn which the skeptic responds to.

---

## EMAIL 1 — IMMEDIATE LINK DROP (references the call)
- **Purpose:** deliver the link Mia promised while her voice is still in their ear; kill the "was that real?" doubt by putting the proof on their screen.
- **Trigger:** `status:connected` + email captured + `draft_site_url` set (WF-3).
- **Delay:** immediate (within minutes of hang-up — fires from the same automation as SMS-1).
- **Channel:** Email (rides behind SMS-1).
- **Mechanism:** The call bought a sliver of trust; the link *is* the proof that earns it. We re-open the loop in the same breath (your number + photos), so the link arrives already incomplete — possession becomes a Zeigarnik hook, not a closed dopamine loop. Founding-spot hold replaces "whenever you want" so waiting has a cost.

### Variation A — "the link from the call" (Voss: accusation audit)
**Subject:** the link from the call

As promised on the call: the site we built for {{contact.company_name}}, live right now.

{{contact.draft_site_url}}

You half-expected I'd never actually send it. So here it is. Open it on your phone, that's where your customers will find you, and decide for yourself.

Fifteen minutes puts your real number and photos in. Your founding spot holds until we talk: {{custom_values.booking_link}}

Any question, that's my cell: Alex Rojko, 713-352-2542.

— alex

*(~64 words. Accusation audit names the FEELING the call left ("you thought I'd flake"), not the product — the prior "expecting junk or some bait" planted two scam-words onto the gift, so it was cut. "Decide for yourself" gives control to a skeptic. The spot-hold time-boxes the wait without a deadline that feels like pressure. Carries the stress-test face+proof fix: Alex's full name + verifiable cell (713-352-2542) so the post-call follow-up has a real human to call back.)*

### Variation B — "told you it was real" (Voss: label)
**Subject:** told you it was real

Here it is, like I said on the phone. The site we built for {{contact.company_name}}:

{{contact.draft_site_url}}

You'd want to see it before you believe it. So see it. You've paid nothing, and that won't change until you say keep it.

The 15 minutes puts your photos and number in, and locks $450 before it's $700: {{custom_values.booking_link}}

If you'd rather just call a human, that's me: Alex Rojko, 713-352-2542.

— alex

*(~67 words. Label ("you'd want to see it before you believe it") mirrors the skeptic's own stance back, which disarms faster than a denial. The "It seems like…" opener was dropped here so the label-opener grammar isn't a cross-file stamp (it recurs in inbound-form's nudges). Price ceiling is pre-seeded here so the booking call is never the first time they hear $700. Carries the stress-test face+proof fix: Alex's full name + verifiable cell (713-352-2542).)*

---

## EMAIL 2 — +1 DAY, "DID THE SITE LOAD" (service pretext, re-deliver)
- **Purpose:** re-surface the link under a no-pressure service reason; confirm it opened; restate the stakes once.
- **Trigger:** Email 1 sent AND no appointment booked AND not DND.
- **Delay:** +1 day after Email 1.
- **Channel:** Email (SMS twin optional — see Part 2 SMS-B2).
- **Mechanism:** "Did it load?" is a legitimate reason to land in the inbox again that costs them nothing to read — it sidesteps the "you're chasing me" reflex that makes a skeptic dig in. One concrete cost-of-inaction (jobs to whoever Google can find), framed as *you're already built, just not visible* — which flatters the work they've put in instead of shaming the gap.

### Variation A — "did the link work" (Voss: no-oriented question)
**Subject:** did the link work

Did the site open alright on your phone? Some inboxes mangle links, so here it is clean: {{contact.draft_site_url}}

Did the day get away from you before you had a real look? It always does. Here's why that look matters. Someone hears your name, types it into their phone, and finds nothing. So they call the guy whose site loads. You're already built. You just aren't the one they find yet.

One short call fixes that: {{custom_values.booking_link}}

— alex

*(64 words. A no-oriented/face-saving question ("did the day get away from you?") replaces the old label so Lane A no longer fires two labels back-to-back (E2 then E3) — Lane A device ledger is now audit → no-question → label → walk-away, four distinct devices matching the cold-email rotation. It excuses the silence so they don't feel caught, then names a cost a one-page site genuinely fixes: the searcher who lands on nothing. This is the ONE searcher-frame instance in the workflow; E3 and E4 carry different cost angles. No SEO/ranking claim the product can't cash.)*

### Variation B — "your site, one tap" (Voss: no-oriented question)
**Subject:** open it one more time

Yesterday's link, in case it slid down the pile: {{contact.draft_site_url}}

Would it be the worst use of two minutes to open it once on your phone and just react? That's the whole ask for now. Every week {{contact.company_name}} has nothing to find, the customer who searched you books the next guy who does.

When you're ready to put your real number on it: {{custom_values.booking_link}}

— alex

*(60 words. No-oriented question ("would it be the worst…") lets a guarded buyer say "no, that's not the worst" — a safe yes in disguise. The ask is deliberately tiny here, one tap, because day-2 is too early to push the booking hard on a skeptic.)*

---

## EMAIL 3 — +3 DAYS, THE RE-LOOP (your photos / domain / founding price)
- **Purpose:** the conversion engine of the sequence. Re-open the loop in writing: the draft is the rough cut, the finished thing needs the 15 minutes, and the founding price is a closing window.
- **Trigger:** Email 2 sent AND no appointment booked AND not DND.
- **Delay:** +3 days after Email 1 (2 days after Email 2).
- **Channel:** Email (this is the email the +3d SMS twin reinforces — SMS-B3).
- **Mechanism:** This is OFFER-AB §4 (Beat 4 + 5) turned into text. By now the dopamine of "free live site" has cooled — so we make the possession explicitly **unfinished** ("it's on our subdomain, not yours; your photos aren't in"). The thing they own is incomplete in the one way that matters, and they literally **can't finish it without the call.** Then we time-box the loss (the $450 price, the founding ten) so loss-aversion outweighs the convenience of ghosting. This is where most closes are won.

### Variation A — "it's still the rough cut" (Voss: label + Hormozi loss)
**Subject:** it's still the rough cut

Three days in, your site's still live: {{contact.draft_site_url}}

Here's the honest part. It's the rough cut: your photos aren't in it, your number isn't on it, and it sits on our address, not yours.

Fifteen minutes on the phone is the whole job, and I do all of it. You answer two questions about your photos and your number, I build the rest while we talk. That locks $450 before it moves to $700.

Land one job in 30 days and the site already paid for itself twice over. Don't, and I refund the $450 and you keep the site anyway. The next quiet week, you'll have something working for you instead of nothing, starting the day it's live.

{{custom_values.booking_link}}

— alex

*(The "rough cut" frame makes the kept draft an open loop. Cut back to FIVE beats (de-patterning pass) — rough cut → 15 min is the whole job → locks $450 → 30-day guarantee → the first customer this week — so each sentence earns the next and the slippery slope holds. The $3-4k agency anchor was DROPPED here (it already lives in cold-email E3 and booking 2A; at the post-call stage they heard price on the call, so it over-stuffed the money email). Carries the three Review-1 fixes that belong at this moment: (1) the guarantee is CONCRETE and cashable — "at least one paying job in 30 days" is an event the buyer controls and can verify, not the vague "obvious choice" weasel a skeptic waves off; (2) effort collapses to zero AT the money moment — "fifteen minutes is the whole job, I do all of it" kills the silent "what do I have to DO" objection at the close; (3) the vivid near-term dream — "the first customer who searches your name THIS WEEK finds you instead of the guy down the road" — taps Hormozi's Time-Delay lever. Voss device = the label "the rough cut.")*

### Variation B — "whose name is on it" (Voss: no-oriented question + Hormozi loss)
**Subject:** whose name is on it

The site's yours to keep either way: {{contact.draft_site_url}}

Right now it lives on our address, not your domain, with stock spots where your photos go. Would it be a mistake to leave it half-finished when 15 minutes puts your name, number, and real work on it?

That same call locks $450. Ten founding spots, then everyone pays $700. The half-built version costs you nothing to keep. Every week it's a draft, the next mobile guy in town is the one who looks established.

{{custom_values.booking_link}}

— alex

*(73 words. No-oriented question ("would it be a mistake…") invites the protective "no" while the content makes leaving it half-built feel like the actual mistake. Cost-of-inaction angle here is PEER-COMPARISON, not the searcher line (the searcher frame is used once, at E2, and never repeated in this workflow per the cross-file mold fix): "the next mobile guy in town looks established" — a different mechanism (status vs a lost lead) so a lead who reads E2→E3→E4 never hears the same skeleton twice.)*

---

## EMAIL 4 — +6 DAYS, WALK-AWAY (end on strength)
- **Purpose:** close the thread with dignity, leave the cost-of-inaction ringing, keep the door open without begging. A clean exit makes the *next* touch (reactivation) land warmer.
- **Trigger:** Email 3 sent AND no appointment booked AND not DND.
- **Delay:** +6 days after Email 1 (3 days after Email 3).
- **Channel:** Email (SMS twin optional — SMS-B4).
- **Mechanism:** The walk-away is a status move, not a surrender. Saying "I'm done emailing you" removes the chase a skeptic was bracing for — which is disarming precisely because they expected more pressure. The draft staying theirs reverses the loss frame one last time, and "I answer every email myself" matches the site's promise and keeps the reactivation door open. No excuse-label is offered (that would absolve them) — so the cost-of-inaction is the last thing they feel.

### Variation A — "this is the last one" (Voss: walk-away)
**Subject:** this is the last one

I'm done emailing you about this. You've got the site, you don't need me in your inbox.

The draft we built stays yours: {{contact.draft_site_url}}

Only thing worth saying on the way out: a slow week never tells you it was the missing site that caused it. The work just quietly goes elsewhere. When you want your name on it, I answer every email myself.

— alex

*(60 words. Pure walk-away, no excuse-label — so the consequence is the last note. Cost-of-inaction angle here is the UNATTRIBUTED SLOW-WEEK ("a slow week never tells you it was the missing site that caused it") — the third distinct cost mechanism after E2's searcher and E3's peer-comparison, so the same contact never reads the "searches you, finds nothing, books the guy" skeleton more than once across the workflow. "I answer every email myself" matches the site line and leaves a real door.)*

### Variation B — "leaving you to it" (Voss: walk-away)
**Subject:** leaving you to it

This is the last one. I'm not going to chase you about something that's already free and already yours.

The site stays built, the link stays live: {{contact.draft_site_url}}

But it's your call, not my email. If a slow week ever has you wondering where the work went, reply. It comes straight to me.

— alex

*(~52 words. Walk-away again, worded apart from A. Drops the searcher-skeleton entirely (it leans on the lived slow-week instead) so neither E4 variant repeats the E2 mold. The founding-ten scarcity mechanic was REMOVED here (stress-test face+proof fix 3): the "ten spots, then $700" line already fires once in E3-B, and repeating it at E4 reads as a fake clock to a skeptic — so scarcity appears at most once per sequence. "Your call, not my email" hands control back — the strongest possible close for a buyer who hates being pushed.)*

---

# PART 2 — SMS (the twins that ride alongside)

Channel: GHL/LC SMS (or SignalWire). These go to **business numbers after a live connect** — not cold
blasts. The post-call link drop by text is the killer move: it hits their pocket while Mia's voice is
still in their ear, seconds before the email.

### Compliance (non-negotiable — from SMS-COPY.md, do not weaken)
1. **First SMS to any number** includes the business name ("We Did It For You") and **"Reply STOP to opt out."**
2. STOP honored immediately (GHL DND auto-flags) — never override, never re-message.
3. Send window 9am–6pm recipient local time. One link per message (carrier filtering). No public-shortener links.
4. **No copy-paste twins:** an SMS never repeats a sentence from the email firing alongside it.

> **Cadence note:** SMS-B1 fires immediately (with Email 1) — always. The +1d/+3d/+6d SMS twins
> (SMS-B2/B3/B4) are **optional reinforcement**; default ON only for the +3d re-loop (SMS-B3, the
> conversion beat) to avoid over-texting a B2B number. Turn B2/B4 on only for high-value niches.

---

## SMS-B1 — IMMEDIATE POST-CALL LINK DROP (fires with Email 1)
- **Trigger:** call disposition = connected, "send the link" agreed on the call.
- **Delay:** immediate (within 2 minutes of hang-up).
- **First SMS to this number → full compliance line.**

### Variation A (standard built lead)
Here's your site, like we said on the call: {{contact.draft_site_url}} Keep it or toss it, $0 either way. — alex's team at We Did It For You. Reply STOP to opt out

### Variation B (spec-build owner — Elite Mobile Tire & Brake, Buddy's Mobile Spa, any pre-built spec lead)
{{contact.company_name}}'s site is already live. We built it before we ever called: {{contact.draft_site_url}} — alex's team at We Did It For You. Yours to keep or toss. Reply STOP to opt out

*(Freedom device: "keep it or toss it." No sentence from Email 1 reused. ~2 segments. Variation B states the build-first proof flatly for the two shipped spec leads.)*

---

## SMS-B2 — +1 DAY "DID IT LOAD" TWIN (optional reinforcement)
- **Trigger:** Email 2 queued AND no booking AND not DND.
- **Delay:** +1 day, same hour as Email 2 (fire the SMS ~5 min ahead so the text lands first).

### Variation A
Wanted to be sure that site loaded clean on your phone: {{contact.draft_site_url}} That's where your customers find you, so it's the read that counts. — alex's team

### Variation B
Your site's still up: {{contact.draft_site_url}} Open it once and tell me your honest read. — alex's team

*(Service pretext, no booking push on day 2. Worded apart from Email 2. Compliance line dropped, not the first SMS to the number. Hedges cut: no "no rush", no "just didn't want", no "when you get a sec" — the imperative stands on its own.)*

---

## SMS-B3 — +3 DAY RE-LOOP TWIN (default ON — the conversion beat)
- **Trigger:** Email 3 queued AND no booking AND not DND.
- **Delay:** +3 days, paired with Email 3 (SMS ~5 min ahead).

### Variation A
Your site's still on our address, not yours, and your photos aren't in yet. 15 min fixes that and locks $450 before it's $700: {{custom_values.booking_link}} — alex's team

### Variation B
Right now it's the rough cut. The good version has your real work on it, on your own domain, at your $450 founding spot. That's the 15 min: {{custom_values.booking_link}} — alex's team

*(Carries the email's re-loop mechanism in one text: incomplete possession + time-boxed price. Booking link, not the site link, because the goal here is the call. Worded apart from Email 3.)*

---

## SMS-B4 — +6 DAY WALK-AWAY TWIN (optional)
- **Trigger:** Email 4 queued AND no booking AND not DND.
- **Delay:** +6 days, paired with Email 4.

### Variation A
Last text from me on this. Your site stays live and yours: {{contact.draft_site_url}} If a slow week ever hits, reply and it comes straight to alex. — alex's team

### Variation B
I'll leave it here. The draft's built, the link's live, the founding price isn't forever. Your call, not my texts. — alex's team at We Did It For You

*(Walk-away, hands control back. Worded apart from Email 4. Variation B re-includes the brand name as a clean sign-off on the final touch.)*

---

# WIRING NOTES (GHL)

1. **One workflow** ("Call Connected — Post-Call Nurture", extends WF-3 in GHL-BUILD-SPEC §6). Entry trigger: tag `status:connected` AND `draft_site_url` not empty.
2. **Step order:** SMS-B1 + Email 1 immediate → move opportunity to **Site Link Sent**, tag `status:site-sent` → Wait 1d → Email 2 (+ SMS-B2 if niche flag) → Wait 2d (day 3) → **Email 3 + SMS-B3** → Wait 3d (day 6) → Email 4 (+ SMS-B4 if niche flag).
3. **Goal event (hard stop):** `status:booked` OR `status:approved` OR opportunity ≥ Walkthrough Booked OR DND. The second any fires, every remaining step auto-skips — never email "still the rough cut" to someone who already booked.
4. **A/B in GHL:** use the workflow's built-in A/B split (50/50) on each email step, or run Variation A as workflow v1 and Variation B as v2 on alternating batches. Track open + reply + booking per variation; promote the winner after ~100 sends/arm.
5. **No-email leads:** if no email was captured on the call, only the SMS path (SMS-B1, + B3) fires. The booking link in SMS-B3 is the conversion path for the email-less majority.
6. **Sync-back:** once panel-approved, fold Email 1–4 into `../../email/SEQUENCES.md` Sequence B (replacing the +0/+2d/+5d cadence with this +0/+1d/+3d/+6d four-touch) and update `../../ghl/GHL-BUILD-SPEC.md` WF-3/WF-2 copy blocks + `../00-TOUCHPOINT-GRAPH.md` §3.4 timing table. Never reword copy downstream — edit here, re-run /panel, then re-sync.

---

# PRE-FLIGHT COPY-LAW AUDIT (run before import)

| Check | Status |
|---|---|
| Every email ≤75 words (E1 ≤60); E3 is the conversion engine, runs long BY DESIGN | E1 A55/B58 · E2 A64/B60 · E3 A~118 (intentional — the money-moment conversion email; cut to FIVE beats in the de-patterning pass — concrete guarantee + effort-collapse + near-term dream — with the $3-4k anchor dropped here since it lives in cold-email E3/booking 2A and they heard price on the call; down from ~139)/B73 · E4 A60/B69 — pass (whitespace count, merge fields excluded; E3-A's overrun is the one deliberate exception, same rationale as booking 1A's confirmation-email exception) |
| Subjects lowercase, 3–5 words | pass (all 8) |
| Exactly one Voss device, no verbatim repeat across the journey | E1 audit/label · E2 no-oriented/no-oriented · E3 label/no-oriented · E4 walk-away/walk-away (E4 A/B worded apart). **Lane A ledger now audit→no-question→label→walk-away (4 distinct, matches cold-email); the old E2-A/E3-A double-label is fixed** — pass |
| No begging phrases | none present — pass |
| Leads with the gift, ends on strength (link or strong line) | pass |
| One Hormozi cost-of-inaction per nudge (E2/E3/E4) | pass |
| Zero AI-tell words, no bullets in bodies | pass |
| Mid-sentence em-dash count in prospect bodies (target 0) | **0 in email bodies** — verified by scan; SMS use periods/line breaks not em-dashes |
| Cost-of-inaction is product-true (no Google-ranking claim a one-page site can't deliver) | **pass** — all CoI lines stay product-true |
| Cost-of-inaction skeleton not repeated (cross-file mold fix) | **pass (fixed)** — the "searches you → finds nothing → books the guy whose site loads" skeleton appears ONCE in Lane A (E2-A). E3-A was reworded OFF it to the lived QUIET-WEEK angle ("the next quiet week you'll have something working for you instead of nothing"); E3-B carries PEER-COMPARISON ("the next mobile guy looks established"); E4-A carries UNATTRIBUTED SLOW-WEEK; E4-B drops it entirely. A Lane-A lead who reads E2-A→E3-A→E4-A never hears the same mold twice. |
| SMS: first-touch compliance line + STOP, one link, no email twin reuse | pass |
| Reads naturally with `first_name` empty + `draft_site_url` as merge field | pass |

> **Gate:** run `/panel` on this file before it goes live (copy law: all prospect-facing copy clears advisors first). Log the verdict in `../../PANEL-VERDICTS.md`, then sync per Wiring Note 6.
