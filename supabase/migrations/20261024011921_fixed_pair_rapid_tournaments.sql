-- Fixed pairs are a property of the independent tournament roster. Existing
-- tournaments remain rotating; no league membership or result is changed.
ALTER TABLE public.rapid_tournaments ADD COLUMN pairing text NOT NULL DEFAULT 'rotating' CHECK (pairing IN ('rotating','fixed'));
ALTER TABLE public.rapid_tournament_players ADD COLUMN pair_number smallint CHECK (pair_number BETWEEN 1 AND 12);

CREATE FUNCTION public.guard_fixed_rapid_match() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_a smallint; v_b smallint;
BEGIN
  IF (SELECT pairing FROM public.rapid_tournaments WHERE id=NEW.tournament_id) <> 'fixed' THEN RETURN NEW; END IF;
  SELECT pair_number INTO v_a FROM public.rapid_tournament_players WHERE id=NEW.team_a_one_id AND tournament_id=NEW.tournament_id;
  SELECT pair_number INTO v_b FROM public.rapid_tournament_players WHERE id=NEW.team_b_one_id AND tournament_id=NEW.tournament_id;
  IF v_a IS NULL OR v_b IS NULL OR v_a=v_b
    OR NOT EXISTS (SELECT 1 FROM public.rapid_tournament_players WHERE id=NEW.team_a_two_id AND tournament_id=NEW.tournament_id AND pair_number=v_a)
    OR NOT EXISTS (SELECT 1 FROM public.rapid_tournament_players WHERE id=NEW.team_b_two_id AND tournament_id=NEW.tournament_id AND pair_number=v_b)
    OR NEW.team_a_one_id=NEW.team_a_two_id OR NEW.team_b_one_id=NEW.team_b_two_id
  THEN RAISE EXCEPTION 'invalid_fixed_match'; END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_fixed_rapid_match() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_fixed_rapid_match() TO service_role;
CREATE TRIGGER rapid_fixed_match_guard BEFORE INSERT OR UPDATE OF tournament_id,team_a_one_id,team_a_two_id,team_b_one_id,team_b_two_id
  ON public.rapid_tournament_matches FOR EACH ROW EXECUTE FUNCTION public.guard_fixed_rapid_match();

CREATE FUNCTION public.guard_fixed_rapid_start() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
  IF OLD.status<>'draft' AND NEW.pairing IS DISTINCT FROM OLD.pairing THEN RAISE EXCEPTION 'tournament_pairing_locked'; END IF;
  IF NEW.pairing='fixed' AND NEW.status='in_progress' AND OLD.status='draft' THEN
    IF NEW.player_count%2<>0
      OR (SELECT count(*) FROM public.rapid_tournament_players WHERE tournament_id=NEW.id AND pair_number IS NOT NULL)<>NEW.player_count
      OR EXISTS (SELECT pair_number FROM public.rapid_tournament_players WHERE tournament_id=NEW.id GROUP BY pair_number HAVING count(*)<>2)
      OR EXISTS (SELECT 1 FROM public.rapid_tournament_matches m
        JOIN public.rapid_tournament_players a1 ON a1.id=m.team_a_one_id
        JOIN public.rapid_tournament_players a2 ON a2.id=m.team_a_two_id
        JOIN public.rapid_tournament_players b1 ON b1.id=m.team_b_one_id
        JOIN public.rapid_tournament_players b2 ON b2.id=m.team_b_two_id
        WHERE m.tournament_id=NEW.id AND (a1.pair_number IS DISTINCT FROM a2.pair_number
          OR b1.pair_number IS DISTINCT FROM b2.pair_number OR a1.pair_number=b1.pair_number))
      OR (NEW.format='balanced_americana' AND (SELECT count(*) FROM public.rapid_tournament_matches WHERE tournament_id=NEW.id)<>NEW.round_count*least(NEW.court_count,floor(NEW.player_count/4.0)::integer))
    THEN RAISE EXCEPTION 'invalid_fixed_teams'; END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_fixed_rapid_start() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_fixed_rapid_start() TO service_role;
CREATE TRIGGER rapid_fixed_start_guard BEFORE UPDATE OF status,pairing ON public.rapid_tournaments
  FOR EACH ROW EXECUTE FUNCTION public.guard_fixed_rapid_start();

CREATE FUNCTION public.guard_fixed_rapid_pair_change() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
  IF NEW.pair_number IS DISTINCT FROM OLD.pair_number AND EXISTS (
    SELECT 1 FROM public.rapid_tournaments WHERE id=OLD.tournament_id AND pairing='fixed' AND status<>'draft'
  ) THEN RAISE EXCEPTION 'tournament_pairing_locked'; END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_fixed_rapid_pair_change() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_fixed_rapid_pair_change() TO service_role;
CREATE TRIGGER rapid_fixed_pair_change_guard BEFORE UPDATE OF pair_number ON public.rapid_tournament_players
  FOR EACH ROW EXECUTE FUNCTION public.guard_fixed_rapid_pair_change();

CREATE FUNCTION public.create_fixed_rapid_tournament(
  p_creator_user_id uuid,p_name text,p_description text,p_starts_at timestamptz,
  p_court_names text[],p_player_names text[],p_player_user_ids uuid[],p_player_pair_numbers smallint[],
  p_configuration jsonb,p_matches jsonb,
  p_duplicate_of uuid DEFAULT NULL,p_source_league_id uuid DEFAULT NULL,p_source_season_id uuid DEFAULT NULL,
  p_logo_url text DEFAULT NULL,p_accent_color text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_format text:=p_configuration->>'format'; v_matches jsonb;
BEGIN
  IF cardinality(p_player_names)%2<>0 OR cardinality(p_player_pair_numbers) IS DISTINCT FROM cardinality(p_player_names)
    OR EXISTS (SELECT 1 FROM unnest(p_player_pair_numbers) n WHERE n IS NULL OR n NOT BETWEEN 1 AND least(12,cardinality(p_player_names)/2))
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
    WHERE p.tournament_id=v_id AND p.slot=chr(64+input.ord::integer);
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
REVOKE ALL ON FUNCTION public.create_fixed_rapid_tournament(uuid,text,text,timestamptz,text[],text[],uuid[],smallint[],jsonb,jsonb,uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_fixed_rapid_tournament(uuid,text,text,timestamptz,text[],text[],uuid[],smallint[],jsonb,jsonb,uuid,uuid,uuid,text,text) TO service_role;
