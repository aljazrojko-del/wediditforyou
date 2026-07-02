# WDIFY ↔ Aljaz Supabase — Definitive Repo Integration Map

**Generated:** 2026-06-16 · Source of truth: `the live repo` (Aljaz's live Next.js repo) + `the Supabase sync tool` (our side, VPS).

**The one-line truth:** Aljaz's `public.leads` is the shared source of truth. His `place_id` (UNIQUE NOT NULL, format `mns-{id}`) is the join key — NOT `mns_lead_id`. His `generate-sites.ts` is the ONLY thing that may write `slug` + `site_url` + content. Our job is: upsert clean leads keyed on `place_id`, let his generator make sites, then READ `slug` for Mia's graduation and WRITE call outcomes back to `call_*`. Our current script is misaligned on 4 columns and the slug-ownership contract — fix our side, PR exactly one thing into his repo (a call-status webhook).

---

## 1. THE REAL `leads` SCHEMA (the 1:1 target)

Complete column list of `public.leads` after all migrations (base `schema.sql` + `002`–`013`). **Bold = the only columns our side should ever touch.**

### Identity / core (schema.sql)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | auto `gen_random_uuid()` — **never set by us** |
| **`place_id`** | text **UNIQUE NOT NULL** | **THE join key.** Format `mns-{our_lead_id}`. Our upsert conflict target. |
| **`name`** | text **NOT NULL** | business name |
| `address` | text | |
| **`phone`** | text | |
| `rating` | real | |
| `rating_count` | int | |
| `types` | text[] | google places types |
| **`niche`** | text **NOT NULL** | MUST normalize to one of `groomer/tutor/plumber/auto/landscape/hair` via his `normalizeNiche` regex, else site has no template |
| **`city`** | text **NOT NULL** | |
| **`source`** | text default `google_places` | we set `mns_crm` (his import uses this) |
| **`status`** | text default `new` | Supabase pipeline status (lowercase `new`), distinct from dashboard status |
| **`has_website`** | bool default false | **CRITICAL: must be `false`** or `generate-sites` skips the lead |
| `website_url` | text | |
| `created_at` | timestamptz default now() | |

### Site generation — **OWNED BY `generate-sites.ts`, NEVER WRITE THESE** (002 + 003_site_content)
`slug` (text UNIQUE) · `site_url` (text) · `headline` · `subheadline` · `services` (jsonb) · `reviews` (jsonb) · `about_text` · `generated_at` (timestamptz)
→ **We READ `slug` only.**

### MNS enrichment (003_mns_columns) — we MAY write on initial upsert
**`owner_email`** · **`owner_phone`** · **`owner_name`** · **`fire_score`** (int) · **`fire_tier`** (text A/B/C/D)

### 3rd-party enrichment (003_enrichment) — his pipeline, don't touch
`owner_first_name` · `owner_last_name` · `owner_title` · `email` · `email_status` · `company_domain` · `facebook_url` · `enrichment_data` (jsonb) · `enriched_at`

### SMS outreach (004) — his scripts own
`sms_sent_at` · `sms_message_id` · `sms_reply_at` · `sms_body`

### Dashboard sync (005) — his bridge owns
`dashboard_id` (int) · `dashboard_status` · `dashboard_synced_at` · `dashboard_pushed_at`

### Review pipeline (006) — his payment automation
`tier` · `payment_status` · `paid_at` · `google_review_url` · `last_job_completed_at` · `review_request_sent_at` · `review_request_message_id` · `review_received_at`

### Call / outreach tracking (007) — **WE WRITE THESE (Mia's outcomes)**
**`call_placed_at`** (timestamptz) · **`call_sid`** (text) · **`call_status`** (text: queued/ringing/in-progress/completed/busy/failed/no-answer) · `last_inbound_at` (his SMS webhook bumps) · `inbound_count` (his webhook)

### Post-payment / welcome (010 + 013) — his automation
`welcome_sms_sent_at` · `welcome_sms_id` · `review_sms_via` · `welcome_email_sent_at` · `welcome_email_id`

### Self-service (009)
`customer_admin_token` (uuid)

**Total: 56 columns.** Supporting tables: `inbound_messages`, `change_requests`, `onboarding_state`.

### ⚠️ MISMATCHES — our script vs his REAL schema (every one is a bug today)
| Our script writes | His real column | Verdict |
|---|---|---|
| `mns_lead_id` | **does not exist** | ❌ **upsert will 400/PGRST204.** Rename → set `place_id = "mns-" + mns_lead_id`. |
| `call_status: "NEW"` (on build) | `call_status` exists but enum is `queued/ringing/.../no-answer` | ❌ `"NEW"` is not a valid call_status; and we shouldn't seed it at build. **Remove from build.** Use `status` (lowercase `new`) for pipeline. |
| `updated_by: "luka"` | **does not exist** | ❌ upsert error. **Remove entirely.** |
| `slug` (pre-set on build) | `slug` is owned by `generate-sites` | ❌ **Breaks the live-site contract.** Pre-setting `slug` without content = empty shell site. **Stop writing slug on build.** |
| upsert conflict `unique(mns_lead_id)` (comment) | conflict target is `place_id` | ❌ wrong onConflict; PostgREST needs `on_conflict=place_id`. |
| `source: "mns-heatseak"` / `"mns-manual"` | his import uses `mns_crm` | ⚠️ harmless but inconsistent — use `mns_crm` so his queries/indices match. |
| (missing) `has_website: false` | required-false or generation skips | ❌ **must explicitly send `has_website=false`** for site-less leads. |
| (missing) `name`, `city`, `niche` NOT NULL guaranteed | NOT NULL | already guards on name/city; **niche must pass `normalizeNiche`**. |

---

## 2. WHAT ALREADY EXISTS — do NOT rebuild

| His asset | What it does | Decision | Why |
|---|---|---|---|
| `scripts/import-from-mns.ts` | Pulls hot leads from the lead dashboard API → upserts Supabase on `place_id` → auto-runs generate-sites | **Use the Supabase sync tool upsert, not his importer** | His importer only hits 8 niche search terms and `fire_tier in {A,B}` via the dashboard API, and dedupes `ignoreDuplicates:true` (never updates). We control which ~174 site-less leads ship and can update rows. We mimic his EXACT row shape so the two are interchangeable. (See §4.) |
| `scripts/generate-sites.ts` | Claude-Haiku content + slugify → writes slug/site_url/content where `has_website=false AND site_url IS NULL` | **Use HIS — mandatory, never replicate** | This is the ONLY safe slug + content writer. Our side must NOT pre-write slug/site_url or it corrupts. We trigger it (or ask Aljaz to cron it) after our upsert. |
| `lib/generate-site.ts` slugify | Deterministic `slugify(name, city)` | **Use HIS formula** (we already mirror it, but with a bug — see §3) | Slug must match exactly or Mia's URL 404s. |
| `app/sites/[slug]/page.tsx` | Pure SSR by slug lookup | **His — read-only contract** | A site is live the instant `slug` resolves a row with content. No deploy. |
| `scripts/text-lead-signalwire.ts` / `send-sms.ts` / `/api/admin/blast` | City-routed SMS, writes `sms_*` | **Use HIS for the site-preview SMS** | City-aware area codes (713/602/469/615/464), A2P-registered numbers, already writes `sms_*`. We must NOT run our own SMS sender into his columns. |
| `/api/outreach/send-link` (Bearer `OUTREACH_AUTH_TOKEN`) | Unified SMS→email fallback link delivery, `source:"mia"` | **Use HIS — this is Mia's integration point** | Abstracts SignalWire+OpenPhone+city routing. Mia POSTs here after booking instead of sending its own SMS. |
| `call-from-supabase.ts` + `/api/twiml/call/[slug]` | Pre-recorded TwiML `<Say>` robocall (NO AI) | **Use OURS (Mia)** | His is a dumb TwiML reader. Mia (Gemini-Live, NEPQ, books calls) is the real caller. We keep ALL calling. (See §5.) |
| `/api/webhooks/signalwire/sms` | Logs inbound SMS, bumps `inbound_count`/`last_inbound_at`/`sms_reply_at` | **Use HIS** | Already live. We just read these for engagement signal. Do NOT reimplement inbound logging. |
| `bridge-to-dashboard.ts` | Syncs Supabase ↔ his separate wdify-ops CRM | **Ignore — his internal CRM** | Unrelated to this flow. |
| `/api/webhooks/stripe` | Payment → welcome flows | **His** | Post-payment automation, not ours. |
| **`/api/webhooks/signalwire/call-status`** | **DOES NOT EXIST** | **PR THIS (only real gap)** | `makeCall` already accepts `statusCallback`, but there's no receiver, so `call_status` freezes at placement. (See §5.) |

---

## 3. THE SLUG + SITE-LIVE CONTRACT (Mia's graduation switch)

**Slug generation (his canonical `slugify` in `app/sites/_templates/utils.ts`):**
```
`${name} ${city}`
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[̀-ͯ]/g, "")   // strip diacritics
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 80)  || "site"
```
Example: `Smith Plumbing` + `Austin, TX` → `smith-plumbing-austin-tx`.

⚠️ **Our `slugify` has a bug:** we do `re.sub(r"[^a-z0-9]+","-", f"{name} {city}".lower()).strip("-")` — **no NFKD diacritic strip and no 80-char cap.** For MX/accented names our slug ≠ his slug → Mia's graduation URL 404s. **But we should STOP generating slugs entirely on build (see contract below), so this becomes moot — slug is read, not written, by us.**

**What makes a site LIVE (the graduation gate):**
- A site is live ⇔ `slug IS NOT NULL` **AND** content columns (`headline`, `services`, `reviews`, `about_text`) are populated — and `generate-sites` always writes them together atomically. So in practice: **`slug IS NOT NULL` ⇒ live**, guaranteed by his generator.
- `page.tsx` does `SELECT ... WHERE slug = {slug}` → if no row → `notFound()`. If row but empty content → falls back to per-niche static content (never null). So a slug-only row WITHOUT content (the bug our current build would create) renders a generic shell, not a 404 — **silently degraded, the worst case.**

**→ Mia's graduation switch:** `sync-urls` reads `GET /leads?select=phone,slug&slug=not.is.null` and writes `phone → https://sites.wedidit4you.com/{slug}` into `site_urls.json`. The dialer flips to present-tense ("I already built it, it's live at...") for any phone present in that map. **This is correct and stays — it READS his slug.** Only fix: it must trust HIS slug, never our locally-computed one.

---

## 4. THE SYNC MECHANISM (shared source of truth — pick ONE)

**Three candidates:** (a) his `import-from-mns` pull, (b) our `wdify_supabase.py` upsert, (c) both.

**DECISION: (b) — OUR `wdify_supabase.py` upsert is the single writer of lead rows. Drop his `import-from-mns` from the live flow.**

**Why:**
1. **One writer, no race.** Two importers both upserting on `place_id` is a phantom-conflict generator. Pick one. Ours gives us control over exactly which ~174 site-less leads of the 742 ship, and lets us UPDATE rows (his `ignoreDuplicates:true` can only insert-once).
2. **We already hold the data locally** (the lead database, (WDIFY)). His importer round-trips through his dashboard API which needs credentials and is gated to 8 hardcoded niche searches + `fire_tier in {A,B}`. That's a narrower, slower, credential-heavy path to the same table.
3. **Interchangeability is the safety net:** we make our upsert row shape **byte-for-byte match his `import-from-mns` row map** (`place_id`, `name`, `phone`, `niche`, `city`, `source:"mns_crm"`, `status:"new"`, `has_website`, `website_url`, `owner_*`, `fire_*`). So if Aljaz ever runs his importer, it's a no-op dedupe, not a conflict.

**The clean flow (one direction for writes, two reads):**
```
[our lead database (WDIFY)]
   │  wdify_supabase.py build         (OUR upsert, on_conflict=place_id)
   ▼
[Supabase public.leads]  ← single source of truth
   │  generate-sites.ts               (HIS generator: slug+site_url+content)   ← we trigger / he crons
   ▼
[slug populated = site live @ sites.wedidit4you.com/{slug}]
   │  wdify_supabase.py sync-urls      (OUR read: slug → site_urls.json)
   ▼
[Mia dialer graduates lead → present-tense pitch]
   │  Mia calls (SignalWire+Gemini) → POST call-status webhook
   ▼
[Supabase call_placed_at / call_sid / call_status updated]   ← OUR write-back
   │  inbound SMS → HIS /api/webhooks/signalwire/sms          (his read path)
   ▼
[loop: Aljaz dashboard + our reporting both read the one table]
```
**No `bridge-to-dashboard` in our path** — that's his internal CRM, irrelevant to this flow.

---

## 5. CONCRETE ACTIONS

### (A) Changes to OUR side — `the Supabase sync tool` (+ configs)

**A1. Fix the upsert row shape in `build()` — exact column renames:**
- `"mns_lead_id": l["mns_lead_id"]` → **`"place_id": "mns-" + l["mns_lead_id"]`**
- **DELETE** `"slug": slug` from the build row (let `generate-sites` own it).
- **DELETE** `"call_status": "NEW"` (invalid enum; not a build field).
- **DELETE** `"updated_by": "luka"` (column doesn't exist).
- `"source": "mns-heatseak"` → **`"source": "mns_crm"`**.
- **ADD** `"status": "new"`, **`"has_website": False`**, `"website_url": <website or None>`.
- **ADD** owner passthrough when available: `owner_email`, `owner_phone`, `owner_name`, `fire_score`, `fire_tier` (pull from our `our lead database` row — they exist there).
- Change PostgREST upsert to conflict on `place_id`: `prefer="resolution=merge-duplicates,return=minimal"` **+ add `params={"on_conflict": "place_id"}`** on the POST.

**A2. Fix `build_one()` the same way** (add `place_id` — needs an id arg, or derive from phone; drop slug/call_status/updated_by; add has_website/status).

**A3. Stop generating/writing slug locally.** Remove `slug = slugify(...)` from build. Drop `_add_url(... url)` at build time — we don't know the slug until HIS generator runs. The URL map is populated by `sync-urls` reading his real slug. (Keep `slugify` only as a dead-reckoning fallback if ever needed, but fix it to match his: add NFKD strip + `[:80]`.)

**A4. Add a `generate` trigger** (since we dropped his auto-trigger from `import-from-mns`): after build, either (i) call `npm run generate-sites -- --limit N` on his deploy if we have shell access, or (ii) leave it for Aljaz's cron / a one-line endpoint. **Cleanest: ask Aljaz to cron `generate-sites` every 5 min** (it's idempotent, only touches `site_url IS NULL`). Until then, `sync-urls` simply returns fewer rows.

**A5. Add a `writeback` subcommand** (new) for Mia's call outcomes:
`PATCH /leads?place_id=eq.mns-{id}` body `{call_placed_at, call_sid, call_status}` — service role bypasses RLS. This is the reverse channel into the one table.

**A6. Config:** confirm `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set from Aljaz's `wediditforyou` Vercel project (the script already reads them; they're the unblock).

### (B) Changes to PR into HIS repo (feature branch) — **exactly ONE thing**

**PR `feat/call-status-webhook`:**
- **New route `app/api/webhooks/signalwire/call-status/route.ts`** — accepts SignalWire `StatusCallback` form POST (`CallSid`, `CallStatus`, `To`), matches lead by `call_sid` (or last-10-digit phone), updates `leads.call_status` (+ `call_placed_at` if first). This is the documented gap — `makeCall` already supports `statusCallback` but nothing receives it, so `call_status` freezes. ~30 lines, mirrors his existing `/api/webhooks/signalwire/sms` pattern.

**No migrations needed.** All columns our flow uses (`place_id`, `call_placed_at`, `call_sid`, `call_status`, `slug`, owner_*, fire_*) already exist post-migration. Do NOT add columns.

**Optional (only if Aljaz wants real-time):** a tiny `POST /api/generate-sites` (Bearer-guarded) wrapping `generateAll()` so we can trigger generation without shell — but a cron on his side is simpler. Default: **no second endpoint; just the webhook + ask for a cron.**

### (C) Call / SMS division of labor — DECISION

> **Mia owns ALL calling. Aljaz's SignalWire layer owns ALL link delivery + inbound logging. We write call outcomes; he writes SMS/inbound.**

- **Calls:** Mia (the AI voice caller, SignalWire+Gemini-Live, NEPQ, books) places every outbound call. Do NOT use his `call-from-supabase.ts` (dumb TwiML robocall). Mia passes `statusCallback=https://wedidit4you.com/api/webhooks/signalwire/call-status` on `makeCall` so outcomes persist. Mia (via our `writeback` subcommand) also stamps `call_placed_at/call_sid/call_status` directly as a belt-and-suspenders.
- **Site-preview SMS / link delivery:** **his side.** After a Mia booking, Mia POSTs `/api/outreach/send-link` (`channel:"auto"`, `source:"mia"`, Bearer `OUTREACH_AUTH_TOKEN`) — SMS-first with email fallback, city-routed. We do NOT run our own SMS into his `sms_*` columns.
- **Inbound SMS:** **his webhook** logs to `inbound_messages` + bumps `inbound_count/last_inbound_at`. We READ these for engagement; we do NOT reimplement.
- **Net:** zero column-write collisions. Mia → `call_*`. Aljaz → `sms_*`, `inbound_*`, `slug`+content. Clean partition of the one table.

---

## 6. OPEN QUESTIONS FOR ALJAZ (only genuine blockers)

1. **Supabase creds:** confirm + hand over `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from the `wediditforyou` Vercel project. **Hard blocker** — our script can't write the table without them.
2. **Who triggers `generate-sites`?** Will you cron `npm run generate-sites -- --limit 50` every ~5 min on your deploy (idempotent, `site_url IS NULL` only)? If not, we need a Bearer-guarded `POST /api/generate-sites` PR. **Blocks site-go-live timing.**
3. **`OUTREACH_AUTH_TOKEN`** value for Mia to call `/api/outreach/send-link`. **Blocks link delivery.**
4. **Merge the `feat/call-status-webhook` PR** (so call outcomes persist) — and confirm the public host for `statusCallback` is `https://wedidit4you.com` (not the `sites.` subdomain). **Blocks call-outcome tracking.**
5. **A2P 10DLC status** on the SignalWire brand — are the 5 city numbers registered/approved? If not, `/api/outreach/send-link` SMS returns 403 and silently falls back to email. **Affects SMS deliverability, not a hard stop.**
