-- Una foto o un vídeo puede publicarse sin texto. Los mensajes de solo texto siguen necesitando texto.
-- Se conserva la regla de mensajes eliminados (cuerpo vacío + deleted_at).

alter table public.league_season_chat_messages
  drop constraint league_season_chat_messages_body_check,
  add constraint league_season_chat_messages_body_check check (
    (
      deleted_at is null
      and char_length(btrim(body)) <= 2000
      and (media_path is not null or char_length(btrim(body)) >= 1)
    )
    or (deleted_at is not null and body = '')
  );

create or replace function public.send_league_season_chat_media_message(
  p_season_id uuid,
  p_user_id uuid,
  p_sender_display_name text,
  p_body text,
  p_media_kind text,
  p_media_path text,
  p_reply_to_id uuid default null
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
    season_id, sender_user_id, sender_display_name, body, media_kind, media_path, reply_to_id
  ) values (
    p_season_id, p_user_id, p_sender_display_name, btrim(coalesce(p_body, '')), p_media_kind, p_media_path, p_reply_to_id
  )
  returning * into v_message;
  return v_message;
end;
$$;
