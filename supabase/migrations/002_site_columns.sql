-- Adds per-lead generated-site columns to public.leads.
-- Run once in Supabase SQL Editor. Idempotent.

alter table public.leads
  add column if not exists slug          text unique,
  add column if not exists site_url      text,
  add column if not exists headline      text,
  add column if not exists generated_at  timestamptz;

create index if not exists leads_slug_idx on public.leads (slug);
