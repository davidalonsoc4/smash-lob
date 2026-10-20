ALTER TABLE public.rapid_tournaments
  DROP CONSTRAINT IF EXISTS rapid_tournaments_format_check,
  DROP CONSTRAINT IF EXISTS rapid_tournaments_ranking_mode_check;

ALTER TABLE public.rapid_tournaments
  ADD COLUMN IF NOT EXISTS generation_seed integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT rapid_tournaments_format_check CHECK (format IN ('balanced_americana', 'dynamic_mexicano')),
  ADD CONSTRAINT rapid_tournaments_ranking_mode_check CHECK (ranking_mode IN ('average_percentage', 'mexicano_rating'));

ALTER TABLE public.rapid_tournament_rounds
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'generated'
  CHECK (status IN ('pending','generated','completed'));
UPDATE public.rapid_tournament_rounds r SET status='completed'
WHERE EXISTS (SELECT 1 FROM public.rapid_tournament_matches m WHERE m.round_id=r.id)
  AND NOT EXISTS (SELECT 1 FROM public.rapid_tournament_matches m WHERE m.round_id=r.id AND (m.score_a IS NULL OR m.score_b IS NULL));

CREATE FUNCTION public.create_dynamic_mexicano_tournament(
  p_creator_user_id uuid, p_name text, p_description text, p_starts_at timestamptz,
  p_court_names text[], p_player_names text[], p_player_user_ids uuid[],
  p_reservation_minutes smallint, p_preparation_minutes smallint, p_round_count smallint,
  p_rounds jsonb, p_generation_seed integer
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid; v_round_minutes constant smallint := 16; v_transition_minutes constant smallint := 3;
  v_courts integer := coalesce(cardinality(p_court_names), 0); v_players integer := coalesce(cardinality(p_player_names), 0);
  v_safety integer;
BEGIN
  IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 100 OR p_starts_at <= now()
    OR v_players NOT BETWEEN 8 AND 16 OR cardinality(p_player_user_ids) <> v_players
    OR v_courts NOT BETWEEN 1 AND 4 OR p_reservation_minutes NOT IN (60,90,120)
    OR p_round_count <> floor((p_reservation_minutes + 1)::numeric / 19)::smallint
    OR p_round_count * least(v_courts,floor(v_players/4.0)) * 4 < v_players
    OR p_preparation_minutes < 0 OR jsonb_typeof(p_rounds) <> 'array'
    OR jsonb_array_length(p_rounds) <> p_round_count THEN
    RAISE EXCEPTION 'invalid_tournament_configuration';
  END IF;
  v_safety := p_reservation_minutes - (p_round_count * v_round_minutes) - ((p_round_count - 1) * v_transition_minutes);
  IF p_preparation_minutes > v_safety - 2 THEN RAISE EXCEPTION 'invalid_preparation_minutes'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_player_names) AS names(player_name) WHERE length(btrim(names.player_name)) NOT BETWEEN 1 AND 80)
    OR (SELECT count(DISTINCT lower(btrim(names.player_name))) FROM unnest(p_player_names) AS names(player_name)) <> v_players THEN
    RAISE EXCEPTION 'invalid_player_names';
  END IF;
  IF (SELECT count(DISTINCT accounts.user_id) FROM unnest(p_player_user_ids) AS accounts(user_id) WHERE accounts.user_id IS NOT NULL)
       <> (SELECT count(accounts.user_id) FROM unnest(p_player_user_ids) AS accounts(user_id) WHERE accounts.user_id IS NOT NULL)
    OR EXISTS (SELECT 1 FROM unnest(p_player_user_ids) AS accounts(user_id) WHERE accounts.user_id IS NOT NULL AND (
      NOT EXISTS (SELECT 1 FROM public.app_users u WHERE u.id=accounts.user_id AND u.suspended_at IS NULL)
      OR NOT EXISTS (SELECT 1 FROM public.league_memberships m JOIN public.league_memberships owner ON owner.league_id=m.league_id
        WHERE m.user_id=accounts.user_id AND m.player_id IS NOT NULL AND owner.user_id=p_creator_user_id AND owner.player_id IS NOT NULL)
    )) THEN RAISE EXCEPTION 'invalid_player_accounts'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_court_names) AS courts(court_name) WHERE length(btrim(courts.court_name)) NOT BETWEEN 1 AND 80)
    OR EXISTS (SELECT 1 FROM jsonb_to_recordset(p_rounds) AS x(round_number smallint,starts_at timestamptz,ends_at timestamptz)
      WHERE x.round_number NOT BETWEEN 1 AND p_round_count OR x.ends_at <= x.starts_at) THEN
    RAISE EXCEPTION 'invalid_tournament_schedule';
  END IF;

  INSERT INTO public.rapid_tournaments (
    created_by_user_id,name,description,starts_at,court_one_name,court_two_name,court_three_name,court_four_name,
    player_count,court_count,reservation_minutes,round_count,round_minutes,transition_minutes,preparation_minutes,
    safety_margin_minutes,format,ranking_mode,generation_seed
  ) VALUES (
    p_creator_user_id,btrim(p_name),coalesce(left(btrim(p_description),1000),''),p_starts_at,
    btrim(p_court_names[1]),btrim(p_court_names[2]),p_court_names[3],p_court_names[4],
    v_players,v_courts,p_reservation_minutes,p_round_count,v_round_minutes,v_transition_minutes,p_preparation_minutes,
    v_safety,'dynamic_mexicano','mexicano_rating',p_generation_seed
  ) RETURNING id INTO v_id;

  INSERT INTO public.rapid_tournament_players (tournament_id,slot,full_name,user_id)
  SELECT v_id,chr(64 + ord::int)::char(1),btrim(regexp_replace(name,'\s+',' ','g')),uid
  FROM unnest(p_player_names,p_player_user_ids) WITH ORDINALITY input(name,uid,ord);

  INSERT INTO public.rapid_tournament_rounds (tournament_id,round_number,starts_at,ends_at,status)
  SELECT v_id,x.round_number,x.starts_at,x.ends_at,'pending'
  FROM jsonb_to_recordset(p_rounds) AS x(round_number smallint,starts_at timestamptz,ends_at timestamptz);

  RETURN v_id;
