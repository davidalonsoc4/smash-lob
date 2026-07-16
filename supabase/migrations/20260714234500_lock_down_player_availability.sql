alter table public.player_availability enable row level security;

drop policy if exists "dev all player_availability" on public.player_availability;

revoke all on table public.player_availability from anon;
revoke all on table public.player_availability from authenticated;
grant all on table public.player_availability to service_role;
