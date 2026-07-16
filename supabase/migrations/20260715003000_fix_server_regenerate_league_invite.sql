create or replace function public.server_regenerate_league_invite(
  p_league_id uuid,
  p_code text,
  p_created_by_user_id uuid
)
returns table (
  league_id uuid,
  invite_code text
)
language plpgsql
set search_path = public
as $$
declare
  next_invite_code text := upper(trim(p_code));
begin
  update public.leagues as leagues
  set invite_code = next_invite_code
  where leagues.id = p_league_id
  returning leagues.id, leagues.invite_code into league_id, invite_code;

  if league_id is null then
    raise exception 'league_not_found';
  end if;

  insert into public.invites (league_id, code, created_by_user_id)
  values (league_id, invite_code, p_created_by_user_id);

  return next;
end;
$$;

revoke all on function public.server_regenerate_league_invite(uuid, text, uuid) from public;
revoke all on function public.server_regenerate_league_invite(uuid, text, uuid) from anon;
revoke all on function public.server_regenerate_league_invite(uuid, text, uuid) from authenticated;
grant execute on function public.server_regenerate_league_invite(uuid, text, uuid) to service_role;
