-- Tracks the agency dashboard (wdify-ops) bridge state per lead.
-- When a Supabase lead is pushed to the dashboard, dashboard_id stores the
-- remote ID. Status syncs run periodically to pull the current pipeline state
-- back into Supabase so you always know where each lead is.
--
-- Idempotent. Safe to re-run.

alter table public.leads
  add column if not exists dashboard_id        integer,
  add column if not exists dashboard_status    text,
  add column if not exists dashboard_synced_at timestamptz,
  add column if not exists dashboard_pushed_at timestamptz;

create index if not exists leads_dashboard_id_idx     on public.leads (dashboard_id);
create index if not exists leads_dashboard_status_idx on public.leads (dashboard_status);
