ALTER TABLE public.rapid_tournament_players
  ADD COLUMN user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX rapid_tournament_players_user_idx
  ON public.rapid_tournament_players (tournament_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE public.rapid_tournament_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  player_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz NOT NULL,
  claimed_by_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tournament_id, player_id)
    REFERENCES public.rapid_tournament_players(tournament_id, id) ON DELETE CASCADE,
  CHECK ((claimed_by_user_id IS NULL) = (claimed_at IS NULL))
);

CREATE INDEX rapid_tournament_invites_tournament_idx
  ON public.rapid_tournament_invites (tournament_id, created_at DESC);
CREATE UNIQUE INDEX rapid_tournament_invites_one_active_player_idx
  ON public.rapid_tournament_invites (tournament_id, player_id)
  WHERE claimed_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.rapid_tournament_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rapid_tournament_invites FROM anon, authenticated;
GRANT ALL ON TABLE public.rapid_tournament_invites TO service_role;

CREATE FUNCTION public.create_rapid_tournament_with_accounts(
  p_creator_user_id uuid,
  p_name text,
  p_description text,
  p_starts_at timestamptz,
  p_court_one_name text,
  p_court_two_name text,
  p_shuffled_names text[],
  p_shuffled_user_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_shuffled_user_ids IS NULL OR cardinality(p_shuffled_user_ids) <> 12 THEN
    RAISE EXCEPTION 'invalid_player_accounts';
  END IF;
  IF (SELECT count(DISTINCT user_id) FROM unnest(p_shuffled_user_ids) AS input(user_id) WHERE user_id IS NOT NULL)
      <> (SELECT count(user_id) FROM unnest(p_shuffled_user_ids) AS input(user_id) WHERE user_id IS NOT NULL) THEN
    RAISE EXCEPTION 'duplicate_player_accounts';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(p_shuffled_user_ids) AS input(user_id)
    WHERE user_id IS NOT NULL AND (
      NOT EXISTS (SELECT 1 FROM public.app_users u WHERE u.id = input.user_id AND u.suspended_at IS NULL)
      OR NOT EXISTS (
        SELECT 1 FROM public.league_memberships candidate
        JOIN public.league_memberships organizer ON organizer.league_id = candidate.league_id
        WHERE candidate.user_id = input.user_id AND candidate.player_id IS NOT NULL
          AND organizer.user_id = p_creator_user_id AND organizer.player_id IS NOT NULL
      )
    )
  ) THEN RAISE EXCEPTION 'ineligible_player_account'; END IF;

  v_id := public.create_rapid_tournament(
    p_creator_user_id, p_name, p_description, p_starts_at,
    p_court_one_name, p_court_two_name, p_shuffled_names
  );
  UPDATE public.rapid_tournament_players player
  SET user_id = input.user_id
  FROM unnest(p_shuffled_user_ids) WITH ORDINALITY AS input(user_id, ordinal)
  WHERE player.tournament_id = v_id
    AND player.slot = chr(64 + input.ordinal::int)::char(1);
  RETURN v_id;
END;
$$;

