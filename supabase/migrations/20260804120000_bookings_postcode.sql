-- Dedicated postcode column for party bookings (service-area validation + admin/emails).
alter table public.bookings
  add column if not exists postcode text;

comment on column public.bookings.postcode is
  'UK party postcode (normalised). Street line remains in address.';
