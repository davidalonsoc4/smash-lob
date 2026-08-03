-- Remove the rejected per-league avatar model. User images remain global in
-- app_users.avatar_url, while linked players only preserve their historical
-- name and initials so unlinking always returns to the default initials avatar.

ALTER TABLE public.league_memberships
  DROP COLUMN IF EXISTS league_avatar_url;

UPDATE public.players AS player
SET link_identity_snapshot = jsonb_strip_nulls(
  jsonb_build_object(
    'displayName', NULLIF(trim(player.link_identity_snapshot->>'displayName'), ''),
    'avatarInitials', NULLIF(trim(player.link_identity_snapshot->>'avatarInitials'), '')
  )
)
WHERE player.link_identity_snapshot IS NOT NULL;

-- Images belong exclusively to app_users. Historical and unlinked players use
-- the default avatar generated from their initials.
UPDATE public.players
SET avatar_url = NULL
WHERE avatar_url IS NOT NULL;

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
  -- Releasing a player restores only the historical name and initials. Images
  -- belong to the account, so the player row always returns to its default avatar.
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
        avatar_url = NULL,
        link_identity_snapshot = NULL
      WHERE player.id = OLD.player_id
        AND player.league_id = OLD.league_id;
    END IF;

    RETURN OLD;
  END IF;

  -- Reassigning a membership first restores the historical identity of the
  -- player that is being released.
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
      avatar_url = NULL,
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

  -- Capture the unlinked historical identity once, then expose the linked
  -- account name. The account image remains only in app_users.avatar_url.
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
          jsonb_strip_nulls(
            jsonb_build_object(
              'displayName', NULLIF(trim(player.display_name), ''),
              'avatarInitials', NULLIF(trim(player.avatar_initials), '')
            )
          )
        ),
        display_name = COALESCE(v_display_name, player.display_name),
        avatar_initials = COALESCE(NULLIF(v_initials, ''), player.avatar_initials),
        avatar_url = NULL
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
