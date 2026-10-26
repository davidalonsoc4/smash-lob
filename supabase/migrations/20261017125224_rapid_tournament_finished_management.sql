-- The API authenticates the creator; clients have no direct execute privileges.
CREATE FUNCTION public.restart_rapid_tournament_for_testing(p_tournament_id uuid, p_creator_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM public.rapid_tournaments
  WHERE id = p_tournament_id AND created_by_user_id = p_creator_user_id FOR UPDATE;
  IF NOT FOUND OR v_status <> 'finished' THEN RETURN false; END IF;
  UPDATE public.rapid_tournament_matches SET score_a = NULL, score_b = NULL WHERE tournament_id = p_tournament_id;
  UPDATE public.rapid_tournaments SET status = 'in_progress', started_at = now(), finished_at = NULL WHERE id = p_tournament_id;
  RETURN true;
END;
$$;

CREATE FUNCTION public.delete_finished_rapid_tournament(p_tournament_id uuid, p_creator_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  -- Existing cascading FKs remove this tournament's children only.
  DELETE FROM public.rapid_tournaments
  WHERE id = p_tournament_id AND created_by_user_id = p_creator_user_id AND status = 'finished';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.restart_rapid_tournament_for_testing(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_finished_rapid_tournament(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restart_rapid_tournament_for_testing(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_finished_rapid_tournament(uuid, uuid) TO service_role;
