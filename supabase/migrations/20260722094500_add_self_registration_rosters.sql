-- v0.11.0: perfiles globales y plantillas de temporada por autoinscripción.

ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

UPDATE public.app_users
SET
  first_name = NULLIF(split_part(trim(COALESCE(display_name, '')), ' ', 1), ''),
  last_name = NULLIF(split_part(trim(COALESCE(display_name, '')), ' ', 2), '')
WHERE first_name IS NULL AND trim(COALESCE(display_name, '')) <> '';

ALTER TABLE public.season_settings
  ADD COLUMN IF NOT EXISTS roster_mode text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS player_capacity integer,
  ADD COLUMN IF NOT EXISTS registration_open boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS roster_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS schedule_mode text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS calendar_mode text NOT NULL DEFAULT 'balanced';

ALTER TABLE public.season_settings
  DROP CONSTRAINT IF EXISTS season_settings_roster_mode_check,
  ADD CONSTRAINT season_settings_roster_mode_check
    CHECK (roster_mode IN ('fixed', 'self_registration'));

ALTER TABLE public.season_settings
  DROP CONSTRAINT IF EXISTS season_settings_player_capacity_check,
  ADD CONSTRAINT season_settings_player_capacity_check
    CHECK (
      player_capacity IS NULL
      OR (player_capacity BETWEEN 4 AND 32 AND player_capacity % 4 = 0)
    );

ALTER TABLE public.season_settings
  DROP CONSTRAINT IF EXISTS season_settings_schedule_mode_check,
  ADD CONSTRAINT season_settings_schedule_mode_check
    CHECK (schedule_mode IN ('single', 'double', 'extended'));

ALTER TABLE public.season_settings
  DROP CONSTRAINT IF EXISTS season_settings_calendar_mode_check,
  ADD CONSTRAINT season_settings_calendar_mode_check
    CHECK (calendar_mode IN ('balanced', 'manual'));

UPDATE public.season_settings AS settings
SET player_capacity = counts.player_count
FROM (
  SELECT season_id, count(*)::integer AS player_count
  FROM public.season_players
  WHERE status = 'active'
  GROUP BY season_id
) AS counts
WHERE settings.season_id = counts.season_id
  AND settings.player_capacity IS NULL;

CREATE INDEX IF NOT EXISTS season_settings_open_registration_idx
  ON public.season_settings (league_id, registration_open)
  WHERE roster_mode = 'self_registration';

CREATE OR REPLACE FUNCTION public.server_update_user_profile(
  p_user_id uuid,
  p_first_name text,
  p_last_name text
)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  display_name text,
  profile_completed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name text := trim(COALESCE(p_first_name, ''));
  v_last_name text := trim(COALESCE(p_last_name, ''));
  v_display_name text;
  v_completed_at timestamptz := now();
