alter table public.season_settings
  add column if not exists calendar_visibility_mode text,
  add column if not exists revealed_through_round integer,
  add column if not exists opening_round_enabled boolean,
  add column if not exists opening_round_at timestamptz;

update public.season_settings
set
  calendar_visibility_mode = coalesce(calendar_visibility_mode, 'full'),
  revealed_through_round = coalesce(revealed_through_round, 0),
  opening_round_enabled = coalesce(opening_round_enabled, false)
where
  calendar_visibility_mode is null
  or revealed_through_round is null
  or opening_round_enabled is null;

alter table public.season_settings
  alter column calendar_visibility_mode set default 'full',
  alter column calendar_visibility_mode set not null,
  alter column revealed_through_round set default 0,
  alter column revealed_through_round set not null,
  alter column opening_round_enabled set default false,
  alter column opening_round_enabled set not null;

alter table public.season_settings
  drop constraint if exists season_settings_calendar_visibility_mode_check,
  add constraint season_settings_calendar_visibility_mode_check
    check (calendar_visibility_mode in ('full', 'progressive')),
  drop constraint if exists season_settings_revealed_through_round_check,
  add constraint season_settings_revealed_through_round_check
    check (revealed_through_round >= 0);

alter table public.league_memberships
  add column if not exists experience_mode text;

update public.league_memberships
set experience_mode = coalesce(experience_mode, 'admin')
where experience_mode is null;

alter table public.league_memberships
  alter column experience_mode set default 'admin',
  alter column experience_mode set not null;

alter table public.league_memberships
  drop constraint if exists league_memberships_experience_mode_check,
  add constraint league_memberships_experience_mode_check
    check (experience_mode in ('admin', 'player', 'player_experience'));

notify pgrst, 'reload schema';
