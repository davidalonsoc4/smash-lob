CREATE INDEX rapid_tournament_matches_round_fk_idx
  ON public.rapid_tournament_matches (tournament_id, round_id);
CREATE INDEX rapid_tournament_matches_team_a_one_fk_idx
  ON public.rapid_tournament_matches (tournament_id, team_a_one_id);
CREATE INDEX rapid_tournament_matches_team_a_two_fk_idx
  ON public.rapid_tournament_matches (tournament_id, team_a_two_id);
CREATE INDEX rapid_tournament_matches_team_b_one_fk_idx
  ON public.rapid_tournament_matches (tournament_id, team_b_one_id);
CREATE INDEX rapid_tournament_matches_team_b_two_fk_idx
  ON public.rapid_tournament_matches (tournament_id, team_b_two_id);
