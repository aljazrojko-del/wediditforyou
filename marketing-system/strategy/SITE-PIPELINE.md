# WDIFY Build-First Pipeline — site-ahead → reveal call → close

**The model (confirmed 2026-06-12):** find a business with no website → Aljaz's automated
builder generates a site for them on a prompt → Mia calls and *reveals* the finished site ("I already
built you a website — it's live, want the link?") → texts the link live on the call → books the
15-min review with Alex → close at **$450** founding (then $700).

The reveal is the whole hook. It only works if a real site exists for that business **before** Mia dials.

## The pipeline (4 stages)

```
1. SCRAPE     no-website leads → postgres our lead database ((WDIFY))   [LIVE: the lead scraper, 2×/day]
2. BUILD      Aljaz's builder turns each lead → live site → URL              [AljAZ'S BUILDER — trigger TBD]
3. ATTACH     URL stored against the lead's phone                            [READY: the site-URL attach tool]
4. CALL       Mia reveals + texts the site, books the review                 [LIVE: queue_campaign.py + Mia]
```

Stage 4 already auto-splits: a lead **with** a site URL gets the present-tense SPEC reveal and Mia
texts the exact link via `send_materials`; a lead **without** gets the honest COLD reveal ("I want to
build you one, free, by tomorrow"). As Aljaz's builder fills in URLs (stage 3), leads graduate from
COLD to SPEC automatically — no code change.

## What's BUILT and ready (our side)
- `set_site_urls.py` — attach builder URLs: `--phone +1… --url https://…` or `--csv builds.csv` (phone,url).
  Writes `the site-URL map`.
- `queue_campaign.py` — reads that map, routes each lead to the right opener, injects `draft_site_url`
  into the call so Mia texts the real link.
- Mia `send_materials` — now texts the actual built-site URL (branded WDIFY).
- Two configs: `engine_config_specbuild.json` (present-tense reveal), `engine_config_cold.json` (honest future-tense).

## What I NEED from Aljaz to fully automate stage 2→3 (the only gap)
1. **How to trigger the builder programmatically** — an API endpoint? a CLI/prompt? a repo + command?
   (e.g. `POST /build {company, niche, city, phone, reviews}` → returns a live URL.)
2. **The generated-site URL pattern** — e.g. `https://{slug}.wedidit4you.com` or a Vercel alias.
3. **Throughput** — how many sites/day the builder can produce (sets the daily call volume).

Give me those three and I wire stage 2→3 end to end: scrape → auto-build the day's list → attach URLs →
Mia dials only built leads with the full-strength reveal. Until then, manual: Aljaz builds → runs
`set_site_urls.py --csv` → leads graduate to SPEC automatically.

## Immediate path (no automation needed yet)
For the **2 Lubbock spec builds** (Elite Mobile Tire & Brake, Buddy's Mobile Spa) — Aljaz already built
these. Need from Aljaz: each business's **phone** + **live site URL**. Then:
```
python3 the site-URL attach tool --phone +1<elite> --url https://<elite-site>
python3 the site-URL attach tool --phone +1<buddys> --url https://<buddys-site>
```
…and those two get Mia's present-tense reveal + the live link texted, on the very first calls.

## Price (confirmed): $450 founding (first ten), then $700. No monthly year one. $0 until they approve.

---

## Aljaz's OWN SignalWire (dedicated-per-project) — WIRING READY, awaiting unlock
WDIFY calls must run on Aljaz's SignalWire account + his 5 geo-numbers (Chicago, Nashville,
Dallas, Houston, Phoenix), on his own dedicated account. His creds live in his Vercel project
`wediditforyou` but are marked **Vercel "Sensitive"** = write-only, return `''` to any token/API/CLI
(verified 2026-06-13). Aljaz is flipping them to readable so we can pull them.

**The moment they're unlocked, run (one shot):**
```bash
# 1. pull his now-readable values
cd a working dir && npx vercel env pull .env.prod --environment=production \
  --token [REDACTED] \
  --scope [REDACTED]
# 2. wire them into both WDIFY configs + the geo number map
python3 the SignalWire wiring tool --space <SPACE_URL> --project <PROJECT_ID> \
  --token <API_TOKEN> --phoenix <#> --houston <#> --dallas <#> --chicago <#> --nashville <#>
# 3. test on Aljaz's number
python3 the campaign queue tool --test-call +1<num>
```
Plumbing already done: dialer per-client `provider_config` (no shared-infra touch), queue tool
geo-matches caller-ID by lead state, falls back to the shared launch caller until configured. Helper:
`the SignalWire wiring tool`. Map: `the geo number map`.
