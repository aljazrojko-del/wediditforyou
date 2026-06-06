-- Customer self-service: a public-but-unguessable token grants the customer
-- access to a "Request a change" form for their own site, no password needed.
-- Each request is logged so we have an audit trail + can roll back.
-- Idempotent. Safe to re-run.

alter table public.leads
  add column if not exists customer_admin_token  uuid;

create unique index if not exists leads_customer_admin_token_idx
  on public.leads (customer_admin_token)
  where customer_admin_token is not null;

create table if not exists public.change_requests (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete cascade,
  requested_at    timestamptz not null default now(),
  change_type     text not null,             -- text|photo|service|hours|other
  description     text not null,
  prior_site_data jsonb,
  new_site_data   jsonb,
  status          text not null default 'pending',  -- pending|applied|failed|rejected
  error_message   text,
  applied_at      timestamptz,
  raw             jsonb
);

create index if not exists change_requests_lead_idx
  on public.change_requests (lead_id);
create index if not exists change_requests_status_idx
  on public.change_requests (status);
create index if not exists change_requests_requested_idx
  on public.change_requests (requested_at desc);
