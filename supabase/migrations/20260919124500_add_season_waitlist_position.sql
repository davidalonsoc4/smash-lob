ALTER TABLE public.season_waitlist
  ADD COLUMN IF NOT EXISTS position integer;

WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY season_id ORDER BY created_at, id)::integer AS next_position
  FROM public.season_waitlist
  WHERE status = 'waiting'
)
UPDATE public.season_waitlist AS entries
SET position = ranked.next_position
FROM ranked
WHERE entries.id = ranked.id
  AND entries.position IS NULL;

CREATE INDEX IF NOT EXISTS season_waitlist_position_idx
  ON public.season_waitlist (season_id, status, position, created_at, id);
