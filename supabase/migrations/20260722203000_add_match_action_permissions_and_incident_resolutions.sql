-- Smash & Lob v0.12.2
-- Permisos por temporada para incidencias/suplentes y resoluciones contextuales.

alter table public.season_settings
  add column if not exists allow_player_incidents boolean not null default true,
  add column if not exists allow_player_substitutions boolean not null default true;

alter table public.matches
  drop constraint if exists matches_resolution_type_check,
  add constraint matches_resolution_type_check
    check (
      resolution_type is null or resolution_type in (
        'continue',
        'substitute',
        'reset_result',
        'played',
        'postponed',
        'cancelled',
        'no_show',
        'abandoned',
        'administrative'
      )
    );
