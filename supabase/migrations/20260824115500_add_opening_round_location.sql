alter table public.season_settings
  add column if not exists opening_round_location text;

notify pgrst, 'reload schema';
