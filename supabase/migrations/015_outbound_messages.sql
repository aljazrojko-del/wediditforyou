-- Log every outbound SMS so we can render a full two-way conversation thread
-- in the admin. Mirrors inbound_messages structure.
-- Idempotent. Safe to re-run.

create table if not exists public.outbound_messages (
  id           bigserial primary key,
  sent_at      timestamptz not null default now(),
  from_phone   text not null,
  to_phone     text not null,
  body         text,
  message_sid  text unique,
  lead_id      uuid references public.leads(id) on delete set null,
  status       text,        -- queued | sent | delivered | failed
  error        text,
  raw          jsonb
);

create index if not exists outbound_messages_sent_idx on public.outbound_messages (sent_at desc);
create index if not exists outbound_messages_to_idx   on public.outbound_messages (to_phone);
create index if not exists outbound_messages_lead_idx on public.outbound_messages (lead_id);
