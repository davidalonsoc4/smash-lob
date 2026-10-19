ALTER TABLE public.rapid_tournaments
  ADD COLUMN source_league_id uuid REFERENCES public.leagues(id) ON DELETE SET NULL,
  ADD COLUMN source_season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  ADD CONSTRAINT rapid_tournaments_source_pair_check
    CHECK ((source_league_id IS NULL) = (source_season_id IS NULL));

CREATE INDEX rapid_tournaments_source_season_idx
  ON public.rapid_tournaments (source_league_id, source_season_id)
  WHERE source_league_id IS NOT NULL;
