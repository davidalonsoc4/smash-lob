-- Pending partners exist only in an upcoming self-registration season.
-- Existing leagues/rosters/results are not rewritten. All RPCs are server-only.
CREATE OR REPLACE FUNCTION public.guard_season_pair_number() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_mode text; v_pending boolean;
BEGIN
  SELECT l.modality, s.status = 'upcoming' AND EXISTS (
    SELECT 1 FROM public.season_settings ss WHERE ss.season_id=s.id AND ss.roster_mode='self_registration'
  ) AND NOT EXISTS (SELECT 1 FROM public.matches m WHERE m.season_id=s.id)
    INTO v_mode, v_pending FROM public.seasons s JOIN public.leagues l ON l.id=s.league_id WHERE s.id=NEW.season_id;
  IF v_mode <> 'fixed_pairs' THEN
    IF NEW.pair_number IS NOT NULL THEN RAISE EXCEPTION 'individual_league_has_no_fixed_pairs'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.pair_number IS NULL AND NEW.replaces_player_id IS NOT NULL AND NOT COALESCE(v_pending,false) THEN
    SELECT pair_number INTO NEW.pair_number FROM public.season_players WHERE season_id=NEW.season_id AND player_id=NEW.replaces_player_id;
  END IF;
  IF NEW.pair_number IS NULL AND NOT COALESCE(v_pending,false) THEN RAISE EXCEPTION 'invalid_fixed_pairs'; END IF;
  IF TG_OP='UPDATE' AND (NEW.season_id<>OLD.season_id OR NEW.player_id<>OLD.player_id OR
    (NEW.pair_number IS DISTINCT FROM OLD.pair_number AND NOT COALESCE(v_pending,false))) THEN
    RAISE EXCEPTION 'season_pair_identity_immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.server_join_pair_registration(
  p_user_id uuid, p_league_id uuid, p_season_id uuid, p_historical_player_id uuid, p_partner_player_id uuid
) RETURNS TABLE(player_id uuid, registered_count integer, player_capacity integer, roster_complete boolean)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_result record; v_pair smallint; v_partner_pair smallint; v_number smallint;
BEGIN
  -- Same lock order as the existing join/remove/start RPCs. A stale selection
  -- rolls back the complete registration, including its player, membership and fee.
  PERFORM 1 FROM public.season_settings ss JOIN public.leagues l ON l.id=ss.league_id
    WHERE ss.season_id=p_season_id AND ss.league_id=p_league_id
      AND ss.roster_mode='self_registration' AND l.modality='fixed_pairs' FOR UPDATE OF ss;
  IF NOT FOUND THEN RAISE EXCEPTION 'self_registration_not_enabled'; END IF;
  SELECT * INTO v_result FROM public.server_join_self_registration_season_v2(p_user_id,p_league_id,p_season_id,p_historical_player_id);
  SELECT sp.pair_number INTO v_pair FROM public.season_players sp WHERE sp.season_id=p_season_id AND sp.player_id=v_result.player_id;
  IF v_pair IS NOT NULL AND (SELECT count(*) FROM public.season_players sp WHERE sp.season_id=p_season_id AND sp.pair_number=v_pair AND sp.status='active')=2 THEN
    IF p_partner_player_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.season_players sp WHERE sp.season_id=p_season_id AND sp.player_id=p_partner_player_id AND sp.player_id<>v_result.player_id AND sp.pair_number=v_pair AND sp.status='active'
    ) THEN RAISE EXCEPTION 'partner_unavailable'; END IF;
  ELSIF p_partner_player_id IS NOT NULL THEN
    IF p_partner_player_id=v_result.player_id OR EXISTS(SELECT 1 FROM public.matches m WHERE m.season_id=p_season_id) THEN RAISE EXCEPTION 'partner_unavailable'; END IF;
    SELECT sp.pair_number INTO v_partner_pair FROM public.season_players sp
      WHERE sp.season_id=p_season_id AND sp.player_id=p_partner_player_id AND sp.status='active' FOR UPDATE;
    IF NOT FOUND OR (v_partner_pair IS NOT NULL AND (SELECT count(*) FROM public.season_players sp WHERE sp.season_id=p_season_id AND sp.pair_number=v_partner_pair AND sp.status='active')=2) THEN
      RAISE EXCEPTION 'partner_unavailable';
    END IF;
    -- A removal can leave the other member alone. Such a slot is pending again.
    UPDATE public.season_players sp SET pair_number=NULL WHERE sp.season_id=p_season_id AND sp.status='active' AND sp.pair_number IN (
      SELECT lone.pair_number FROM public.season_players lone WHERE lone.season_id=p_season_id AND lone.status='active' AND lone.pair_number IS NOT NULL GROUP BY lone.pair_number HAVING count(*)=1
    );
    SELECT n::smallint INTO v_number FROM generate_series(1,16) n WHERE NOT EXISTS (
      SELECT 1 FROM public.season_players sp WHERE sp.season_id=p_season_id AND sp.status='active' AND sp.pair_number=n
    ) ORDER BY n LIMIT 1;
    IF v_number IS NULL THEN RAISE EXCEPTION 'invalid_fixed_pairs'; END IF;
    UPDATE public.season_players sp SET pair_number=v_number WHERE sp.season_id=p_season_id AND sp.player_id IN(v_result.player_id,p_partner_player_id) AND sp.status='active';
  END IF;
  RETURN QUERY SELECT v_result.player_id, v_result.registered_count, v_result.player_capacity,
    v_result.roster_complete AND NOT EXISTS (
      SELECT 1 FROM public.season_players sp WHERE sp.season_id=p_season_id AND sp.status='active' GROUP BY sp.pair_number HAVING sp.pair_number IS NULL OR count(*)<>2
    );
