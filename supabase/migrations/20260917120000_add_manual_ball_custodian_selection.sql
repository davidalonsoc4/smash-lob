ALTER TABLE public.season_settings
  ADD COLUMN balls_assignment_mode text NOT NULL DEFAULT 'priority'
    CHECK (balls_assignment_mode IN ('priority', 'selected')),
  ADD COLUMN balls_assignment_custodian_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

COMMENT ON COLUMN public.season_settings.balls_assignment_mode IS
  'Controls whether ball custodians are selected by priority tie-breaks or from an explicit eligible-player list.';

COMMENT ON COLUMN public.season_settings.balls_assignment_custodian_ids IS
  'Player IDs eligible for organization-assigned ball custody when balls_assignment_mode is selected.';
