-- Extra princess entertainer + child count on bookings.
alter table public.bookings
  add column if not exists extra_character text;

alter table public.bookings
  add column if not exists num_children integer;

comment on column public.bookings.extra_character is
  'Optional/mandatory second princess slug. £50 added to remaining_balance, not the deposit.';

comment on column public.bookings.num_children is
  'Number of children attending; extra princess is required when greater than 20.';
