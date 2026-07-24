-- Controls whether players can browse previous-season statistics while the
-- league still has an active or upcoming season. When every season is closed,
-- historical scopes remain available so the league keeps a useful archive.

alter table public.leagues
  add column if not exists show_historical_profile_stats boolean not null default false;
