-- Traditional draws share tournament identity, roster, invites and ownership.
-- Unresolved fixtures are a bounded draw, never fake players or scored byes.
ALTER TABLE public.rapid_tournaments
  DROP CONSTRAINT rapid_tournaments_tournament_mode_check,
  DROP CONSTRAINT rapid_tournaments_format_check,
  DROP CONSTRAINT rapid_tournaments_ranking_mode_check,
  ADD CONSTRAINT rapid_tournaments_tournament_mode_check CHECK (tournament_mode IN ('rapid','traditional')),
  ADD CONSTRAINT rapid_tournaments_format_check CHECK (format IN ('balanced_americana','dynamic_mexicano','knockout','groups','groups_knockout')),
  ADD CONSTRAINT rapid_tournaments_ranking_mode_check CHECK (ranking_mode IN ('average_percentage','mexicano_rating','sporting')),
  ADD CONSTRAINT rapid_tournaments_mode_format_check CHECK ((tournament_mode='traditional')=(format IN ('knockout','groups','groups_knockout')));

CREATE TABLE public.traditional_tournament_state (
  tournament_id uuid PRIMARY KEY REFERENCES public.rapid_tournaments(id) ON DELETE CASCADE,
  draw jsonb NOT NULL CHECK (jsonb_typeof(draw)='object' AND pg_column_size(draw)<100000),
  results jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(results)='array' AND pg_column_size(results)<100000),
  schedule jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(schedule)='array' AND pg_column_size(schedule)<100000),
  tie_orders jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(tie_orders)='object' AND pg_column_size(tie_orders)<10000),
  revision integer NOT NULL DEFAULT 0 CHECK (revision>=0)
);
ALTER TABLE public.traditional_tournament_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.traditional_tournament_state FROM PUBLIC,anon,authenticated;
GRANT ALL ON TABLE public.traditional_tournament_state TO service_role;

CREATE FUNCTION public.traditional_source_team(p_draw jsonb,p_results jsonb,p_orders jsonb,p_source jsonb)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_match jsonb; v_result jsonb; v_row record; v_group jsonb; v_order text[];
BEGIN
  IF p_source IS NULL OR p_source='null'::jsonb THEN RETURN NULL; END IF;
  IF p_source->>'kind'='team' THEN RETURN p_source->>'teamId'; END IF;
  IF p_source->>'kind' IN ('winner','loser') THEN
    SELECT m INTO v_match FROM jsonb_array_elements(p_draw->'matches') m WHERE m->>'id'=p_source->>'matchId';
    SELECT r INTO v_result FROM jsonb_array_elements(p_results) r WHERE r->>'matchId'=p_source->>'matchId';
    IF v_result IS NOT NULL THEN
      IF (v_result->>'scoreA')::bigint=(v_result->>'scoreB')::bigint THEN RETURN NULL; END IF;
      RETURN CASE WHEN ((v_result->>'scoreA')::bigint>(v_result->>'scoreB')::bigint)=(p_source->>'kind'='winner')
        THEN v_result->>'teamAId' ELSE v_result->>'teamBId' END;
    END IF;
    IF p_source->>'kind'='winner' AND (v_match->'a'='null'::jsonb OR v_match->'b'='null'::jsonb) THEN
      RETURN public.traditional_source_team(p_draw,p_results,p_orders,CASE WHEN v_match->'a'='null'::jsonb THEN v_match->'b' ELSE v_match->'a' END);
    END IF;
    RETURN NULL;
  END IF;
  SELECT g INTO v_group FROM jsonb_array_elements(p_draw->'groups') g WHERE g->>'id'=p_source->>'groupId';
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_draw->'matches') m WHERE m->>'groupId'=p_source->>'groupId'
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_results) r WHERE r->>'matchId'=m->>'id')) THEN RETURN NULL; END IF;
  SELECT array_agg(x) INTO v_order FROM jsonb_array_elements_text(p_orders->(p_source->>'groupId')) x;
  WITH stats AS (
    SELECT team_id,
      count(*) FILTER (WHERE own>opponent) AS wins,coalesce(sum(own-opponent),0) AS difference,coalesce(sum(own),0) AS points
    FROM jsonb_array_elements_text(v_group->'teamIds') team_id
    LEFT JOIN LATERAL (
      SELECT CASE WHEN r->>'teamAId'=team_id THEN (r->>'scoreA')::bigint ELSE (r->>'scoreB')::bigint END AS own,
        CASE WHEN r->>'teamAId'=team_id THEN (r->>'scoreB')::bigint ELSE (r->>'scoreA')::bigint END AS opponent
      FROM jsonb_array_elements(p_results) r JOIN jsonb_array_elements(p_draw->'matches') m ON m->>'id'=r->>'matchId'
      WHERE m->>'groupId'=p_source->>'groupId' AND team_id IN (r->>'teamAId',r->>'teamBId')
    ) scores ON true GROUP BY team_id
  ), ranked AS (
    SELECT *,row_number() OVER (ORDER BY wins DESC,difference DESC,points DESC,array_position(v_order,team_id),team_id) AS place,
      count(*) OVER (PARTITION BY wins,difference,points) AS tied FROM stats
  ) SELECT * INTO v_row FROM ranked WHERE place=(p_source->>'position')::integer;
  IF NOT FOUND OR (v_row.tied>1 AND v_order IS NULL) THEN RETURN NULL; END IF;
  RETURN v_row.team_id;
