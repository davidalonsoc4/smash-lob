# UI Integration

Route: `/experimental/avatar-lab`

The route is server-gated by the PRE application variant, uses `noindex`, is not listed in normal navigation, keeps authentication/account completion and bypasses league, season, match and MVP providers.

The page has its own full-screen mobile shell with maximum width 448 px. It is designed around 320, 360, 390 and 430 px viewports. The preview uses a 4:5 box, controls have 40–44 px minimum touch targets, categories scroll horizontally and actions respect the bottom safe-area inset.

Future standings, matches and exports must resolve the viewer world once and pass that same world to every avatar in the composition.
