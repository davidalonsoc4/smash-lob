ALTER TABLE public.rapid_tournaments
  DROP CONSTRAINT IF EXISTS rapid_tournaments_player_count_check,
  DROP CONSTRAINT IF EXISTS rapid_tournaments_court_count_check,
  DROP CONSTRAINT IF EXISTS rapid_tournaments_reservation_minutes_check,
  DROP CONSTRAINT IF EXISTS rapid_tournaments_round_count_check,
  DROP CONSTRAINT IF EXISTS rapid_tournaments_safety_margin_minutes_check;
ALTER TABLE public.rapid_tournaments
  ADD COLUMN IF NOT EXISTS preparation_minutes smallint NOT NULL DEFAULT 2 CHECK (preparation_minutes >= 0),
  ADD COLUMN IF NOT EXISTS court_three_name text,
  ADD COLUMN IF NOT EXISTS court_four_name text,
  ADD CONSTRAINT rapid_tournaments_player_count_check CHECK (player_count BETWEEN 8 AND 16),
  ADD CONSTRAINT rapid_tournaments_court_count_check CHECK (court_count BETWEEN 1 AND 4),
  ADD CONSTRAINT rapid_tournaments_reservation_minutes_check CHECK (reservation_minutes IN (60, 90, 120)),
  ADD CONSTRAINT rapid_tournaments_round_count_check CHECK (round_count BETWEEN 1 AND 6),
  ADD CONSTRAINT rapid_tournaments_safety_margin_minutes_check CHECK (safety_margin_minutes >= 2),
  ADD CONSTRAINT rapid_tournaments_court_names_check CHECK (
    length(trim(court_one_name)) BETWEEN 1 AND 80 AND length(trim(court_two_name)) BETWEEN 1 AND 80
    AND (court_count < 3 OR length(trim(court_three_name)) BETWEEN 1 AND 80)
    AND (court_count < 4 OR length(trim(court_four_name)) BETWEEN 1 AND 80)
  );
ALTER TABLE public.rapid_tournaments ALTER COLUMN court_two_name DROP NOT NULL;
ALTER TABLE public.rapid_tournament_players DROP CONSTRAINT IF EXISTS rapid_tournament_players_slot_check;
ALTER TABLE public.rapid_tournament_players ADD CONSTRAINT rapid_tournament_players_slot_check CHECK (slot BETWEEN 'A' AND 'P');
ALTER TABLE public.rapid_tournament_rounds DROP CONSTRAINT IF EXISTS rapid_tournament_rounds_round_number_check;
ALTER TABLE public.rapid_tournament_rounds ADD CONSTRAINT rapid_tournament_rounds_round_number_check CHECK (round_number BETWEEN 1 AND 6);
ALTER TABLE public.rapid_tournament_matches DROP CONSTRAINT IF EXISTS rapid_tournament_matches_round_number_check;
ALTER TABLE public.rapid_tournament_matches DROP CONSTRAINT IF EXISTS rapid_tournament_matches_court_number_check;
ALTER TABLE public.rapid_tournament_matches
  ADD CONSTRAINT rapid_tournament_matches_round_number_check CHECK (round_number BETWEEN 1 AND 6),
  ADD CONSTRAINT rapid_tournament_matches_court_number_check CHECK (court_number BETWEEN 1 AND 4);

