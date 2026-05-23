-- Run this once in Supabase SQL Editor.
-- Idempotent: safe to re-run.

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  place_id      text unique not null,
  name          text not null,
  address       text,
  phone         text,
  rating        real,
  rating_count  int,
  types         text[],
  niche         text not null,
  city          text not null,
  source        text not null default 'google_places',
  status        text not null default 'new',
  has_website   boolean not null default false,
  website_url   text,
  created_at    timestamptz not null default now()
);

create index if not exists leads_niche_city_idx on public.leads (niche, city);
create index if not exists leads_status_idx     on public.leads (status);
