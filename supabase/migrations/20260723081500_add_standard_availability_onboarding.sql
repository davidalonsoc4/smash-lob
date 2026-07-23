ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS availability_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS standard_availability_timezone text NOT NULL DEFAULT 'Europe/Madrid',
  ADD COLUMN IF NOT EXISTS standard_availability_weekly_slots jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Existing users keep access without being forced through onboarding again.
UPDATE public.app_users
SET availability_completed_at = profile_completed_at
WHERE profile_completed_at IS NOT NULL
  AND availability_completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.server_update_user_profile(
  p_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_timezone text DEFAULT NULL,
  p_weekly_slots jsonb DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  display_name text,
  profile_completed_at timestamptz,
  availability_completed_at timestamptz,
  standard_availability_timezone text,
  standard_availability_weekly_slots jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name text := trim(COALESCE(p_first_name, ''));
  v_last_name text := trim(COALESCE(p_last_name, ''));
  v_display_name text;
  v_profile_completed_at timestamptz := now();
  v_availability_completed_at timestamptz;
  v_timezone text;
  v_weekly_slots jsonb;
  v_has_availability boolean := false;
  v_existing public.app_users%ROWTYPE;
BEGIN
  IF length(v_first_name) < 2 OR length(v_first_name) > 40 THEN
    RAISE EXCEPTION 'invalid_first_name';
  END IF;

  IF length(v_last_name) < 2 OR length(v_last_name) > 60 THEN
    RAISE EXCEPTION 'invalid_last_name';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.app_users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  v_timezone := trim(
    COALESCE(NULLIF(p_timezone, ''), v_existing.standard_availability_timezone, 'Europe/Madrid')
  );
  v_weekly_slots := COALESCE(
    p_weekly_slots,
    v_existing.standard_availability_weekly_slots,
    '{}'::jsonb
  );

  IF length(v_timezone) = 0 OR length(v_timezone) > 100 THEN
    RAISE EXCEPTION 'invalid_timezone';
  END IF;

  IF jsonb_typeof(v_weekly_slots) <> 'object' THEN
    RAISE EXCEPTION 'invalid_weekly_slots';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM jsonb_each(v_weekly_slots) AS weekday(day_key, slots)
    WHERE jsonb_typeof(slots) = 'array'
      AND jsonb_array_length(slots) > 0
  )
  INTO v_has_availability;

  IF v_existing.availability_completed_at IS NULL AND NOT v_has_availability THEN
    RAISE EXCEPTION 'standard_availability_required';
  END IF;

  v_availability_completed_at := COALESCE(
    v_existing.availability_completed_at,
    CASE WHEN v_has_availability THEN now() ELSE NULL END
  );
  v_display_name := v_first_name || ' ' || v_last_name;

  UPDATE public.app_users AS app_user
  SET
    first_name = v_first_name,
    last_name = v_last_name,
    display_name = v_display_name,
    profile_completed_at = v_profile_completed_at,
    availability_completed_at = v_availability_completed_at,
    standard_availability_timezone = v_timezone,
    standard_availability_weekly_slots = v_weekly_slots
  WHERE app_user.id = p_user_id;

  UPDATE public.players AS player
  SET
    display_name = v_display_name,
    avatar_initials = upper(left(v_first_name, 1) || left(v_last_name, 1))
  FROM public.league_memberships AS membership
  WHERE membership.user_id = p_user_id
    AND membership.player_id = player.id;

  IF v_availability_completed_at IS NOT NULL THEN
    INSERT INTO public.player_availability (
      league_id,
      season_id,
      player_id,
      user_id,
      timezone,
      weekly_slots,
      date_overrides,
      updated_at
    )
    SELECT
      membership.league_id,
      season_player.season_id,
      membership.player_id,
      p_user_id,
      v_timezone,
      v_weekly_slots,
      '{}'::jsonb,
      now()
    FROM public.league_memberships AS membership
    JOIN public.season_players AS season_player
      ON season_player.player_id = membership.player_id
    JOIN public.seasons AS season
      ON season.id = season_player.season_id
     AND season.league_id = membership.league_id
    WHERE membership.user_id = p_user_id
      AND membership.player_id IS NOT NULL
    ON CONFLICT (league_id, season_id, player_id) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT
    p_user_id,
    v_first_name,
    v_last_name,
    v_display_name,
    v_profile_completed_at,
    v_availability_completed_at,
    v_timezone,
    v_weekly_slots;
END;
$$;

CREATE OR REPLACE FUNCTION public.server_seed_standard_player_availability(
  p_league_id uuid,
  p_season_id uuid,
  p_player_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_timezone text;
  v_weekly_slots jsonb;
  v_availability_completed_at timestamptz;
BEGIN
  SELECT
    membership.user_id,
    app_user.standard_availability_timezone,
    app_user.standard_availability_weekly_slots,
    app_user.availability_completed_at
  INTO
    v_user_id,
    v_timezone,
    v_weekly_slots,
    v_availability_completed_at
  FROM public.league_memberships AS membership
  JOIN public.app_users AS app_user
    ON app_user.id = membership.user_id
  WHERE membership.league_id = p_league_id
    AND membership.player_id = p_player_id
  LIMIT 1;

  IF v_user_id IS NULL OR v_availability_completed_at IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.player_availability (
    league_id,
    season_id,
    player_id,
    user_id,
    timezone,
    weekly_slots,
    date_overrides,
    updated_at
  )
  VALUES (
    p_league_id,
    p_season_id,
    p_player_id,
    v_user_id,
    COALESCE(NULLIF(v_timezone, ''), 'Europe/Madrid'),
    COALESCE(v_weekly_slots, '{}'::jsonb),
    '{}'::jsonb,
    now()
  )
  ON CONFLICT (league_id, season_id, player_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_standard_availability_from_season_player()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_league_id uuid;
BEGIN
  SELECT league_id
  INTO v_league_id
  FROM public.seasons
  WHERE id = NEW.season_id;

  IF v_league_id IS NOT NULL THEN
    PERFORM public.server_seed_standard_player_availability(
      v_league_id,
      NEW.season_id,
      NEW.player_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS season_players_seed_standard_availability
  ON public.season_players;

CREATE TRIGGER season_players_seed_standard_availability
AFTER INSERT OR UPDATE OF player_id, season_id
ON public.season_players
FOR EACH ROW
EXECUTE FUNCTION public.seed_standard_availability_from_season_player();

CREATE OR REPLACE FUNCTION public.seed_standard_availability_from_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_player record;
BEGIN
  IF NEW.player_id IS NULL THEN
    RETURN NEW;
  END IF;

  FOR v_season_player IN
    SELECT season_player.season_id
    FROM public.season_players AS season_player
    JOIN public.seasons AS season
      ON season.id = season_player.season_id
    WHERE season.league_id = NEW.league_id
      AND season_player.player_id = NEW.player_id
  LOOP
    PERFORM public.server_seed_standard_player_availability(
      NEW.league_id,
      v_season_player.season_id,
      NEW.player_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS league_memberships_seed_standard_availability
  ON public.league_memberships;

CREATE TRIGGER league_memberships_seed_standard_availability
AFTER INSERT OR UPDATE OF player_id, user_id
ON public.league_memberships
FOR EACH ROW
EXECUTE FUNCTION public.seed_standard_availability_from_membership();

REVOKE ALL ON FUNCTION public.server_update_user_profile(uuid, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.server_seed_standard_player_availability(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_standard_availability_from_season_player() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_standard_availability_from_membership() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.server_update_user_profile(uuid, text, text, text, jsonb) TO service_role;