CREATE FUNCTION public.create_rapid_tournament_flexible(
  p_creator_user_id uuid, p_name text, p_description text, p_starts_at timestamptz,
  p_court_names text[], p_player_names text[], p_player_user_ids uuid[],
  p_reservation_minutes smallint, p_preparation_minutes smallint, p_round_count smallint,
  p_rounds jsonb, p_matches jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_id uuid; v_round_minutes constant smallint := 16; v_transition_minutes constant smallint := 3;
  v_courts integer := coalesce(cardinality(p_court_names), 0); v_players integer := coalesce(cardinality(p_player_names), 0);
  v_games integer := coalesce(cardinality(p_matches), 0); v_safety integer;
BEGIN
  IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 100 OR p_starts_at <= now()
    OR v_players NOT BETWEEN 8 AND 16 OR cardinality(p_player_user_ids) <> v_players
    OR v_courts NOT BETWEEN 1 AND 4 OR p_reservation_minutes NOT IN (60,90,120)
    OR p_round_count <> floor((p_reservation_minutes + 1)::numeric / 19)::smallint
    OR p_round_count * least(v_courts,floor(v_players/4.0)) * 4 < v_players
    OR p_preparation_minutes < 0 OR jsonb_typeof(p_rounds) <> 'array' OR jsonb_typeof(p_matches) <> 'array'
    OR jsonb_array_length(p_rounds) <> p_round_count
    OR v_games <> p_round_count * least(v_courts, floor(v_players / 4.0)) THEN RAISE EXCEPTION 'invalid_tournament_configuration'; END IF;
  v_safety := p_reservation_minutes - (p_round_count * v_round_minutes) - ((p_round_count - 1) * v_transition_minutes);
  IF p_preparation_minutes > v_safety - 2 THEN RAISE EXCEPTION 'invalid_preparation_minutes'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_player_names) n WHERE length(btrim(n)) NOT BETWEEN 1 AND 80)
    OR (SELECT count(DISTINCT lower(btrim(n))) FROM unnest(p_player_names) n) <> v_players THEN RAISE EXCEPTION 'invalid_player_names'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_player_user_ids) id WHERE id IS NOT NULL AND (
      NOT EXISTS (SELECT 1 FROM public.app_users u WHERE u.id=id AND u.suspended_at IS NULL)
      OR NOT EXISTS (SELECT 1 FROM public.league_memberships m JOIN public.league_memberships owner ON owner.league_id=m.league_id WHERE m.user_id=id AND m.player_id IS NOT NULL AND owner.user_id=p_creator_user_id AND owner.player_id IS NOT NULL)
    )) THEN RAISE EXCEPTION 'invalid_player_accounts'; END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_matches) AS x(round_number smallint,court_number smallint,team_a text[],team_b text[])
    WHERE x.round_number NOT BETWEEN 1 AND p_round_count OR x.court_number NOT BETWEEN 1 AND least(v_courts,floor(v_players/4.0))
      OR cardinality(x.team_a) <> 2 OR cardinality(x.team_b) <> 2
      OR x.team_a[1]=x.team_a[2] OR x.team_b[1]=x.team_b[2]
      OR x.team_a[1]=x.team_b[1] OR x.team_a[1]=x.team_b[2] OR x.team_a[2]=x.team_b[1] OR x.team_a[2]=x.team_b[2]
      OR EXISTS (SELECT 1 FROM unnest(x.team_a || x.team_b) slot WHERE slot IS NULL OR slot NOT IN (SELECT chr(64+ord::int) FROM generate_series(1,v_players) ord))
  ) OR EXISTS (
    SELECT round_number,court_number FROM jsonb_to_recordset(p_matches) AS x(round_number smallint,court_number smallint,team_a text[],team_b text[])
    GROUP BY round_number,court_number HAVING count(*) <> 1
  ) OR EXISTS (
    SELECT round_number,slot FROM jsonb_to_recordset(p_matches) AS x(round_number smallint,court_number smallint,team_a text[],team_b text[]),
      LATERAL unnest(x.team_a || x.team_b) slot GROUP BY round_number,slot HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_court_names) n WHERE length(btrim(n)) NOT BETWEEN 1 AND 80) THEN RAISE EXCEPTION 'invalid_court_names'; END IF;
  IF (SELECT count(DISTINCT id) FROM unnest(p_player_user_ids) id WHERE id IS NOT NULL) <> (SELECT count(id) FROM unnest(p_player_user_ids) id WHERE id IS NOT NULL)
    OR EXISTS (SELECT 1 FROM unnest(p_player_user_ids) id WHERE id IS NOT NULL AND (
      NOT EXISTS (SELECT 1 FROM public.app_users u WHERE u.id = id AND u.suspended_at IS NULL)
      OR NOT EXISTS (SELECT 1 FROM public.league_memberships m JOIN public.league_memberships owner ON owner.league_id=m.league_id WHERE m.user_id=id AND m.player_id IS NOT NULL AND owner.user_id=p_creator_user_id AND owner.player_id IS NOT NULL)
    )) THEN RAISE EXCEPTION 'invalid_player_accounts'; END IF;
  INSERT INTO public.rapid_tournaments (created_by_user_id,name,description,starts_at,court_one_name,court_two_name,court_three_name,court_four_name,player_count,court_count,reservation_minutes,round_count,round_minutes,transition_minutes,preparation_minutes,safety_margin_minutes)
  VALUES (p_creator_user_id,btrim(p_name),coalesce(left(btrim(p_description),1000),''),p_starts_at,btrim(p_court_names[1]),btrim(p_court_names[2]),p_court_names[3],p_court_names[4],v_players,v_courts,p_reservation_minutes,p_round_count,v_round_minutes,v_transition_minutes,p_preparation_minutes,v_safety)
  RETURNING id INTO v_id;
  INSERT INTO public.rapid_tournament_players (tournament_id,slot,full_name,user_id)
  SELECT v_id,chr(64 + ord::int)::char(1),btrim(regexp_replace(name,'\s+',' ','g')),uid FROM unnest(p_player_names,p_player_user_ids) WITH ORDINALITY input(name,uid,ord);
  INSERT INTO public.rapid_tournament_rounds (tournament_id,round_number,starts_at,ends_at)
  SELECT v_id,x.round_number,x.starts_at,x.ends_at FROM jsonb_to_recordset(p_rounds) AS x(round_number smallint,starts_at timestamptz,ends_at timestamptz);
  INSERT INTO public.rapid_tournament_matches (tournament_id,round_id,round_number,court_number,court_name,team_a_one_id,team_a_two_id,team_b_one_id,team_b_two_id)
  SELECT v_id,r.id,x.round_number,x.court_number,p_court_names[x.court_number],a1.id,a2.id,b1.id,b2.id
  FROM jsonb_to_recordset(p_matches) AS x(round_number smallint,court_number smallint,team_a text[],team_b text[])
  JOIN public.rapid_tournament_rounds r ON r.tournament_id=v_id AND r.round_number=x.round_number
  JOIN public.rapid_tournament_players a1 ON a1.tournament_id=v_id AND a1.slot=x.team_a[1]
  JOIN public.rapid_tournament_players a2 ON a2.tournament_id=v_id AND a2.slot=x.team_a[2]
  JOIN public.rapid_tournament_players b1 ON b1.tournament_id=v_id AND b1.slot=x.team_b[1]
  JOIN public.rapid_tournament_players b2 ON b2.tournament_id=v_id AND b2.slot=x.team_b[2];
  IF NOT FOUND OR (SELECT count(*) FROM public.rapid_tournament_matches WHERE tournament_id=v_id) <> v_games THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  RETURN v_id;
