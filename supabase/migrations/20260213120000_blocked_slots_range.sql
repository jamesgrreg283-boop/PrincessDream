-- Multi-day / time-range blocks (holidays, etc.)
alter table public.blocked_slots drop constraint if exists blocked_slots_party_date_party_start_time_key;

alter table public.blocked_slots
  add column if not exists party_end_date date,
  add column if not exists party_end_time text;

comment on column public.blocked_slots.party_end_date is
  'Inclusive end calendar date; null means single day (party_date only).';
comment on column public.blocked_slots.party_end_time is
  'Inclusive end time on the 9:00–16:00 party grid; null means only party_start_time is blocked.';