END; $$;

CREATE FUNCTION public.traditional_source_teams(p_draw jsonb,p_source jsonb)
RETURNS text[] LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_match jsonb; v_ids text[];
BEGIN
  IF p_source IS NULL OR p_source='null'::jsonb THEN RETURN ARRAY[]::text[]; END IF;
  IF p_source->>'kind'='team' THEN RETURN ARRAY[p_source->>'teamId']; END IF;
  IF p_source->>'kind'='group' THEN
    SELECT array_agg(id) INTO v_ids FROM jsonb_array_elements(p_draw->'groups') g,
      LATERAL jsonb_array_elements_text(g->'teamIds') id WHERE g->>'id'=p_source->>'groupId';
    RETURN v_ids;
  END IF;
  SELECT m INTO v_match FROM jsonb_array_elements(p_draw->'matches') m WHERE m->>'id'=p_source->>'matchId';
  RETURN public.traditional_source_teams(p_draw,v_match->'a')||public.traditional_source_teams(p_draw,v_match->'b');
END; $$;

CREATE FUNCTION public.traditional_source_dependencies(p_draw jsonb,p_source jsonb)
RETURNS text[] LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_match jsonb; v_ids text[];
BEGIN
  IF p_source IS NULL OR p_source='null'::jsonb OR p_source->>'kind'='team' THEN RETURN ARRAY[]::text[]; END IF;
  IF p_source->>'kind'='group' THEN
    SELECT array_agg(m->>'id') INTO v_ids FROM jsonb_array_elements(p_draw->'matches') m WHERE m->>'groupId'=p_source->>'groupId';
    RETURN v_ids;
  END IF;
  SELECT m INTO v_match FROM jsonb_array_elements(p_draw->'matches') m WHERE m->>'id'=p_source->>'matchId';
  IF v_match->'a'<>'null'::jsonb AND v_match->'b'<>'null'::jsonb THEN RETURN ARRAY[v_match->>'id']; END IF;
  RETURN public.traditional_source_dependencies(p_draw,v_match->'a')||public.traditional_source_dependencies(p_draw,v_match->'b');
END; $$;

CREATE FUNCTION public.validate_traditional_tournament_state() RETURNS trigger
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
    OR jsonb_array_length(NEW.draw->'matches') NOT BETWEEN 1 AND 100
    OR (SELECT count(DISTINCT m->>'id') FROM jsonb_array_elements(NEW.draw->'matches') m)<>jsonb_array_length(NEW.draw->'matches')
    OR (SELECT count(DISTINCT id) FROM jsonb_array_elements_text(NEW.draw->'seedOrder') id)<>v_team_count
    OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(NEW.draw->'seedOrder') id WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.draw->'teams') t WHERE t->>'id'=id))
    OR (v_t.format='knockout' AND (v_group_count<>0 OR v_qualifiers<>0))
    OR (v_t.format<>'knockout' AND (v_group_count NOT BETWEEN 1 AND 6 OR v_group_count*2>v_team_count))
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
CREATE TRIGGER traditional_state_validation BEFORE INSERT OR UPDATE ON public.traditional_tournament_state
  FOR EACH ROW EXECUTE FUNCTION public.validate_traditional_tournament_state();

