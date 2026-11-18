-- Why the automatic league-chat notice of a tutorial did not go out for a league (no_season | failed).
-- It lets the management screen show which leagues are still pending instead of failing silently.
alter table public.tutorial_video_leagues
  add column if not exists announce_failed_reason text;
