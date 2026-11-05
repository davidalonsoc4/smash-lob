-- Season chats keep their own participant list so a new league member cannot
-- gain access to previous seasons merely by joining the league later.
create table public.league_season_chat_participants (
  season_id uuid not null references public.seasons(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (season_id, user_id)
);

create table public.league_season_chat_messages (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  sender_user_id uuid not null references public.app_users(id) on delete restrict,
  sender_display_name text not null,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index league_season_chat_messages_season_created_idx
  on public.league_season_chat_messages (season_id, created_at desc, id desc);

alter table public.league_season_chat_participants enable row level security;
alter table public.league_season_chat_messages enable row level security;
revoke all on public.league_season_chat_participants, public.league_season_chat_messages
  from public, anon, authenticated;
grant all on public.league_season_chat_participants, public.league_season_chat_messages
  to service_role;

-- Capture participation while the season is active. Never infer historical
-- participation from today's league membership after the season has ended.
create function public.capture_active_league_chat_participants()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_season uuid; target_league uuid;
begin
  if tg_table_name = 'seasons' then
    target_season := new.id;
  elsif tg_table_name = 'season_players' then
    target_season := new.season_id;
  else
    target_league := new.league_id;
  end if;
  insert into public.league_season_chat_participants (season_id, user_id, player_id)
  select s.id, lm.user_id, sp.player_id
  from public.seasons s
  join public.season_players sp on sp.season_id = s.id
  join public.league_memberships lm on lm.league_id = s.league_id and lm.player_id = sp.player_id
  where s.status = 'active'
    and (s.id = target_season or s.league_id = target_league)
  on conflict (season_id, user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.capture_active_league_chat_participants() from public, anon, authenticated;

create trigger capture_league_chat_season
after insert or update of status on public.seasons
for each row execute function public.capture_active_league_chat_participants();

create trigger capture_league_chat_roster
after insert or update of player_id on public.season_players
for each row execute function public.capture_active_league_chat_participants();

create trigger capture_league_chat_membership
after insert or update of player_id on public.league_memberships
for each row execute function public.capture_active_league_chat_participants();

insert into public.league_season_chat_participants (season_id, user_id, player_id)
select s.id, lm.user_id, sp.player_id
from public.seasons s
join public.season_players sp on sp.season_id = s.id
join public.league_memberships lm on lm.league_id = s.league_id and lm.player_id = sp.player_id
where s.status = 'active'
on conflict (season_id, user_id) do nothing;
