-- Protect league creators and administrators from removal during self-registration.
-- Only league creators, administrators, or the application superuser may free roster places.

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

REVOKE ALL ON FUNCTION public.server_remove_self_registration_player(uuid, boolean, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.server_remove_self_registration_player(uuid, boolean, uuid, uuid, uuid) TO service_role;
