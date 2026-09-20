-- Spectator links are league-wide and intentionally use the neutral app
-- default. Normalize links created before this policy so old QR codes cannot
-- keep exposing a creator's private Competition or palette selection.
update public.spectator_invites
set
  theme_visual_style = 'classic',
  theme_base = 'system',
  theme_palette = 'classic',
  theme_competition_accent = 'league',
  theme_accent_color = '#D7A544'
where
  theme_visual_style is distinct from 'classic'
  or theme_base is distinct from 'system'
  or theme_palette is distinct from 'classic'
  or theme_competition_accent is distinct from 'league'
  or theme_accent_color is distinct from '#D7A544';

comment on column public.spectator_invites.theme_visual_style is 'Stable spectator-link appearance: always the neutral Classic application style.';
comment on column public.spectator_invites.theme_base is 'Stable spectator-link base theme: system.';
comment on column public.spectator_invites.theme_palette is 'Stable spectator-link palette: classic.';
comment on column public.spectator_invites.theme_competition_accent is 'Reserved for compatibility; spectator links always use the classic style.';
comment on column public.spectator_invites.theme_accent_color is 'Reserved compatibility color for the stable spectator-link appearance.';
