# Per-lead site generator — deployment

This wires step 2 (auto-generate site) + step 3 (deploy to preview URL) of the
"We Did It For You" sales loop. One Next.js app serves both the brand landing
page and infinite per-lead sites at `sites.wedidit4you.com/{slug}`.

## What was added

- `app/sites/[slug]/page.tsx` — dynamic route, reads lead from Supabase, picks
  template by niche, renders.
- `app/sites/_templates/` — `TemplatePlumber.tsx` (refactored from
  `app/demo/reyes-plumbing`), shared `types.ts`, `images.ts` (curated Unsplash
  bank per niche), `registry.ts` (niche normalizer + template lookup).
- `lib/generate-site.ts` — pure function: lead row → `SiteData`. Calls Claude
  Haiku for a one-line hero headline; falls back to a static headline if
  `ANTHROPIC_API_KEY` is missing.
- `scripts/generate-sites.ts` — `npm run generate-sites` to backfill any lead
  missing a `site_url`. Exports `generateAll()` so the scraper can call it.
- `scripts/pull-leads.ts` — now auto-runs `generateAll()` after a successful
  upsert, so new leads get a `site_url` within seconds of being scraped.
- `proxy.ts` — rewrites `sites.wedidit4you.com/{slug}` to `/sites/{slug}`
  internally so the subdomain serves clean URLs from one Next app. (Next 16
  renamed `middleware` to `proxy`.)
- `supabase/migrations/002_site_columns.sql` — adds `slug`, `site_url`,
  `headline`, `generated_at` columns.

## Your 3 manual steps

### 1. Apply the migration (Supabase)

Open Supabase → SQL Editor → paste:

```sql
-- contents of supabase/migrations/002_site_columns.sql
alter table public.leads
  add column if not exists slug          text unique,
  add column if not exists site_url      text,
  add column if not exists headline      text,
  add column if not exists generated_at  timestamptz;
create index if not exists leads_slug_idx on public.leads (slug);
```

Idempotent — safe to re-run.

### ⚠️ Setting env vars from PowerShell — BOM trap

PowerShell pipes (`"value" | npx vercel env add NAME production`) prepend a
UTF-8 BOM (`﻿`) to the value. Supabase URLs and JWTs become invalid.
Use **bash + `printf %s`** (no BOM, no trailing newline), or the Vercel web UI:

```bash
printf "%s" "https://xxx.supabase.co" | npx vercel env add SUPABASE_URL production
```

### 2. Add `ANTHROPIC_API_KEY` to env

Locally (`.env.local`):
```
ANTHROPIC_API_KEY=sk-ant-...
```

On Vercel: Project → Settings → Environment Variables → add
`ANTHROPIC_API_KEY` for Production + Preview.

If you skip this, the loop still works — headlines fall back to a static
template like `"Phoenix plumbing. Done right."`.

### 3. Wire the DNS (GoDaddy → Vercel)

In GoDaddy DNS for `wedidit4you.com`:
- Add record: **CNAME** · name `sites` · value `cname.vercel-dns.com.` · TTL default

In Vercel for this project:
- Settings → Domains → add `sites.wedidit4you.com`

Vercel will issue SSL and detect the CNAME automatically (1–5 min).

## How to use

```bash
# Install (one time)
npm install

# Local check
npm run dev
# visit http://localhost:3000/sites/<any-slug-from-supabase>

# Backfill any leads missing a site_url
npm run generate-sites

# Regenerate everything (e.g. after tweaking a template)
npm run generate-sites -- --force

# Scrape new leads — auto-generates sites in the same run
npm run leads -- --niche "plumber" --city "Phoenix, AZ"
```

After a scrape, each new lead in Supabase has:
- `slug` — URL-safe, e.g. `joes-plumbing-phoenix-az`
- `site_url` — full URL Brooke and email pipeline can pitch
- `headline` — AI-generated hero text
- `generated_at` — timestamp

## What's still on the table

- **Hair / auto / landscape templates.** The registry currently routes every
  niche to `TemplatePlumber`. The 3 remaining templates (`TemplateHair`,
  `TemplateAuto`, `TemplateLandscape`) are mechanical refactors of the existing
  demo pages in `app/demo/`. ~30 min each. Once added, drop them into
  `app/sites/_templates/registry.ts`:
  ```ts
  export const TEMPLATES = {
    plumber: TemplatePlumber,
    hair: TemplateHair,        // replace fallback
    auto: TemplateAuto,        // replace fallback
    landscape: TemplateLandscape, // replace fallback
  };
  ```
- **Brooke prompt + email template** need updating to read `site_url` from the
  lead record and weave it into the pitch ("Hey {first_name}, built you a draft
  at {site_url} — take a look").
- **`sites.wedidit4you.com/` root** currently falls through to the brand
  landing. If you want a redirect there, add it to `proxy.ts`.
