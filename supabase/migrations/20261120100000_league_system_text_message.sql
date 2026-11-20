-- Text message signed by the league itself (sent by the organization, not by a person): a "Novedad" or, when
-- p_is_announcement is false, a normal message that looks like one more participant. Same shape as
-- send_league_system_announcement, without media. Only the server (service_role) can call it,
-- after checking that the caller is the creator or an administrator of the league.
create function public.send_league_system_text(
  p_season_id uuid,
  p_sender_display_name text,
  p_body text,
  p_is_announcement boolean default true
) returns public.league_season_chat_messages
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.season_status;
  v_league_id uuid;
  v_sender uuid;
  v_message public.league_season_chat_messages;
begin
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 2000 or char_length(btrim(coalesce(p_sender_display_name, ''))) = 0 then
    raise exception 'season_chat_invalid_body' using errcode = 'P0001';
  end if;
  select status, league_id into v_status, v_league_id from public.seasons where id = p_season_id for share;
  if v_status is null or v_status not in ('upcoming', 'active') then
    raise exception 'season_chat_read_only' using errcode = 'P0001';
  end if;
  select lm.user_id into v_sender from public.league_memberships lm
  where lm.league_id = v_league_id and lm.role = 'creator' limit 1;
  if v_sender is null then
    raise exception 'season_chat_forbidden' using errcode = 'P0001';
  end if;
  insert into public.league_season_chat_messages (
    season_id, sender_user_id, sender_display_name, body, is_announcement, is_system
  ) values (
    p_season_id, v_sender, btrim(p_sender_display_name), btrim(p_body), coalesce(p_is_announcement, true), true
  )
  returning * into v_message;
  return v_message;
end;
$$;

revoke all on function public.send_league_system_text(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.send_league_system_text(uuid, text, text, boolean) to service_role;
