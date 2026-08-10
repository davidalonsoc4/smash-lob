-- Add a third MVP mode without changing existing seasons.
ALTER TABLE public.season_settings
  DROP CONSTRAINT IF EXISTS season_settings_mvp_system_check;

ALTER TABLE public.season_settings
  ADD CONSTRAINT season_settings_mvp_system_check
  CHECK (mvp_system = ANY (ARRAY[
    'none'::text,
    'automatic'::text,
    'automatic_advanced'::text,
    'voting'::text
  ]));
