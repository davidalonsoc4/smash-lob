-- Avisos automáticos de tutoriales en el chat de la liga.
-- El mensaje lo "firma" la propia liga: la fila sigue necesitando un usuario (sender_user_id es obligatorio), así que
-- se usa el creador de la liga como autor técnico y is_system marca que el nombre visible es el de la liga.
alter table public.league_season_chat_messages
  add column if not exists is_system boolean not null default false;

-- Marca cada liga ya avisada para no repetir el mensaje al editar el tutorial.
alter table public.tutorial_video_leagues
  add column if not exists announced_at timestamptz;

create function public.send_league_system_announcement(
  p_season_id uuid,
  p_sender_display_name text,
  p_body text,
  p_media_path text,
  p_poster_path text default null,
  p_width integer default null,
  p_height integer default null,
  p_duration_ms integer default null
) returns public.league_season_chat_messages
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.season_status;
  v_league_id uuid;
  v_sender uuid;
  v_message public.league_season_chat_messages;
begin
  if char_length(btrim(coalesce(p_body, ''))) > 2000 or char_length(btrim(coalesce(p_sender_display_name, ''))) = 0 then
    raise exception 'season_chat_invalid_body' using errcode = 'P0001';
  end if;
  if p_media_path is null or p_media_path not like p_season_id::text || '/%'
     or (p_poster_path is not null and p_poster_path not like p_season_id::text || '/%') then
    raise exception 'season_chat_invalid_media' using errcode = 'P0001';
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
    season_id, sender_user_id, sender_display_name, body, media_kind, media_path, is_announcement, is_system,
    media_poster_path, media_width, media_height, media_duration_ms
  ) values (
    p_season_id, v_sender, btrim(p_sender_display_name), btrim(coalesce(p_body, '')), 'video', p_media_path, true, true,
    p_poster_path, p_width, p_height, p_duration_ms
  )
  returning * into v_message;
  return v_message;
end;
$$;

revoke all on function public.send_league_system_announcement(uuid, text, text, text, text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.send_league_system_announcement(uuid, text, text, text, text, integer, integer, integer)
  to service_role;
