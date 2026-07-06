# WDIFY Launch — /panel Verdict Record (2026-06-12)

Two packs went through /panel (3 lenses each: Hormozi · Voss · Human/anti-template).
Every issue below was checked against the CURRENT files after fixes were applied.
Copy law: Hard Rule 0.5 — no outbound copy ships without a /panel PASS.

| Pack | Files reviewed | Panel final verdict | State of cited issues today |
|---|---|---|---|
| mia | `mia/client_config_cold.json`, `mia/client_config_specbuild.json`, `mia/engine_config_cold.json`, `mia/CALL-SCRIPTS.md` | **PASS** | All 9 fixed and verified in current files |
| emailsms | `email/SEQUENCES.md`, `sms/SMS-COPY.md` | **FAIL** (at review time) | All 9 fixed in current files — **needs /panel re-run for the official PASS before any send** |

---

## Pack 1 — mia · final verdict: PASS

### Lens: Hormozi — verdict at review: FAIL → all issues fixed

| # | Issue found | Fixed? | Where the fix lives now |
|---|---|---|---|
| 1 | **Buried founding-ten scarcity** — pitch core named "$450 once" bare; the founding-ten frame and the $700 jump only fired in the price-objection branch most connects never reach. | YES | Pitch core in `client_config_cold.json` + `engine_config_cold.json` + `CALL-SCRIPTS.md` §3 now reads: "$450 once. That's the founding price for our first ten businesses, then it's $700 for good." Scarcity fires on every pitch, not just when asked. |
| 2 | **Zero scarcity at either close** — neither the cold close nor the spec-build close used the founding-ten countdown the live site runs ("Spot 3 of 10: Open"). | YES | Cold close: "that puts you inside our first ten. The $450 price locks the second it's built." Spec-build close: "You're one of our first ten, so that call locks the $450 founding price before it goes to $700." (`CALL-SCRIPTS.md` §5 + both configs' ON YES / close blocks.) |
| 3 | **Spec-build price had no anchor** — "$450 one time" stood naked, inviting the price objection. | YES | `client_config_specbuild.json` PRICE block: "$450 one time, less than most guys charge for a logo" + founding-ten frame + $700 jump. A cost-of-inaction block (3–5 jobs/week) was also added for first hesitation. |

### Lens: Voss — verdict at review: FAIL → all issues fixed

| # | Issue found | Fixed? | Where the fix lives now |
|---|---|---|---|
| 1 | **Robot/scam counter explained and never asked** — five sentences, ended on a statement (cold config + scripts; only spec-build had the closing ask). | YES | Cold versions now end "Would it be crazy to just look at it?"; spec-build ends "Want the link?" — every variant ends on an ask. |
| 2 | **Facebook objection ended weak in cold versions** ("...costs you nothing unless you keep it." — no pivot). | YES | All three files now end the counter "Want us to build yours?" (cold) / "want the link?" (spec-build). |
| 3 | **"How did you get my number" died on a statement** ("...so they keep scrolling."). | YES | All versions now pivot: "Want to be the one they stop on?" |

### Lens: Human / anti-template — verdict at review: FAIL → all issues fixed

| # | Issue found | Fixed? | Where the fix lives now |
|---|---|---|---|
| 1 | **KILLER — "$450 is about one job" math wrong for ~64% of the list** (groomers $80–120, barbers $40–75, detailers, cleaners — 476 of 742 leads instantly smell a template). | YES | Affordability counter now uses the week, not the job: "you're losing three to five jobs a week... $450 is less than one week of that. If the site can't pay for itself, don't keep it." True in every niche on the list. |
| 2 | **Spec-build config hardcoded BOTH niches in one line** ("mobile tire repair Lubbock, or dog groomer Lubbock") — mail-merge tell to either owner. | YES | `client_config_specbuild.json` now keys niche per business, the objection uses "[niche] in Lubbock", and an explicit rule was added: "Never mention the other business's niche on a call." |
| 3 | **Canned tie-back fired regardless of the answer** ("Whatever they answer, tie it back" + verbatim stat) — conversationally deaf. | YES | Discovery now mandates: mirror their last words first, bridge off what THEY said, separate branch for "booked solid" (better jobs, not more jobs), and the hard rule "Never drop the stat against an answer it doesn't fit." (`CALL-SCRIPTS.md` §2 + both pitch configs.) |

**Mia pack status: CLEARED FOR LAUNCH.** Panel PASS, all fixes verified present in the files Mia will actually run.

---

## Pack 2 — emailsms · final verdict: FAIL (at review) → fixed, awaiting re-run

### Lens: Hormozi — verdict at review: FAIL → all issues fixed

| # | Issue found | Fixed? | Where the fix lives now |
|---|---|---|---|
| 1 | **KILLER — founding-ten scarcity existed in 1 of 18 pieces** (D3 only), and Sequence D is parked until phase-2 domains. Every live channel shipped with zero price and zero scarcity. | YES | Scarcity now runs through every live sequence: A2 ("first ten at $450. After that it's $700"), A3 ("while founding spots last"), A4 ("ends at ten clients"), B1 ("founding spot at $450 holds until we talk"), C1 ("holds through this call"), C3 + SMS-5 ("still open"), D3 (unchanged). |
| 2 | **A2 sold the call's features, not the consequence** — no price anchor, no urgency before the close call. | YES | A2 now anchors $450 → $700 before the booking ask and closes on a no-oriented question ("Opposed to grabbing a time today?"). |
| 3 | **B1 granted permission to procrastinate** ("When you want your real photos and number in it..."). | YES | Replaced with the spot-hold: "Your founding spot at $450 holds until we talk" — waiting now costs something. (Noted in the file's own annotation.) |

### Lens: Voss — verdict at review: FAIL → all issues fixed

| # | Issue found | Fixed? | Where the fix lives now |
|---|---|---|---|
| 1 | **A1 defused its own accusation audit** ("You're probably wondering what the catch is. There isn't one."). | YES | The denial is gone. The audit stands and the proof answers it: "The next email answers that better than I could: your live link, before you've spent a dollar." |
| 2 | **A3 explained 3 sentences, asked nothing, ended on a bare link.** | YES | A3 now carries a question ("What's one job worth to you?") and ends on an imperative ("Grab the fifteen minutes:") — not a naked URL. |
| 3 | **A4 stacked two tension devices** (walk-away opener + "I'd feel weird") in 53 words. | YES | One device remains ("I'd feel weird not saying this plainly"); the finality moved to the subject line ("yours either way"). |

### Lens: Human / anti-template — verdict at review: FAIL → all issues fixed

| # | Issue found | Fixed? | Where the fix lives now |
|---|---|---|---|
| 1 | **"It seems like" opened sentences in 6 of 11 emails**, twice to the same recipient inside one thread (B2→B3, D2→D4). | YES | Now appears exactly once in the whole set (A3). B2 = "Busy week, I get it", D2 = "Pretty sure my last one got buried", B3/D4 rewritten. An explicit anti-template rule was added to the header: no Voss device phrasing repeats verbatim within one recipient journey. |
| 2 | **"Would it be a terrible idea" verbatim 3x** (A2, C2, D3) — twice in one A→C journey. | YES (in this pack) | A2 = "Opposed to grabbing a time today?", C2 = "would it hurt to move it instead of missing it?", D3 = "Any reason not to grab one before the price moves?". ⚠ Residual: the phrase still lives in `ghl/GHL-BUILD-SPEC.md` NDG-2 — see note below. |
| 3 | **Phone/photos/colors triplet stamped in identical order 5x** across A2, A3, C1, C2, SMS-3. | YES | Every instance now varies ("number and photos in" / "real number goes in, your own photos go up" / "swap in your real number and your own photos"); SMS-3 reworded entirely; the no-copy-paste-twins rule was added to SMS-COPY.md compliance block. |

**Emailsms pack status: FIXED, NOT YET CLEARED.** The panel verdict on record is FAIL; the fixes landed after the run.
Per Hard Rule 0.5, **re-run /panel on `email/SEQUENCES.md` + `sms/SMS-COPY.md` and log the PASS here before any send.**
(No send is imminent anyway — GHL is inactive and Sequence D is phase-2-gated.)

---

## ⚠ Out-of-scope finding logged during verification

`ghl/GHL-BUILD-SPEC.md` §6 embeds its OWN email/SMS copy set (ACK-1, DLV-1, NDG-1, NDG-2, LNK-1/2, BKG-1/2, RMD-1, NSH-1)
that overlaps the same touchpoints as the panel-reviewed SEQUENCES.md/SMS-COPY.md but with different, **never-panel-reviewed**
wording — and it still contains the exact patterns the panel failed: NDG-1 stacks "Seems like" + "I'd feel weird" (two devices),
NDG-2 uses "Would it be a terrible idea" verbatim. Before the GHL build hour: either replace the §6 copy blocks with the
SEQUENCES.md/SMS-COPY.md versions (recommended — one canonical copy set) or run the §6 copy through /panel separately.
See README.md → Gaps.

---

## FORMAL RE-RUN 2026-06-12 — Hard Rule 0.5 panel (Hormozi + Voss + anti-AI-detection), official record

Scope: `email/SEQUENCES.md` (14 emails A1–D4) · `sms/SMS-COPY.md` (SMS-1–5) · `ghl/GHL-BUILD-SPEC.md` §6 embedded copy (11 blocks).
Checklist applied per piece: banned begging phrases · ≤75 words · exactly ONE Voss device · lowercase 3-5 word subjects ·
ends on strength · zero AI-tell words · cost-of-inaction present · founding-ten $450→$700 scarcity not buried ·
offer facts vs CONTEXT.md · no bullets in bodies · sign-off "— alex".

### Per-file verdicts

| File | Verdict | Changes made this run |
|---|---|---|
| `email/SEQUENCES.md` | **PASS** | None — clean as found |
| `sms/SMS-COPY.md` | **PASS** | None — clean as found |
| `ghl/GHL-BUILD-SPEC.md` §6 | **FAIL as found → fixed → PASS** | All 11 copy blocks replaced with verbatim approved canon (see below) |

### SEQUENCES.md — PASS detail
Word counts 29–65, all ≤75. Subjects all lowercase 3-5 words. One Voss device per piece, no stacking:
accusation audit (A1, B1, D1) · label (A3, B2, C1, D2) · no-oriented question (A2, C2, C3, D3) ·
"I'd feel weird" (A4) · walk-away (B3, D4 — the law's Day-7 device). Zero banned phrases, zero AI-tells,
no bullets, every piece ends on link/imperative/"— alex". Scarcity live in A2/A3/A4/B1/C1/C3/D3;
cost-of-inaction in A3/A4/B2/B3/D3/D4 (A1, C2 are transactional acks where it would be forced — accepted).
Offer facts match CONTEXT.md exactly: build-first, $0 until approve, 24h-or-free, keep the draft, $450 founding-10 → $700.
D1 correctly has no links. Anti-template rule honored: no device phrasing repeats verbatim inside one journey.

### SMS-COPY.md — PASS detail
Compliance lines on first-touch (SMS-1/2/3), one link per message, STOP honored, one device each
(SMS-1 freedom close · SMS-3 consequence close "Miss it and it stays a draft" · SMS-4 "Is it crazy" no-oriented).
Scarcity in SMS-5. "— alex's team at We Did It For You" is the correct SMS sign-off (business-name identification
requirement supersedes bare "— alex" on first SMS). Zero banned phrases, zero AI-tells. No copy-paste twins with email pairs.

### GHL-BUILD-SPEC.md §6 — what was wrong, what was changed
As found, §6 carried a second never-panel-reviewed copy set duplicating every canon touchpoint. Confirmed violations:
NDG-1 stacked TWO devices ("Seems like" + "I'd feel weird") · NDG-2 used "Would it be a terrible idea" verbatim
(the exact phrase the panel killed) and invented an offer fact ("link comes down in a week") contradicting
keep-the-draft · DLV-1 ~84 words with no device · ACK-1/LNK-2/BKG-1 had no device · LNK-1 SMS carried two links and
no STOP line on a first SMS to the number.

Fix applied (structure kept, copy swapped — one canonical copy set):
ACK-1→A1 · DLV-1→A2 · NDG-1→A3 · NDG-2→A4 · LNK-1→SMS-1 (+SMS-2 note for the 2 Lubbock spec-build owners) ·
LNK-2→B1 · BKG-1→C1 · BKG-2→SMS-3 · RMD-1→SMS-4 · NSH-1→SMS-5 · WF-4b "resend LNK-2" swapped to new NSH-2→C3
(the canon's actual no-show email). §6 header rewritten: copy is VERBATIM from SEQUENCES.md/SMS-COPY.md, never
reworded in the spec; `{{calendar_link}}` convention removed in favor of canon `{{custom_values.booking_link}}`
(custom value "Booking Link" = §7 calendar permalink — create before go-live).

Verified post-fix by grep: zero orphan `{{calendar_link}}`, zero killed patterns, zero banned phrases,
zero AI-tell words across all three files. The 2026-06-12 "⚠ Out-of-scope finding" above is RESOLVED.

Notes (non-blocking): WF-4 sends only SMS-4 at T-1h (no C2 email twin) — deliberate structure choice, not a copy
violation; add C2 as an email step if no-show rate warrants. §3 keeps `founding_spot_number` as a tracking field
even though no canon email merges it — fine.

### FINAL VERDICT: **PASS — all three files cleared for the GHL build hour.**
Sends still gated by: GHL agency reactivation, Sequence D phase-2 domain warmup, Booking Link custom value created.
