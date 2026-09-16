ALTER TABLE public.season_settings
  ADD COLUMN IF NOT EXISTS organization_balls_assigned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS balls_assignment_priority uuid[] NOT NULL DEFAULT '{}'::uuid[];

COMMENT ON COLUMN public.season_settings.organization_balls_assigned IS
  'When true, the organization assigns one ball custodian per scheduled match and ball purchases are disabled.';

COMMENT ON COLUMN public.season_settings.balls_assignment_priority IS
  'Ordered player ids used to break ties when selecting the minimum ball custodian set.';
