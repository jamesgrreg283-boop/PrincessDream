-- Manual date/time blocks (Instagram/WhatsApp holds without a full booking row).
create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  party_date date not null,
  party_start_time text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (party_date, party_start_time)
);

create index if not exists idx_blocked_slots_date on public.blocked_slots (party_date);

alter table public.blocked_slots enable row level security;

comment on table public.blocked_slots is 'Admin-only blocks; public availability treats like a booked slot.';
