-- Un mensaje del chat de liga solo se puede editar durante 15 minutos y borrar durante 1 hora desde que se envía.
-- Misma firma que la función existente: se reemplaza su cuerpo añadiendo la comprobación de antigüedad.

create or replace function public.change_league_season_chat_message(
  p_season_id uuid, p_user_id uuid, p_message_id uuid, p_body text
) returns public.league_season_chat_messages
language plpgsql security invoker set search_path = '' as $$
declare
  v_season public.seasons;
  v_message public.league_season_chat_messages;
  v_limit interval;
begin
  select * into v_season from public.seasons where id = p_season_id for share;
  if not found or v_season.status not in ('upcoming', 'active') then
    raise exception 'season_chat_read_only' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.league_season_chat_participants
    where season_id = p_season_id and user_id = p_user_id
  ) or (v_season.status = 'upcoming' and not exists (
    select 1 from public.season_players sp
    join public.league_memberships lm on lm.league_id = v_season.league_id and lm.player_id = sp.player_id
    where sp.season_id = p_season_id and lm.user_id = p_user_id
  )) then
    raise exception 'season_chat_forbidden' using errcode = 'P0001';
  end if;
  select * into v_message from public.league_season_chat_messages
  where id = p_message_id and season_id = p_season_id and sender_user_id = p_user_id for update;
  if not found then
    raise exception 'season_chat_message_not_found' using errcode = 'P0001';
  end if;
  if v_message.deleted_at is not null or v_message.body = p_body then
    return v_message;
  end if;
  -- p_body null means "delete": 1 hour; otherwise it is an edit: 15 minutes.
  v_limit := case when p_body is null then interval '1 hour' else interval '15 minutes' end;
  if clock_timestamp() - v_message.created_at > v_limit then
    raise exception 'season_chat_change_expired' using errcode = 'P0001';
  end if;
  update public.league_season_chat_messages
  set body = coalesce(p_body, ''),
      edited_at = case when p_body is null then edited_at else clock_timestamp() end,
      deleted_at = case when p_body is null then clock_timestamp() end
  where id = v_message.id returning * into v_message;
  return v_message;
end;
$$;
