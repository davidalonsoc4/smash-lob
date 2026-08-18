create table if not exists public.personal_match_bookings (
  match_id uuid primary key references public.personal_matches(id) on delete cascade,
  is_reserved boolean not null default false,
  booking_reservations jsonb not null default '{"reservations":[],"ballPurchases":[]}'::jsonb,
  booking_transfers jsonb not null default '[]'::jsonb,
  booking_updated_at timestamptz,
  constraint personal_match_booking_reservations_object_check
    check (jsonb_typeof(booking_reservations) = 'object'),
  constraint personal_match_booking_transfers_array_check
    check (jsonb_typeof(booking_transfers) = 'array')
);

alter table public.personal_match_bookings enable row level security;

revoke all on table public.personal_match_bookings from public, anon, authenticated;
grant select, insert, update, delete on table public.personal_match_bookings to service_role;
