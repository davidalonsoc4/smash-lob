\set ON_ERROR_STOP on

do $$
begin
  if not exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '20260803203000'
  ) then
    raise exception 'final identity migration is not recorded';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'league_memberships'
      and column_name = 'league_avatar_url'
  ) then
    raise exception 'league_avatar_url still exists';
  end if;

  if (
    select link_identity_snapshot->>'displayName'
    from public.players
    where id = '53000000-0000-0000-0000-000000000001'
  ) is distinct from 'Legacy Visible Name' then
    raise exception 'legacy display name was not preserved';
  end if;

  if (
    select link_identity_snapshot->>'avatarInitials'
    from public.players
    where id = '53000000-0000-0000-0000-000000000001'
  ) is distinct from 'LV' then
    raise exception 'legacy initials were not preserved';
  end if;

  if exists (
    select 1
    from public.players
    where id = '53000000-0000-0000-0000-000000000001'
      and avatar_url is not null
  ) then
    raise exception 'legacy player image was not removed';
  end if;
end $$;

delete from public.league_memberships
where id = '54000000-0000-0000-0000-000000000001';

do $$
begin
  if (
    select display_name
    from public.players
    where id = '53000000-0000-0000-0000-000000000001'
  ) is distinct from 'Legacy Visible Name' then
    raise exception 'unlink did not restore the legacy name';
  end if;

  if exists (
    select 1
    from public.players
    where id = '53000000-0000-0000-0000-000000000001'
      and link_identity_snapshot is not null
  ) then
    raise exception 'unlink did not clear the identity snapshot';
  end if;
end $$;
