-- Per-lead color theme overrides. Customer can request brighter / warmer /
-- specific palette via the change-request form; Claude converts plain-English
-- description into a structured hex code set, stored here, read by templates.
-- Idempotent. Safe to re-run.

alter table public.leads
  add column if not exists theme jsonb;

-- Example shape:
--   { "primary": "#C2410C", "accent": "#E89A6B", "background": "#FFF8F0",
--     "text": "#2A1810", "muted": "#8A6850" }
--
-- Null = use niche default colors (current behavior).
