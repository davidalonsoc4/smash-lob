ALTER TABLE public.rapid_tournaments
  ADD COLUMN break_minutes smallint NOT NULL DEFAULT 0 CHECK (break_minutes BETWEEN 0 AND 60),
  ADD COLUMN break_every_rounds smallint NOT NULL DEFAULT 0 CHECK (break_every_rounds BETWEEN 0 AND 100),
  ADD CONSTRAINT rapid_tournaments_break_pair CHECK ((break_minutes=0)=(break_every_rounds=0));

CREATE FUNCTION public.create_planned_rapid_tournament(
  p_creator_user_id uuid,p_name text,p_description text,p_starts_at timestamptz,
  p_court_names text[],p_player_names text[],p_player_user_ids uuid[],p_player_pair_numbers smallint[],
  p_configuration jsonb,p_matches jsonb,
  p_duplicate_of uuid DEFAULT NULL,p_source_league_id uuid DEFAULT NULL,p_source_season_id uuid DEFAULT NULL,
  p_logo_url text DEFAULT NULL,p_accent_color text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_minutes integer:=(p_configuration->>'breakMinutes')::integer;
  v_every integer:=(p_configuration->>'breakEveryRounds')::integer;
  v_rounds integer:=(p_configuration->>'rounds')::integer; v_extra integer;
BEGIN
  IF v_minutes IS NULL OR v_minutes NOT BETWEEN 1 AND 60 OR v_every IS NULL OR v_every NOT BETWEEN 1 AND 100
    OR p_configuration->>'pairing' IS NULL OR p_configuration->>'pairing' NOT IN ('fixed','rotating')
  THEN RAISE EXCEPTION 'invalid_tournament_configuration'; END IF;
  v_extra:=((v_rounds-1)/v_every)*v_minutes;
  IF (p_configuration->>'reservationMinutes')::integer-(p_configuration->>'preparationMinutes')::integer
    -v_rounds*(p_configuration->>'roundMinutes')::integer-(v_rounds-1)*(p_configuration->>'transitionMinutes')::integer-v_extra<2
  THEN RAISE EXCEPTION 'invalid_tournament_configuration'; END IF;
  IF p_configuration->>'pairing'='fixed' THEN
    v_id:=public.create_fixed_rapid_tournament(p_creator_user_id,p_name,p_description,p_starts_at,p_court_names,p_player_names,
      p_player_user_ids,p_player_pair_numbers,p_configuration,p_matches,p_duplicate_of,p_source_league_id,p_source_season_id,p_logo_url,p_accent_color);
  ELSE
    IF p_player_pair_numbers IS NOT NULL THEN RAISE EXCEPTION 'invalid_fixed_teams'; END IF;
    v_id:=public.create_configurable_rapid_tournament(p_creator_user_id,p_name,p_description,p_starts_at,p_court_names,p_player_names,
      p_player_user_ids,p_configuration,p_matches,p_duplicate_of,p_source_league_id,p_source_season_id,p_logo_url,p_accent_color);
  END IF;
  UPDATE public.rapid_tournaments SET break_minutes=v_minutes,break_every_rounds=v_every,safety_margin_minutes=safety_margin_minutes-v_extra WHERE id=v_id;
  UPDATE public.rapid_tournament_rounds SET
    starts_at=starts_at+make_interval(mins=>((round_number-1)/v_every)*v_minutes),
    ends_at=ends_at+make_interval(mins=>((round_number-1)/v_every)*v_minutes)
    WHERE tournament_id=v_id;
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.create_planned_rapid_tournament(uuid,text,text,timestamptz,text[],text[],uuid[],smallint[],jsonb,jsonb,uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_planned_rapid_tournament(uuid,text,text,timestamptz,text[],text[],uuid[],smallint[],jsonb,jsonb,uuid,uuid,uuid,text,text) TO service_role;