END; $$;

CREATE FUNCTION public.generate_dynamic_mexicano_round(
  p_tournament_id uuid, p_creator_user_id uuid, p_round_number smallint, p_matches jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  v_t public.rapid_tournaments%ROWTYPE; v_expected integer; v_previous integer; v_existing integer;
BEGIN
  SELECT * INTO v_t FROM public.rapid_tournaments
  WHERE id=p_tournament_id AND created_by_user_id=p_creator_user_id FOR UPDATE;
  IF NOT FOUND OR v_t.format <> 'dynamic_mexicano' OR v_t.status='finished' THEN RETURN false; END IF;

  SELECT count(*) INTO v_existing FROM public.rapid_tournament_matches
  WHERE tournament_id=p_tournament_id AND round_number=p_round_number;
  IF v_existing > 0 THEN RETURN true; END IF;

  v_expected := least(v_t.court_count, floor(v_t.player_count / 4.0))::integer;
  SELECT coalesce(max(round_number),0) INTO v_previous FROM public.rapid_tournament_matches WHERE tournament_id=p_tournament_id;
  IF p_round_number <> v_previous + 1 OR p_round_number > v_t.round_count
    OR jsonb_typeof(p_matches) <> 'array' OR jsonb_array_length(p_matches) <> v_expected
    OR (p_round_number=1 AND v_t.status <> 'draft') OR (p_round_number>1 AND v_t.status <> 'in_progress') THEN
    RETURN false;
  END IF;
  IF p_round_number > 1 AND EXISTS (
    SELECT 1 FROM public.rapid_tournament_matches
    WHERE tournament_id=p_tournament_id AND round_number=p_round_number-1 AND (score_a IS NULL OR score_b IS NULL)
  ) THEN RETURN false; END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_matches) AS x(court_number smallint,team_a uuid[],team_b uuid[])
    WHERE x.court_number NOT BETWEEN 1 AND v_expected OR cardinality(x.team_a)<>2 OR cardinality(x.team_b)<>2
      OR x.team_a[1]=x.team_a[2] OR x.team_b[1]=x.team_b[2]
      OR x.team_a[1]=x.team_b[1] OR x.team_a[1]=x.team_b[2] OR x.team_a[2]=x.team_b[1] OR x.team_a[2]=x.team_b[2]
      OR EXISTS (SELECT 1 FROM unnest(x.team_a || x.team_b) AS ids(player_id)
        WHERE NOT EXISTS (SELECT 1 FROM public.rapid_tournament_players p WHERE p.tournament_id=p_tournament_id AND p.id=ids.player_id))
  ) OR EXISTS (
    SELECT x.court_number FROM jsonb_to_recordset(p_matches) AS x(court_number smallint,team_a uuid[],team_b uuid[])
    GROUP BY x.court_number HAVING count(*)<>1
  ) OR EXISTS (
    SELECT ids.player_id FROM jsonb_to_recordset(p_matches) AS x(court_number smallint,team_a uuid[],team_b uuid[]),
      LATERAL unnest(x.team_a || x.team_b) AS ids(player_id) GROUP BY ids.player_id HAVING count(*)>1
  ) THEN RAISE EXCEPTION 'invalid_dynamic_round'; END IF;

  INSERT INTO public.rapid_tournament_matches (
    tournament_id,round_id,round_number,court_number,court_name,
    team_a_one_id,team_a_two_id,team_b_one_id,team_b_two_id
  )
  SELECT p_tournament_id,r.id,p_round_number,x.court_number,
    CASE x.court_number WHEN 1 THEN v_t.court_one_name WHEN 2 THEN v_t.court_two_name WHEN 3 THEN v_t.court_three_name ELSE v_t.court_four_name END,
    x.team_a[1],x.team_a[2],x.team_b[1],x.team_b[2]
  FROM jsonb_to_recordset(p_matches) AS x(court_number smallint,team_a uuid[],team_b uuid[])
  JOIN public.rapid_tournament_rounds r ON r.tournament_id=p_tournament_id AND r.round_number=p_round_number;

  UPDATE public.rapid_tournament_rounds SET status='generated'
  WHERE tournament_id=p_tournament_id AND round_number=p_round_number;

  IF p_round_number=1 THEN
    UPDATE public.rapid_tournaments SET status='in_progress',started_at=now()
    WHERE id=p_tournament_id AND status='draft';
  END IF;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.record_rapid_tournament_result(
  p_tournament_id uuid,p_match_id uuid,p_creator_user_id uuid,p_score_a integer,p_score_b integer
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_status text; v_format text; v_round smallint;
BEGIN
  SELECT status,format INTO v_status,v_format FROM public.rapid_tournaments
  WHERE id=p_tournament_id AND created_by_user_id=p_creator_user_id FOR UPDATE;
  IF NOT FOUND OR v_status<>'in_progress' THEN RETURN false; END IF;
  IF p_score_a IS NULL OR p_score_b IS NULL OR p_score_a<0 OR p_score_b<0 OR p_score_a::bigint+p_score_b::bigint<=0 THEN
    RAISE EXCEPTION 'invalid_score';
  END IF;
  SELECT round_number INTO v_round FROM public.rapid_tournament_matches WHERE id=p_match_id AND tournament_id=p_tournament_id;
  IF NOT FOUND OR (v_format='dynamic_mexicano' AND EXISTS (
    SELECT 1 FROM public.rapid_tournament_matches WHERE tournament_id=p_tournament_id AND round_number>v_round
  )) THEN RETURN false; END IF;
  UPDATE public.rapid_tournament_matches SET score_a=p_score_a,score_b=p_score_b
  WHERE id=p_match_id AND tournament_id=p_tournament_id;
  IF FOUND AND NOT EXISTS (
    SELECT 1 FROM public.rapid_tournament_matches WHERE tournament_id=p_tournament_id AND round_number=v_round AND (score_a IS NULL OR score_b IS NULL)
  ) THEN
    UPDATE public.rapid_tournament_rounds SET status='completed' WHERE tournament_id=p_tournament_id AND round_number=v_round;
  END IF;
  RETURN FOUND;
END; $$;

REVOKE ALL ON FUNCTION public.create_dynamic_mexicano_tournament(uuid,text,text,timestamptz,text[],text[],uuid[],smallint,smallint,smallint,jsonb,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.generate_dynamic_mexicano_round(uuid,uuid,smallint,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.record_rapid_tournament_result(uuid,uuid,uuid,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_dynamic_mexicano_tournament(uuid,text,text,timestamptz,text[],text[],uuid[],smallint,smallint,smallint,jsonb,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_dynamic_mexicano_round(uuid,uuid,smallint,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_rapid_tournament_result(uuid,uuid,uuid,integer,integer) TO service_role;


CREATE OR REPLACE FUNCTION public.restart_rapid_tournament_for_testing(p_tournament_id uuid, p_creator_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_status text; v_format text;
BEGIN
  SELECT status,format INTO v_status,v_format FROM public.rapid_tournaments
  WHERE id=p_tournament_id AND created_by_user_id=p_creator_user_id FOR UPDATE;
  IF NOT FOUND OR v_status<>'finished' THEN RETURN false; END IF;
  IF v_format='dynamic_mexicano' THEN
    DELETE FROM public.rapid_tournament_matches WHERE tournament_id=p_tournament_id;
    UPDATE public.rapid_tournament_rounds SET status='pending' WHERE tournament_id=p_tournament_id;
    UPDATE public.rapid_tournaments SET status='draft',started_at=NULL,finished_at=NULL WHERE id=p_tournament_id;
  ELSE
    UPDATE public.rapid_tournament_matches SET score_a=NULL,score_b=NULL WHERE tournament_id=p_tournament_id;
    UPDATE public.rapid_tournament_rounds SET status='generated' WHERE tournament_id=p_tournament_id;
    UPDATE public.rapid_tournaments SET status='in_progress',started_at=now(),finished_at=NULL WHERE id=p_tournament_id;
  END IF;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.restart_rapid_tournament_for_testing(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.restart_rapid_tournament_for_testing(uuid,uuid) TO service_role;
