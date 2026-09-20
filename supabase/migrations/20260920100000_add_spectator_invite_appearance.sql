alter table public.spectator_invites
  add column if not exists theme_visual_style text,
  add column if not exists theme_base text,
  add column if not exists theme_palette text,
  add column if not exists theme_competition_accent text,
  add column if not exists theme_accent_color text;

alter table public.spectator_invites
  drop constraint if exists spectator_invites_theme_visual_style_check,
  drop constraint if exists spectator_invites_theme_base_check,
  drop constraint if exists spectator_invites_theme_palette_check,
  drop constraint if exists spectator_invites_theme_competition_accent_check;

alter table public.spectator_invites
  add constraint spectator_invites_theme_visual_style_check
    check (theme_visual_style is null or theme_visual_style in ('classic', 'competition')),
  add constraint spectator_invites_theme_base_check
    check (theme_base is null or theme_base in ('light', 'dark', 'system')),
  add constraint spectator_invites_theme_palette_check
    check (theme_palette is null or theme_palette in ('classic', 'indigo', 'midnight', 'sage', 'burgundy', 'graphite', 'league')),
  add constraint spectator_invites_theme_competition_accent_check
    check (theme_competition_accent is null or theme_competition_accent in ('league', 'gold', 'blue', 'green', 'coral', 'violet', 'ice'));

comment on column public.spectator_invites.theme_visual_style is 'Immutable visual style captured when the spectator link is first generated.';
comment on column public.spectator_invites.theme_base is 'Immutable base theme captured when the spectator link is first generated.';
comment on column public.spectator_invites.theme_palette is 'Immutable classic palette captured when the spectator link is first generated.';
comment on column public.spectator_invites.theme_competition_accent is 'Immutable Competition accent choice captured when the spectator link is first generated.';
comment on column public.spectator_invites.theme_accent_color is 'Resolved league/accent colour captured when the spectator link is first generated.';
