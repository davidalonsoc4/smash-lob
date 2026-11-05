-- Lock the season during the write so finishing it cannot race with sending.
create function public.send_league_season_chat_message(
  p_season_id uuid, p_user_id uuid, p_sender_display_name text, p_body text
) returns public.league_season_chat_messages
language plpgsql security definer set search_path = '' as $$
declare v_status public.season_status; v_message public.league_season_chat_messages;
begin
  select status into v_status from public.seasons where id = p_season_id for share;
  if v_status is distinct from 'active'::public.season_status then
    raise exception 'season_chat_read_only' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.league_season_chat_participants where season_id = p_season_id and user_id = p_user_id) then
    raise exception 'season_chat_forbidden' using errcode = 'P0001';
  end if;
  insert into public.league_season_chat_messages (season_id, sender_user_id, sender_display_name, body)
  values (p_season_id, p_user_id, p_sender_display_name, p_body)
  returning * into v_message;
  return v_message;
end;
$$;
revoke all on function public.send_league_season_chat_message(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.send_league_season_chat_message(uuid,uuid,text,text) to service_role;
