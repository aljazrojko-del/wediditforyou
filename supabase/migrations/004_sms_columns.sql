-- Tracks Quo (OpenPhone) SMS outreach per lead. Idempotent.

alter table public.leads
  add column if not exists sms_sent_at      timestamptz,
  add column if not exists sms_message_id   text,
  add column if not exists sms_reply_at     timestamptz,
  add column if not exists sms_body         text;
