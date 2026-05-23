-- Stores per-lead AI-generated site content so each site feels custom, not templated.
-- Runs once in Supabase SQL Editor. Idempotent.

alter table public.leads
  add column if not exists subheadline   text,
  add column if not exists services      jsonb,
  add column if not exists reviews       jsonb,
  add column if not exists about_text    text;
