alter table public.leagues
  add column if not exists recommendations text not null default '';
