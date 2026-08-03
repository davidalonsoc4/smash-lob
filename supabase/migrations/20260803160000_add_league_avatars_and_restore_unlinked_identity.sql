-- Add per-league avatars and preserve the identity that a player had before an account was linked.

ALTER TABLE public.league_memberships
  ADD COLUMN IF NOT EXISTS league_avatar_url text;

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS link_identity_snapshot jsonb;

-- Existing linked players cannot recover a name that was overwritten before this migration.
-- Keep their current name/initials as the recoverable baseline, but ensure unlinking
-- returns to the default avatar instead of retaining the linked account image.
UPDATE public.players AS player
SET
  link_identity_snapshot = jsonb_build_object(
    'displayName', player.display_name,
    'avatarInitials', player.avatar_initials,
    'avatarUrl', NULL
  ),
  avatar_url = NULL
FROM public.league_memberships AS membership
WHERE membership.player_id = player.id
  AND membership.league_id = player.league_id
  AND player.link_identity_snapshot IS NULL;

CREATE OR REPLACE FUNCTION public.server_sync_linked_player_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.app_users%ROWTYPE;
  v_display_name text;
  v_initials text;
  v_snapshot jsonb;
  v_should_sync boolean := false;
BEGIN
  -- A deleted membership releases its player immediately.
  IF TG_OP = 'DELETE' THEN
    IF OLD.player_id IS NOT NULL THEN
      SELECT player.link_identity_snapshot
      INTO v_snapshot
      FROM public.players AS player
      WHERE player.id = OLD.player_id
        AND player.league_id = OLD.league_id
      FOR UPDATE;

      UPDATE public.players AS player
      SET
        display_name = CASE
          WHEN v_snapshot IS NOT NULL
            THEN COALESCE(NULLIF(trim(v_snapshot->>'displayName'), ''), player.display_name)
          ELSE player.display_name
        END,
        avatar_initials = CASE
          WHEN v_snapshot IS NOT NULL
            THEN COALESCE(NULLIF(trim(v_snapshot->>'avatarInitials'), ''), player.avatar_initials)
          ELSE player.avatar_initials
        END,
        avatar_url = CASE
          WHEN v_snapshot IS NOT NULL AND v_snapshot ? 'avatarUrl'
            THEN NULLIF(v_snapshot->>'avatarUrl', '')
          ELSE NULL
        END,
        link_identity_snapshot = NULL
      WHERE player.id = OLD.player_id
        AND player.league_id = OLD.league_id;
    END IF;

    RETURN OLD;
  END IF;

  -- Reassigning a membership first restores the player that is being released.
  IF TG_OP = 'UPDATE'
     AND (
       OLD.player_id IS DISTINCT FROM NEW.player_id
       OR OLD.league_id IS DISTINCT FROM NEW.league_id
     )
     AND OLD.player_id IS NOT NULL THEN
    SELECT player.link_identity_snapshot
    INTO v_snapshot
    FROM public.players AS player
    WHERE player.id = OLD.player_id
      AND player.league_id = OLD.league_id
    FOR UPDATE;

    UPDATE public.players AS player
    SET
      display_name = CASE
        WHEN v_snapshot IS NOT NULL
          THEN COALESCE(NULLIF(trim(v_snapshot->>'displayName'), ''), player.display_name)
        ELSE player.display_name
      END,
      avatar_initials = CASE
        WHEN v_snapshot IS NOT NULL
          THEN COALESCE(NULLIF(trim(v_snapshot->>'avatarInitials'), ''), player.avatar_initials)
        ELSE player.avatar_initials
      END,
      avatar_url = CASE
        WHEN v_snapshot IS NOT NULL AND v_snapshot ? 'avatarUrl'
          THEN NULLIF(v_snapshot->>'avatarUrl', '')
        ELSE NULL
      END,
      link_identity_snapshot = NULL
    WHERE player.id = OLD.player_id
      AND player.league_id = OLD.league_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_should_sync := true;
  ELSIF TG_OP = 'UPDATE' THEN
    v_should_sync :=
      OLD.player_id IS DISTINCT FROM NEW.player_id
      OR OLD.user_id IS DISTINCT FROM NEW.user_id
      OR OLD.league_id IS DISTINCT FROM NEW.league_id;
  END IF;

  -- Capture the unlinked identity once, then show the linked account name.
  IF v_should_sync AND NEW.player_id IS NOT NULL THEN
    SELECT *
    INTO v_user
    FROM public.app_users AS app_user
    WHERE app_user.id = NEW.user_id;

    IF FOUND THEN
      v_display_name := NULLIF(trim(COALESCE(v_user.display_name, '')), '');

      IF v_display_name IS NULL THEN
        v_display_name := NULLIF(
          trim(COALESCE(v_user.first_name, '') || ' ' || COALESCE(v_user.last_name, '')),
          ''
        );
      END IF;

      v_initials := upper(
        left(trim(COALESCE(v_user.first_name, '')), 1)
        || left(trim(COALESCE(v_user.last_name, '')), 1)
      );

      UPDATE public.players AS player
      SET
        link_identity_snapshot = COALESCE(
          player.link_identity_snapshot,
          jsonb_build_object(
            'displayName', player.display_name,
            'avatarInitials', player.avatar_initials,
            'avatarUrl', player.avatar_url
          )
        ),
        display_name = COALESCE(v_display_name, player.display_name),
        avatar_initials = COALESCE(NULLIF(v_initials, ''), player.avatar_initials)
      WHERE player.id = NEW.player_id
        AND player.league_id = NEW.league_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS league_memberships_sync_linked_player_identity
  ON public.league_memberships;

CREATE TRIGGER league_memberships_sync_linked_player_identity
AFTER INSERT OR UPDATE OF user_id, league_id, player_id OR DELETE
ON public.league_memberships
FOR EACH ROW
EXECUTE FUNCTION public.server_sync_linked_player_identity();

REVOKE ALL ON FUNCTION public.server_sync_linked_player_identity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.server_sync_linked_player_identity() FROM anon;
REVOKE ALL ON FUNCTION public.server_sync_linked_player_identity() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.server_sync_linked_player_identity() TO service_role;

-- Keep self-registration compatible with the new identity model. Account images
-- remain account-level fallbacks; they are no longer copied into the player row.
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
      NULL
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
    avatar_initials = v_initials
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