CREATE FUNCTION public.reroll_rapid_tournament_with_accounts(
  p_tournament_id uuid,
  p_creator_user_id uuid,
  p_shuffled_names text[],
  p_shuffled_user_ids uuid[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_names text[];
BEGIN
  PERFORM 1 FROM public.rapid_tournaments
  WHERE id = p_tournament_id AND created_by_user_id = p_creator_user_id AND status = 'draft'
  FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF p_shuffled_names IS NULL OR cardinality(p_shuffled_names) <> 12
    OR p_shuffled_user_ids IS NULL OR cardinality(p_shuffled_user_ids) <> 12 THEN
    RAISE EXCEPTION 'invalid_player_count';
  END IF;
  SELECT array_agg(btrim(regexp_replace(name, '\s+', ' ', 'g')) ORDER BY ordinal)
    INTO v_names FROM unnest(p_shuffled_names) WITH ORDINALITY AS input(name, ordinal);
  IF EXISTS (SELECT 1 FROM unnest(v_names) AS input(name) WHERE name = '' OR length(name) > 80)
    OR (SELECT count(DISTINCT lower(name)) FROM unnest(v_names) AS input(name)) <> 12 THEN
    RAISE EXCEPTION 'invalid_player_names';
  END IF;
  IF (SELECT count(DISTINCT user_id) FROM unnest(p_shuffled_user_ids) AS input(user_id) WHERE user_id IS NOT NULL)
      <> (SELECT count(user_id) FROM unnest(p_shuffled_user_ids) AS input(user_id) WHERE user_id IS NOT NULL) THEN
    RAISE EXCEPTION 'duplicate_player_accounts';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(p_shuffled_user_ids) AS input(user_id)
    WHERE user_id IS NOT NULL AND (
      NOT EXISTS (SELECT 1 FROM public.app_users u WHERE u.id = input.user_id AND u.suspended_at IS NULL)
      OR NOT EXISTS (
        SELECT 1 FROM public.league_memberships candidate
        JOIN public.league_memberships organizer ON organizer.league_id = candidate.league_id
        WHERE candidate.user_id = input.user_id AND candidate.player_id IS NOT NULL
          AND organizer.user_id = p_creator_user_id AND organizer.player_id IS NOT NULL
      )
    )
  ) THEN RAISE EXCEPTION 'ineligible_player_account'; END IF;

  UPDATE public.rapid_tournament_invites
  SET revoked_at = now()
  WHERE tournament_id = p_tournament_id AND claimed_at IS NULL AND revoked_at IS NULL;
  UPDATE public.rapid_tournament_players player
  SET full_name = input.name, user_id = input.user_id
  FROM unnest(v_names, p_shuffled_user_ids) WITH ORDINALITY AS input(name, user_id, ordinal)
  WHERE player.tournament_id = p_tournament_id
    AND player.slot = chr(64 + input.ordinal::int)::char(1);
  PERFORM public.rebuild_rapid_tournament_matches(p_tournament_id);
  RETURN true;
END;
$$;

CREATE FUNCTION public.create_rapid_tournament_invite(
  p_tournament_id uuid,
  p_player_id uuid,
  p_creator_user_id uuid,
  p_code_hash text,
  p_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status FROM public.rapid_tournaments
  WHERE id = p_tournament_id AND created_by_user_id = p_creator_user_id
  FOR UPDATE;
  IF NOT FOUND OR v_status NOT IN ('draft', 'in_progress') THEN RETURN false; END IF;
  IF p_code_hash !~ '^[0-9a-f]{64}$' OR p_expires_at <= now() THEN
    RAISE EXCEPTION 'invalid_tournament_invite';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.rapid_tournament_players
    WHERE id = p_player_id AND tournament_id = p_tournament_id AND user_id IS NULL
  ) THEN RETURN false; END IF;
  UPDATE public.rapid_tournament_invites
  SET revoked_at = now()
  WHERE tournament_id = p_tournament_id AND player_id = p_player_id
    AND claimed_at IS NULL AND revoked_at IS NULL;
  INSERT INTO public.rapid_tournament_invites (
    tournament_id, player_id, created_by_user_id, code_hash, expires_at
  ) VALUES (p_tournament_id, p_player_id, p_creator_user_id, p_code_hash, p_expires_at);
  RETURN true;
END;
$$;

CREATE FUNCTION public.claim_rapid_tournament_invite(p_code_hash text, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invite public.rapid_tournament_invites%ROWTYPE;
  v_tournament_id uuid;
  v_status text;
BEGIN
  IF p_code_hash !~ '^[0-9a-f]{64}$' THEN RETURN NULL; END IF;
  SELECT tournament_id INTO v_tournament_id FROM public.rapid_tournament_invites
  WHERE code_hash = p_code_hash AND claimed_at IS NULL AND revoked_at IS NULL AND expires_at > now();
  IF NOT FOUND THEN RETURN NULL; END IF;
  -- Lock in the same order as draft rerolls and invite creation (tournament, then invite).
  SELECT status INTO v_status FROM public.rapid_tournaments
  WHERE id = v_tournament_id FOR UPDATE;
  IF NOT FOUND OR v_status = 'finished' THEN RETURN NULL; END IF;
  SELECT * INTO v_invite FROM public.rapid_tournament_invites
  WHERE code_hash = p_code_hash AND tournament_id = v_tournament_id
    AND claimed_at IS NULL AND revoked_at IS NULL AND expires_at > now()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = p_user_id AND suspended_at IS NULL)
    OR EXISTS (SELECT 1 FROM public.rapid_tournament_players WHERE tournament_id = v_invite.tournament_id AND user_id = p_user_id) THEN
    RETURN NULL;
  END IF;
  UPDATE public.rapid_tournament_players SET user_id = p_user_id
  WHERE id = v_invite.player_id AND tournament_id = v_invite.tournament_id AND user_id IS NULL;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE public.rapid_tournament_invites
  SET claimed_by_user_id = p_user_id, claimed_at = now()
  WHERE id = v_invite.id;
  RETURN v_invite.tournament_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_rapid_tournament_with_accounts(uuid, text, text, timestamptz, text, text, text[], uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reroll_rapid_tournament_with_accounts(uuid, uuid, text[], uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_rapid_tournament_invite(uuid, uuid, uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_rapid_tournament_invite(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_rapid_tournament_with_accounts(uuid, text, text, timestamptz, text, text, text[], uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.reroll_rapid_tournament_with_accounts(uuid, uuid, text[], uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_rapid_tournament_invite(uuid, uuid, uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_rapid_tournament_invite(text, uuid) TO service_role;
