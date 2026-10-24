-- Additive. Existing leagues remain individual; no existing roster is rewritten.
ALTER TABLE public.leagues ADD COLUMN modality text NOT NULL DEFAULT 'individual'
  CHECK (modality IN ('individual', 'fixed_pairs'));
ALTER TABLE public.season_players ADD COLUMN pair_number smallint
  CHECK (pair_number BETWEEN 1 AND 16);

CREATE FUNCTION public.guard_league_modality() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.modality IS DISTINCT FROM OLD.modality THEN
    RAISE EXCEPTION 'league_modality_immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER league_modality_immutable BEFORE UPDATE OF modality ON public.leagues
FOR EACH ROW EXECUTE FUNCTION public.guard_league_modality();

CREATE FUNCTION public.guard_season_pair_number() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_mode text;
BEGIN
  SELECT l.modality INTO v_mode FROM public.seasons s JOIN public.leagues l ON l.id = s.league_id WHERE s.id = NEW.season_id;
  IF v_mode <> 'fixed_pairs' THEN
    IF NEW.pair_number IS NOT NULL THEN RAISE EXCEPTION 'individual_league_has_no_fixed_pairs'; END IF;
    RETURN NEW;
  END IF;
  -- The existing atomic replacement RPC keeps the outgoing player's team identity.
  IF NEW.pair_number IS NULL AND NEW.replaces_player_id IS NOT NULL THEN
    SELECT pair_number INTO NEW.pair_number FROM public.season_players
      WHERE season_id = NEW.season_id AND player_id = NEW.replaces_player_id;
  END IF;
  IF NEW.pair_number IS NULL THEN RAISE EXCEPTION 'invalid_fixed_pairs'; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.pair_number IS DISTINCT FROM OLD.pair_number OR NEW.season_id <> OLD.season_id OR NEW.player_id <> OLD.player_id) THEN
    RAISE EXCEPTION 'season_pair_identity_immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER season_pair_number BEFORE INSERT OR UPDATE ON public.season_players
FOR EACH ROW EXECUTE FUNCTION public.guard_season_pair_number();

CREATE FUNCTION public.guard_fixed_pair_season_start() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_count integer;
BEGIN
  IF NEW.status <> 'active' OR OLD.status = 'active' OR NOT EXISTS (SELECT 1 FROM public.leagues WHERE id = NEW.league_id AND modality = 'fixed_pairs') THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_count FROM public.season_players WHERE season_id = NEW.id AND status <> 'withdrawn';
  IF v_count < 4 OR v_count > 32 OR v_count % 2 <> 0 OR EXISTS (
    SELECT pair_number FROM public.season_players WHERE season_id = NEW.id AND status <> 'withdrawn'
    GROUP BY pair_number HAVING pair_number IS NULL OR count(*) <> 2
  ) THEN RAISE EXCEPTION 'invalid_fixed_pairs'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER fixed_pair_season_start BEFORE UPDATE OF status ON public.seasons
FOR EACH ROW EXECUTE FUNCTION public.guard_fixed_pair_season_start();

CREATE FUNCTION public.guard_fixed_league_match() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_team uuid[]; v_known integer; v_distinct integer; v_pair integer; v_other integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.leagues WHERE id = NEW.league_id AND modality = 'fixed_pairs') THEN RETURN NEW; END IF;
  IF cardinality(NEW.team_a) <> 2 OR cardinality(NEW.team_b) <> 2 OR
    (SELECT count(DISTINCT id) FROM unnest(NEW.team_a || NEW.team_b) id) <> 4 THEN RAISE EXCEPTION 'invalid_fixed_pair_match'; END IF;
  FOREACH v_team SLICE 1 IN ARRAY ARRAY[NEW.team_a, NEW.team_b] LOOP
    SELECT count(*), count(DISTINCT pair_number), min(pair_number) INTO v_known, v_distinct, v_pair
      FROM public.season_players WHERE season_id = NEW.season_id AND player_id = ANY(v_team);
    IF v_distinct > 1 OR (TG_OP = 'INSERT' AND (v_known <> 2 OR v_distinct <> 1)) THEN RAISE EXCEPTION 'invalid_fixed_pair_match'; END IF;
    -- Existing authorized substitution RPCs may introduce temporary substitutes
    -- without a season slot. Permanent replacements inherit their slot above.
    IF TG_OP = 'UPDATE' AND v_known < 2 AND EXISTS (
      SELECT 1 FROM unnest(v_team) member_id
      WHERE NOT EXISTS (SELECT 1 FROM public.season_players WHERE season_id = NEW.season_id AND player_id = member_id)
        AND NOT EXISTS (SELECT 1 FROM public.season_substitutes WHERE season_id = NEW.season_id AND player_id = member_id AND active)
    ) THEN RAISE EXCEPTION 'invalid_fixed_pair_match'; END IF;
    IF v_pair IS NOT NULL AND v_other = v_pair THEN RAISE EXCEPTION 'invalid_fixed_pair_match'; END IF;
    v_other := v_pair;
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER fixed_league_match BEFORE INSERT OR UPDATE OF team_a, team_b, season_id, league_id ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.guard_fixed_league_match();

-- No new grants, policies, bypasses or exposed RPCs. Existing RLS remains in force.
REVOKE ALL ON FUNCTION public.guard_league_modality() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_season_pair_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_fixed_pair_season_start() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_fixed_league_match() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_league_modality(), public.guard_season_pair_number(), public.guard_fixed_pair_season_start(), public.guard_fixed_league_match() TO service_role;
