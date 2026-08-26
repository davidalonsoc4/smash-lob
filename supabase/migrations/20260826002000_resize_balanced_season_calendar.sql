-- Smash & Lob v1.12.3
-- Permite regenerar y redimensionar atomically un calendario equilibrado
-- mientras la temporada siga sin resultados registrados.

create or replace function public.resize_season_calendar_matches(
  p_season_id uuid,
  p_total_rounds integer,
  p_schedule_mode text,
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
  v_league_id uuid;
  v_payload_count integer;
  v_max_round integer;
begin
  if p_total_rounds < 1
    or p_schedule_mode not in ('single', 'double', 'extended')
    or jsonb_typeof(p_matches) is distinct from 'array'
  then
    raise exception 'season_calendar_resize_invalid_payload';
  end if;

  select league_id
  into v_league_id
  from public.seasons
  where id = p_season_id
  for update;

  if v_league_id is null then
    raise exception 'season_calendar_resize_season_not_found';
  end if;

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
    raise exception 'season_calendar_resize_has_results';
  end if;

  v_payload_count := jsonb_array_length(p_matches);
  select max((item.value ->> 'round')::integer)
  into v_max_round
  from jsonb_array_elements(p_matches) as item(value);

  if v_payload_count < 1
    or v_max_round is distinct from p_total_rounds
    or exists (
      select 1
      from jsonb_array_elements(p_matches) as item(value)
      where (item.value ->> 'round')::integer < 1
        or jsonb_array_length(item.value -> 'team_a') <> 2
        or jsonb_array_length(item.value -> 'team_b') <> 2
    )
  then
    raise exception 'season_calendar_resize_invalid_payload';
  end if;

  select array_agg(id)
  into v_match_ids
  from public.matches
  where season_id = p_season_id;

  -- Estado operativo ligado a los emparejamientos que van a desaparecer.
  delete from public.match_chat_reads
  where match_id = any(coalesce(v_match_ids, array[]::uuid[]));

  delete from public.match_chat_messages
  where match_id = any(coalesce(v_match_ids, array[]::uuid[]));

  delete from public.match_substitutions
  where match_id = any(coalesce(v_match_ids, array[]::uuid[]));

  delete from public.match_result_confirmations
  where match_id = any(coalesce(v_match_ids, array[]::uuid[]));

  delete from public.mvp_votes
  where match_id = any(coalesce(v_match_ids, array[]::uuid[]));

  delete from public.activity_events
  where match_id = any(coalesce(v_match_ids, array[]::uuid[]));

  delete from public.matches
  where season_id = p_season_id;

  for v_match in
    select value
    from jsonb_array_elements(p_matches)
  loop
    insert into public.matches (
      league_id,
      season_id,
      round,
      status,
      team_a,
      team_b,
      scheduled_at,
      date_label,
      location,
      points_a,
      points_b,
      sets,
      result_recorded_at,
      result_reported_by_player_id,
      result_locked,
      court_reserved,
      booking_reservations,
      booking_transfers,
      booking_updated_at,
      ranking_counts
    ) values (
      v_league_id,
      p_season_id,
      (v_match ->> 'round')::integer,
      (v_match ->> 'status')::public.match_status,
      array(
        select player_id.value::uuid
        from jsonb_array_elements_text(v_match -> 'team_a') as player_id(value)
      ),
      array(
        select player_id.value::uuid
        from jsonb_array_elements_text(v_match -> 'team_b') as player_id(value)
      ),
      case
        when jsonb_typeof(v_match -> 'scheduled_at') = 'string'
          then (v_match ->> 'scheduled_at')::timestamptz
        else null
      end,
      null,
      case
        when jsonb_typeof(v_match -> 'location') = 'string'
          then v_match ->> 'location'
        else null
      end,
      null,
      null,
      '[]'::jsonb,
      null,
      null,
      false,
      false,
      '[]'::jsonb,
      '[]'::jsonb,
      null,
      true
    );
  end loop;

  update public.seasons
  set
    total_rounds = p_total_rounds,
    completed_rounds = least(completed_rounds, p_total_rounds)
  where id = p_season_id;

  update public.season_settings
  set
    schedule_mode = p_schedule_mode,
    revealed_through_round = least(coalesce(revealed_through_round, 0), p_total_rounds),
    manual_active_round = case
      when manual_active_round is not null and manual_active_round > p_total_rounds then null
      else manual_active_round
    end,
    manual_completed_rounds = array(
      select completed_round
      from unnest(coalesce(manual_completed_rounds, array[]::integer[])) as completed_round
      where completed_round <= p_total_rounds
      order by completed_round
    )
  where season_id = p_season_id;
end;
$$;

revoke all on function public.resize_season_calendar_matches(uuid, integer, text, jsonb)
from public, anon, authenticated;
grant execute on function public.resize_season_calendar_matches(uuid, integer, text, jsonb)
to service_role;

notify pgrst, 'reload schema';
