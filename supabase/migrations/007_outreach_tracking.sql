-- Cloud-admin outreach tracking: per-lead call/SMS status + inbound replies.
-- Idempotent. Safe to re-run.

alter table public.leads
  add column if not exists call_placed_at      timestamptz,
  add column if not exists call_sid            text,
  add column if not exists call_status         text,        -- queued | ringing | in-progress | completed | busy | failed | no-answer
  add column if not exists last_inbound_at     timestamptz,
  add column if not exists inbound_count       int not null default 0;

create index if not exists leads_call_placed_idx    on public.leads (call_placed_at);
create index if not exists leads_last_inbound_idx   on public.leads (last_inbound_at);

-- All inbound SMS messages from prospects. Phone-matched to a lead when possible.
create table if not exists public.inbound_messages (
  id          bigserial primary key,
  received_at timestamptz not null default now(),
  from_phone  text not null,
  to_phone    text not null,
  body        text,
  message_sid text unique,
  lead_id     uuid references public.leads(id) on delete set null,
  raw         jsonb
);

create index if not exists inbound_messages_received_idx on public.inbound_messages (received_at desc);
create index if not exists inbound_messages_lead_idx     on public.inbound_messages (lead_id);
create index if not exists inbound_messages_from_idx     on public.inbound_messages (from_phone);
