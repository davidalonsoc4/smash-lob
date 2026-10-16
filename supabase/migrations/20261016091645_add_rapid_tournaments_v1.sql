CREATE TABLE public.rapid_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 1000),
  starts_at timestamptz NOT NULL,
  court_one_name text NOT NULL CHECK (length(trim(court_one_name)) BETWEEN 1 AND 80),
  court_two_name text NOT NULL CHECK (length(trim(court_two_name)) BETWEEN 1 AND 80),
  tournament_mode text NOT NULL DEFAULT 'rapid' CHECK (tournament_mode = 'rapid'),
  format text NOT NULL DEFAULT 'balanced_americana' CHECK (format = 'balanced_americana'),
  player_count smallint NOT NULL DEFAULT 12 CHECK (player_count = 12),
  court_count smallint NOT NULL DEFAULT 2 CHECK (court_count = 2),
  reservation_minutes smallint NOT NULL DEFAULT 120 CHECK (reservation_minutes = 120),
  round_count smallint NOT NULL DEFAULT 6 CHECK (round_count = 6),
  round_minutes smallint NOT NULL DEFAULT 16 CHECK (round_minutes = 16),
  transition_minutes smallint NOT NULL DEFAULT 3 CHECK (transition_minutes = 3),
  safety_margin_minutes smallint NOT NULL DEFAULT 9 CHECK (safety_margin_minutes = 9),
  pair_mode text NOT NULL DEFAULT 'rotating' CHECK (pair_mode = 'rotating'),
  scoring_mode text NOT NULL DEFAULT 'rally_points' CHECK (scoring_mode = 'rally_points'),
  ranking_mode text NOT NULL DEFAULT 'average_percentage' CHECK (ranking_mode = 'average_percentage'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'finished')),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE TABLE public.rapid_tournament_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.rapid_tournaments(id) ON DELETE CASCADE,
  slot char(1) NOT NULL CHECK (slot BETWEEN 'A' AND 'L'),
  full_name text NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, slot),
  UNIQUE (tournament_id, id)
);

CREATE TABLE public.rapid_tournament_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.rapid_tournaments(id) ON DELETE CASCADE,
  round_number smallint NOT NULL CHECK (round_number BETWEEN 1 AND 6),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  UNIQUE (tournament_id, round_number),
  UNIQUE (tournament_id, id)
);

CREATE TABLE public.rapid_tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  round_id uuid NOT NULL,
  round_number smallint NOT NULL CHECK (round_number BETWEEN 1 AND 6),
  court_number smallint NOT NULL CHECK (court_number IN (1, 2)),
  court_name text NOT NULL CHECK (length(trim(court_name)) BETWEEN 1 AND 80),
  team_a_one_id uuid NOT NULL,
  team_a_two_id uuid NOT NULL,
  team_b_one_id uuid NOT NULL,
  team_b_two_id uuid NOT NULL,
  score_a integer CHECK (score_a IS NULL OR score_a >= 0),
  score_b integer CHECK (score_b IS NULL OR score_b >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, round_number, court_number),
  FOREIGN KEY (tournament_id, round_id) REFERENCES public.rapid_tournament_rounds(tournament_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id, team_a_one_id) REFERENCES public.rapid_tournament_players(tournament_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id, team_a_two_id) REFERENCES public.rapid_tournament_players(tournament_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id, team_b_one_id) REFERENCES public.rapid_tournament_players(tournament_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id, team_b_two_id) REFERENCES public.rapid_tournament_players(tournament_id, id) ON DELETE CASCADE,
  CHECK (team_a_one_id <> team_a_two_id AND team_a_one_id <> team_b_one_id AND team_a_one_id <> team_b_two_id
    AND team_a_two_id <> team_b_one_id AND team_a_two_id <> team_b_two_id AND team_b_one_id <> team_b_two_id),
  CHECK ((score_a IS NULL AND score_b IS NULL) OR (score_a IS NOT NULL AND score_b IS NOT NULL AND score_a::bigint + score_b::bigint > 0))
);

CREATE INDEX rapid_tournaments_owner_status_idx ON public.rapid_tournaments (created_by_user_id, status, starts_at);
CREATE INDEX rapid_tournament_matches_round_idx ON public.rapid_tournament_matches (tournament_id, round_number, court_number);
CREATE INDEX rapid_tournament_players_order_idx ON public.rapid_tournament_players (tournament_id, slot);

