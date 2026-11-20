-- Reacciones a los mensajes del chat de liga. Un conjunto cerrado de seis (se guardan como clave, el emoji lo pone la app)
-- y como máximo una reacción por persona y mensaje: reaccionar de nuevo cambia la reacción, repetir la misma la retira.
-- Solo el servidor lee y escribe; los participantes del chat reciben el resumen junto a cada mensaje.

create table public.league_season_chat_reactions (
  message_id uuid not null references public.league_season_chat_messages(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  reaction text not null check (reaction in ('thumbs_up', 'heart', 'laugh', 'surprised', 'ball', 'fire')),
  reacted_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index league_season_chat_reactions_message_idx on public.league_season_chat_reactions (message_id, reaction);

alter table public.league_season_chat_reactions enable row level security;
revoke all on public.league_season_chat_reactions from public, anon, authenticated;
grant all on public.league_season_chat_reactions to service_role;

-- p_reaction null retira la reacción. Devuelve la reacción que queda (null si ya no hay ninguna).
create function public.react_league_season_chat_message(
  p_season_id uuid,
  p_user_id uuid,
  p_message_id uuid,
  p_reaction text
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_status public.season_status;
  v_current text;
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
    where id = p_message_id and season_id = p_season_id and deleted_at is null
  ) then
    raise exception 'season_chat_message_not_found' using errcode = 'P0001';
  end if;
  select reaction into v_current from public.league_season_chat_reactions
  where message_id = p_message_id and user_id = p_user_id;
  if p_reaction is null or p_reaction = v_current then
    delete from public.league_season_chat_reactions where message_id = p_message_id and user_id = p_user_id;
    return null;
  end if;
  insert into public.league_season_chat_reactions (message_id, user_id, reaction)
  values (p_message_id, p_user_id, p_reaction)
  on conflict (message_id, user_id) do update set reaction = excluded.reaction, reacted_at = now();
  return p_reaction;
end;
$$;

-- Resumen por mensaje: cuántas personas eligieron cada reacción y cuál es la de quien consulta.
create function public.league_season_chat_reaction_summary(
  p_message_ids uuid[],
  p_user_id uuid
) returns table (message_id uuid, reaction text, total integer, mine boolean)
language sql stable security definer set search_path = '' as $$
  select r.message_id, r.reaction, count(*)::integer, bool_or(r.user_id = p_user_id)
  from public.league_season_chat_reactions r
  where r.message_id = any(p_message_ids)
  group by r.message_id, r.reaction;
$$;

revoke all on function public.react_league_season_chat_message(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.react_league_season_chat_message(uuid, uuid, uuid, text) to service_role;
revoke all on function public.league_season_chat_reaction_summary(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.league_season_chat_reaction_summary(uuid[], uuid) to service_role;
