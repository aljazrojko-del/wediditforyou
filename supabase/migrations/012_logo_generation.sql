-- Premium-tier auto-logo storage. logo_options holds 3 generated URLs the
-- customer can pick from; logo_url is their chosen one. Idempotent.

alter table public.leads
  add column if not exists logo_options       jsonb,
  add column if not exists logo_url           text,
  add column if not exists logo_generated_at  timestamptz,
  add column if not exists logo_selected_at   timestamptz;
