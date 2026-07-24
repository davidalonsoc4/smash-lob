BEGIN;

ALTER TABLE public.league_announcements
  ADD COLUMN IF NOT EXISTS target_player_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

CREATE INDEX IF NOT EXISTS league_announcements_target_players_idx
  ON public.league_announcements USING gin (target_player_ids);

COMMIT;
