CREATE OR REPLACE FUNCTION public.server_join_self_registration_season_v2(
  p_user_id uuid,
  p_league_id uuid,
  p_season_id uuid,
  p_historical_player_id uuid
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
    IF p_historical_player_id IS NOT NULL
       AND p_historical_player_id <> v_membership.player_id THEN
      RAISE EXCEPTION 'historical_player_not_available';
    END IF;

    v_player_id := v_membership.player_id;
    v_is_creator := v_membership.role = 'creator';
  ELSIF p_historical_player_id IS NOT NULL THEN
    SELECT player.id INTO v_player_id
    FROM public.players AS player
    WHERE player.id = p_historical_player_id
      AND player.league_id = p_league_id
    FOR UPDATE;

    IF v_player_id IS NULL THEN
      RAISE EXCEPTION 'historical_player_not_available';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.league_memberships AS membership
      WHERE membership.league_id = p_league_id
        AND membership.player_id = v_player_id
    ) THEN
      RAISE EXCEPTION 'historical_player_not_available';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.season_players AS season_player
      JOIN public.seasons AS historical_season
        ON historical_season.id = season_player.season_id
      WHERE season_player.player_id = v_player_id
        AND historical_season.league_id = p_league_id
        AND historical_season.id <> p_season_id
        AND historical_season.status = 'finished'
    ) THEN
      RAISE EXCEPTION 'historical_player_not_available';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.season_players AS season_player
      WHERE season_player.season_id = p_season_id
        AND season_player.player_id = v_player_id
    ) THEN
      RAISE EXCEPTION 'historical_player_not_available';
    END IF;

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

REVOKE ALL ON FUNCTION public.server_join_self_registration_season_v2(uuid, uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.server_join_self_registration_season_v2(uuid, uuid, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.server_join_self_registration_season_v2(uuid, uuid, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.server_join_self_registration_season_v2(uuid, uuid, uuid, uuid) TO service_role;
