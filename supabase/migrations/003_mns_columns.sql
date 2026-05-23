-- Adds MNS Agency CRM enrichment fields to public.leads.
-- Run once in Supabase SQL Editor. Idempotent.

alter table public.leads
  add column if not exists owner_email  text,
  add column if not exists owner_phone  text,
  add column if not exists owner_name   text,
  add column if not exists fire_score   int,
  add column if not exists fire_tier    text;

create index if not exists leads_fire_tier_idx on public.leads (fire_tier);
create index if not exists leads_source_idx    on public.leads (source);
