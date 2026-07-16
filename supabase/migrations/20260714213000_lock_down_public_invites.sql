alter table public.invites enable row level security;

drop policy if exists "authenticated can manage invites" on public.invites;
drop policy if exists "dev all invites" on public.invites;
drop policy if exists "invites readable by code" on public.invites;

revoke all on table public.invites from anon;
revoke all on table public.invites from authenticated;
grant all on table public.invites to service_role;
