-- Fotos y vídeos en el chat de liga/temporada. Solo los publica el rol creator de la liga.
-- Cada foto/vídeo lleva siempre un texto (la restricción del cuerpo no se modifica).
-- Los archivos viven en un bucket PRIVADO: no hay políticas para anon/authenticated, el servidor
-- entrega enlaces firmados de corta duración solo a los participantes del chat.

alter table public.league_season_chat_messages
  add column if not exists media_kind text,
  add column if not exists media_path text;

alter table public.league_season_chat_messages
  add constraint league_season_chat_messages_media_check
    check (
      (media_kind is null and media_path is null)
      or (media_kind in ('image', 'video') and media_path is not null and char_length(media_path) between 1 and 300)
    );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'league-chat-media',
  'league-chat-media',
  false,
  52428800,
  array['video/mp4', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.send_league_season_chat_media_message(
  p_season_id uuid,
  p_user_id uuid,
  p_sender_display_name text,
  p_body text,
  p_media_kind text,
  p_media_path text
) returns public.league_season_chat_messages
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.season_status;
  v_league_id uuid;
  v_message public.league_season_chat_messages;
begin
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 2000 then
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
  insert into public.league_season_chat_messages (
    season_id, sender_user_id, sender_display_name, body, media_kind, media_path
  ) values (
    p_season_id, p_user_id, p_sender_display_name, btrim(p_body), p_media_kind, p_media_path
  )
  returning * into v_message;
  return v_message;
end;
$$;

revoke all on function public.send_league_season_chat_media_message(uuid, uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.send_league_season_chat_media_message(uuid, uuid, text, text, text, text)
  to service_role;
