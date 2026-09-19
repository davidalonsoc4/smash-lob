alter table public.leagues
  add column if not exists accent_color text not null default '#D7A544';

update public.leagues
set accent_color = upper(accent_color)
where accent_color is not null;

alter table public.leagues
  drop constraint if exists leagues_accent_color_format;

alter table public.leagues
  add constraint leagues_accent_color_format
  check (accent_color ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.leagues.accent_color is
  'Identity accent used by Competition visual style and league surfaces.';
