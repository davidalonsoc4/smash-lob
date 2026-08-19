-- v1.10.18: structured friendly locations + gap-free friendly dashboard.

alter table public.personal_matches
  add column if not exists location_id uuid references public.padel_locations(id) on delete set null,
  add column if not exists location_court text,
  add column if not exists location_snapshot jsonb;

create index if not exists personal_matches_location_id_idx
  on public.personal_matches (location_id)
  where location_id is not null;

comment on column public.personal_matches.location_id is
  'Structured reference to the global padel location catalog. NULL for free-text/legacy locations.';
comment on column public.personal_matches.location_court is
  'Court selected for this match (for example Pista 1), stored separately from the global location.';
comment on column public.personal_matches.location_snapshot is
  'Immutable location snapshot used to preserve historical display/maps data if the catalog entry is later removed.';

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
      and (
        pm.status = 'finished'
        or (pm.status = 'scheduled' and pm.played_at < now())
      )

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
  select distinct
    'friendly'::text as source,
    pm.id as match_id,
    pm.played_at as event_at
  from public.personal_matches pm
  inner join public.personal_match_participants pmp
    on pmp.match_id = pm.id
  where pmp.user_id = p_user_id
    and pm.status = 'scheduled'
    and pm.played_at >= now()
  order by event_at asc, match_id;
$$;

revoke all on function public.server_next_user_matches(uuid)
  from public, anon, authenticated;
grant execute on function public.server_next_user_matches(uuid)
  to service_role;