BEGIN
  IF length(v_first_name) < 2 OR length(v_first_name) > 40 THEN
    RAISE EXCEPTION 'invalid_first_name';
  END IF;

  IF length(v_last_name) < 2 OR length(v_last_name) > 60 THEN
    RAISE EXCEPTION 'invalid_last_name';
  END IF;

  v_display_name := v_first_name || ' ' || v_last_name;

  UPDATE public.app_users AS app_user
  SET
    first_name = v_first_name,
    last_name = v_last_name,
    display_name = v_display_name,
    profile_completed_at = v_completed_at
  WHERE app_user.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  UPDATE public.players AS player
  SET
    display_name = v_display_name,
    avatar_initials = upper(left(v_first_name, 1) || left(v_last_name, 1))
  FROM public.league_memberships AS membership
  WHERE membership.user_id = p_user_id
    AND membership.player_id = player.id;

  RETURN QUERY
  SELECT p_user_id, v_first_name, v_last_name, v_display_name, v_completed_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.server_join_self_registration_season(
  p_user_id uuid,
  p_league_id uuid,
  p_season_id uuid
)
RETURNS TABLE (
  player_id uuid,
  registered_count integer,
  player_capacity integer,
  roster_complete boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.season_settings%ROWTYPE;
  v_season public.seasons%ROWTYPE;
  v_user public.app_users%ROWTYPE;
  v_membership public.league_memberships%ROWTYPE;
  v_membership_exists boolean := false;
  v_player_id uuid;
  v_count integer;
  v_display_name text;
  v_initials text;
  v_slug text;
  v_registration_fee jsonb;
  v_payments jsonb;
  v_is_creator boolean := false;
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

  IF NOT FOUND THEN
    RAISE EXCEPTION 'season_not_found';
  END IF;

  IF v_season.status <> 'upcoming' THEN
    RAISE EXCEPTION 'registration_closed';
  END IF;

  SELECT * INTO v_user
  FROM public.app_users AS app_user
  WHERE app_user.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_user.profile_completed_at IS NULL
     OR length(trim(COALESCE(v_user.first_name, ''))) < 2
     OR length(trim(COALESCE(v_user.last_name, ''))) < 2 THEN
    RAISE EXCEPTION 'profile_incomplete';
  END IF;

  v_display_name := trim(v_user.first_name) || ' ' || trim(v_user.last_name);
  v_initials := upper(left(trim(v_user.first_name), 1) || left(trim(v_user.last_name), 1));

  SELECT * INTO v_membership
  FROM public.league_memberships AS membership
  WHERE membership.user_id = p_user_id
    AND membership.league_id = p_league_id
  LIMIT 1
  FOR UPDATE;

  v_membership_exists := FOUND;

  IF v_membership_exists AND v_membership.player_id IS NOT NULL THEN
    v_player_id := v_membership.player_id;
    v_is_creator := v_membership.role = 'creator';
  ELSE
    v_slug := lower(regexp_replace(
      translate(v_display_name, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'),
      '[^a-zA-Z0-9]+', '-', 'g'
    ));
    v_slug := trim(both '-' FROM v_slug) || '-' || substr(gen_random_uuid()::text, 1, 8);

    INSERT INTO public.players (
      league_id,
      slug,
      display_name,
      avatar_initials,
      avatar_url
    ) VALUES (
      p_league_id,
      v_slug,
      v_display_name,
      v_initials,
      v_user.avatar_url
    )
    RETURNING id INTO v_player_id;

    IF v_membership_exists THEN
      v_is_creator := v_membership.role = 'creator';
      UPDATE public.league_memberships AS membership
      SET player_id = v_player_id
      WHERE membership.id = v_membership.id;
    ELSE
      INSERT INTO public.league_memberships (
        user_id,
        league_id,
        player_id,
        role
      ) VALUES (
        p_user_id,
        p_league_id,
        v_player_id,
        'player'
      );
    END IF;
  END IF;

  UPDATE public.players AS player
  SET
    display_name = v_display_name,
    avatar_initials = v_initials,
    avatar_url = COALESCE(v_user.avatar_url, player.avatar_url)
  WHERE player.id = v_player_id
    AND player.league_id = p_league_id;

  DELETE FROM public.league_spectators AS spectator
  WHERE spectator.league_id = p_league_id
    AND spectator.user_id = p_user_id;

  IF EXISTS (
    SELECT 1
    FROM public.season_players AS season_player
    WHERE season_player.season_id = p_season_id
      AND season_player.player_id = v_player_id
      AND season_player.status = 'active'
  ) THEN
    SELECT count(*)::integer INTO v_count
    FROM public.season_players AS season_player
    WHERE season_player.season_id = p_season_id
      AND season_player.status = 'active';

    RETURN QUERY SELECT
      v_player_id,
      v_count,
      v_settings.player_capacity,
      v_count >= v_settings.player_capacity;
    RETURN;
  END IF;

  IF NOT v_settings.registration_open THEN
    RAISE EXCEPTION 'registration_closed';
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.season_players AS season_player
  WHERE season_player.season_id = p_season_id
    AND season_player.status = 'active';

  IF v_count >= v_settings.player_capacity THEN
    RAISE EXCEPTION 'roster_full';
  END IF;

  INSERT INTO public.season_players (
    season_id,
    player_id,
    status,
    joined_from_round
  ) VALUES (
    p_season_id,
    v_player_id,
    'active',
    1
  );

  v_count := v_count + 1;
  v_registration_fee := COALESCE(v_settings.registration_fee, '{}'::jsonb);
  v_payments := COALESCE(v_registration_fee->'payments', '[]'::jsonb);

  IF NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_payments) AS payment
    WHERE payment->>'playerId' = v_player_id::text
  ) THEN
    v_payments := v_payments || jsonb_build_array(
      jsonb_build_object(
        'playerId', v_player_id,
        'isPaid', v_is_creator,
        'paidAt', CASE WHEN v_is_creator THEN now() ELSE NULL END
      )
    );
  END IF;

  UPDATE public.season_settings AS settings
  SET
    registration_fee = jsonb_set(v_registration_fee, '{payments}', v_payments, true),
    registration_open = v_count < settings.player_capacity,
    roster_completed_at = CASE
      WHEN v_count >= settings.player_capacity THEN COALESCE(settings.roster_completed_at, now())
      ELSE NULL
    END
  WHERE settings.season_id = p_season_id;

  RETURN QUERY SELECT
    v_player_id,
    v_count,
    v_settings.player_capacity,
    v_count >= v_settings.player_capacity;
