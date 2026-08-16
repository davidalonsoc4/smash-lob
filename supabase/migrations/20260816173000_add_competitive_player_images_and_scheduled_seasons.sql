-- v1.10.0: keep account identity and league-competitive identity separate,
-- and allow seasons to expose an optional automatic start instant.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS competitive_avatar_url text;

COMMENT ON COLUMN public.players.competitive_avatar_url IS
  'Optional superadmin-managed image override for this competitive player card. app_users.avatar_url remains the global account identity.';

ALTER TABLE public.season_settings
  ADD COLUMN IF NOT EXISTS scheduled_start_at timestamptz;

COMMENT ON COLUMN public.season_settings.scheduled_start_at IS
  'Optional automatic season start instant. While it is in the future the season remains upcoming and competitive mutations stay locked.';

CREATE INDEX IF NOT EXISTS season_settings_scheduled_start_idx
  ON public.season_settings (scheduled_start_at)
  WHERE scheduled_start_at IS NOT NULL;
