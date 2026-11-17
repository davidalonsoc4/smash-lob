-- App administrator: a narrow permission that is independent from the superuser
-- and from league roles. It does not change league access, experience modes or
-- the list of leagues; today it only unlocks tutorial management.
alter table public.app_users
  add column if not exists is_app_admin boolean not null default false;

comment on column public.app_users.is_app_admin is
  'Manages global app content (tutorial videos). Not a superuser: league access is unchanged.';
