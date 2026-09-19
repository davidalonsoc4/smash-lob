CREATE TABLE IF NOT EXISTS public.season_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'promoted', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  promoted_at timestamptz,
  confirmation_expires_at timestamptz,
  UNIQUE (season_id, user_id)
);

CREATE INDEX IF NOT EXISTS season_waitlist_order_idx
  ON public.season_waitlist (season_id, status, created_at, id);

ALTER TABLE public.season_waitlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.season_waitlist FROM anon, authenticated;
GRANT ALL ON TABLE public.season_waitlist TO service_role;
