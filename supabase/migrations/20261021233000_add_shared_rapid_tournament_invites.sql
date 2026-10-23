CREATE TABLE public.rapid_tournament_join_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL UNIQUE REFERENCES public.rapid_tournaments(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rapid_tournament_join_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rapid_tournament_join_invites FROM anon, authenticated;
GRANT ALL ON TABLE public.rapid_tournament_join_invites TO service_role;

CREATE FUNCTION public.create_rapid_tournament_join_invite(
  p_tournament_id uuid, p_creator_user_id uuid, p_code_hash text, p_expires_at timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM public.rapid_tournaments
  WHERE id = p_tournament_id AND created_by_user_id = p_creator_user_id FOR UPDATE;
  IF NOT FOUND OR v_status = 'finished' THEN RETURN false; END IF;
  IF p_code_hash !~ '^[0-9a-f]{64}$' OR p_expires_at <= now() THEN RAISE EXCEPTION 'invalid_tournament_invite'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.rapid_tournament_players WHERE tournament_id = p_tournament_id AND user_id IS NULL) THEN RETURN false; END IF;
  INSERT INTO public.rapid_tournament_join_invites(tournament_id, created_by_user_id, code_hash, expires_at, revoked_at)
  VALUES (p_tournament_id, p_creator_user_id, p_code_hash, p_expires_at, NULL)
  ON CONFLICT (tournament_id) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, revoked_at = NULL, created_at = now();
  RETURN true;
END;
$$;

CREATE FUNCTION public.claim_rapid_tournament_join_invite(
  p_code_hash text, p_user_id uuid, p_player_id uuid
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_tournament_id uuid; v_status text;
BEGIN
  IF p_code_hash !~ '^[0-9a-f]{64}$' THEN RETURN NULL; END IF;
  SELECT tournament_id INTO v_tournament_id FROM public.rapid_tournament_join_invites
  WHERE code_hash = p_code_hash AND revoked_at IS NULL AND expires_at > now();
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT status INTO v_status FROM public.rapid_tournaments WHERE id = v_tournament_id FOR UPDATE;
  IF NOT FOUND OR v_status = 'finished' THEN RETURN NULL; END IF;
  PERFORM 1 FROM public.rapid_tournament_join_invites WHERE tournament_id = v_tournament_id
    AND code_hash = p_code_hash AND revoked_at IS NULL AND expires_at > now() FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = p_user_id AND suspended_at IS NULL)
    OR EXISTS (SELECT 1 FROM public.rapid_tournament_players WHERE tournament_id = v_tournament_id AND user_id = p_user_id) THEN RETURN NULL; END IF;
  UPDATE public.rapid_tournament_players SET user_id = p_user_id
  WHERE id = p_player_id AND tournament_id = v_tournament_id AND user_id IS NULL;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN v_tournament_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_rapid_tournament_join_invite(uuid, uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_rapid_tournament_join_invite(text, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_rapid_tournament_join_invite(uuid, uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_rapid_tournament_join_invite(text, uuid, uuid) TO service_role;
