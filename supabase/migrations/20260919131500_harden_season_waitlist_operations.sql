CREATE OR REPLACE FUNCTION public.reorder_season_waitlist(
  p_league_id uuid,
  p_season_id uuid,
  p_user_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected_count integer;
  supplied_count integer;
BEGIN
  SELECT count(*) INTO expected_count
  FROM public.season_waitlist
  WHERE league_id = p_league_id AND season_id = p_season_id AND status = 'waiting';

  supplied_count := COALESCE(array_length(p_user_ids, 1), 0);
  IF expected_count <> supplied_count OR EXISTS (
    SELECT 1
    FROM unnest(p_user_ids) AS requested(user_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.season_waitlist entry
      WHERE entry.league_id = p_league_id AND entry.season_id = p_season_id
        AND entry.status = 'waiting' AND entry.user_id = requested.user_id
    )
  ) THEN
    RAISE EXCEPTION 'invalid_waitlist_order';
  END IF;

  UPDATE public.season_waitlist
  SET position = COALESCE(position, 0) + expected_count + 1
  WHERE league_id = p_league_id AND season_id = p_season_id AND status = 'waiting';

  UPDATE public.season_waitlist entry
  SET position = requested.ordinality
  FROM unnest(p_user_ids) WITH ORDINALITY AS requested(user_id, ordinality)
  WHERE entry.league_id = p_league_id AND entry.season_id = p_season_id
    AND entry.status = 'waiting' AND entry.user_id = requested.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_season_waitlist(uuid, uuid, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_season_waitlist(uuid, uuid, uuid[]) TO service_role;
