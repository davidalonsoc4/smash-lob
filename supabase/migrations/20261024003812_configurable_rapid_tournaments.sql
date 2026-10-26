-- Additive extension: legacy RPCs and persisted tournaments keep their defaults.
ALTER TABLE public.rapid_tournaments
  DROP CONSTRAINT rapid_tournaments_player_count_check,
  DROP CONSTRAINT rapid_tournaments_reservation_minutes_check,
  DROP CONSTRAINT rapid_tournaments_round_count_check,
  DROP CONSTRAINT rapid_tournaments_round_minutes_check,
  DROP CONSTRAINT rapid_tournaments_transition_minutes_check,
  ADD CONSTRAINT rapid_tournaments_player_count_check CHECK (player_count BETWEEN 4 AND 24),
  ADD CONSTRAINT rapid_tournaments_reservation_minutes_check CHECK (reservation_minutes BETWEEN 30 AND 1440),
  ADD CONSTRAINT rapid_tournaments_round_count_check CHECK (round_count BETWEEN 1 AND 100),
  ADD CONSTRAINT rapid_tournaments_round_minutes_check CHECK (round_minutes BETWEEN 1 AND 120),
  ADD CONSTRAINT rapid_tournaments_transition_minutes_check CHECK (transition_minutes BETWEEN 0 AND 30),
  ADD COLUMN configuration_version smallint NOT NULL DEFAULT 1 CHECK (configuration_version IN (1,2)),
  ADD COLUMN logo_url text CHECK (logo_url IS NULL OR length(logo_url) <= 1000000),
  ADD COLUMN accent_color text CHECK (accent_color IS NULL OR accent_color ~ '^#[0-9a-fA-F]{6}$');
ALTER TABLE public.rapid_tournament_players DROP CONSTRAINT rapid_tournament_players_slot_check,
  ADD CONSTRAINT rapid_tournament_players_slot_check CHECK (slot BETWEEN 'A' AND 'X');
ALTER TABLE public.rapid_tournament_rounds DROP CONSTRAINT rapid_tournament_rounds_round_number_check,
  ADD CONSTRAINT rapid_tournament_rounds_round_number_check CHECK (round_number BETWEEN 1 AND 100);
ALTER TABLE public.rapid_tournament_matches DROP CONSTRAINT rapid_tournament_matches_round_number_check,
  ADD CONSTRAINT rapid_tournament_matches_round_number_check CHECK (round_number BETWEEN 1 AND 100);

