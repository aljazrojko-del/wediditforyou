-- Per-customer site analytics: visits, call-link taps, booking-link taps.
-- Powers the customer-facing "Call & Booking Tracker" in /my-site/{token}
-- (a Premium bonus) and backs the 30-Day Inquiry Guarantee with real numbers.
create table if not exists public.site_events (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  type       text not null check (type in ('visit', 'call_click', 'booking_click')),
  created_at timestamptz not null default now()
);

create index if not exists site_events_lead_time_idx
  on public.site_events (lead_id, created_at);