END;
$$;

CREATE FUNCTION public.server_set_registration_pairs(p_actor_user_id uuid,p_league_id uuid,p_season_id uuid,p_roster jsonb,p_pairs jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_roster jsonb; v_pair jsonb; v_number smallint:=0; v_invalidated boolean;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.league_memberships lm WHERE lm.league_id=p_league_id AND lm.user_id=p_actor_user_id AND lm.role IN('creator','admin'))
     AND NOT EXISTS(SELECT 1 FROM public.app_users u WHERE u.id=p_actor_user_id AND u.is_superuser) THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM 1 FROM public.season_settings ss JOIN public.leagues l ON l.id=ss.league_id
    WHERE ss.league_id=p_league_id AND ss.season_id=p_season_id AND ss.roster_mode='self_registration' AND l.modality='fixed_pairs' FOR UPDATE OF ss;
  IF NOT FOUND THEN RAISE EXCEPTION 'self_registration_not_enabled'; END IF;
  PERFORM 1 FROM public.seasons s WHERE s.id=p_season_id AND s.league_id=p_league_id AND s.status='upcoming' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'registration_closed'; END IF;
  SELECT COALESCE(jsonb_object_agg(sp.player_id::text,to_jsonb(sp.pair_number)),'{}'::jsonb) INTO v_roster
    FROM public.season_players sp WHERE sp.season_id=p_season_id AND sp.status='active';
  IF p_roster IS DISTINCT FROM v_roster THEN RAISE EXCEPTION 'roster_changed'; END IF;
  IF jsonb_typeof(p_pairs) IS DISTINCT FROM 'array' OR jsonb_array_length(p_pairs)>16 THEN RAISE EXCEPTION 'invalid_fixed_pairs'; END IF;
  FOR v_pair IN SELECT value FROM jsonb_array_elements(p_pairs) LOOP
    IF jsonb_typeof(v_pair) IS DISTINCT FROM 'array' OR jsonb_array_length(v_pair)<>2 OR EXISTS(
      SELECT 1 FROM jsonb_array_elements_text(v_pair) AS member(player_id) WHERE NOT(v_roster ? member.player_id)
    ) THEN RAISE EXCEPTION 'invalid_fixed_pairs'; END IF;
  END LOOP;
  IF (SELECT count(*) FROM jsonb_array_elements(p_pairs) p CROSS JOIN LATERAL jsonb_array_elements_text(p.value) id)<>
     (SELECT count(DISTINCT id.value) FROM jsonb_array_elements(p_pairs) p CROSS JOIN LATERAL jsonb_array_elements_text(p.value) id) THEN RAISE EXCEPTION 'invalid_fixed_pairs'; END IF;
  IF EXISTS(SELECT 1 FROM public.matches m WHERE m.season_id=p_season_id AND (m.status='finished' OR m.result_recorded_at IS NOT NULL OR m.points_a IS NOT NULL OR m.points_b IS NOT NULL OR m.sets<>'[]'::jsonb)) THEN
    RAISE EXCEPTION 'played_calendar_immutable';
  END IF;
  v_invalidated:=EXISTS(SELECT 1 FROM public.matches m WHERE m.season_id=p_season_id);
  DELETE FROM public.matches m WHERE m.season_id=p_season_id;
  UPDATE public.season_players sp SET pair_number=NULL WHERE sp.season_id=p_season_id AND sp.status='active';
  FOR v_pair IN SELECT value FROM jsonb_array_elements(p_pairs) LOOP
    v_number:=v_number+1;
    UPDATE public.season_players sp SET pair_number=v_number WHERE sp.season_id=p_season_id AND sp.status='active' AND sp.player_id::text IN(SELECT jsonb_array_elements_text(v_pair));
  END LOOP;
  RETURN v_invalidated;
END;
$$;
REVOKE ALL ON FUNCTION public.server_join_pair_registration(uuid,uuid,uuid,uuid,uuid),public.server_set_registration_pairs(uuid,uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.server_join_pair_registration(uuid,uuid,uuid,uuid,uuid),public.server_set_registration_pairs(uuid,uuid,uuid,jsonb,jsonb) TO service_role;
