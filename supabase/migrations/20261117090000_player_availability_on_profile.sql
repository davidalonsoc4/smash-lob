-- La disponibilidad pasa a ser del jugador (cuenta o perfil) y no de cada liga/temporada.
-- Cuentas: app_users.standard_availability_*. Jugadores sin cuenta vinculada: players.availability_*.
-- La tabla por liga (player_availability) NO se borra: queda como copia de seguridad de solo lectura.

ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS standard_availability_date_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS availability_timezone text,
  ADD COLUMN IF NOT EXISTS availability_weekly_slots jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS availability_date_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS availability_updated_at timestamptz;

-- Auxiliar local a esta migración: ¿el objeto {clave: [franjas]} tiene alguna franja?
CREATE OR REPLACE FUNCTION public.migration_availability_has_slots(p_value jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_value IS NULL OR jsonb_typeof(p_value) <> 'object' THEN false
    ELSE EXISTS (
      SELECT 1
      FROM jsonb_each(p_value) AS entry(key, slots)
      WHERE jsonb_typeof(slots) = 'array'
        AND jsonb_array_length(slots) > 0
    )
  END
$$;

-- 1) Cuentas: se conserva lo que ya tuvieran en el perfil; si no tenían nada, se copia la
--    disponibilidad por liga más reciente que tenga franjas.
WITH owned AS (
  SELECT
    COALESCE(availability.user_id, membership.user_id) AS user_id,
    availability.timezone,
    availability.weekly_slots,
    availability.date_overrides,
    availability.updated_at
  FROM public.player_availability AS availability
  LEFT JOIN public.league_memberships AS membership
    ON membership.player_id = availability.player_id
   AND membership.league_id = availability.league_id
),
latest_weekly AS (
  SELECT DISTINCT ON (user_id) user_id, timezone, weekly_slots
  FROM owned
  WHERE user_id IS NOT NULL
    AND public.migration_availability_has_slots(weekly_slots)
  ORDER BY user_id, updated_at DESC NULLS LAST
)
UPDATE public.app_users AS app_user
SET
  standard_availability_timezone = COALESCE(NULLIF(latest.timezone, ''), app_user.standard_availability_timezone),
  standard_availability_weekly_slots = latest.weekly_slots,
  availability_completed_at = COALESCE(app_user.availability_completed_at, now())
FROM latest_weekly AS latest
WHERE app_user.id = latest.user_id
  AND NOT public.migration_availability_has_slots(app_user.standard_availability_weekly_slots);

WITH owned AS (
  SELECT
    COALESCE(availability.user_id, membership.user_id) AS user_id,
    availability.date_overrides,
    availability.updated_at
  FROM public.player_availability AS availability
  LEFT JOIN public.league_memberships AS membership
    ON membership.player_id = availability.player_id
   AND membership.league_id = availability.league_id
),
latest_overrides AS (
  SELECT DISTINCT ON (user_id) user_id, date_overrides
  FROM owned
  WHERE user_id IS NOT NULL
    AND public.migration_availability_has_slots(date_overrides)
  ORDER BY user_id, updated_at DESC NULLS LAST
)
UPDATE public.app_users AS app_user
SET standard_availability_date_overrides = latest.date_overrides
FROM latest_overrides AS latest
WHERE app_user.id = latest.user_id
  AND NOT public.migration_availability_has_slots(app_user.standard_availability_date_overrides);

-- 2) Jugadores sin cuenta vinculada: la disponibilidad pasa al propio jugador.
WITH latest_player AS (
  SELECT DISTINCT ON (availability.player_id)
    availability.player_id,
    availability.timezone,
    availability.weekly_slots,
    availability.date_overrides,
    availability.updated_at
  FROM public.player_availability AS availability
  WHERE (
      public.migration_availability_has_slots(availability.weekly_slots)
      OR public.migration_availability_has_slots(availability.date_overrides)
    )
    AND availability.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.league_memberships AS membership
      WHERE membership.player_id = availability.player_id
        AND membership.user_id IS NOT NULL
    )
  ORDER BY availability.player_id, availability.updated_at DESC NULLS LAST
)
UPDATE public.players AS player
SET
  availability_timezone = latest.timezone,
  availability_weekly_slots = COALESCE(latest.weekly_slots, '{}'::jsonb),
  availability_date_overrides = COALESCE(latest.date_overrides, '{}'::jsonb),
  availability_updated_at = latest.updated_at
FROM latest_player AS latest
WHERE player.id = latest.player_id
  AND NOT public.migration_availability_has_slots(player.availability_weekly_slots);

DROP FUNCTION public.migration_availability_has_slots(jsonb);

-- 3) Se deja de copiar el perfil a cada temporada: ya no existe disponibilidad por liga.
DROP TRIGGER IF EXISTS season_players_seed_standard_availability ON public.season_players;
DROP TRIGGER IF EXISTS league_memberships_seed_standard_availability ON public.league_memberships;
DROP FUNCTION IF EXISTS public.seed_standard_availability_from_season_player();
DROP FUNCTION IF EXISTS public.seed_standard_availability_from_membership();
DROP FUNCTION IF EXISTS public.server_seed_standard_player_availability(uuid, uuid, uuid);

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

REVOKE ALL ON FUNCTION public.server_update_user_profile(uuid, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.server_update_user_profile(uuid, text, text, text, jsonb) TO service_role;

COMMENT ON TABLE public.player_availability IS
  'Legado: disponibilidad por liga/temporada anterior. La disponibilidad vigente vive en app_users y players. Solo lectura.';
