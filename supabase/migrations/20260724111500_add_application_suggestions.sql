CREATE TABLE IF NOT EXISTS public.application_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  submitted_by_email text NOT NULL,
  submitted_by_name text,
  category text NOT NULL CHECK (
    category IN ('improvement', 'feature', 'usability', 'other')
  ),
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  details text NOT NULL CHECK (char_length(details) BETWEEN 10 AND 2000),
  app_version text NOT NULL,
  source_path text,
  status text NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'reviewing', 'planned', 'declined', 'completed')
  ),
  admin_note text,
  reviewed_by_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS application_suggestions_created_at_idx
  ON public.application_suggestions (created_at DESC);

CREATE INDEX IF NOT EXISTS application_suggestions_submitter_idx
  ON public.application_suggestions (submitted_by_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS application_suggestions_status_idx
  ON public.application_suggestions (status, created_at DESC);

ALTER TABLE public.application_suggestions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.application_suggestions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.application_suggestions TO service_role;
