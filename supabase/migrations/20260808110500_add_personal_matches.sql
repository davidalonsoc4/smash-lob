create table if not exists public.personal_matches (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid references public.app_users(id) on delete set null,
  played_at timestamptz not null,
  location_name text,
  sets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_matches_location_name_length_check
    check (location_name is null or char_length(location_name) between 1 and 120),
  constraint personal_matches_sets_array_check
    check (jsonb_typeof(sets) = 'array' and jsonb_array_length(sets) between 1 and 5)
);

create table if not exists public.personal_match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.personal_matches(id) on delete cascade,
  team smallint not null,
  slot smallint not null,
  user_id uuid references public.app_users(id) on delete set null,
  source_player_id uuid references public.players(id) on delete set null,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint personal_match_participants_team_check check (team in (1, 2)),
  constraint personal_match_participants_slot_check check (slot in (1, 2)),
  constraint personal_match_participants_name_check check (char_length(trim(display_name)) between 2 and 60),
  constraint personal_match_participants_match_team_slot_key unique (match_id, team, slot)
);

create unique index if not exists personal_match_participants_match_user_key
  on public.personal_match_participants(match_id, user_id)
  where user_id is not null;

create index if not exists personal_matches_played_at_idx
  on public.personal_matches(played_at desc);

create index if not exists personal_match_participants_user_match_idx
  on public.personal_match_participants(user_id, match_id)
  where user_id is not null;

create index if not exists personal_match_participants_match_idx
  on public.personal_match_participants(match_id);

alter table public.personal_matches enable row level security;
alter table public.personal_match_participants enable row level security;

revoke all on table public.personal_matches from public, anon, authenticated;
revoke all on table public.personal_match_participants from public, anon, authenticated;
grant select, insert, update, delete on table public.personal_matches to service_role;
grant select, insert, update, delete on table public.personal_match_participants to service_role;

create or replace function public.server_create_personal_match(
  p_created_by_user_id uuid,
  p_played_at timestamptz,
  p_location_name text,
  p_sets jsonb,
  p_participants jsonb
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

  if jsonb_typeof(p_sets) <> 'array' or jsonb_array_length(p_sets) not between 1 and 5 then
    raise exception 'invalid personal match sets';
  end if;

  if jsonb_typeof(p_participants) <> 'array' or jsonb_array_length(p_participants) <> 4 then
    raise exception 'invalid personal match participants';
  end if;

  insert into public.personal_matches (
    created_by_user_id,
    played_at,
    location_name,
    sets
  )
  values (
    p_created_by_user_id,
    p_played_at,
    nullif(trim(p_location_name), ''),
    p_sets
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

revoke all on function public.server_create_personal_match(uuid, timestamptz, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.server_create_personal_match(uuid, timestamptz, text, jsonb, jsonb)
  to service_role;
