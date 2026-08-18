-- Prepare scheduled self-registration calendars before the public season start.
-- Admins can inspect the full calendar while the season remains `upcoming`.
-- The same calendar is reused when scheduled_start_at is reached; it is never duplicated.

CREATE OR REPLACE FUNCTION public.server_prepare_self_registration_season_calendar(
  p_actor_user_id uuid,
  p_actor_is_superuser boolean,
  p_league_id uuid,
  p_season_id uuid,
  p_matches jsonb
)
RETURNS TABLE (
  season_id uuid,
  registered_count integer,
  match_count integer,
  prepared boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.season_settings%ROWTYPE;
  v_season public.seasons%ROWTYPE;
  v_membership public.league_memberships%ROWTYPE;
  v_registered_count integer;
  v_expected_matches integer;
  v_existing_matches integer;
  v_match jsonb;
  v_round integer;
  v_team_a uuid[];
  v_team_b uuid[];
BEGIN
  SELECT * INTO v_membership
  FROM public.league_memberships AS membership
  WHERE membership.user_id = p_actor_user_id
    AND membership.league_id = p_league_id
  LIMIT 1;

  IF NOT COALESCE(p_actor_is_superuser, false)
     AND (NOT FOUND OR v_membership.role NOT IN ('creator', 'admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_settings
  FROM public.season_settings AS settings
  WHERE settings.season_id = p_season_id
    AND settings.league_id = p_league_id
  FOR UPDATE;

  IF NOT FOUND OR v_settings.roster_mode <> 'self_registration' THEN
    RAISE EXCEPTION 'self_registration_not_enabled';
  END IF;

  IF v_settings.scheduled_start_at IS NULL THEN
    RAISE EXCEPTION 'season_not_scheduled';
  END IF;

  SELECT * INTO v_season
  FROM public.seasons AS season
  WHERE season.id = p_season_id
    AND season.league_id = p_league_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'season_not_found';
  END IF;

  IF v_season.status <> 'upcoming' THEN
    RAISE EXCEPTION 'season_prepare_not_allowed';
  END IF;

  SELECT count(*)::integer INTO v_registered_count
  FROM public.season_players AS season_player
  WHERE season_player.season_id = p_season_id
    AND season_player.status = 'active';

  IF v_settings.player_capacity IS NULL
     OR v_registered_count <> v_settings.player_capacity THEN
    RAISE EXCEPTION 'roster_incomplete';
  END IF;

  IF jsonb_typeof(COALESCE(p_matches, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'invalid_matches_payload';
  END IF;

  SELECT count(*)::integer INTO v_expected_matches
  FROM jsonb_array_elements(COALESCE(p_matches, '[]'::jsonb));

  IF v_expected_matches < 1 THEN
    RAISE EXCEPTION 'empty_calendar';
  END IF;

  SELECT count(*)::integer INTO v_existing_matches
  FROM public.matches AS match_row
  WHERE match_row.season_id = p_season_id;

  IF v_existing_matches > 0 THEN
    IF v_existing_matches <> v_expected_matches
       OR EXISTS (
         SELECT 1
         FROM public.matches AS match_row
         WHERE match_row.season_id = p_season_id
           AND (
             cardinality(match_row.team_a) <> 2
             OR cardinality(match_row.team_b) <> 2
             OR (
               SELECT count(DISTINCT participant_id)
               FROM unnest(match_row.team_a || match_row.team_b)
                 AS participant(participant_id)
             ) <> 4
             OR EXISTS (
               SELECT 1
               FROM unnest(match_row.team_a || match_row.team_b)
                 AS participant(player_id)
               LEFT JOIN public.season_players AS season_player
                 ON season_player.season_id = p_season_id
                AND season_player.player_id = participant.player_id
                AND season_player.status = 'active'
               WHERE season_player.player_id IS NULL
             )
           )
       ) THEN
      RAISE EXCEPTION 'season_calendar_invalid';
    END IF;

    UPDATE public.season_settings AS settings
    SET
      registration_open = false,
      roster_completed_at = COALESCE(settings.roster_completed_at, now())
    WHERE settings.season_id = p_season_id;

    RETURN QUERY
    SELECT p_season_id, v_registered_count, v_existing_matches, false;
    RETURN;
  END IF;

  FOR v_match IN
    SELECT value FROM jsonb_array_elements(p_matches)
  LOOP
    v_round := NULLIF(v_match->>'round', '')::integer;

    SELECT COALESCE(array_agg(value::uuid ORDER BY ordinality), '{}'::uuid[])
      INTO v_team_a
    FROM jsonb_array_elements_text(COALESCE(v_match->'teamA', '[]'::jsonb))
      WITH ORDINALITY AS team(value, ordinality);

    SELECT COALESCE(array_agg(value::uuid ORDER BY ordinality), '{}'::uuid[])
      INTO v_team_b
    FROM jsonb_array_elements_text(COALESCE(v_match->'teamB', '[]'::jsonb))
      WITH ORDINALITY AS team(value, ordinality);

    IF v_round IS NULL
       OR cardinality(v_team_a) <> 2
       OR cardinality(v_team_b) <> 2
       OR EXISTS (
         SELECT 1
         FROM unnest(v_team_a || v_team_b) AS participant(player_id)
         LEFT JOIN public.season_players AS season_player
           ON season_player.season_id = p_season_id
          AND season_player.player_id = participant.player_id
          AND season_player.status = 'active'
         WHERE season_player.player_id IS NULL
       )
       OR (
         SELECT count(DISTINCT participant_id)
         FROM unnest(v_team_a || v_team_b) AS participant(participant_id)
       ) <> 4 THEN
      RAISE EXCEPTION 'invalid_match_participants';
    END IF;

    INSERT INTO public.matches (
      league_id,
      season_id,
      round,
      status,
      team_a,
      team_b,
      points_a,
      points_b,
      sets,
      scheduled_at,
      date_label,
      location,
      result_recorded_at,
      result_reported_by_player_id,
      result_locked
    ) VALUES (
      p_league_id,
      p_season_id,
      v_round,
      'scheduling',
      v_team_a,
      v_team_b,
      NULL,
      NULL,
      '[]'::jsonb,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      false
    );
  END LOOP;

  UPDATE public.season_settings AS settings
  SET
    registration_open = false,
    roster_completed_at = COALESCE(settings.roster_completed_at, now())
  WHERE settings.season_id = p_season_id;

  RETURN QUERY
  SELECT p_season_id, v_registered_count, v_expected_matches, true;
END;
$$;

-- If the roster changes before the scheduled start, any prepared calendar is invalid.
-- Remove it transactionally so a new one is generated as soon as the roster is complete again.
CREATE OR REPLACE FUNCTION public.server_remove_self_registration_player(
  p_actor_user_id uuid,
  p_actor_is_superuser boolean,
  p_league_id uuid,
  p_season_id uuid,
  p_player_id uuid
)
RETURNS TABLE (
  registered_count integer,
  player_capacity integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.season_settings%ROWTYPE;
  v_season public.seasons%ROWTYPE;
  v_actor_membership public.league_memberships%ROWTYPE;
  v_target_membership public.league_memberships%ROWTYPE;
  v_count integer;
  v_registration_fee jsonb;
  v_payments jsonb;
BEGIN
  SELECT * INTO v_settings
  FROM public.season_settings AS settings
  WHERE settings.season_id = p_season_id
    AND settings.league_id = p_league_id
  FOR UPDATE;

  IF NOT FOUND OR v_settings.roster_mode <> 'self_registration' THEN
    RAISE EXCEPTION 'self_registration_not_enabled';
  END IF;

  SELECT * INTO v_season
  FROM public.seasons AS season
  WHERE season.id = p_season_id
    AND season.league_id = p_league_id
  FOR UPDATE;

  IF NOT FOUND OR v_season.status <> 'upcoming' THEN
    RAISE EXCEPTION 'registration_change_not_allowed';
  END IF;

  SELECT * INTO v_actor_membership
  FROM public.league_memberships AS membership
  WHERE membership.user_id = p_actor_user_id
    AND membership.league_id = p_league_id
  LIMIT 1;

  IF NOT (
    COALESCE(p_actor_is_superuser, false)
    OR COALESCE(v_actor_membership.role IN ('creator', 'admin'), false)
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_target_membership
  FROM public.league_memberships AS membership
  WHERE membership.player_id = p_player_id
    AND membership.league_id = p_league_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'player_membership_not_found';
  END IF;

  IF v_target_membership.role IN ('creator', 'admin') THEN
    RAISE EXCEPTION 'protected_league_manager';
  END IF;

  DELETE FROM public.matches AS match_row
  WHERE match_row.season_id = p_season_id;

  DELETE FROM public.season_players AS season_player
  WHERE season_player.season_id = p_season_id
    AND season_player.player_id = p_player_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'season_player_not_found';
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.season_players AS season_player
  WHERE season_player.season_id = p_season_id
    AND season_player.status = 'active';

  v_registration_fee := COALESCE(v_settings.registration_fee, '{}'::jsonb);

  SELECT COALESCE(jsonb_agg(payment), '[]'::jsonb) INTO v_payments
  FROM jsonb_array_elements(
    COALESCE(v_registration_fee->'payments', '[]'::jsonb)
  ) AS payment
  WHERE payment->>'playerId' <> p_player_id::text;

  UPDATE public.season_settings AS settings
  SET
    registration_fee = jsonb_set(
      v_registration_fee,
      '{payments}',
      v_payments,
      true
    ),
    registration_open = true,
    roster_completed_at = NULL
  WHERE settings.season_id = p_season_id;

  RETURN QUERY SELECT v_count, v_settings.player_capacity;
END;
$$;

-- Starting a self-registration season now reuses a calendar prepared while it was upcoming.
-- If no prepared calendar exists (for an unscheduled/manual-start flow), the RPC still creates it.
CREATE OR REPLACE FUNCTION public.server_start_self_registration_season(
  p_actor_user_id uuid,
  p_actor_is_superuser boolean,
  p_league_id uuid,
  p_season_id uuid,
  p_matches jsonb
)
RETURNS TABLE (
  season_id uuid,
  total_rounds integer,
  registered_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.season_settings%ROWTYPE;
  v_season public.seasons%ROWTYPE;
  v_membership public.league_memberships%ROWTYPE;
  v_registered_count integer;
  v_expected_matches integer;
  v_existing_matches integer;
  v_match jsonb;
  v_round integer;
  v_team_a uuid[];
  v_team_b uuid[];
BEGIN
  SELECT * INTO v_membership
  FROM public.league_memberships AS membership
  WHERE membership.user_id = p_actor_user_id
    AND membership.league_id = p_league_id
  LIMIT 1;

  IF NOT COALESCE(p_actor_is_superuser, false)
     AND (NOT FOUND OR v_membership.role NOT IN ('creator', 'admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_settings
  FROM public.season_settings AS settings
  WHERE settings.season_id = p_season_id
    AND settings.league_id = p_league_id
  FOR UPDATE;

  IF NOT FOUND OR v_settings.roster_mode <> 'self_registration' THEN
    RAISE EXCEPTION 'self_registration_not_enabled';
  END IF;

  SELECT * INTO v_season
  FROM public.seasons AS season
  WHERE season.id = p_season_id
    AND season.league_id = p_league_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'season_not_found';
  END IF;

  IF v_season.status <> 'upcoming' THEN
    RAISE EXCEPTION 'season_start_not_allowed';
  END IF;

  SELECT count(*)::integer INTO v_registered_count
  FROM public.season_players AS season_player
  WHERE season_player.season_id = p_season_id
    AND season_player.status = 'active';

  IF v_settings.player_capacity IS NULL
     OR v_registered_count <> v_settings.player_capacity THEN
    RAISE EXCEPTION 'roster_incomplete';
  END IF;

  IF COALESCE((v_settings.registration_fee->>'enabled')::boolean, false)
     AND COALESCE((v_settings.registration_fee->>'amount')::numeric, 0) > 0
     AND EXISTS (
       SELECT 1
       FROM public.season_players AS season_player
       WHERE season_player.season_id = p_season_id
         AND season_player.status = 'active'
         AND NOT EXISTS (
           SELECT 1
           FROM jsonb_array_elements(
             COALESCE(v_settings.registration_fee->'payments', '[]'::jsonb)
           ) AS payment
           WHERE payment->>'playerId' = season_player.player_id::text
             AND COALESCE((payment->>'isPaid')::boolean, false)
         )
     ) THEN
    RAISE EXCEPTION 'registration_unsettled';
  END IF;

  IF jsonb_typeof(COALESCE(p_matches, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'invalid_matches_payload';
  END IF;

  SELECT count(*)::integer INTO v_expected_matches
  FROM jsonb_array_elements(COALESCE(p_matches, '[]'::jsonb));

  IF v_expected_matches < 1 THEN
    RAISE EXCEPTION 'empty_calendar';
  END IF;

  SELECT count(*)::integer INTO v_existing_matches
  FROM public.matches AS match_row
  WHERE match_row.season_id = p_season_id;

  IF v_existing_matches > 0 THEN
    IF v_existing_matches <> v_expected_matches
       OR EXISTS (
         SELECT 1
         FROM public.matches AS match_row
         WHERE match_row.season_id = p_season_id
           AND (
             cardinality(match_row.team_a) <> 2
             OR cardinality(match_row.team_b) <> 2
             OR (
               SELECT count(DISTINCT participant_id)
               FROM unnest(match_row.team_a || match_row.team_b)
                 AS participant(participant_id)
             ) <> 4
             OR EXISTS (
               SELECT 1
               FROM unnest(match_row.team_a || match_row.team_b)
                 AS participant(player_id)
               LEFT JOIN public.season_players AS season_player
                 ON season_player.season_id = p_season_id
                AND season_player.player_id = participant.player_id
                AND season_player.status = 'active'
               WHERE season_player.player_id IS NULL
             )
           )
       ) THEN
      RAISE EXCEPTION 'season_calendar_invalid';
    END IF;
  ELSE
    FOR v_match IN
      SELECT value FROM jsonb_array_elements(p_matches)
    LOOP
      v_round := NULLIF(v_match->>'round', '')::integer;

      SELECT COALESCE(array_agg(value::uuid ORDER BY ordinality), '{}'::uuid[])
        INTO v_team_a
      FROM jsonb_array_elements_text(COALESCE(v_match->'teamA', '[]'::jsonb))
        WITH ORDINALITY AS team(value, ordinality);

      SELECT COALESCE(array_agg(value::uuid ORDER BY ordinality), '{}'::uuid[])
        INTO v_team_b
      FROM jsonb_array_elements_text(COALESCE(v_match->'teamB', '[]'::jsonb))
        WITH ORDINALITY AS team(value, ordinality);

      IF v_round IS NULL
         OR cardinality(v_team_a) <> 2
         OR cardinality(v_team_b) <> 2
         OR EXISTS (
           SELECT 1
           FROM unnest(v_team_a || v_team_b) AS participant(player_id)
           LEFT JOIN public.season_players AS season_player
             ON season_player.season_id = p_season_id
            AND season_player.player_id = participant.player_id
            AND season_player.status = 'active'
           WHERE season_player.player_id IS NULL
         )
         OR (
           SELECT count(DISTINCT participant_id)
           FROM unnest(v_team_a || v_team_b) AS participant(participant_id)
         ) <> 4 THEN
        RAISE EXCEPTION 'invalid_match_participants';
      END IF;

      INSERT INTO public.matches (
        league_id,
        season_id,
        round,
        status,
        team_a,
        team_b,
        points_a,
        points_b,
        sets,
        scheduled_at,
        date_label,
        location,
        result_recorded_at,
        result_reported_by_player_id,
        result_locked
      ) VALUES (
        p_league_id,
        p_season_id,
        v_round,
        'scheduling',
        v_team_a,
        v_team_b,
        NULL,
        NULL,
        '[]'::jsonb,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        false
      );
    END LOOP;
  END IF;

  UPDATE public.seasons AS season
  SET status = 'finished'
  WHERE season.league_id = p_league_id
    AND season.status = 'active'
    AND season.id <> p_season_id;

  UPDATE public.seasons AS season
  SET status = 'active'
  WHERE season.id = p_season_id
    AND season.league_id = p_league_id;

  UPDATE public.leagues AS league
  SET active_season_id = p_season_id
  WHERE league.id = p_league_id;

  UPDATE public.season_settings AS settings
  SET
    registration_open = false,
    roster_completed_at = COALESCE(settings.roster_completed_at, now())
  WHERE settings.season_id = p_season_id;

  RETURN QUERY
  SELECT p_season_id, v_season.total_rounds, v_registered_count;
END;
$$;

REVOKE ALL ON FUNCTION public.server_prepare_self_registration_season_calendar(uuid, boolean, uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.server_prepare_self_registration_season_calendar(uuid, boolean, uuid, uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.server_prepare_self_registration_season_calendar(uuid, boolean, uuid, uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.server_prepare_self_registration_season_calendar(uuid, boolean, uuid, uuid, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.server_remove_self_registration_player(uuid, boolean, uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.server_remove_self_registration_player(uuid, boolean, uuid, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.server_remove_self_registration_player(uuid, boolean, uuid, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.server_remove_self_registration_player(uuid, boolean, uuid, uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.server_start_self_registration_season(uuid, boolean, uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.server_start_self_registration_season(uuid, boolean, uuid, uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.server_start_self_registration_season(uuid, boolean, uuid, uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.server_start_self_registration_season(uuid, boolean, uuid, uuid, jsonb) TO service_role;
