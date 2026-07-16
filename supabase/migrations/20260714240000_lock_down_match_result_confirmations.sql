alter table public.match_result_confirmations enable row level security;

drop policy if exists "dev all match_result_confirmations" on public.match_result_confirmations;

revoke all on table public.match_result_confirmations from anon;
revoke all on table public.match_result_confirmations from authenticated;
grant all on table public.match_result_confirmations to service_role;
