-- v1.8.0: la disponibilidad pasa a ser una ayuda opcional por temporada.
ALTER TABLE public.season_settings
  ADD COLUMN IF NOT EXISTS availability_recommendations_enabled boolean NOT NULL DEFAULT false;

-- El perfil global ya no obliga a rellenar disponibilidad habitual.
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
