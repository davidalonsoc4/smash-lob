-- Smash & Lob v1.11.0
-- REROLL atomico: solo bloquea si hay resultados reales y limpia el estado
-- operativo ligado a los emparejamientos anteriores.

create or replace function public.reroll_season_calendar_matches(
  p_season_id uuid,
  p_matches jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match jsonb;
  v_match_ids uuid[];
  v_payload_count integer;
  v_existing_count integer;
  v_distinct_payload_count integer;
begin
  if jsonb_typeof(p_matches) is distinct from 'array' then
    raise exception 'season_calendar_reroll_invalid_payload';
  end if;

  -- Comprobacion dentro de la misma transaccion para cerrar la carrera entre
  -- la lectura del servidor y la sustitucion definitiva del calendario.
  if exists (
    select 1
    from public.matches match
    where match.season_id = p_season_id
      and (
        match.points_a is not null
        or match.points_b is not null
        or jsonb_array_length(coalesce(match.sets, '[]'::jsonb)) > 0
        or match.result_recorded_at is not null
        or match.result_reported_by_player_id is not null
      )
  ) then
    raise exception 'season_calendar_reroll_has_results';
  end if;

  select count(*)
  into v_existing_count
  from public.matches
  where season_id = p_season_id;

  v_payload_count := jsonb_array_length(p_matches);

  select
    array_agg((item.value ->> 'id')::uuid),
    count(distinct (item.value ->> 'id'))
  into v_match_ids, v_distinct_payload_count
  from jsonb_array_elements(p_matches) as item(value);

  if v_payload_count <> v_existing_count
    or v_distinct_payload_count <> v_payload_count
    or exists (
      select 1
      from unnest(coalesce(v_match_ids, array[]::uuid[])) as payload_match_id
      where not exists (
        select 1
        from public.matches match
        where match.id = payload_match_id
          and match.season_id = p_season_id
      )
    )
    or exists (
      select 1
      from public.matches match
      where match.season_id = p_season_id
        and not (match.id = any(coalesce(v_match_ids, array[]::uuid[])))
    )
  then
    raise exception 'season_calendar_reroll_match_set_mismatch';
  end if;

  -- Estos datos pertenecen a los emparejamientos anteriores. Mantenerlos
  -- podria asignar chats, reservas, votos o sustituciones a jugadores nuevos.
  delete from public.match_chat_reads
  where match_id = any(v_match_ids);

  delete from public.match_chat_messages
  where match_id = any(v_match_ids);

  delete from public.match_substitutions
  where match_id = any(v_match_ids);

  delete from public.match_result_confirmations
  where match_id = any(v_match_ids);

  delete from public.mvp_votes
  where match_id = any(v_match_ids);

  delete from public.activity_events
  where match_id = any(v_match_ids);

  for v_match in
    select value
    from jsonb_array_elements(p_matches)
  loop
    update public.matches
    set
      round = (v_match ->> 'round')::integer,
      team_a = array(
        select player_id.value::uuid
        from jsonb_array_elements_text(v_match -> 'team_a') as player_id(value)
      ),
      team_b = array(
        select player_id.value::uuid
        from jsonb_array_elements_text(v_match -> 'team_b') as player_id(value)
      ),
      status = (v_match ->> 'status')::public.match_status,
      scheduled_at = case
        when jsonb_typeof(v_match -> 'scheduled_at') = 'string'
          then (v_match ->> 'scheduled_at')::timestamptz
        else null
      end,
      date_label = null,
      location = case
        when jsonb_typeof(v_match -> 'location') = 'string'
          then v_match ->> 'location'
        else null
      end,
      points_a = null,
      points_b = null,
      sets = '[]'::jsonb,
      result_recorded_at = null,
      result_reported_by_player_id = null,
      result_locked = false,
      court_reserved = false,
      booking_reservations = '[]'::jsonb,
      booking_transfers = '[]'::jsonb,
      booking_updated_at = null,
      incident_type = null,
      incident_status = null,
      incident_reason = null,
      incident_notes = null,
      incident_reported_by_user_id = null,
      incident_resolved_by_user_id = null,
      incident_created_at = null,
      incident_resolved_at = null,
      resolution_type = null,
      ranking_counts = true
    where id = (v_match ->> 'id')::uuid
      and season_id = p_season_id;

    if not found then
      raise exception 'season_calendar_reroll_match_not_found';
    end if;
  end loop;
end;
$$;

revoke all on function public.reroll_season_calendar_matches(uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.reroll_season_calendar_matches(uuid, jsonb)
to service_role;

notify pgrst, 'reload schema';