END; $$;

CREATE FUNCTION public.reroll_rapid_tournament_flexible(
  p_tournament_id uuid,p_creator_user_id uuid,p_player_names text[],p_player_user_ids uuid[],p_matches jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_t public.rapid_tournaments%ROWTYPE; v_players integer; v_games integer;
BEGIN
  SELECT * INTO v_t FROM public.rapid_tournaments WHERE id=p_tournament_id AND created_by_user_id=p_creator_user_id AND status='draft' FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  v_players := cardinality(p_player_names); v_games := jsonb_array_length(p_matches);
  IF v_players <> v_t.player_count OR cardinality(p_player_user_ids) <> v_players OR v_games <> v_t.round_count * least(v_t.court_count, floor(v_players / 4.0)) THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_player_names) n WHERE length(btrim(n)) NOT BETWEEN 1 AND 80)
    OR (SELECT count(DISTINCT lower(btrim(n))) FROM unnest(p_player_names) n) <> v_players THEN RAISE EXCEPTION 'invalid_player_names'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_player_user_ids) id WHERE id IS NOT NULL AND (
      NOT EXISTS (SELECT 1 FROM public.app_users u WHERE u.id=id AND u.suspended_at IS NULL)
      OR NOT EXISTS (SELECT 1 FROM public.league_memberships m JOIN public.league_memberships owner ON owner.league_id=m.league_id WHERE m.user_id=id AND m.player_id IS NOT NULL AND owner.user_id=p_creator_user_id AND owner.player_id IS NOT NULL)
    )) OR (SELECT count(id) FROM unnest(p_player_user_ids) id WHERE id IS NOT NULL) <> (SELECT count(DISTINCT id) FROM unnest(p_player_user_ids) id WHERE id IS NOT NULL) THEN RAISE EXCEPTION 'invalid_player_accounts'; END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_matches) AS x(round_number smallint,court_number smallint,team_a text[],team_b text[])
    WHERE x.round_number NOT BETWEEN 1 AND v_t.round_count OR x.court_number NOT BETWEEN 1 AND least(v_t.court_count,floor(v_players/4.0))
      OR cardinality(x.team_a) <> 2 OR cardinality(x.team_b) <> 2
      OR x.team_a[1]=x.team_a[2] OR x.team_b[1]=x.team_b[2]
      OR x.team_a[1]=x.team_b[1] OR x.team_a[1]=x.team_b[2] OR x.team_a[2]=x.team_b[1] OR x.team_a[2]=x.team_b[2]
      OR EXISTS (SELECT 1 FROM unnest(x.team_a || x.team_b) slot WHERE slot IS NULL OR slot NOT IN (SELECT chr(64+ord::int) FROM generate_series(1,v_players) ord))
  ) OR EXISTS (
    SELECT round_number,court_number FROM jsonb_to_recordset(p_matches) AS x(round_number smallint,court_number smallint,team_a text[],team_b text[])
    GROUP BY round_number,court_number HAVING count(*) <> 1
  ) OR EXISTS (
    SELECT round_number,slot FROM jsonb_to_recordset(p_matches) AS x(round_number smallint,court_number smallint,team_a text[],team_b text[]),
      LATERAL unnest(x.team_a || x.team_b) slot GROUP BY round_number,slot HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  UPDATE public.rapid_tournament_players player SET full_name=input.name,user_id=input.uid
  FROM unnest(p_player_names,p_player_user_ids) WITH ORDINALITY input(name,uid,ord)
  WHERE player.tournament_id=p_tournament_id AND player.slot=chr(64+input.ord::int)::char(1);
  DELETE FROM public.rapid_tournament_matches WHERE tournament_id=p_tournament_id;
  INSERT INTO public.rapid_tournament_matches (tournament_id,round_id,round_number,court_number,court_name,team_a_one_id,team_a_two_id,team_b_one_id,team_b_two_id)
  SELECT p_tournament_id,r.id,x.round_number,x.court_number,CASE x.court_number WHEN 1 THEN v_t.court_one_name WHEN 2 THEN v_t.court_two_name WHEN 3 THEN v_t.court_three_name ELSE v_t.court_four_name END,a1.id,a2.id,b1.id,b2.id
  FROM jsonb_to_recordset(p_matches) AS x(round_number smallint,court_number smallint,team_a text[],team_b text[])
  JOIN public.rapid_tournament_rounds r ON r.tournament_id=p_tournament_id AND r.round_number=x.round_number
  JOIN public.rapid_tournament_players a1 ON a1.tournament_id=p_tournament_id AND a1.slot=x.team_a[1]
  JOIN public.rapid_tournament_players a2 ON a2.tournament_id=p_tournament_id AND a2.slot=x.team_a[2]
  JOIN public.rapid_tournament_players b1 ON b1.tournament_id=p_tournament_id AND b1.slot=x.team_b[1]
  JOIN public.rapid_tournament_players b2 ON b2.tournament_id=p_tournament_id AND b2.slot=x.team_b[2];
  IF (SELECT count(*) FROM public.rapid_tournament_matches WHERE tournament_id=p_tournament_id) <> v_games THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.finish_rapid_tournament(p_tournament_id uuid, p_creator_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_status text; v_completed integer; v_expected integer;
BEGIN
  SELECT status,round_count * least(court_count,floor(player_count/4.0))::integer INTO v_status,v_expected
  FROM public.rapid_tournaments WHERE id=p_tournament_id AND created_by_user_id=p_creator_user_id FOR UPDATE;
  IF NOT FOUND OR v_status <> 'in_progress' THEN RETURN false; END IF;
  SELECT count(*) INTO v_completed FROM public.rapid_tournament_matches
  WHERE tournament_id=p_tournament_id AND score_a IS NOT NULL AND score_b IS NOT NULL;
  IF v_completed <> v_expected THEN RETURN false; END IF;
  UPDATE public.rapid_tournaments SET status='finished',finished_at=now() WHERE id=p_tournament_id;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.create_rapid_tournament_flexible(uuid,text,text,timestamptz,text[],text[],uuid[],smallint,smallint,smallint,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.reroll_rapid_tournament_flexible(uuid,uuid,text[],uuid[],jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.finish_rapid_tournament(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_rapid_tournament_flexible(uuid,text,text,timestamptz,text[],text[],uuid[],smallint,smallint,smallint,jsonb,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.reroll_rapid_tournament_flexible(uuid,uuid,text[],uuid[],jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_rapid_tournament(uuid,uuid) TO service_role;