CREATE FUNCTION public.create_configurable_rapid_tournament(
  p_creator_user_id uuid, p_name text, p_description text, p_starts_at timestamptz,
  p_court_names text[], p_player_names text[], p_player_user_ids uuid[],
  p_configuration jsonb, p_matches jsonb,
  p_duplicate_of uuid DEFAULT NULL, p_source_league_id uuid DEFAULT NULL, p_source_season_id uuid DEFAULT NULL,
  p_logo_url text DEFAULT NULL, p_accent_color text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid; v_players integer := cardinality(p_player_names); v_courts integer := cardinality(p_court_names);
  v_rounds integer := (p_configuration->>'rounds')::integer;
  v_minutes integer := (p_configuration->>'roundMinutes')::integer;
  v_transition integer := (p_configuration->>'transitionMinutes')::integer;
  v_preparation integer := (p_configuration->>'preparationMinutes')::integer;
  v_reservation integer := (p_configuration->>'reservationMinutes')::integer;
  v_format text := p_configuration->>'format'; v_active integer; v_safety integer; v_games integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id=p_creator_user_id AND suspended_at IS NULL)
    OR p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 100
    OR p_starts_at IS NULL OR p_starts_at<=now()
    OR v_players IS NULL OR v_players NOT BETWEEN 4 AND 24 OR cardinality(p_player_user_ids) IS DISTINCT FROM v_players
    OR v_courts IS NULL OR v_courts NOT BETWEEN 1 AND 4
    OR v_rounds IS NULL OR v_rounds NOT BETWEEN 1 AND 100
    OR v_minutes IS NULL OR v_minutes NOT BETWEEN 1 AND 120
    OR v_transition IS NULL OR v_transition NOT BETWEEN 0 AND 30
    OR v_preparation IS NULL OR v_preparation<0
    OR v_reservation IS NULL OR v_reservation NOT BETWEEN 30 AND 1440
    OR v_format IS NULL OR v_format NOT IN ('balanced_americana','dynamic_mexicano')
    OR jsonb_typeof(p_matches) IS DISTINCT FROM 'array'
  THEN RAISE EXCEPTION 'invalid_tournament_configuration'; END IF;
  v_active := least(v_courts, floor(v_players/4.0)::integer);
  v_safety := v_reservation - v_rounds*v_minutes - (v_rounds-1)*v_transition;
  IF v_safety-v_preparation<2 OR v_rounds*v_active*4<v_players THEN
    RAISE EXCEPTION 'invalid_tournament_configuration';
  END IF;
  IF p_duplicate_of IS NOT NULL AND (p_source_league_id IS NOT NULL OR NOT EXISTS (
    SELECT 1 FROM public.rapid_tournaments WHERE id=p_duplicate_of AND created_by_user_id=p_creator_user_id
  )) THEN RAISE EXCEPTION 'invalid_tournament_source'; END IF;
  IF (p_source_league_id IS NULL) <> (p_source_season_id IS NULL) OR (p_source_league_id IS NOT NULL AND (
    NOT EXISTS (SELECT 1 FROM public.seasons WHERE id=p_source_season_id AND league_id=p_source_league_id)
    OR NOT (EXISTS (SELECT 1 FROM public.league_memberships WHERE league_id=p_source_league_id
      AND user_id=p_creator_user_id AND role IN ('creator','admin'))
      OR EXISTS (SELECT 1 FROM public.app_users WHERE id=p_creator_user_id AND is_superuser))
  )) THEN RAISE EXCEPTION 'invalid_tournament_source'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_player_names) names(name) WHERE name IS NULL OR length(btrim(name)) NOT BETWEEN 1 AND 80)
    OR (SELECT count(DISTINCT lower(regexp_replace(btrim(name),'\s+',' ','g'))) FROM unnest(p_player_names) names(name))<>v_players
    OR EXISTS (SELECT 1 FROM unnest(p_court_names) courts(name) WHERE name IS NULL OR length(btrim(name)) NOT BETWEEN 1 AND 80)
  THEN RAISE EXCEPTION 'invalid_player_or_court_names'; END IF;
  IF (SELECT count(uid) FROM unnest(p_player_user_ids) ids(uid))<>(SELECT count(DISTINCT uid) FROM unnest(p_player_user_ids) ids(uid))
    OR EXISTS (SELECT 1 FROM unnest(p_player_user_ids) ids(uid) WHERE uid IS NOT NULL AND (
      NOT EXISTS (SELECT 1 FROM public.app_users WHERE id=uid AND suspended_at IS NULL)
      OR NOT (EXISTS (SELECT 1 FROM public.league_memberships member JOIN public.league_memberships owner
        ON owner.league_id=member.league_id WHERE member.user_id=uid AND member.player_id IS NOT NULL
        AND owner.user_id=p_creator_user_id AND owner.player_id IS NOT NULL)
      OR EXISTS (SELECT 1 FROM public.rapid_tournament_players p JOIN public.rapid_tournaments t ON t.id=p.tournament_id
        WHERE t.id=p_duplicate_of AND t.created_by_user_id=p_creator_user_id AND p.user_id=uid)
      OR EXISTS (SELECT 1 FROM public.league_memberships member JOIN public.season_players sp ON sp.player_id=member.player_id
        WHERE member.league_id=p_source_league_id AND sp.season_id=p_source_season_id AND member.user_id=uid))
    )) THEN RAISE EXCEPTION 'invalid_player_accounts'; END IF;
  v_games := jsonb_array_length(p_matches);
  IF (v_format='dynamic_mexicano' AND v_games<>0) OR (v_format='balanced_americana' AND v_games<>v_rounds*v_active) THEN
    RAISE EXCEPTION 'invalid_tournament_schedule';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p_matches) x(round_number integer,court_number integer,team_a text[],team_b text[])
    WHERE round_number IS NULL OR round_number NOT BETWEEN 1 AND v_rounds
      OR court_number IS NULL OR court_number NOT BETWEEN 1 AND v_active
      OR cardinality(team_a) IS DISTINCT FROM 2 OR cardinality(team_b) IS DISTINCT FROM 2
      OR (SELECT count(DISTINCT slot) FROM unnest(team_a||team_b) s(slot))<>4
      OR EXISTS (SELECT 1 FROM unnest(team_a||team_b) s(slot) WHERE slot IS NULL OR slot NOT IN (SELECT chr(64+i) FROM generate_series(1,v_players) i)))
    OR EXISTS (SELECT round_number,court_number FROM jsonb_to_recordset(p_matches) x(round_number integer,court_number integer)
      GROUP BY round_number,court_number HAVING count(*)>1)
    OR EXISTS (SELECT round_number,slot FROM jsonb_to_recordset(p_matches) x(round_number integer,team_a text[],team_b text[]),
      LATERAL unnest(team_a||team_b) s(slot) GROUP BY round_number,slot HAVING count(*)>1)
  THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  IF v_format='balanced_americana' AND EXISTS (
    SELECT 1 FROM generate_series(1,v_players) i WHERE (
      SELECT count(*) FROM jsonb_to_recordset(p_matches) x(team_a text[],team_b text[]) WHERE chr(64+i)=ANY(team_a||team_b)
    ) NOT BETWEEN floor(v_games*4.0/v_players) AND ceil(v_games*4.0/v_players)
  ) THEN RAISE EXCEPTION 'unbalanced_tournament_participation'; END IF;

  INSERT INTO public.rapid_tournaments(created_by_user_id,name,description,starts_at,
    court_one_name,court_two_name,court_three_name,court_four_name,player_count,court_count,
    reservation_minutes,round_count,round_minutes,transition_minutes,preparation_minutes,safety_margin_minutes,
    format,ranking_mode,generation_seed,source_league_id,source_season_id,logo_url,accent_color,configuration_version)
  VALUES(p_creator_user_id,btrim(p_name),coalesce(left(btrim(p_description),1000),''),p_starts_at,
    p_court_names[1],p_court_names[2],p_court_names[3],p_court_names[4],v_players,v_courts,
    v_reservation,v_rounds,v_minutes,v_transition,v_preparation,v_safety,v_format,
    CASE WHEN v_format='dynamic_mexicano' THEN 'mexicano_rating' ELSE 'average_percentage' END,
    coalesce((p_configuration->>'generationSeed')::integer,0),p_source_league_id,p_source_season_id,p_logo_url,p_accent_color,2)
  RETURNING id INTO v_id;
  INSERT INTO public.rapid_tournament_players(tournament_id,slot,full_name,user_id)
  SELECT v_id,chr(64+ord::integer)::char(1),regexp_replace(btrim(name),'\s+',' ','g'),uid
  FROM unnest(p_player_names,p_player_user_ids) WITH ORDINALITY input(name,uid,ord);
  INSERT INTO public.rapid_tournament_rounds(tournament_id,round_number,starts_at,ends_at,status)
  SELECT v_id,r,p_starts_at+make_interval(mins=>v_preparation+(r-1)*(v_minutes+v_transition)),
    p_starts_at+make_interval(mins=>v_preparation+(r-1)*(v_minutes+v_transition)+v_minutes),
    CASE WHEN v_format='dynamic_mexicano' THEN 'pending' ELSE 'generated' END
  FROM generate_series(1,v_rounds) r;
  INSERT INTO public.rapid_tournament_matches(tournament_id,round_id,round_number,court_number,court_name,
    team_a_one_id,team_a_two_id,team_b_one_id,team_b_two_id)
  SELECT v_id,r.id,x.round_number,x.court_number,p_court_names[x.court_number],a1.id,a2.id,b1.id,b2.id
  FROM jsonb_to_recordset(p_matches) x(round_number integer,court_number integer,team_a text[],team_b text[])
    JOIN public.rapid_tournament_rounds r ON r.tournament_id=v_id AND r.round_number=x.round_number
    JOIN public.rapid_tournament_players a1 ON a1.tournament_id=v_id AND a1.slot=x.team_a[1]
    JOIN public.rapid_tournament_players a2 ON a2.tournament_id=v_id AND a2.slot=x.team_a[2]
    JOIN public.rapid_tournament_players b1 ON b1.tournament_id=v_id AND b1.slot=x.team_b[1]
    JOIN public.rapid_tournament_players b2 ON b2.tournament_id=v_id AND b2.slot=x.team_b[2];
  IF (SELECT count(*) FROM public.rapid_tournament_matches WHERE tournament_id=v_id)<>v_games THEN
    RAISE EXCEPTION 'invalid_tournament_schedule';
  END IF;
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.create_configurable_rapid_tournament(uuid,text,text,timestamptz,text[],text[],uuid[],jsonb,jsonb,uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_configurable_rapid_tournament(uuid,text,text,timestamptz,text[],text[],uuid[],jsonb,jsonb,uuid,uuid,uuid,text,text) TO service_role;

-- Redraw changes only unplayed fixtures, preserving participant/account identities.
CREATE FUNCTION public.redraw_configurable_rapid_tournament(p_tournament_id uuid,p_creator_user_id uuid,p_matches jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_t public.rapid_tournaments%ROWTYPE; v_games integer; v_active integer;
BEGIN
  SELECT * INTO v_t FROM public.rapid_tournaments WHERE id=p_tournament_id AND created_by_user_id=p_creator_user_id FOR UPDATE;
  IF NOT FOUND OR v_t.status<>'draft' OR v_t.format<>'balanced_americana' THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM public.rapid_tournament_matches WHERE tournament_id=p_tournament_id AND score_a IS NOT NULL) THEN RETURN false; END IF;
  v_active:=least(v_t.court_count,floor(v_t.player_count/4.0)::integer);
  v_games:=v_t.round_count*v_active;
  IF jsonb_typeof(p_matches) IS DISTINCT FROM 'array' OR jsonb_array_length(p_matches)<>v_games THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_to_recordset(p_matches) x(round_number integer,court_number integer,team_a uuid[],team_b uuid[])
    WHERE round_number IS NULL OR round_number NOT BETWEEN 1 AND v_t.round_count
      OR court_number IS NULL OR court_number NOT BETWEEN 1 AND v_active
      OR cardinality(team_a) IS DISTINCT FROM 2 OR cardinality(team_b) IS DISTINCT FROM 2
      OR (SELECT count(DISTINCT uid) FROM unnest(team_a||team_b) ids(uid))<>4
      OR EXISTS(SELECT 1 FROM unnest(team_a||team_b) ids(uid) WHERE NOT EXISTS(SELECT 1 FROM public.rapid_tournament_players WHERE tournament_id=p_tournament_id AND id=uid)))
    OR EXISTS(SELECT round_number,court_number FROM jsonb_to_recordset(p_matches) x(round_number integer,court_number integer) GROUP BY round_number,court_number HAVING count(*)>1)
    OR EXISTS(SELECT round_number,uid FROM jsonb_to_recordset(p_matches) x(round_number integer,team_a uuid[],team_b uuid[]),LATERAL unnest(team_a||team_b) ids(uid) GROUP BY round_number,uid HAVING count(*)>1)
  THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  IF EXISTS(SELECT 1 FROM public.rapid_tournament_players p WHERE tournament_id=p_tournament_id AND
    (SELECT count(*) FROM jsonb_to_recordset(p_matches) x(team_a uuid[],team_b uuid[]) WHERE p.id=ANY(team_a||team_b))
    NOT BETWEEN floor(v_games*4.0/v_t.player_count) AND ceil(v_games*4.0/v_t.player_count)) THEN
    RAISE EXCEPTION 'unbalanced_tournament_participation';
  END IF;
  DELETE FROM public.rapid_tournament_matches WHERE tournament_id=p_tournament_id;
  INSERT INTO public.rapid_tournament_matches(tournament_id,round_id,round_number,court_number,court_name,team_a_one_id,team_a_two_id,team_b_one_id,team_b_two_id)
  SELECT p_tournament_id,r.id,x.round_number,x.court_number,
    (ARRAY[v_t.court_one_name,v_t.court_two_name,v_t.court_three_name,v_t.court_four_name])[x.court_number],
    x.team_a[1],x.team_a[2],x.team_b[1],x.team_b[2]
  FROM jsonb_to_recordset(p_matches) x(round_number integer,court_number integer,team_a uuid[],team_b uuid[])
    JOIN public.rapid_tournament_rounds r ON r.tournament_id=p_tournament_id AND r.round_number=x.round_number;
  IF (SELECT count(*) FROM public.rapid_tournament_matches WHERE tournament_id=p_tournament_id)<>v_games THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.redraw_configurable_rapid_tournament(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.redraw_configurable_rapid_tournament(uuid,uuid,jsonb) TO service_role;
