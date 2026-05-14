-- Tracks successful Resend delivery of admin + customer confirmation after paid checkout.
alter table public.bookings
  add column if not exists confirmation_emails_sent_at timestamptz;

comment on column public.bookings.confirmation_emails_sent_at is
  'When admin and customer confirmation emails were sent successfully (Stripe webhook or backup ensure endpoint).';
