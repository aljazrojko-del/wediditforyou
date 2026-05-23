-- Tracks auto-review SMS pipeline for paying customers.
-- Premium tier component #6: after a job is done, automatically text the
-- customer asking for a Google review. Compounds local SEO ranking.
--
-- Idempotent. Safe to re-run.

alter table public.leads
  add column if not exists tier                       text,                 -- 'starter' | 'premium' | null (prospect)
  add column if not exists payment_status             text,                 -- 'pending' | 'paid' | 'refunded'
  add column if not exists paid_at                    timestamptz,
  add column if not exists google_review_url          text,                 -- e.g. https://g.page/r/...
  add column if not exists last_job_completed_at      timestamptz,          -- updated each time owner marks a job done
  add column if not exists review_request_sent_at     timestamptz,
  add column if not exists review_request_message_id  text,
  add column if not exists review_received_at         timestamptz;          -- nullable; filled when we detect a new review

create index if not exists leads_tier_idx                on public.leads (tier);
create index if not exists leads_payment_status_idx      on public.leads (payment_status);
create index if not exists leads_last_job_completed_idx  on public.leads (last_job_completed_at);
