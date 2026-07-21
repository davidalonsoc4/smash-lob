BEGIN;

-- Corrige referencias ambiguas entre columnas SQL y parámetros de salida
-- PL/pgSQL en las RPC de suplentes. La migración original ya fue aplicada
-- en PRE, por lo que esta corrección se entrega como una migración nueva.

CREATE OR REPLACE FUNCTION public.server_add_season_substitute(
  p_season_id uuid,
  p_player_id uuid,
  p_display_name text,
  p_slug text,
  p_avatar_initials text
)
RETURNS TABLE (
  substitute_id uuid,
  player_id uuid
)
LANGUAGE plpgsql
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_season public.seasons%ROWTYPE;
  v_player_id uuid := p_player_id;
BEGIN
  SELECT season.* INTO v_season
  FROM public.seasons AS season
  WHERE season.id = p_season_id
  FOR UPDATE;

  IF v_season.id IS NULL THEN
    RAISE EXCEPTION 'season_not_found';
  END IF;

  IF v_player_id IS NULL THEN
    IF length(trim(COALESCE(p_display_name, ''))) < 2 OR length(trim(p_display_name)) > 80 THEN
      RAISE EXCEPTION 'invalid_display_name';
    END IF;

    INSERT INTO public.players AS player (league_id, slug, display_name, avatar_initials)
    VALUES (v_season.league_id, p_slug, trim(p_display_name), p_avatar_initials)
    RETURNING player.id INTO v_player_id;
  ELSIF NOT EXISTS (
    SELECT 1
    FROM public.players AS player
    WHERE player.id = v_player_id
      AND player.league_id = v_season.league_id
  ) THEN
    RAISE EXCEPTION 'player_not_found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.season_players AS season_player
    WHERE season_player.season_id = p_season_id
      AND season_player.player_id = v_player_id
  ) THEN
    RAISE EXCEPTION 'season_player_cannot_be_substitute';
  END IF;

  INSERT INTO public.season_substitutes AS season_substitute (
    league_id,
    season_id,
    player_id,
    active,
    inactive_reason,
    updated_at
  )
  VALUES (
    v_season.league_id,
    p_season_id,
    v_player_id,
    true,
    NULL,
    now()
  )
  ON CONFLICT (season_id, player_id)
  DO UPDATE SET
    active = true,
    inactive_reason = NULL,
    updated_at = now()
  RETURNING season_substitute.id INTO substitute_id;

  player_id := v_player_id;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.server_assign_match_substitute(
  p_match_id uuid,
  p_original_player_id uuid,
  p_substitute_player_id uuid,
  p_display_name text,
  p_slug text,
  p_avatar_initials text,
  p_created_by_user_id uuid
)
RETURNS TABLE (
  match_id uuid,
  substitute_player_id uuid
)
LANGUAGE plpgsql
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_match public.matches%ROWTYPE;
  v_substitute_player_id uuid := p_substitute_player_id;
  v_booking jsonb;
  v_team_a uuid[];
  v_team_b uuid[];
BEGIN
  SELECT match_row.* INTO v_match
  FROM public.matches AS match_row
  WHERE match_row.id = p_match_id
  FOR UPDATE;

  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'match_not_found';
  END IF;

  IF v_match.status = 'finished' THEN
    RAISE EXCEPTION 'finished_match_locked';
  END IF;

  IF NOT (p_original_player_id = ANY(v_match.team_a) OR p_original_player_id = ANY(v_match.team_b)) THEN
    RAISE EXCEPTION 'invalid_original_player';
  END IF;

  IF v_substitute_player_id IS NULL THEN
    IF length(trim(COALESCE(p_display_name, ''))) < 2 OR length(trim(p_display_name)) > 80 THEN
      RAISE EXCEPTION 'invalid_display_name';
    END IF;

    INSERT INTO public.players AS player (league_id, slug, display_name, avatar_initials)
    VALUES (v_match.league_id, p_slug, trim(p_display_name), p_avatar_initials)
    RETURNING player.id INTO v_substitute_player_id;

    INSERT INTO public.season_substitutes (
      league_id,
      season_id,
      player_id,
      active,
      inactive_reason,
      updated_at
    ) VALUES (
      v_match.league_id,
      v_match.season_id,
      v_substitute_player_id,
      true,
      NULL,
      now()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.players AS player
    WHERE player.id = v_substitute_player_id
      AND player.league_id = v_match.league_id
  ) THEN
    RAISE EXCEPTION 'substitute_player_not_found';
  END IF;

  IF v_substitute_player_id = ANY(v_match.team_a) OR v_substitute_player_id = ANY(v_match.team_b) THEN
    RAISE EXCEPTION 'substitute_already_in_match';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.season_players AS season_player
    WHERE season_player.season_id = v_match.season_id
      AND season_player.player_id = v_substitute_player_id
  ) THEN
    RAISE EXCEPTION 'season_player_cannot_be_substitute';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.season_substitutes AS season_substitute
    WHERE season_substitute.season_id = v_match.season_id
      AND season_substitute.player_id = v_substitute_player_id
      AND season_substitute.active = true
  ) THEN
    RAISE EXCEPTION 'substitute_not_available';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.match_substitutions AS match_substitution
    WHERE match_substitution.match_id = p_match_id
      AND match_substitution.original_player_id = p_original_player_id
  ) THEN
    RAISE EXCEPTION 'original_player_already_substituted';
  END IF;

  v_team_a := array_replace(v_match.team_a, p_original_player_id, v_substitute_player_id);
  v_team_b := array_replace(v_match.team_b, p_original_player_id, v_substitute_player_id);
  v_booking := public.server_substitution_replace_booking_player(
    v_match.booking_reservations,
    p_original_player_id,
    v_substitute_player_id
  );

  UPDATE public.matches AS match_row
  SET
    team_a = v_team_a,
    team_b = v_team_b,
    booking_reservations = CASE
      WHEN match_row.court_reserved THEN v_booking
      ELSE match_row.booking_reservations
    END,
    booking_transfers = CASE
      WHEN match_row.court_reserved THEN public.server_substitution_build_booking_transfers(
        v_team_a || v_team_b,
        v_booking,
        match_row.booking_transfers
      )
      ELSE match_row.booking_transfers
    END,
    booking_updated_at = CASE
      WHEN match_row.court_reserved THEN now()
      ELSE match_row.booking_updated_at
    END
  WHERE match_row.id = p_match_id;

  INSERT INTO public.match_substitutions (
    league_id,
    season_id,
    match_id,
    original_player_id,
    substitute_player_id,
    substitution_type,
    created_by_user_id
  ) VALUES (
    v_match.league_id,
    v_match.season_id,
    p_match_id,
    p_original_player_id,
    v_substitute_player_id,
    'single',
    p_created_by_user_id
  );

  match_id := p_match_id;
  substitute_player_id := v_substitute_player_id;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.server_add_season_substitute(uuid, uuid, text, text, text)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.server_assign_match_substitute(uuid, uuid, uuid, text, text, text, uuid)
  FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.server_add_season_substitute(uuid, uuid, text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.server_assign_match_substitute(uuid, uuid, uuid, text, text, text, uuid)
  TO service_role;

COMMIT;
