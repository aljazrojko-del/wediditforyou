-- SMS consent tracking on leads. Nullable: null = unknown (cold pull, no
-- consent capture yet), true = explicit opt-in via web form, false = explicit
-- decline. Outreach endpoints filter `IS NOT FALSE` so null + true pass.
-- Idempotent. Safe to re-run.

alter table public.leads
  add column if not exists sms_consent     boolean,
  add column if not exists sms_consent_at  timestamptz;

create index if not exists leads_sms_consent_idx
  on public.leads (sms_consent)
  where sms_consent is not null;
