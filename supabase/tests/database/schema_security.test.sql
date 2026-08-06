begin;

select plan(16);

select ok(
  not exists (
    select 1
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind in ('r', 'p')
      and relation.relrowsecurity is false
  ),
  'all public tables have row level security enabled'
);

select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'anon'
  ),
  'anon has no direct table grants in public'
);

select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'authenticated'
  ),
  'authenticated has no direct table grants in public'
);

select ok(
  not exists (
    select 1
    from pg_proc as procedure
    join pg_namespace as namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and has_function_privilege('anon', procedure.oid, 'EXECUTE')
  ),
  'anon cannot execute public functions'
);

select ok(
  not exists (
    select 1
    from pg_proc as procedure
    join pg_namespace as namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and has_function_privilege('authenticated', procedure.oid, 'EXECUTE')
  ),
  'authenticated cannot execute public functions'
);

select ok(
  not exists (
    select 1
    from pg_proc as procedure
    join pg_namespace as namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and left(procedure.proname, 7) = 'server_'
      and not has_function_privilege('service_role', procedure.oid, 'EXECUTE')
  ),
  'service_role can execute every server function'
);

select has_column(
  'public',
  'players',
  'link_identity_snapshot',
  'players keeps the historical identity snapshot'
);

select hasnt_column(
  'public',
  'league_memberships',
  'league_avatar_url',
  'the rejected per-league avatar column is absent'
);

select has_column(
  'public',
  'app_users',
  'avatar_url',
  'account images remain global on app_users'
);

select has_trigger(
  'public',
  'league_memberships',
  'league_memberships_sync_linked_player_identity',
  'linked player identity synchronization trigger exists'
);

select ok(
  exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '20260803203000'
  ),
  'the final identity migration is recorded'
);

select ok(
  not exists (
    select 1
    from pg_default_acl as defaults
    cross join lateral aclexplode(defaults.defaclacl) as acl
    join pg_roles as owner_role on owner_role.oid = defaults.defaclrole
    join pg_roles as grantee on grantee.oid = acl.grantee
    join pg_namespace as namespace on namespace.oid = defaults.defaclnamespace
    where namespace.nspname = 'public'
      and owner_role.rolname = 'postgres'
      and defaults.defaclobjtype in ('r', 'S', 'f')
      and grantee.rolname in ('anon', 'authenticated')
      and acl.privilege_type in ('INSERT', 'SELECT', 'UPDATE', 'DELETE', 'EXECUTE', 'USAGE')
  ),
  'application-object default privileges stay revoked for API roles'
);

select ok(
  not exists (
    select 1
    from public.players
    where avatar_url is not null
  ),
  'player rows do not store account images'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
  ),
  'the browser roles cannot regain access through permissive policies'
);


select has_table(
  'public',
  'user_onboarding_progress',
  'guided onboarding progress is persisted per account'
);

select has_pk(
  'public',
  'user_onboarding_progress',
  'guided onboarding progress has one row per user and tour'
);

select * from finish();
rollback;
