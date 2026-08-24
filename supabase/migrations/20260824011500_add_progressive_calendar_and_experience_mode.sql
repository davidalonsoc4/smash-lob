alter table public.season_settings
  add column if not exists calendar_visibility_mode text not null default 'full',
  add column if not exists revealed_through_round integer not null default 0,
  add column if not exists opening_round_enabled boolean not null default false,
  add column if not exists opening_round_at timestamptz;

alter table public.season_settings
  drop constraint if exists season_settings_calendar_visibility_mode_check,
  add constraint season_settings_calendar_visibility_mode_check
    check (calendar_visibility_mode in ('full', 'progressive')),
  drop constraint if exists season_settings_revealed_through_round_check,
  add constraint season_settings_revealed_through_round_check
    check (revealed_through_round >= 0);

alter table public.league_memberships
  add column if not exists experience_mode text not null default 'admin';

alter table public.league_memberships
  drop constraint if exists league_memberships_experience_mode_check,
  add constraint league_memberships_experience_mode_check
    check (experience_mode in ('admin', 'player', 'player_experience'));
