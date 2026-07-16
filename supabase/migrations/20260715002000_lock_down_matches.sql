alter table public.matches enable row level security;

drop policy if exists "authenticated can manage matches" on public.matches;
drop policy if exists "dev all matches" on public.matches;
drop policy if exists "league members can read matches" on public.matches;

revoke all on table public.matches from anon;
revoke all on table public.matches from authenticated;
grant all on table public.matches to service_role;
