-- The API authenticates the creator; this function is never exposed to browser roles.
CREATE FUNCTION public.finish_empty_rapid_tournament(p_tournament_id uuid, p_creator_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_scored_matches integer;
BEGIN
  SELECT status INTO v_status
  FROM public.rapid_tournaments
  WHERE id = p_tournament_id AND created_by_user_id = p_creator_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_status NOT IN ('draft', 'in_progress') THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO v_scored_matches
  FROM public.rapid_tournament_matches
  WHERE tournament_id = p_tournament_id
    AND (score_a IS NOT NULL OR score_b IS NOT NULL);

  IF v_scored_matches <> 0 THEN
    RETURN false;
  END IF;

  UPDATE public.rapid_tournaments
  SET status = 'finished', finished_at = now()
  WHERE id = p_tournament_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.finish_empty_rapid_tournament(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_empty_rapid_tournament(uuid, uuid) TO service_role;