CREATE FUNCTION public.create_traditional_tournament(
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
    FROM (SELECT pair_number,jsonb_agg(id ORDER BY slot) player_ids FROM public.rapid_tournament_players WHERE tournament_id=v_id GROUP BY pair_number) pairs;
  v_draw:=jsonb_set(p_draw,'{teams}',v_teams);
  UPDATE public.rapid_tournaments SET tournament_mode='traditional',format=p_draw->'configuration'->>'format',ranking_mode='sporting',
    round_count=greatest(1,jsonb_array_length(p_draw->'matches')),round_minutes=p_match_minutes,transition_minutes=p_transition_minutes WHERE id=v_id;
  INSERT INTO public.traditional_tournament_state(tournament_id,draw,schedule) VALUES(v_id,v_draw,p_schedule);
  RETURN v_id;
END; $$;

CREATE FUNCTION public.update_traditional_tournament(
  p_tournament_id uuid,p_actor_user_id uuid,p_expected_revision integer,p_action text,
  p_draw jsonb DEFAULT NULL,p_results jsonb DEFAULT NULL,p_schedule jsonb DEFAULT NULL,p_tie_orders jsonb DEFAULT NULL
) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_t public.rapid_tournaments%ROWTYPE; v_state public.traditional_tournament_state%ROWTYPE; v_old_setting text;
BEGIN
  SELECT * INTO v_t FROM public.rapid_tournaments WHERE id=p_tournament_id AND created_by_user_id=p_actor_user_id AND tournament_mode='traditional' FOR UPDATE;
  IF NOT FOUND OR v_t.status='finished' OR NOT EXISTS(SELECT 1 FROM public.app_users WHERE id=p_actor_user_id AND suspended_at IS NULL) THEN RETURN -1; END IF;
  SELECT * INTO STRICT v_state FROM public.traditional_tournament_state WHERE tournament_id=p_tournament_id FOR UPDATE;
  IF v_state.revision<>p_expected_revision THEN RETURN -1; END IF;
  IF p_action IS NULL OR p_action NOT IN ('draw','start','result','schedule','ties','finish')
    OR (p_action IN ('draw','start') AND v_t.status<>'draft') OR (p_action IN ('result','ties','finish') AND v_t.status<>'in_progress')
    OR (p_action<>'draw' AND p_draw IS NOT NULL AND p_draw<>v_state.draw)
    OR (p_action<>'result' AND p_results IS NOT NULL AND p_results<>v_state.results)
    OR (p_action NOT IN ('draw','schedule') AND p_schedule IS NOT NULL AND p_schedule<>v_state.schedule)
    OR (p_action NOT IN ('draw','ties') AND p_tie_orders IS NOT NULL AND p_tie_orders<>v_state.tie_orders)
  THEN RAISE EXCEPTION 'invalid_traditional_action'; END IF;
  IF p_action='result' AND (p_results IS NULL OR jsonb_typeof(p_results)<>'array'
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(v_state.results) old WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_results) new WHERE new->>'matchId'=old->>'matchId'))
    OR (SELECT count(*) FROM jsonb_array_elements(p_results) new WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_state.results) old WHERE old=new))>1)
  THEN RAISE EXCEPTION 'invalid_traditional_results'; END IF;
  IF p_action='schedule' AND EXISTS (SELECT 1 FROM jsonb_array_elements(v_state.results) r WHERE
    (SELECT s FROM jsonb_array_elements(v_state.schedule) s WHERE s->>'matchId'=r->>'matchId') IS DISTINCT FROM
    (SELECT s FROM jsonb_array_elements(p_schedule) s WHERE s->>'matchId'=r->>'matchId')) THEN RAISE EXCEPTION 'played_traditional_schedule_locked'; END IF;
  IF p_action='finish' AND jsonb_array_length(v_state.results)<>(SELECT count(*) FROM jsonb_array_elements(v_state.draw->'matches') m WHERE m->'a'<>'null'::jsonb AND m->'b'<>'null'::jsonb)
  THEN RAISE EXCEPTION 'traditional_tournament_incomplete'; END IF;
  UPDATE public.traditional_tournament_state SET draw=coalesce(p_draw,draw),results=coalesce(p_results,results),schedule=coalesce(p_schedule,schedule),tie_orders=coalesce(p_tie_orders,tie_orders),revision=revision+1 WHERE tournament_id=p_tournament_id;
  v_old_setting:=current_setting('smash.traditional_mutation',true);
  PERFORM set_config('smash.traditional_mutation','on',true);
  IF p_action='start' THEN UPDATE public.rapid_tournaments SET status='in_progress',started_at=now() WHERE id=p_tournament_id; END IF;
  IF p_action='finish' THEN UPDATE public.rapid_tournaments SET status='finished',finished_at=now() WHERE id=p_tournament_id; END IF;
  PERFORM set_config('smash.traditional_mutation',coalesce(v_old_setting,''),true);
  RETURN v_state.revision+1;
END; $$;

CREATE FUNCTION public.guard_traditional_tournament_status() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
  IF OLD.tournament_mode='traditional' AND NEW.status IS DISTINCT FROM OLD.status AND current_setting('smash.traditional_mutation',true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'use_traditional_tournament_management'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER traditional_status_guard BEFORE UPDATE OF status ON public.rapid_tournaments
  FOR EACH ROW EXECUTE FUNCTION public.guard_traditional_tournament_status();

REVOKE ALL ON FUNCTION public.traditional_source_team(jsonb,jsonb,jsonb,jsonb),public.traditional_source_teams(jsonb,jsonb),public.traditional_source_dependencies(jsonb,jsonb),public.validate_traditional_tournament_state(),public.guard_traditional_tournament_status(),
  public.create_traditional_tournament(uuid,text,text,timestamptz,text[],text[],uuid[],smallint[],jsonb,jsonb,integer,integer,uuid,uuid,uuid,text,text),
  public.update_traditional_tournament(uuid,uuid,integer,text,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.traditional_source_team(jsonb,jsonb,jsonb,jsonb),public.traditional_source_teams(jsonb,jsonb),public.traditional_source_dependencies(jsonb,jsonb),public.validate_traditional_tournament_state(),public.guard_traditional_tournament_status(),
  public.create_traditional_tournament(uuid,text,text,timestamptz,text[],text[],uuid[],smallint[],jsonb,jsonb,integer,integer,uuid,uuid,uuid,text,text),
  public.update_traditional_tournament(uuid,uuid,integer,text,jsonb,jsonb,jsonb,jsonb) TO service_role;
