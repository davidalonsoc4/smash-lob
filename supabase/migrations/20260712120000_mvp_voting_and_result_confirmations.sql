alter table public.season_settings
  add column if not exists mvp_system text not null default 'automatic';

alter table public.season_settings
  drop constraint if exists season_settings_mvp_system_check;

alter table public.season_settings
  add constraint season_settings_mvp_system_check
  check (mvp_system in ('none', 'automatic', 'voting'));

alter table public.mvp_votes
  add column if not exists match_id uuid null references public.matches(id) on delete cascade;

drop index if exists public.mvp_votes_league_season_round_voter_idx;
drop index if exists public.mvp_votes_league_season_match_voter_idx;

create unique index if not exists mvp_votes_league_season_match_voter_idx
  on public.mvp_votes (league_id, season_id, match_id, voter_player_id)
  where match_id is not null;

create unique index if not exists mvp_votes_league_season_round_voter_idx
  on public.mvp_votes (league_id, season_id, round, voter_player_id)
  where match_id is null;

create table if not exists public.match_result_confirmations (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null check (status in ('confirmed', 'disputed')),
  updated_at timestamptz not null default now(),
  primary key (match_id, player_id)
);
