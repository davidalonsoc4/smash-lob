alter table public.mvp_manual_selections enable row level security;
drop policy if exists "mvp_manual_delete" on public.mvp_manual_selections;
drop policy if exists "mvp_manual_insert" on public.mvp_manual_selections;
drop policy if exists "mvp_manual_select" on public.mvp_manual_selections;
drop policy if exists "mvp_manual_update" on public.mvp_manual_selections;
revoke all on table public.mvp_manual_selections from anon;
revoke all on table public.mvp_manual_selections from authenticated;
grant all on table public.mvp_manual_selections to service_role;

alter table public.mvp_votes enable row level security;
drop policy if exists "mvp_votes_delete" on public.mvp_votes;
drop policy if exists "mvp_votes_insert" on public.mvp_votes;
drop policy if exists "mvp_votes_select" on public.mvp_votes;
drop policy if exists "mvp_votes_update" on public.mvp_votes;
revoke all on table public.mvp_votes from anon;
revoke all on table public.mvp_votes from authenticated;
grant all on table public.mvp_votes to service_role;
