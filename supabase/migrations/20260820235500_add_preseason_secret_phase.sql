ALTER TABLE public.season_settings
  ADD COLUMN IF NOT EXISTS preseason_secret_days_before integer;

ALTER TABLE public.season_settings
  DROP CONSTRAINT IF EXISTS season_settings_preseason_secret_days_before_check;

ALTER TABLE public.season_settings
  ADD CONSTRAINT season_settings_preseason_secret_days_before_check
  CHECK (
    preseason_secret_days_before IS NULL
    OR preseason_secret_days_before BETWEEN 1 AND 90
  );

COMMENT ON COLUMN public.season_settings.preseason_secret_days_before IS
  'Optional number of days before scheduled_start_at when players enter the safe preseason secrets phase. Pairings remain hidden until season activation.';
