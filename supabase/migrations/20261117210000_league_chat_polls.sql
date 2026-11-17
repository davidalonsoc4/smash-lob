-- Encuestas en el chat de liga. Las crean el creador y los administradores (como las Novedades).
-- Voto único por persona y encuesta, que se puede cambiar o retirar. Los votos solo los ven los participantes del chat.

alter table public.league_season_chat_messages
  add column if not exists has_poll boolean not null default false;

create table public.league_season_chat_poll_options (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.league_season_chat_messages(id) on delete cascade,
  position smallint not null check (position between 1 and 6),
  label text not null check (char_length(btrim(label)) between 1 and 80),
  unique (message_id, position)
);

create table public.league_season_chat_poll_votes (
  message_id uuid not null references public.league_season_chat_messages(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  option_id uuid not null references public.league_season_chat_poll_options(id) on delete cascade,
  voted_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index league_season_chat_poll_votes_option_idx on public.league_season_chat_poll_votes (option_id);

alter table public.league_season_chat_poll_options enable row level security;
alter table public.league_season_chat_poll_votes enable row level security;
revoke all on public.league_season_chat_poll_options, public.league_season_chat_poll_votes from public, anon, authenticated;
grant all on public.league_season_chat_poll_options, public.league_season_chat_poll_votes to service_role;

create function public.send_league_season_chat_poll(
  p_season_id uuid,
  p_user_id uuid,
  p_sender_display_name text,
  p_question text,
  p_options text[]
) returns public.league_season_chat_messages
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.season_status;
  v_league_id uuid;
  v_message public.league_season_chat_messages;
  v_options text[];
  v_index integer;
begin
  select status, league_id into v_status, v_league_id from public.seasons where id = p_season_id for share;
  if v_status is null or v_status not in ('upcoming', 'active') then
    raise exception 'season_chat_read_only' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.league_season_chat_participants where season_id = p_season_id and user_id = p_user_id
  ) then
    raise exception 'season_chat_forbidden' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.league_memberships lm
    where lm.league_id = v_league_id and lm.user_id = p_user_id and lm.role in ('creator', 'admin')
  ) then
    raise exception 'season_chat_poll_forbidden' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_question, ''))) not between 1 and 300 then
    raise exception 'season_chat_invalid_poll' using errcode = 'P0001';
  end if;
  select coalesce(array_agg(btrim(option_label)), '{}') into v_options from unnest(p_options) as option_label;
  if array_length(v_options, 1) is null or array_length(v_options, 1) not between 2 and 6 then
    raise exception 'season_chat_invalid_poll' using errcode = 'P0001';
  end if;
  if exists (select 1 from unnest(v_options) as label where char_length(label) not between 1 and 80)
     or (select count(distinct lower(label)) from unnest(v_options) as label) <> array_length(v_options, 1) then
    raise exception 'season_chat_invalid_poll' using errcode = 'P0001';
  end if;
  insert into public.league_season_chat_messages (season_id, sender_user_id, sender_display_name, body, has_poll)
  values (p_season_id, p_user_id, p_sender_display_name, btrim(p_question), true)
  returning * into v_message;
  for v_index in 1 .. array_length(v_options, 1) loop
    insert into public.league_season_chat_poll_options (message_id, position, label)
    values (v_message.id, v_index, v_options[v_index]);
  end loop;
  return v_message;
end;
$$;

-- p_option_id null retira el voto.
create function public.vote_league_season_chat_poll(
  p_season_id uuid,
  p_user_id uuid,
  p_message_id uuid,
  p_option_id uuid
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.season_status;
begin
  select status into v_status from public.seasons where id = p_season_id for share;
  if v_status is null or v_status not in ('upcoming', 'active') then
    raise exception 'season_chat_read_only' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.league_season_chat_participants where season_id = p_season_id and user_id = p_user_id
  ) then
    raise exception 'season_chat_forbidden' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.league_season_chat_messages
    where id = p_message_id and season_id = p_season_id and has_poll and deleted_at is null
  ) then
    raise exception 'season_chat_poll_not_found' using errcode = 'P0001';
  end if;
  if p_option_id is null then
    delete from public.league_season_chat_poll_votes where message_id = p_message_id and user_id = p_user_id;
    return;
  end if;
  if not exists (
    select 1 from public.league_season_chat_poll_options where id = p_option_id and message_id = p_message_id
  ) then
    raise exception 'season_chat_poll_not_found' using errcode = 'P0001';
  end if;
  insert into public.league_season_chat_poll_votes (message_id, user_id, option_id)
  values (p_message_id, p_user_id, p_option_id)
  on conflict (message_id, user_id) do update set option_id = excluded.option_id, voted_at = now();
end;
$$;

revoke all on function public.send_league_season_chat_poll(uuid, uuid, text, text, text[]) from public, anon, authenticated;
grant execute on function public.send_league_season_chat_poll(uuid, uuid, text, text, text[]) to service_role;
revoke all on function public.vote_league_season_chat_poll(uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.vote_league_season_chat_poll(uuid, uuid, uuid, uuid) to service_role;

-- Una encuesta no se edita (cambiaría la pregunta bajo los votos); sí se puede borrar dentro del plazo.
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
  if v_message.has_poll and p_body is not null then
    raise exception 'season_chat_poll_not_editable' using errcode = 'P0001';
  end if;
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
