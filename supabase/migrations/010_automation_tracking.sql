-- Post-payment automation tracking: welcome SMS, 30-day reminders, domain reg.
-- Idempotent. Safe to re-run.

alter table public.leads
  add column if not exists welcome_sms_sent_at  timestamptz,
  add column if not exists welcome_sms_id       text;

alter table public.onboarding_state
  add column if not exists reminders_sent       jsonb not null default '[]'::jsonb,
  add column if not exists domain_register_error text;

-- Premium-tier auto-review SMS via SignalWire (separate from the legacy
-- OpenPhone/Quo column on leads). The cron flips this every 30 min.
alter table public.leads
  add column if not exists review_sms_via       text;       -- 'signalwire' | 'openphone'
