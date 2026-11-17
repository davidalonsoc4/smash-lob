-- "Novedad": mensaje importante del chat de liga que el servidor notifica a todos los participantes.
-- Lo pueden publicar el creador y los administradores de la liga.

alter table public.league_season_chat_messages
  add column if not exists is_announcement boolean not null default false;

-- Se retiran las firmas anteriores para que PostgREST no encuentre dos candidatas con los mismos argumentos.
drop function if exists public.send_league_season_chat_message(uuid, uuid, text, text, uuid);
drop function if exists public.send_league_season_chat_media_message(uuid, uuid, text, text, text, text, uuid);

create function public.send_league_season_chat_message(
  p_season_id uuid, p_user_id uuid, p_sender_display_name text, p_body text,
  p_reply_to_id uuid default null,
  p_is_announcement boolean default false
) returns public.league_season_chat_messages
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.season_status;
  v_league_id uuid;
  v_message public.league_season_chat_messages;
begin
  select status, league_id into v_status, v_league_id from public.seasons where id = p_season_id for share;
  if v_status is null or v_status not in ('upcoming', 'active') then
    raise exception 'season_chat_read_only' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.league_season_chat_participants where season_id = p_season_id and user_id = p_user_id) then
    raise exception 'season_chat_forbidden' using errcode = 'P0001';
  end if;
  if v_status = 'upcoming' and not exists (
    select 1 from public.season_players sp
    join public.seasons s on s.id = sp.season_id
    join public.league_memberships lm on lm.league_id = s.league_id and lm.player_id = sp.player_id
    where sp.season_id = p_season_id and lm.user_id = p_user_id
  ) then
    raise exception 'season_chat_forbidden' using errcode = 'P0001';
  end if;
  if p_is_announcement and not exists (
    select 1 from public.league_memberships lm
    where lm.league_id = v_league_id and lm.user_id = p_user_id and lm.role in ('creator', 'admin')
  ) then
    raise exception 'season_chat_announcement_forbidden' using errcode = 'P0001';
  end if;
  if p_reply_to_id is not null and not exists (
    select 1 from public.league_season_chat_messages where id = p_reply_to_id and season_id = p_season_id
  ) then
    raise exception 'season_chat_invalid_reply' using errcode = 'P0001';
  end if;
  insert into public.league_season_chat_messages (season_id, sender_user_id, sender_display_name, body, reply_to_id, is_announcement)
  values (p_season_id, p_user_id, p_sender_display_name, p_body, p_reply_to_id, p_is_announcement)
  returning * into v_message;
  return v_message;
end;
$$;

create function public.send_league_season_chat_media_message(
  p_season_id uuid,
  p_user_id uuid,
  p_sender_display_name text,
  p_body text,
  p_media_kind text,
  p_media_path text,
  p_reply_to_id uuid default null,
  p_is_announcement boolean default false
) returns public.league_season_chat_messages
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.season_status;
  v_league_id uuid;
  v_message public.league_season_chat_messages;
begin
  if char_length(btrim(coalesce(p_body, ''))) > 2000 then
    raise exception 'season_chat_invalid_body' using errcode = 'P0001';
  end if;
  if p_media_kind not in ('image', 'video') or p_media_path is null
     or p_media_path not like p_season_id::text || '/%' then
    raise exception 'season_chat_invalid_media' using errcode = 'P0001';
  end if;
  select status, league_id into v_status, v_league_id from public.seasons where id = p_season_id for share;
  if v_status is null or v_status not in ('upcoming', 'active') then
    raise exception 'season_chat_read_only' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.league_season_chat_participants
    where season_id = p_season_id and user_id = p_user_id
  ) then
    raise exception 'season_chat_forbidden' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.league_memberships lm
    where lm.league_id = v_league_id and lm.user_id = p_user_id and lm.role = 'creator'
  ) then
    raise exception 'season_chat_media_forbidden' using errcode = 'P0001';
  end if;
  if p_reply_to_id is not null and not exists (
    select 1 from public.league_season_chat_messages where id = p_reply_to_id and season_id = p_season_id
  ) then
    raise exception 'season_chat_invalid_reply' using errcode = 'P0001';
  end if;
  insert into public.league_season_chat_messages (
    season_id, sender_user_id, sender_display_name, body, media_kind, media_path, reply_to_id, is_announcement
  ) values (
    p_season_id, p_user_id, p_sender_display_name, btrim(coalesce(p_body, '')), p_media_kind, p_media_path, p_reply_to_id, p_is_announcement
  )
  returning * into v_message;
  return v_message;
end;
$$;

revoke all on function public.send_league_season_chat_message(uuid, uuid, text, text, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.send_league_season_chat_message(uuid, uuid, text, text, uuid, boolean) to service_role;
revoke all on function public.send_league_season_chat_media_message(uuid, uuid, text, text, text, text, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.send_league_season_chat_media_message(uuid, uuid, text, text, text, text, uuid, boolean)
  to service_role;
