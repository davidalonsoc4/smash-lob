alter table public.personal_matches
  add column if not exists status text not null default 'finished',
  add column if not exists result_recorded_at timestamptz;

update public.personal_matches
set result_recorded_at = coalesce(result_recorded_at, updated_at, created_at)
where status = 'finished'
  and result_recorded_at is null;

alter table public.personal_matches
  drop constraint if exists personal_matches_sets_array_check;

alter table public.personal_matches
  drop constraint if exists personal_matches_status_check;

alter table public.personal_matches
  drop constraint if exists personal_matches_status_sets_check;

alter table public.personal_matches
  add constraint personal_matches_status_check
    check (status in ('scheduled', 'finished')),
  add constraint personal_matches_sets_array_check
    check (jsonb_typeof(sets) = 'array' and jsonb_array_length(sets) between 0 and 5),
  add constraint personal_matches_status_sets_check
    check (
      (status = 'scheduled' and jsonb_array_length(sets) = 0)
      or
      (status = 'finished' and jsonb_array_length(sets) between 1 and 5)
    );

create index if not exists personal_matches_status_played_at_idx
  on public.personal_matches(status, played_at desc);

create or replace function public.server_create_personal_match(
  p_created_by_user_id uuid,
  p_played_at timestamptz,
  p_location_name text,
  p_sets jsonb,
  p_participants jsonb,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_participant_count integer;
begin
  if p_created_by_user_id is null or not exists (
    select 1 from public.app_users where id = p_created_by_user_id
  ) then
    raise exception 'invalid personal match creator';
  end if;

  if p_played_at is null then
    raise exception 'invalid personal match date';
  end if;

  if p_status not in ('scheduled', 'finished') then
    raise exception 'invalid personal match status';
  end if;

  if jsonb_typeof(p_sets) <> 'array' then
    raise exception 'invalid personal match sets';
  end if;

  if p_status = 'scheduled' and jsonb_array_length(p_sets) <> 0 then
    raise exception 'scheduled personal match cannot contain result sets';
  end if;

  if p_status = 'finished' and jsonb_array_length(p_sets) not between 1 and 5 then
    raise exception 'finished personal match requires result sets';
  end if;

  if jsonb_typeof(p_participants) <> 'array' or jsonb_array_length(p_participants) <> 4 then
    raise exception 'invalid personal match participants';
  end if;

  insert into public.personal_matches (
    created_by_user_id,
    played_at,
    location_name,
    sets,
    status,
    result_recorded_at
  )
  values (
    p_created_by_user_id,
    p_played_at,
    nullif(trim(p_location_name), ''),
    p_sets,
    p_status,
    case when p_status = 'finished' then now() else null end
  )
  returning id into v_match_id;

  insert into public.personal_match_participants (
    match_id,
    team,
    slot,
    user_id,
    source_player_id,
    display_name
  )
  select
    v_match_id,
    participant.team,
    participant.slot,
    participant.user_id,
    participant.source_player_id,
    trim(participant.display_name)
  from jsonb_to_recordset(p_participants) as participant(
    team smallint,
    slot smallint,
    user_id uuid,
    source_player_id uuid,
    display_name text
  );

  select count(*)
  into v_participant_count
  from public.personal_match_participants
  where match_id = v_match_id;

  if v_participant_count <> 4 then
    raise exception 'invalid personal match participant count';
  end if;

  if not exists (
    select 1
    from public.personal_match_participants
    where match_id = v_match_id
      and user_id = p_created_by_user_id
  ) then
    raise exception 'creator must participate in personal match';
  end if;

  return v_match_id;
end;
$$;

revoke all on function public.server_create_personal_match(uuid, timestamptz, text, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.server_create_personal_match(uuid, timestamptz, text, jsonb, jsonb, text)
  to service_role;

-- Keep the v1.4.0 five-argument RPC as a compatibility wrapper while PRE rolls
-- from the already-deployed client to v1.4.1. New clients call the status-aware
-- six-argument overload above.
create or replace function public.server_create_personal_match(
  p_created_by_user_id uuid,
  p_played_at timestamptz,
  p_location_name text,
  p_sets jsonb,
  p_participants jsonb
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.server_create_personal_match(
    p_created_by_user_id,
    p_played_at,
    p_location_name,
    p_sets,
    p_participants,
    'finished'::text
  );
$$;

revoke all on function public.server_create_personal_match(uuid, timestamptz, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.server_create_personal_match(uuid, timestamptz, text, jsonb, jsonb)
  to service_role;

create or replace function public.server_list_user_match_history(
  p_user_id uuid,
  p_limit integer default 10,
  p_offset integer default 0
)
returns table (
  source text,
  match_id uuid,
  event_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with candidate_matches as (
    select
      'friendly'::text as source,
      pm.id as match_id,
      coalesce(pm.played_at, pm.result_recorded_at, pm.created_at) as event_at
    from public.personal_matches pm
    inner join public.personal_match_participants pmp
      on pmp.match_id = pm.id
    where pmp.user_id = p_user_id
      and pm.status = 'finished'

    union all

    select
      'league'::text as source,
      m.id as match_id,
      coalesce(m.scheduled_at, m.result_recorded_at, m.created_at) as event_at
    from public.matches m
    inner join public.league_memberships lm
      on lm.league_id = m.league_id
     and lm.user_id = p_user_id
     and lm.player_id is not null
    where m.status = 'finished'
      and (
        lm.player_id = any(m.team_a)
        or lm.player_id = any(m.team_b)
      )
  )
  select distinct
    candidate_matches.source,
    candidate_matches.match_id,
    candidate_matches.event_at
  from candidate_matches
  order by candidate_matches.event_at desc nulls last, candidate_matches.match_id
  limit least(greatest(coalesce(p_limit, 10), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.server_list_user_match_history(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.server_list_user_match_history(uuid, integer, integer)
  to service_role;

create or replace function public.server_next_user_matches(p_user_id uuid)
returns table (
  source text,
  match_id uuid,
  event_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  (
    select
      'friendly'::text as source,
      pm.id as match_id,
      pm.played_at as event_at
    from public.personal_matches pm
    inner join public.personal_match_participants pmp
      on pmp.match_id = pm.id
    where pmp.user_id = p_user_id
      and pm.status = 'scheduled'
      and pm.played_at >= now()
    order by pm.played_at asc
    limit 1
  )

  union all

  (
    select
      'league'::text as source,
      m.id as match_id,
      m.scheduled_at as event_at
    from public.matches m
    inner join public.league_memberships lm
      on lm.league_id = m.league_id
     and lm.user_id = p_user_id
     and lm.player_id is not null
    where m.status = 'scheduled'
      and m.scheduled_at is not null
      and m.scheduled_at >= now()
      and (
        lm.player_id = any(m.team_a)
        or lm.player_id = any(m.team_b)
      )
    order by m.scheduled_at asc
    limit 1
  );
$$;

revoke all on function public.server_next_user_matches(uuid)
  from public, anon, authenticated;
grant execute on function public.server_next_user_matches(uuid)
  to service_role;
