-- Track welcome-email delivery (mirror of welcome SMS tracking).
-- Idempotency gate for the post-payment email send in app/api/webhooks/stripe/route.ts.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS welcome_email_id text;
