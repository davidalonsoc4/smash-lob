# Competition visual style

Competition is an experimental, dark-only visual style for local product work.
It is selected from **Settings → Themes and appearance** while the app runs on
`localhost`, `127.0.0.1` or a private `192.168.x.x` address. Production builds
and public hosts force Classic until the style is explicitly promoted.

The style is driven by `ThemeProvider` and the tokens scoped to
`html[data-visual-style="competition"]` in `src/app/globals.css`. Classic keeps
the existing rendering path. A selected league accent is stored in
`leagues.accent_color`, validated as a six-digit hexadecimal colour, and exposed
to authenticated and public spectator payloads.

The migration `20260919150000_add_league_accent_color.sql` is additive. It
defaults existing leagues to `#D7A544` and does not alter historical branding.
Apply it only through the normal local migration workflow for this branch; do
not apply it to PRE or Production as part of the experimental work.

## Local verification

1. Start the app with `npm run dev`.
2. Open Settings → Themes and appearance.
3. Choose Competition. Light and System remain visibly disabled and the page
   switches to the dark surface immediately.
4. Edit a league accent under League settings, save it, switch leagues, and
   confirm the accent follows the active league.
5. Open a spectator view and confirm the public payload includes the league
   accent without exposing private player data.

The implementation intentionally has no PRE/PROD deployment or remote database
operation associated with this branch.
