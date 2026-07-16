do $$
declare
  target_tables constant text[] := array[
    'activity_events',
    'app_users',
    'invites',
    'league_locations',
    'league_memberships',
    'league_spectators',
    'leagues',
    'match_result_confirmations',
    'matches',
    'mvp_manual_selections',
    'mvp_votes',
    'notification_preferences',
    'player_availability',
    'players',
    'push_subscriptions',
    'season_players',
    'season_settings',
    'seasons',
    'spectator_invites'
  ];
  target_table text;
  rec record;
begin
  for rec in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(target_tables)
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      rec.policyname,
      rec.schemaname,
      rec.tablename
    );
  end loop;

  foreach target_table in array target_tables
  loop
    execute format('alter table public.%I enable row level security', target_table);
    execute format('revoke all on table public.%I from public', target_table);
    execute format('revoke all on table public.%I from anon', target_table);
    execute format('revoke all on table public.%I from authenticated', target_table);
    execute format('grant all on table public.%I to service_role', target_table);
  end loop;

  for rec in
    select sequence_schema, sequence_name
    from information_schema.sequences
    where sequence_schema = 'public'
  loop
    execute format('revoke all on sequence %I.%I from public', rec.sequence_schema, rec.sequence_name);
    execute format('revoke all on sequence %I.%I from anon', rec.sequence_schema, rec.sequence_name);
    execute format('revoke all on sequence %I.%I from authenticated', rec.sequence_schema, rec.sequence_name);
    execute format('grant all on sequence %I.%I to service_role', rec.sequence_schema, rec.sequence_name);
  end loop;

  for rec in
    select p.oid::regprocedure::text as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke all on function %s from public', rec.signature);
    execute format('revoke all on function %s from anon', rec.signature);
    execute format('revoke all on function %s from authenticated', rec.signature);
  end loop;
end $$;

alter default privileges for role postgres in schema public
  revoke all on tables from public;
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke all on tables from authenticated;

alter default privileges for role postgres in schema public
  revoke all on functions from public;
alter default privileges for role postgres in schema public
  revoke all on functions from anon;
alter default privileges for role postgres in schema public
  revoke all on functions from authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from public;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;
alter default privileges for role postgres in schema public
  revoke all on sequences from authenticated;

do $$
begin
  begin
    alter default privileges for role supabase_admin in schema public
      revoke all on tables from public;
    alter default privileges for role supabase_admin in schema public
      revoke all on tables from anon;
    alter default privileges for role supabase_admin in schema public
      revoke all on tables from authenticated;

    alter default privileges for role supabase_admin in schema public
      revoke all on functions from public;
    alter default privileges for role supabase_admin in schema public
      revoke all on functions from anon;
    alter default privileges for role supabase_admin in schema public
      revoke all on functions from authenticated;

    alter default privileges for role supabase_admin in schema public
      revoke all on sequences from public;
    alter default privileges for role supabase_admin in schema public
      revoke all on sequences from anon;
    alter default privileges for role supabase_admin in schema public
      revoke all on sequences from authenticated;
  exception
    when insufficient_privilege then
      raise notice
        'Skipping supabase_admin default privilege cleanup because the current migration role cannot alter that role';
  end;
end $$;
