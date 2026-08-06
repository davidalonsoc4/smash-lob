CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  tour_key text NOT NULL,
  tour_version integer NOT NULL CHECK (tour_version BETWEEN 1 AND 100),
  status text NOT NULL CHECK (status IN ('completed', 'skipped')),
  completed_at timestamptz,
  skipped_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tour_key),
  CONSTRAINT user_onboarding_progress_timestamp_check CHECK (
    (status = 'completed' AND completed_at IS NOT NULL AND skipped_at IS NULL)
    OR
    (status = 'skipped' AND skipped_at IS NOT NULL AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS user_onboarding_progress_user_status_idx
  ON public.user_onboarding_progress (user_id, status);

ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_onboarding_progress FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_onboarding_progress TO service_role;
