-- PrincessDream bookings (run in Supabase SQL editor or via CLI).
-- Serverless API uses the service role key and bypasses RLS.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  parent_name text not null,
  email text not null,
  phone text not null,
  child_name text not null,
  child_age text not null,
  party_date date not null,
  party_start_time text not null,
  address text not null,
  postcode text,
  selected_character text not null,
  selected_package text not null,
  total_price integer not null,
  deposit_amount integer not null,
  remaining_balance integer not null,
  notes text,
  status text not null check (status in ('pending', 'confirmed', 'cancelled')),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  hold_expires_at timestamptz
);

create index if not exists idx_bookings_party_slot
  on public.bookings (party_date, party_start_time);

create index if not exists idx_bookings_stripe_session
  on public.bookings (stripe_session_id)
  where stripe_session_id is not null;

create index if not exists idx_bookings_status_party
  on public.bookings (status, party_date);

alter table public.bookings enable row level security;

-- No public policies: all access via service role on the server.

comment on table public.bookings is 'Party bookings; pending rows hold a slot until Stripe checkout completes or hold_expires_at.';