ALTER TABLE public.rapid_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapid_tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapid_tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapid_tournament_matches ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.rapid_tournaments, public.rapid_tournament_players, public.rapid_tournament_rounds, public.rapid_tournament_matches FROM anon, authenticated;
GRANT ALL ON TABLE public.rapid_tournaments, public.rapid_tournament_players, public.rapid_tournament_rounds, public.rapid_tournament_matches TO service_role;

CREATE FUNCTION public.rebuild_rapid_tournament_matches(p_tournament_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.rapid_tournament_matches WHERE tournament_id = p_tournament_id;

  INSERT INTO public.rapid_tournament_matches (
    tournament_id, round_id, round_number, court_number, court_name,
    team_a_one_id, team_a_two_id, team_b_one_id, team_b_two_id
  )
  WITH fixtures(round_number, court_number, a1, a2, b1, b2) AS (
    VALUES
      (1, 1, 'F', 'I', 'K', 'E'), (1, 2, 'L', 'H', 'J', 'G'),
      (2, 1, 'D', 'K', 'L', 'A'), (2, 2, 'C', 'I', 'B', 'J'),
      (3, 1, 'C', 'B', 'G', 'H'), (3, 2, 'D', 'A', 'E', 'F'),
      (4, 1, 'F', 'G', 'J', 'I'), (4, 2, 'H', 'E', 'K', 'L'),
      (5, 1, 'L', 'J', 'A', 'B'), (5, 2, 'K', 'I', 'D', 'C'),
      (6, 1, 'D', 'E', 'C', 'H'), (6, 2, 'A', 'F', 'G', 'B')
  )
  SELECT t.id, r.id, f.round_number, f.court_number,
    CASE f.court_number WHEN 1 THEN t.court_one_name ELSE t.court_two_name END,
    a1.id, a2.id, b1.id, b2.id
  FROM fixtures f
  JOIN public.rapid_tournaments t ON t.id = p_tournament_id
  JOIN public.rapid_tournament_rounds r ON r.tournament_id = t.id AND r.round_number = f.round_number
  JOIN public.rapid_tournament_players a1 ON a1.tournament_id = t.id AND a1.slot = f.a1
  JOIN public.rapid_tournament_players a2 ON a2.tournament_id = t.id AND a2.slot = f.a2
  JOIN public.rapid_tournament_players b1 ON b1.tournament_id = t.id AND b1.slot = f.b1
  JOIN public.rapid_tournament_players b2 ON b2.tournament_id = t.id AND b2.slot = f.b2;
END;
$$;

CREATE FUNCTION public.create_rapid_tournament(
  p_creator_user_id uuid, p_name text, p_description text, p_starts_at timestamptz,
  p_court_one_name text, p_court_two_name text, p_shuffled_names text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_names text[];
BEGIN
  IF p_shuffled_names IS NULL OR cardinality(p_shuffled_names) <> 12 THEN RAISE EXCEPTION 'invalid_player_count'; END IF;
  SELECT array_agg(btrim(regexp_replace(name, '\s+', ' ', 'g')) ORDER BY ordinal)
    INTO v_names FROM unnest(p_shuffled_names) WITH ORDINALITY AS input(name, ordinal);
  IF EXISTS (SELECT 1 FROM unnest(v_names) AS input(name) WHERE name = '' OR length(name) > 80) THEN RAISE EXCEPTION 'invalid_player_name'; END IF;
  IF (SELECT count(DISTINCT lower(name)) FROM unnest(v_names) AS input(name)) <> 12 THEN RAISE EXCEPTION 'duplicate_player_names'; END IF;
  IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 100 OR p_court_one_name IS NULL OR length(btrim(p_court_one_name)) NOT BETWEEN 1 AND 80 OR p_court_two_name IS NULL OR length(btrim(p_court_two_name)) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'invalid_tournament_details'; END IF;

  INSERT INTO public.rapid_tournaments (created_by_user_id, name, description, starts_at, court_one_name, court_two_name)
  VALUES (p_creator_user_id, btrim(p_name), coalesce(left(btrim(p_description), 1000), ''), p_starts_at, btrim(p_court_one_name), btrim(p_court_two_name))
  RETURNING id INTO v_id;

  INSERT INTO public.rapid_tournament_players (tournament_id, slot, full_name)
  SELECT v_id, chr(64 + ordinal::int)::char(1), name FROM unnest(v_names) WITH ORDINALITY AS input(name, ordinal);
  INSERT INTO public.rapid_tournament_rounds (tournament_id, round_number, starts_at, ends_at)
  SELECT v_id, round_number::smallint, p_starts_at + make_interval(mins => (round_number - 1) * 19), p_starts_at + make_interval(mins => (round_number - 1) * 19 + 16)
  FROM generate_series(1, 6) AS round_number;
  PERFORM public.rebuild_rapid_tournament_matches(v_id);
  RETURN v_id;
END;
$$;

CREATE FUNCTION public.reroll_rapid_tournament(p_tournament_id uuid, p_creator_user_id uuid, p_shuffled_names text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_names text[];
BEGIN
  PERFORM 1 FROM public.rapid_tournaments WHERE id = p_tournament_id AND created_by_user_id = p_creator_user_id AND status = 'draft' FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF p_shuffled_names IS NULL OR cardinality(p_shuffled_names) <> 12 THEN RAISE EXCEPTION 'invalid_player_count'; END IF;
  SELECT array_agg(btrim(regexp_replace(name, '\s+', ' ', 'g')) ORDER BY ordinal)
    INTO v_names FROM unnest(p_shuffled_names) WITH ORDINALITY AS input(name, ordinal);
  IF EXISTS (SELECT 1 FROM unnest(v_names) AS input(name) WHERE name = '' OR length(name) > 80) THEN RAISE EXCEPTION 'invalid_player_name'; END IF;
  IF (SELECT count(DISTINCT lower(name)) FROM unnest(v_names) AS input(name)) <> 12 THEN RAISE EXCEPTION 'duplicate_player_names'; END IF;
  UPDATE public.rapid_tournament_players player SET full_name = input.name
  FROM unnest(v_names) WITH ORDINALITY AS input(name, ordinal)
  WHERE player.tournament_id = p_tournament_id AND player.slot = chr(64 + input.ordinal::int)::char(1);
  PERFORM public.rebuild_rapid_tournament_matches(p_tournament_id);
  RETURN true;
END;
$$;

CREATE FUNCTION public.start_rapid_tournament(p_tournament_id uuid, p_creator_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.rapid_tournaments SET status = 'in_progress', started_at = now()
  WHERE id = p_tournament_id AND created_by_user_id = p_creator_user_id AND status = 'draft';
  RETURN FOUND;
END;
$$;

CREATE FUNCTION public.record_rapid_tournament_result(p_tournament_id uuid, p_match_id uuid, p_creator_user_id uuid, p_score_a integer, p_score_b integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status FROM public.rapid_tournaments
  WHERE id = p_tournament_id AND created_by_user_id = p_creator_user_id FOR UPDATE;
  IF NOT FOUND OR v_status <> 'in_progress' THEN RETURN false; END IF;
  IF p_score_a IS NULL OR p_score_b IS NULL OR p_score_a < 0 OR p_score_b < 0 OR p_score_a::bigint + p_score_b::bigint <= 0 THEN RAISE EXCEPTION 'invalid_score'; END IF;
  UPDATE public.rapid_tournament_matches SET score_a = p_score_a, score_b = p_score_b
  WHERE id = p_match_id AND tournament_id = p_tournament_id;
  RETURN FOUND;
END;
$$;

CREATE FUNCTION public.finish_rapid_tournament(p_tournament_id uuid, p_creator_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status text;
  v_completed integer;
BEGIN
  SELECT status INTO v_status FROM public.rapid_tournaments
  WHERE id = p_tournament_id AND created_by_user_id = p_creator_user_id FOR UPDATE;
  IF NOT FOUND OR v_status <> 'in_progress' THEN RETURN false; END IF;
  SELECT count(*) INTO v_completed FROM public.rapid_tournament_matches
  WHERE tournament_id = p_tournament_id AND score_a IS NOT NULL AND score_b IS NOT NULL;
  IF v_completed <> 12 THEN RETURN false; END IF;
  UPDATE public.rapid_tournaments SET status = 'finished', finished_at = now() WHERE id = p_tournament_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.rebuild_rapid_tournament_matches(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_rapid_tournament(uuid, text, text, timestamptz, text, text, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reroll_rapid_tournament(uuid, uuid, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_rapid_tournament(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_rapid_tournament_result(uuid, uuid, uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_rapid_tournament(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_rapid_tournament(uuid, text, text, timestamptz, text, text, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.rebuild_rapid_tournament_matches(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reroll_rapid_tournament(uuid, uuid, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_rapid_tournament(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_rapid_tournament_result(uuid, uuid, uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_rapid_tournament(uuid, uuid) TO service_role;
