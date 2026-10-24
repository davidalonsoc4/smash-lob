-- Extend total participants to 32, i.e. at most 16 fixed pairs. Existing rows
-- and A-X slots retain their identity; no applied migration is modified.
ALTER TABLE public.rapid_tournaments
  DROP CONSTRAINT rapid_tournaments_player_count_check,
  ADD CONSTRAINT rapid_tournaments_player_count_check CHECK (player_count BETWEEN 4 AND 32),
  DROP CONSTRAINT rapid_tournaments_round_count_check,
  ADD CONSTRAINT rapid_tournaments_round_count_check CHECK (round_count BETWEEN 1 AND CASE WHEN tournament_mode='traditional' THEN 120 ELSE 100 END);
ALTER TABLE public.rapid_tournament_players
  DROP CONSTRAINT rapid_tournament_players_slot_check,
  ADD CONSTRAINT rapid_tournament_players_slot_check CHECK (position(slot::text IN 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef')>0),
  DROP CONSTRAINT rapid_tournament_players_pair_number_check,
  ADD CONSTRAINT rapid_tournament_players_pair_number_check CHECK (pair_number BETWEEN 1 AND 16);

CREATE OR REPLACE FUNCTION public.create_configurable_rapid_tournament(
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
    OR v_players IS NULL OR v_players NOT BETWEEN 4 AND 32 OR cardinality(p_player_user_ids) IS DISTINCT FROM v_players
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
      OR EXISTS (SELECT 1 FROM unnest(team_a||team_b) s(slot) WHERE slot IS NULL OR slot NOT IN (SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',i,1) FROM generate_series(1,v_players) i)))
    OR EXISTS (SELECT round_number,court_number FROM jsonb_to_recordset(p_matches) x(round_number integer,court_number integer)
      GROUP BY round_number,court_number HAVING count(*)>1)
    OR EXISTS (SELECT round_number,slot FROM jsonb_to_recordset(p_matches) x(round_number integer,team_a text[],team_b text[]),
      LATERAL unnest(team_a||team_b) s(slot) GROUP BY round_number,slot HAVING count(*)>1)
  THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  IF v_format='balanced_americana' AND EXISTS (
    SELECT 1 FROM generate_series(1,v_players) i WHERE (
      SELECT count(*) FROM jsonb_to_recordset(p_matches) x(team_a text[],team_b text[]) WHERE substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',i,1)=ANY(team_a||team_b)
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
  SELECT v_id,substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',ord::integer,1)::char(1),regexp_replace(btrim(name),'\s+',' ','g'),uid
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

CREATE OR REPLACE FUNCTION public.create_fixed_rapid_tournament(
  p_creator_user_id uuid,p_name text,p_description text,p_starts_at timestamptz,
  p_court_names text[],p_player_names text[],p_player_user_ids uuid[],p_player_pair_numbers smallint[],
  p_configuration jsonb,p_matches jsonb,
  p_duplicate_of uuid DEFAULT NULL,p_source_league_id uuid DEFAULT NULL,p_source_season_id uuid DEFAULT NULL,
  p_logo_url text DEFAULT NULL,p_accent_color text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_format text:=p_configuration->>'format'; v_matches jsonb;
BEGIN
  IF cardinality(p_player_names)%2<>0 OR cardinality(p_player_pair_numbers) IS DISTINCT FROM cardinality(p_player_names)
    OR EXISTS (SELECT 1 FROM unnest(p_player_pair_numbers) n WHERE n IS NULL OR n NOT BETWEEN 1 AND least(16,cardinality(p_player_names)/2))
    OR EXISTS (SELECT n FROM unnest(p_player_pair_numbers) n GROUP BY n HAVING count(*)<>2)
    OR v_format IS NULL OR v_format NOT IN ('balanced_americana','dynamic_mexicano')
    OR jsonb_typeof(p_matches) IS DISTINCT FROM 'array'
  THEN RAISE EXCEPTION 'invalid_fixed_teams'; END IF;
  -- Reuse the atomic creator/source/account/time validation without creating
  -- fixtures until fixed-pair identities have been assigned.
  v_id:=public.create_configurable_rapid_tournament(p_creator_user_id,p_name,p_description,p_starts_at,
    p_court_names,p_player_names,p_player_user_ids,p_configuration||jsonb_build_object('format','dynamic_mexicano'),'[]'::jsonb,
    p_duplicate_of,p_source_league_id,p_source_season_id,p_logo_url,p_accent_color);
  UPDATE public.rapid_tournaments SET pairing='fixed',format=v_format,
    ranking_mode=CASE WHEN v_format='dynamic_mexicano' THEN 'mexicano_rating' ELSE 'average_percentage' END WHERE id=v_id;
  UPDATE public.rapid_tournament_players p SET pair_number=input.n FROM unnest(p_player_pair_numbers) WITH ORDINALITY input(n,ord)
    WHERE p.tournament_id=v_id AND p.slot=substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',input.ord::integer,1);
  IF v_format='balanced_americana' THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('round_number',x.round_number,'court_number',x.court_number,
      'team_a',ARRAY[a1.id,a2.id],'team_b',ARRAY[b1.id,b2.id])),'[]'::jsonb) INTO v_matches
    FROM jsonb_to_recordset(p_matches) x(round_number integer,court_number integer,team_a text[],team_b text[])
      LEFT JOIN public.rapid_tournament_players a1 ON a1.tournament_id=v_id AND a1.slot=x.team_a[1]
      LEFT JOIN public.rapid_tournament_players a2 ON a2.tournament_id=v_id AND a2.slot=x.team_a[2]
      LEFT JOIN public.rapid_tournament_players b1 ON b1.tournament_id=v_id AND b1.slot=x.team_b[1]
      LEFT JOIN public.rapid_tournament_players b2 ON b2.tournament_id=v_id AND b2.slot=x.team_b[2];
    IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p_matches) x(team_a text[],team_b text[])
      WHERE cardinality(team_a) IS DISTINCT FROM 2 OR cardinality(team_b) IS DISTINCT FROM 2)
      OR NOT public.redraw_configurable_rapid_tournament(v_id,p_creator_user_id,v_matches)
    THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
    UPDATE public.rapid_tournament_rounds SET status='generated' WHERE tournament_id=v_id;
  ELSIF jsonb_array_length(p_matches)<>0 THEN RAISE EXCEPTION 'invalid_tournament_schedule'; END IF;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.create_traditional_tournament(
  p_creator_user_id uuid,p_name text,p_description text,p_starts_at timestamptz,
  p_court_names text[],p_player_names text[],p_player_user_ids uuid[],p_player_pair_numbers smallint[],
  p_draw jsonb,p_schedule jsonb,p_match_minutes integer,p_transition_minutes integer,
  p_duplicate_of uuid DEFAULT NULL,p_source_league_id uuid DEFAULT NULL,p_source_season_id uuid DEFAULT NULL,
  p_logo_url text DEFAULT NULL,p_accent_color text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_draw jsonb; v_teams jsonb;
BEGIN
  IF p_match_minutes IS NULL OR p_match_minutes NOT BETWEEN 1 AND 120 OR p_transition_minutes IS NULL OR p_transition_minutes NOT BETWEEN 0 AND 30 THEN RAISE EXCEPTION 'invalid_traditional_configuration'; END IF;
  -- Reuse canonical names/accounts/source/pair validation atomically. Temporary
  -- planning rows never leave this transaction and contain no matches/results.
  v_id:=public.create_fixed_rapid_tournament(p_creator_user_id,p_name,p_description,p_starts_at,p_court_names,p_player_names,p_player_user_ids,p_player_pair_numbers,
    jsonb_build_object('format','dynamic_mexicano','rounds',cardinality(p_player_names),'roundMinutes',1,'transitionMinutes',0,'preparationMinutes',0,'reservationMinutes',60),'[]',
    p_duplicate_of,p_source_league_id,p_source_season_id,p_logo_url,p_accent_color);
  DELETE FROM public.rapid_tournament_rounds WHERE tournament_id=v_id;
  SELECT jsonb_agg(jsonb_build_object('id','pair-'||pair_number,'playerIds',player_ids) ORDER BY pair_number) INTO v_teams
    FROM (SELECT pair_number,jsonb_agg(id ORDER BY position(slot::text IN 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef')) player_ids FROM public.rapid_tournament_players WHERE tournament_id=v_id GROUP BY pair_number) pairs;
  v_draw:=jsonb_set(p_draw,'{teams}',v_teams);
  UPDATE public.rapid_tournaments SET tournament_mode='traditional',format=p_draw->'configuration'->>'format',ranking_mode='sporting',
    round_count=greatest(1,jsonb_array_length(p_draw->'matches')),round_minutes=p_match_minutes,transition_minutes=p_transition_minutes WHERE id=v_id;
  INSERT INTO public.traditional_tournament_state(tournament_id,draw,schedule) VALUES(v_id,v_draw,p_schedule);
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.validate_traditional_tournament_state() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_t public.rapid_tournaments%ROWTYPE; v_item jsonb; v_node jsonb; v_source jsonb; v_other jsonb;
  v_left jsonb; v_right jsonb; v_previous text[]:=ARRAY[]::text[]; v_dep text; v_pair integer;
  v_config jsonb:=NEW.draw->'configuration'; v_team_count integer; v_group_count integer; v_qualifiers integer;
  v_main_teams integer; v_main_size integer:=1; v_consolation_teams integer; v_consolation_size integer:=1;
BEGIN
  SELECT * INTO STRICT v_t FROM public.rapid_tournaments WHERE id=NEW.tournament_id;
  IF v_t.tournament_mode<>'traditional' OR jsonb_typeof(NEW.draw->'teams') IS DISTINCT FROM 'array'
    OR jsonb_typeof(NEW.draw->'groups') IS DISTINCT FROM 'array' OR jsonb_typeof(NEW.draw->'matches') IS DISTINCT FROM 'array'
    OR jsonb_typeof(NEW.draw->'seedOrder') IS DISTINCT FROM 'array' OR v_config->>'format' IS DISTINCT FROM v_t.format
    OR jsonb_typeof(v_config->'thirdPlace') IS DISTINCT FROM 'boolean' OR jsonb_typeof(v_config->'consolation') IS DISTINCT FROM 'boolean'
    OR jsonb_typeof(NEW.results) IS DISTINCT FROM 'array' OR jsonb_typeof(NEW.schedule) IS DISTINCT FROM 'array' OR jsonb_typeof(NEW.tie_orders) IS DISTINCT FROM 'object'
  THEN RAISE EXCEPTION 'invalid_traditional_plan'; END IF;
  v_team_count:=jsonb_array_length(NEW.draw->'teams'); v_group_count:=(v_config->>'groupCount')::integer; v_qualifiers:=(v_config->>'qualifiersPerGroup')::integer;
  IF v_team_count<>v_t.player_count/2 OR v_group_count IS NULL OR v_qualifiers IS NULL
    OR jsonb_array_length(NEW.draw->'matches') NOT BETWEEN 1 AND 120
    OR (SELECT count(DISTINCT m->>'id') FROM jsonb_array_elements(NEW.draw->'matches') m)<>jsonb_array_length(NEW.draw->'matches')
    OR (SELECT count(DISTINCT id) FROM jsonb_array_elements_text(NEW.draw->'seedOrder') id)<>v_team_count
    OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(NEW.draw->'seedOrder') id WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.draw->'teams') t WHERE t->>'id'=id))
    OR (v_t.format='knockout' AND (v_group_count<>0 OR v_qualifiers<>0))
    OR (v_t.format<>'knockout' AND (v_group_count NOT BETWEEN 1 AND 8 OR v_group_count*2>v_team_count))
    OR (v_t.format='groups' AND (v_qualifiers<>0 OR (v_config->>'thirdPlace')::boolean OR (v_config->>'consolation')::boolean))
    OR (v_t.format='groups_knockout' AND (v_group_count<2 OR v_qualifiers NOT BETWEEN 1 AND v_team_count/v_group_count))
  THEN RAISE EXCEPTION 'invalid_traditional_plan'; END IF;
  v_main_teams:=CASE WHEN v_t.format='knockout' THEN v_team_count ELSE v_group_count*v_qualifiers END;
  WHILE v_main_size<v_main_teams LOOP v_main_size:=v_main_size*2; END LOOP;
  v_consolation_teams:=CASE WHEN v_t.format='knockout' THEN v_team_count-v_main_size/2 ELSE v_team_count-v_main_teams END;
  WHILE v_consolation_size<v_consolation_teams LOOP v_consolation_size:=v_consolation_size*2; END LOOP;
  IF ((v_config->>'thirdPlace')::boolean AND v_main_teams<4)
    OR ((v_config->>'consolation')::boolean AND v_consolation_teams<2)
    OR (v_t.format='knockout' AND v_team_count=4 AND (v_config->>'consolation')::boolean AND (v_config->>'thirdPlace')::boolean)
    OR (SELECT count(*) FROM jsonb_array_elements(NEW.draw->'matches') m WHERE m->>'stage'='main')<>(CASE WHEN v_t.format='groups' THEN 0 ELSE v_main_size-1 END)
    OR (SELECT count(*) FROM jsonb_array_elements(NEW.draw->'matches') m WHERE m->>'stage'='third_place')<>(CASE WHEN (v_config->>'thirdPlace')::boolean THEN 1 ELSE 0 END)
    OR (SELECT count(*) FROM jsonb_array_elements(NEW.draw->'matches') m WHERE m->>'stage'='consolation')<>(CASE WHEN (v_config->>'consolation')::boolean THEN v_consolation_size-1 ELSE 0 END)
  THEN RAISE EXCEPTION 'invalid_traditional_options'; END IF;
  FOR v_pair IN 1..v_team_count LOOP
    SELECT t INTO v_item FROM jsonb_array_elements(NEW.draw->'teams') t WHERE t->>'id'='pair-'||v_pair;
    IF v_item IS NULL OR jsonb_array_length(v_item->'playerIds')<>2
      OR (SELECT count(DISTINCT input.player_id) FROM jsonb_array_elements_text(v_item->'playerIds') input(player_id) JOIN public.rapid_tournament_players p ON p.id::text=input.player_id WHERE p.tournament_id=NEW.tournament_id AND p.pair_number=v_pair)<>2
    THEN RAISE EXCEPTION 'invalid_fixed_teams'; END IF;
  END LOOP;
  IF jsonb_array_length(NEW.draw->'groups')<>v_group_count OR EXISTS (
    SELECT 1 FROM jsonb_each(NEW.tie_orders) o WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(NEW.draw->'groups') g WHERE g->>'id'=o.key AND jsonb_typeof(o.value)='array'
        AND jsonb_array_length(o.value)=jsonb_array_length(g->'teamIds')
        AND (SELECT count(DISTINCT id) FROM jsonb_array_elements_text(o.value) id WHERE g->'teamIds' ? id)=jsonb_array_length(g->'teamIds')
    )) THEN RAISE EXCEPTION 'invalid_group_tie_order'; END IF;
  IF v_group_count>0 AND (
    (SELECT count(*) FROM jsonb_array_elements(NEW.draw->'groups') g,LATERAL jsonb_array_elements_text(g->'teamIds') id)<>v_team_count
    OR (SELECT count(DISTINCT id) FROM jsonb_array_elements(NEW.draw->'groups') g,LATERAL jsonb_array_elements_text(g->'teamIds') id)<>v_team_count
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.draw->'groups') g WHERE jsonb_array_length(g->'teamIds') NOT BETWEEN v_team_count/v_group_count AND ceil(v_team_count::numeric/v_group_count))
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.draw->'groups') g,LATERAL jsonb_array_elements_text(g->'teamIds') id WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.draw->'teams') t WHERE t->>'id'=id)))
  THEN RAISE EXCEPTION 'invalid_traditional_groups'; END IF;
  FOR v_item IN SELECT g FROM jsonb_array_elements(NEW.draw->'groups') g LOOP
    IF (SELECT count(*) FROM jsonb_array_elements(NEW.draw->'matches') m WHERE m->>'stage'='group' AND m->>'groupId'=v_item->>'id')<>jsonb_array_length(v_item->'teamIds')*(jsonb_array_length(v_item->'teamIds')-1)/2
      OR (SELECT count(DISTINCT least(m->'a'->>'teamId',m->'b'->>'teamId')||'/'||greatest(m->'a'->>'teamId',m->'b'->>'teamId')) FROM jsonb_array_elements(NEW.draw->'matches') m WHERE m->>'stage'='group' AND m->>'groupId'=v_item->>'id')<>jsonb_array_length(v_item->'teamIds')*(jsonb_array_length(v_item->'teamIds')-1)/2
    THEN RAISE EXCEPTION 'invalid_traditional_groups'; END IF;
  END LOOP;
  FOR v_node IN SELECT m FROM jsonb_array_elements(NEW.draw->'matches') m LOOP
    IF NOT (v_node ?& ARRAY['id','a','b','stage','round','groupId']) OR coalesce(v_node->>'stage','') NOT IN ('group','main','third_place','consolation') OR (v_node->>'round')::integer NOT BETWEEN 1 AND 100
      OR (v_node->'a'='null'::jsonb AND v_node->'b'='null'::jsonb)
      OR (v_node->>'stage'='group' AND (v_node->'a'->>'kind' IS DISTINCT FROM 'team' OR v_node->'b'->>'kind' IS DISTINCT FROM 'team'
        OR v_node->'a'->>'teamId'=v_node->'b'->>'teamId' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.draw->'groups') g WHERE g->>'id'=v_node->>'groupId' AND g->'teamIds' ? (v_node->'a'->>'teamId') AND g->'teamIds' ? (v_node->'b'->>'teamId'))))
      OR (v_node->>'stage'<>'group' AND v_node->'groupId'<>'null'::jsonb)
      THEN RAISE EXCEPTION 'invalid_traditional_plan'; END IF;
    FOR v_source IN SELECT v_node->'a' UNION ALL SELECT v_node->'b' LOOP
      IF v_source='null'::jsonb THEN CONTINUE; END IF;
      IF (v_source->>'kind'='team' AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.draw->'teams') t WHERE t->>'id'=v_source->>'teamId'))
        OR (v_source->>'kind' IN ('winner','loser') AND NOT coalesce(v_source->>'matchId'=ANY(v_previous),false))
        OR (v_source->>'kind'='group' AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.draw->'groups') g WHERE g->>'id'=v_source->>'groupId' AND (v_source->>'position')::integer BETWEEN 1 AND jsonb_array_length(g->'teamIds')))
        OR coalesce(v_source->>'kind','') NOT IN ('team','group','winner','loser')
      THEN RAISE EXCEPTION 'invalid_traditional_source'; END IF;
    END LOOP;
    v_previous:=array_append(v_previous,v_node->>'id');
  END LOOP;
  IF (SELECT count(DISTINCT r->>'matchId') FROM jsonb_array_elements(NEW.results) r)<>jsonb_array_length(NEW.results) THEN RAISE EXCEPTION 'invalid_traditional_results'; END IF;
  FOR v_item IN SELECT r FROM jsonb_array_elements(NEW.results) r LOOP
    SELECT m INTO v_node FROM jsonb_array_elements(NEW.draw->'matches') m WHERE m->>'id'=v_item->>'matchId';
    IF v_node IS NULL OR jsonb_typeof(v_item->'scoreA') IS DISTINCT FROM 'number' OR jsonb_typeof(v_item->'scoreB') IS DISTINCT FROM 'number'
      OR coalesce(v_item->>'scoreA','') !~ '^\d+$' OR coalesce(v_item->>'scoreB','') !~ '^\d+$'
      OR (v_item->>'scoreA')::bigint NOT BETWEEN 0 AND 2147483647 OR (v_item->>'scoreB')::bigint NOT BETWEEN 0 AND 2147483647
      OR (v_item->>'scoreA')::bigint+(v_item->>'scoreB')::bigint=0 OR (v_node->>'stage'<>'group' AND v_item->>'scoreA'=v_item->>'scoreB')
      OR v_item->>'teamAId' IS NULL OR v_item->>'teamBId' IS NULL OR v_item->>'teamAId'=v_item->>'teamBId'
      OR v_item->>'teamAId' IS DISTINCT FROM public.traditional_source_team(NEW.draw,NEW.results,NEW.tie_orders,v_node->'a')
      OR v_item->>'teamBId' IS DISTINCT FROM public.traditional_source_team(NEW.draw,NEW.results,NEW.tie_orders,v_node->'b')
    THEN RAISE EXCEPTION 'invalid_traditional_results'; END IF;
  END LOOP;
  IF (SELECT count(DISTINCT s->>'matchId') FROM jsonb_array_elements(NEW.schedule) s)<>jsonb_array_length(NEW.schedule) THEN RAISE EXCEPTION 'invalid_traditional_schedule'; END IF;
  FOR v_item IN SELECT s FROM jsonb_array_elements(NEW.schedule) s LOOP
    SELECT m INTO v_node FROM jsonb_array_elements(NEW.draw->'matches') m WHERE m->>'id'=v_item->>'matchId';
    IF v_node IS NULL OR v_node->'a'='null'::jsonb OR v_node->'b'='null'::jsonb
      OR coalesce(v_item->>'court','') !~ '^\d+$' OR (v_item->>'court')::integer NOT BETWEEN 1 AND v_t.court_count
      OR v_item->>'startsAt' IS NULL OR v_item->>'endsAt' IS NULL OR (v_item->>'startsAt')::timestamptz<v_t.starts_at OR (v_item->>'endsAt')::timestamptz<=(v_item->>'startsAt')::timestamptz
    THEN RAISE EXCEPTION 'invalid_traditional_schedule'; END IF;
    FOREACH v_dep IN ARRAY public.traditional_source_dependencies(NEW.draw,v_node->'a')||public.traditional_source_dependencies(NEW.draw,v_node->'b') LOOP
      SELECT s INTO v_other FROM jsonb_array_elements(NEW.schedule) s WHERE s->>'matchId'=v_dep;
      IF v_other IS NULL OR (v_other->>'endsAt')::timestamptz+make_interval(mins=>v_t.transition_minutes)>(v_item->>'startsAt')::timestamptz THEN RAISE EXCEPTION 'traditional_schedule_dependency_conflict'; END IF;
    END LOOP;
    FOR v_other IN SELECT s FROM jsonb_array_elements(NEW.schedule) s WHERE s->>'matchId'>v_item->>'matchId'
      AND (s->>'startsAt')::timestamptz<(v_item->>'endsAt')::timestamptz+make_interval(mins=>v_t.transition_minutes)
      AND (v_item->>'startsAt')::timestamptz<(s->>'endsAt')::timestamptz+make_interval(mins=>v_t.transition_minutes) LOOP
      IF v_item->>'court'=v_other->>'court' THEN RAISE EXCEPTION 'traditional_schedule_overlap'; END IF;
      FOR v_left IN SELECT v_node->'a' UNION ALL SELECT v_node->'b' LOOP
        FOR v_right IN SELECT m->'a' FROM jsonb_array_elements(NEW.draw->'matches') m WHERE m->>'id'=v_other->>'matchId'
          UNION ALL SELECT m->'b' FROM jsonb_array_elements(NEW.draw->'matches') m WHERE m->>'id'=v_other->>'matchId' LOOP
          IF public.traditional_source_teams(NEW.draw,v_left) && public.traditional_source_teams(NEW.draw,v_right)
            AND NOT ((v_left->>'kind'='group' AND v_right->>'kind'='group' AND v_left->>'groupId'=v_right->>'groupId' AND v_left->>'position'<>v_right->>'position')
              OR (v_left->>'kind' IN ('winner','loser') AND v_right->>'kind' IN ('winner','loser') AND v_left->>'matchId'=v_right->>'matchId' AND v_left->>'kind'<>v_right->>'kind'))
          THEN RAISE EXCEPTION 'traditional_schedule_overlap'; END IF;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
  RETURN NEW;
END; $$;

-- CREATE OR REPLACE preserves the existing invoker rights, search paths and
-- service-only EXECUTE grants. Season capacity already permits up to 32.