END;
$$;

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

  SELECT * INTO v_target_membership
  FROM public.league_memberships AS membership
  WHERE membership.player_id = p_player_id
    AND membership.league_id = p_league_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'player_membership_not_found';
  END IF;

  IF NOT (
    COALESCE(p_actor_is_superuser, false)
    OR COALESCE(v_actor_membership.role IN ('creator', 'admin'), false)
    OR COALESCE(v_target_membership.user_id = p_actor_user_id, false)
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

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
  FROM jsonb_array_elements(COALESCE(v_registration_fee->'payments', '[]'::jsonb)) AS payment
  WHERE payment->>'playerId' <> p_player_id::text;

  UPDATE public.season_settings AS settings
  SET
    registration_fee = jsonb_set(v_registration_fee, '{payments}', v_payments, true),
    registration_open = true,
    roster_completed_at = NULL
  WHERE settings.season_id = p_season_id;

  RETURN QUERY SELECT v_count, v_settings.player_capacity;
END;
$$;


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

  IF EXISTS (SELECT 1 FROM public.matches AS match_row WHERE match_row.season_id = p_season_id) THEN
    RAISE EXCEPTION 'season_matches_already_exist';
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
       OR (SELECT count(DISTINCT participant_id) FROM unnest(v_team_a || v_team_b) AS participant(participant_id)) <> 4 THEN
      RAISE EXCEPTION 'invalid_match_participants';
    END IF;

    INSERT INTO public.matches (
      league_id, season_id, round, status, team_a, team_b,
      points_a, points_b, sets, scheduled_at, date_label, location,
      result_recorded_at, result_reported_by_player_id, result_locked
    ) VALUES (
      p_league_id, p_season_id, v_round, 'scheduling', v_team_a, v_team_b,
      NULL, NULL, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, false
    );
  END LOOP;

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

  RETURN QUERY SELECT p_season_id, v_season.total_rounds, v_registered_count;
END;
$$;

REVOKE ALL ON FUNCTION public.server_update_user_profile(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.server_join_self_registration_season(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.server_remove_self_registration_player(uuid, boolean, uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.server_start_self_registration_season(uuid, boolean, uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.server_update_user_profile(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.server_join_self_registration_season(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.server_remove_self_registration_player(uuid, boolean, uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.server_start_self_registration_season(uuid, boolean, uuid, uuid, jsonb) TO service_role;
