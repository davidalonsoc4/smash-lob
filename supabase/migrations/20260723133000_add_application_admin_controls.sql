ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

CREATE TABLE IF NOT EXISTS public.application_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  actor_email text NOT NULL,
  target_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  target_email text,
  league_id uuid REFERENCES public.leagues(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS application_admin_audit_log_created_at_idx
  ON public.application_admin_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS application_admin_audit_log_target_user_id_idx
  ON public.application_admin_audit_log (target_user_id, created_at DESC);

ALTER TABLE public.application_admin_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.application_admin_audit_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.application_admin_audit_log TO service_role;

CREATE OR REPLACE FUNCTION public.server_transfer_league_ownership(
  p_actor_user_id uuid,
  p_league_id uuid,
  p_current_owner_user_id uuid,
  p_new_owner_user_id uuid
)
RETURNS TABLE (
  league_id uuid,
  league_name text,
  previous_owner_user_id uuid,
  new_owner_user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_league public.leagues%ROWTYPE;
  v_actor public.app_users%ROWTYPE;
  v_previous_owner public.app_users%ROWTYPE;
  v_new_owner public.app_users%ROWTYPE;
  v_previous_membership_id uuid;
  v_new_membership_id uuid;
BEGIN
  SELECT *
  INTO v_actor
  FROM public.app_users
  WHERE id = p_actor_user_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_actor.is_superuser OR v_actor.suspended_at IS NOT NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_current_owner_user_id = p_new_owner_user_id THEN
    RAISE EXCEPTION 'same_owner';
  END IF;

  SELECT *
  INTO v_league
  FROM public.leagues
  WHERE id = p_league_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'league_not_found';
  END IF;

  IF v_league.created_by_user_id IS DISTINCT FROM p_current_owner_user_id THEN
    RAISE EXCEPTION 'owner_mismatch';
  END IF;

  SELECT *
  INTO v_previous_owner
  FROM public.app_users
  WHERE id = p_current_owner_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'current_owner_not_found';
  END IF;

  SELECT *
  INTO v_new_owner
  FROM public.app_users
  WHERE id = p_new_owner_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'new_owner_not_found';
  END IF;

  IF v_new_owner.suspended_at IS NOT NULL THEN
    RAISE EXCEPTION 'new_owner_suspended';
  END IF;

  SELECT membership.id
  INTO v_previous_membership_id
  FROM public.league_memberships AS membership
  WHERE membership.league_id = p_league_id
    AND membership.user_id = p_current_owner_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'current_owner_membership_not_found';
  END IF;

  SELECT membership.id
  INTO v_new_membership_id
  FROM public.league_memberships AS membership
  WHERE membership.league_id = p_league_id
    AND membership.user_id = p_new_owner_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'new_owner_membership_not_found';
  END IF;

  UPDATE public.league_memberships
  SET role = 'admin'::public.league_role
  WHERE id = v_previous_membership_id;

  UPDATE public.league_memberships
  SET role = 'creator'::public.league_role
  WHERE id = v_new_membership_id;

  UPDATE public.leagues
  SET created_by_user_id = p_new_owner_user_id
  WHERE id = p_league_id;

  INSERT INTO public.application_admin_audit_log (
    actor_user_id,
    actor_email,
    target_user_id,
    target_email,
    league_id,
    action,
    metadata
  )
  VALUES (
    v_actor.id,
    v_actor.email,
    v_new_owner.id,
    v_new_owner.email,
    v_league.id,
    'league_ownership_transferred',
    jsonb_build_object(
      'leagueName', v_league.name,
      'previousOwnerUserId', v_previous_owner.id,
      'previousOwnerEmail', v_previous_owner.email,
      'newOwnerUserId', v_new_owner.id,
      'newOwnerEmail', v_new_owner.email
    )
  );

  RETURN QUERY
  SELECT
    v_league.id,
    v_league.name,
    v_previous_owner.id,
    v_new_owner.id;
END;
$$;

REVOKE ALL ON FUNCTION public.server_transfer_league_ownership(uuid, uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.server_transfer_league_ownership(uuid, uuid, uuid, uuid)
  TO service_role;
