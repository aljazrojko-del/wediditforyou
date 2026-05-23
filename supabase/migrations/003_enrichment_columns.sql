-- Enrichment columns. Run once in Supabase SQL Editor. Idempotent.

alter table public.leads
  add column if not exists owner_first_name  text,
  add column if not exists owner_last_name   text,
  add column if not exists owner_title       text,
  add column if not exists email             text,
  add column if not exists email_status      text,        -- valid | invalid | catch-all | unknown | skipped
  add column if not exists company_domain    text,
  add column if not exists facebook_url      text,
  add column if not exists enrichment_data   jsonb,        -- full raw responses for debugging
  add column if not exists enriched_at       timestamptz;

create index if not exists leads_email_idx    on public.leads (email)        where email is not null;
create index if not exists leads_enriched_idx on public.leads (enriched_at)  where enriched_at is not null;
