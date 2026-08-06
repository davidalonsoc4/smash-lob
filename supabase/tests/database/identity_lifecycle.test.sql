begin;

select plan(8);

insert into public.app_users (
  id,
  email,
  display_name,
  first_name,
  last_name,
  profile_completed_at,
  avatar_url
) values (
  '10000000-0000-0000-0000-000000000001',
  'identity-test@smashandlob.invalid',
  'Account Identity',
  'Account',
  'Identity',
  now(),
  'data:image/webp;base64,AAAA'
);

insert into public.leagues (
  id,
  slug,
  name,
  invite_code,
  created_by_user_id
) values (
  '20000000-0000-0000-0000-000000000001',
  'identity-test',
  'Identity Test League',
  'IDENTITYTEST',
  '10000000-0000-0000-0000-000000000001'
);

insert into public.players (
  id,
  league_id,
  slug,
  display_name,
  avatar_initials,
  avatar_url
) values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'historical-player',
  'Historical Player',
  'HP',
  null
);

insert into public.league_memberships (
  id,
  user_id,
  league_id,
  player_id,
  role
) values (
  '40000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'player'
);

select is(
  (select display_name from public.players where id = '30000000-0000-0000-0000-000000000001'),
  'Account Identity',
  'linking exposes the global account name'
);

select is(
  (select avatar_initials from public.players where id = '30000000-0000-0000-0000-000000000001'),
  'AI',
  'linking exposes account initials'
);

select is(
  (select link_identity_snapshot->>'displayName' from public.players where id = '30000000-0000-0000-0000-000000000001'),
  'Historical Player',
  'linking preserves the historical name'
);

select is(
  (select link_identity_snapshot->>'avatarInitials' from public.players where id = '30000000-0000-0000-0000-000000000001'),
  'HP',
  'linking preserves historical initials'
);

select is(
  (select avatar_url from public.players where id = '30000000-0000-0000-0000-000000000001'),
  null,
  'account images are never copied into players'
);

delete from public.league_memberships
where id = '40000000-0000-0000-0000-000000000001';

select is(
  (select display_name from public.players where id = '30000000-0000-0000-0000-000000000001'),
  'Historical Player',
  'unlinking restores the historical name'
);

select is(
  (select avatar_initials from public.players where id = '30000000-0000-0000-0000-000000000001'),
  'HP',
  'unlinking restores historical initials'
);

select is(
  (select link_identity_snapshot from public.players where id = '30000000-0000-0000-0000-000000000001'),
  null,
  'unlinking clears the consumed snapshot'
);

select * from finish();
rollback;
