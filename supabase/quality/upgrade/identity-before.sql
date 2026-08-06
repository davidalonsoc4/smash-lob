\set ON_ERROR_STOP on

insert into public.app_users (
  id,
  email,
  display_name,
  first_name,
  last_name,
  profile_completed_at,
  avatar_url
) values (
  '51000000-0000-0000-0000-000000000001',
  'upgrade-test@smashandlob.invalid',
  'Current Account',
  'Current',
  'Account',
  now(),
  'data:image/webp;base64,BBBB'
);

insert into public.leagues (
  id,
  slug,
  name,
  invite_code,
  created_by_user_id
) values (
  '52000000-0000-0000-0000-000000000001',
  'upgrade-test',
  'Upgrade Test League',
  'UPGRADETEST',
  '51000000-0000-0000-0000-000000000001'
);

insert into public.players (
  id,
  league_id,
  slug,
  display_name,
  avatar_initials,
  avatar_url
) values (
  '53000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000001',
  'legacy-player',
  'Legacy Visible Name',
  'LV',
  'data:image/png;base64,CCCC'
);

insert into public.league_memberships (
  id,
  user_id,
  league_id,
  player_id,
  role
) values (
  '54000000-0000-0000-0000-000000000001',
  '51000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000001',
  '53000000-0000-0000-0000-000000000001',
  'player'
);
