alter default privileges for role postgres
  revoke execute on functions from public;

do $$
begin
  begin
    alter default privileges for role supabase_admin
      revoke execute on functions from public;
  exception
    when insufficient_privilege then
      raise notice
        'Skipping supabase_admin global function default privilege cleanup because the current migration role cannot alter that role';
  end;
end $$;
