## v0.16.12 — Classic style naming and award header polish

- Renamed the visible neutral appearance style to Clásico/Classic/Klasikoa while preserving the internal `plain` storage key.
- Kept Colorido and all six palettes unchanged.
- Rounded the Home season-winner and season-MVP title bars to align with the containing cards.
- No API, permission, routing, database or remote-environment change.
- Local lint, typecheck and production build remain required before commit and promotion.

## v0.15.7 — Availability effect dependency cleanup

- ESLint exhaustive-deps warning removed from the availability screen.
- No API, permission or database changes.
- Local lint, typecheck and production build remain required before commit.

## v0.14.0 settings architecture (2026-07-24)

- Reorganized Settings into Personal, My leagues, Personal activity, Administration, Help and information, and Session.
- Player and spectator settings now share the same capability-driven visual architecture.
- Reorganized the league administration hub into General, People and access, Competition, Operations, and Data and control.
- Grouped personal notification preferences into four expandable categories.
- Added clearer internal sections to season, league, users, and administrative activity screens.
- Preserved all existing routes, anchors, APIs, permissions, and the current settings-search implementation.
- No database migration or remote change is required.


## Post-release validation fix (v0.15.5, 2026-07-24)

- Fixed two TypeScript errors introduced by actionable empty states on the Activity screen.
- Empty-state refresh actions now reuse the same refresh function as the section headers.
- No database migration, API contract, permission, or data change is required.

## v0.13.3 public changelog (2026-07-24)

- Added `/changelog` with a public-safe history of documented Smash & Lob releases starting at v0.6.2.
- Added access from player and spectator settings, the visible version footer, and the settings search index.
- Grouped minor revisions when a reliable public per-patch description is unavailable instead of inventing release details.
- Added the changelog route to the spectator allowlist.
- No database migration or remote change is required.


## v0.13.2 cumulative application-admin package (2026-07-23)

- Rebuilt the complete v0.13.x delivery from the original staging snapshot plus the v0.13.0 application-administration changes.
- Retains the v0.12.7 scheduling-panel and compact statistics season-selector refinements.
- Corrects the v0.13.1 upcoming-roster refresh so Supabase snapshots replace stale season/player membership data for the leagues represented by the snapshot.
- The correction is client-state-only and does not add or modify database migrations beyond `20260723133000_add_application_admin_controls.sql`.
- Version advanced to v0.13.2 because the previously delivered v0.13.1 package did not pass TypeScript validation.

# Production Hardening Status

Last updated: 2026-07-26 20:43:00 +02:00
Current branch at status update: `feature/v0.16-colorful-design`
Production branch confirmed from Git + Vercel: `main`
Production source version retained in this run: `v0.9.71`
Staging source commit retained in this run: `78f1986` (`v0.10.0`)
Active milestone state: `H20-H23 complete; environment isolation repair complete`

## Post-hardening fix checkpoint (v0.13.1, 2026-07-23)

- Fixed stale self-registration roster entries after a linked user leaves a league before the season starts.
- Supabase season snapshots are now authoritative for the leagues and seasons included in each refresh, so deleted `season_players` rows no longer survive in local state or localStorage.
- The existing unlink SQL function remains unchanged: it already removes the player from an upcoming self-registration roster and reopens registration. This patch only corrects client hydration.
- No database migration is required for v0.13.1.

## Post-hardening feature checkpoint (2026-07-23)

- Prepared source version `v0.13.0` on top of the current staging snapshot.
- Added global application administration for summary metrics, richer account data, account suspension/reactivation, onboarding resets, push/preference cleanup, league ownership transfer, and application-admin audit history.
- Added local migration `20260723133000_add_application_admin_controls.sql`; it has not been applied remotely by this patch.
- Account suspension is enforced in the shared server authentication boundary and renders a dedicated blocked-account screen before league providers load.
- League ownership transfer updates the league owner and both membership roles transactionally through a service-role-only SQL function.
- The v0.12.7 scheduling-panel and compact season-selector changes are retained cumulatively in this source.
- TypeScript/TSX syntax transpilation passed for every modified source file, and whitespace/conflict-marker checks are clean.
- Full dependency installation, lint, typecheck, and build could not be completed in the review container because its npm proxy returned HTTP 503 for required packages; these gates remain mandatory locally before commit.



## Product experience update — v0.16.0

- Added a fourth device-local appearance preference: `colorful`.
- The initial layout script and ThemeProvider apply the same resolved theme, preventing a light-theme flash during startup.
- Colorful styling is centralized in CSS and covers shell backgrounds, cards, statistics, ranking, bottom navigation, floating controls, forms and skeletons.
- Existing light, dark and system preferences remain supported without data migrations.
- Status colors remain semantic, and the per-league neutral-color option still takes precedence for status elements.
- Full local lint, TypeScript and production-build validation remains required before merging the feature branch.

## Final state summary

- `git fetch --all --prune` was rerun on 2026-07-16, and `git ls-remote --heads origin main release/production-hardening` confirmed both remote branches point to the same release line.
- The requested UI-only change is in place: the settings footer now renders `Beta cerrada · v0.9.68` for both player and spectator settings screens without changing `package.json`, `package-lock.json`, or `src/lib/appVersion.ts`.
- Local release gates for this final change passed: `git diff --check`, `npm run lint`, and `npm run build`.
- Preview and Production deployments for the release run reached `Ready`, and Vercel build logs tied them to `release/production-hardening` / `main` for the final release commit during rollout.
- Production env-name presence was confirmed without printing values, and the normalized checks for `QA_MODE=false`, `NEXT_PUBLIC_QA_MODE=false`, and `NEXT_PUBLIC_APP_URL=https://smash-lob.vercel.app` passed.
- The live production smoke suite passed for root, manifest, auth session/providers, Google provider metadata, cron-without-secret, protected no-session routes, and controlled invalid invite responses.
- The earlier invalid-key finding is superseded by the 2026-07-20 credential repair and the read-only REST validation recorded below.
- On 2026-07-18, the project owner completed the documented two-Google-account Production walkthrough, covering organizer, player/member, result/confirmation/MVP, and spectator flows.

## Environment isolation repair (2026-07-20)

- The local Supabase CLI link remains on PRE project `miadjotkucgluwbrgeih`; it was not switched to Production.
- Vercel Production now targets Supabase Production project `szycbwdzestcmimziyey` for the public URL, anon key, and service-role key.
- Vercel Preview defaults and the explicit Git branch `staging` overrides now target Supabase PRE project `miadjotkucgluwbrgeih` for the same three variables, preventing future Preview branches from falling back to Production.
- Both official legacy JWT pairs were validated before use: three JWT segments, expected project reference and role claims, and successful read-only HTTP checks.
- Public keys were compared exactly after storage without printing values. Service-role values were stored as Vercel Sensitive variables and cannot be read back.
- Production was rebuilt from its existing `main` deployment, preserving the v0.9.71 source line. Staging was rebuilt from its existing branch deployment, preserving v0.10.0.
- No code, data, migration, Supabase link, Production branch, or Git branch was changed as part of the remote configuration repair.
- Read-only data checks show 3 leagues in Production and 0 in PRE. The configured owner account exists in both environments and can create leagues; Production has 3 creator memberships while PRE has none.

## Verified deployment targets

- Preview credential-repair deployment id: `dpl_HppVyCzPCteV9vDJthi1c9fQESg4`
- Preview credential-repair URL: `https://smash-lmw3hmjw7-davidalonsoc4-8740s-projects.vercel.app`
- Preview stable alias (tracks subsequent `staging` commits): `https://smash-lob-git-staging-davidalonsoc4-8740s-projects.vercel.app`
- Preview status at the final post-push check: `Ready`
- Production deployment id: `dpl_ABUCNvnneZ5aTcLhwe51ChVRznBi`
- Production URL: `https://smash-op3577c8f-davidalonsoc4-8740s-projects.vercel.app`
- Production aliases:
  - `https://smash-lob.vercel.app`
  - `https://smash-lob-davidalonsoc4-8740s-projects.vercel.app`
  - `https://smash-lob-git-main-davidalonsoc4-8740s-projects.vercel.app`
- Production status: `Ready`

## Smoke-test snapshot (2026-07-20)

- `/` -> `200 text/html`
- `/api/auth/session` -> `200 application/json` with controlled anonymous response
- Production `/api/invites/CODEX-ENV-ISOLATION-CHECK-20260720` -> `404 application/json`, proving the server-side Supabase lookup completes without a credential error.
- Staging is intentionally behind Vercel Authentication. Authenticated Vercel checks returned an anonymous session and `{ "snapshot": null }` for the controlled invalid invite.
- Direct service-role REST reads completed without `401`: Production returned an exact league count of 3 and PRE returned 0.
- Production owner lookup found one account with league creation enabled and 3 creator memberships.
- PRE owner lookup found one account with league creation enabled and no memberships, consistent with an independent empty PRE dataset.

## Manual two-account verification completed

The project owner completed the interactive Production walkthrough with two Google accounts on 2026-07-18. The human-verified checklist covered:

- organizer sign-in
- opening the league
- generating a player invite
- joining with a second Google account
- claiming a player
- saving availability
- verifying calendar and ranking
- registering or reviewing a result
- verifying result confirmations and MVP voting
- opening and validating a spectator invite

This is human acceptance evidence reported by the project owner. It was not replayed independently by Codex, but it closes the final manual release check documented for the closed beta.

## Known residual risks

- Supabase platform defaults for `supabase_admin` in schema `public` remain an environment-level residual in `pg_default_acl`, although current public business tables remain owned by `postgres` and current-object grant/function audits are clean.
- Supabase security advisors still emit `RLS Enabled No Policy` informational findings on intentionally grants-closed server-only tables.
- The repo still has no automated test suite, so runtime confidence comes from static review plus Preview/Production smoke testing.
- The Google OAuth organizer/member/spectator round-trip now has human Production acceptance evidence; there is still no automated browser end-to-end suite to replay it continuously.

## Blockers

- No current release blocker is documented for the closed-beta scope.
- The application is considered Production Ready for controlled sharing with the league participants.

## v0.13.4 - Profile and navigation consistency (2026-07-24)

- Added a compact `/settings/profile` screen that unifies account-name and active-league avatar editing.
- Kept create-league and join-league actions directly in Settings.
- Replaced remaining text navigation arrows with the shared `ClickableChevron` component.
- Made the current closed-beta version explicit on the public changelog card.
- No database migration is required.

## v0.14.1 - Settings polish (2026-07-24)

- Removed the duplicate application-version navigation row from Settings and restored the centered closed-beta version footer.
- Simplified the public changelog to show only release entries.
- Changed notification preference groups to load collapsed.
- Reworked per-day availability into compact expandable rows and removed the redundant profile-return button.
- Reduced Activity tab and Help screen visual scale to match the Settings architecture.
- No database migration, API, permission, route, or search-index change is required.

## v0.14.2 - Suggestions and settings search (2026-07-24)

- Added an authenticated suggestion inbox with private per-user submission history.
- Added a superuser-only suggestion review screen with internal status and notes.
- Added migration `20260724111500_add_application_suggestions.sql`; browser roles have no direct table access.
- Replaced the inline Settings search bar with a floating search control above the bottom navigation.
- Expanded the search index to cover notification groups, season rules, operations, exports, application administration, and suggestions.
- Improved search matching for natural phrases, plurals, partial words, and small typing errors.
- Compacted Match "More actions" entries to remain on a single line.

## v0.14.3 - Contextual help and stable search dialog (2026-07-24)

- Fixed the floating Settings search dialog to a stable responsive height; only the results area scrolls when the query or result count changes.
- Added a shared multilingual season guide used by Help and by the pre-join rules acceptance screen.
- Help now documents recent application features and summarizes the active roster, calendar, schedule, round-window, scoring, confirmation, MVP, fee, incident, and substitution configuration.
- Registration, MVP, incident, and substitute explanations are omitted when those features are disabled.
- The invitation rules summary now reflects the target season instead of always showing generic fee, calendar, MVP, and substitution rules.
- No database migration, API, permission, or search-index change is required.
- TypeScript syntax transpilation and isolated strict validation of the shared guide passed. Full project lint, typecheck, and build remain mandatory locally because dependencies were unavailable in the review container.

## v0.14.4 - Floating search dialog polish (2026-07-24)

- Anchored the Settings search dialog below the top floating controls while keeping its top edge fixed.
- Made the dialog height content-adaptive up to a responsive maximum.
- Limited scrolling to the results area and only when the content exceeds the available height.
- Extended the backdrop beyond the top viewport edge to remove uncovered pixels on mobile devices.
- No database migration, API, permission, route, or search-index change is required.
## v0.14.5 - React effect validation (2026-07-24)

- Removed synchronous state updates reached directly from effects in both suggestion screens.
- Made initial suggestion loads cancel-safe so late responses do not update unmounted pages.
- Moved notification hash expansion and scrolling into animation-frame callbacks.
- No database migration, API, permission, route, or search-index change is required.

## v0.14.6 - Reopen finished season hotfix (2026-07-24)

- Added a dedicated reopen path for finished seasons instead of reusing initial season start logic.
- Reopening preserves roster mode, players, registrations, season settings, existing matches, and results.
- Existing matches are reloaded from Supabase without calendar regeneration.
- No database migration is required.



## v0.15.0 - Image crop and optimization (2026-07-24)

- Added a reusable crop editor for player avatars and league logos.
- Added drag, zoom, rotation and final-shape previews before upload.
- Normalized client images to 512 × 512 compressed WebP data URLs.
- Added file type and 12 MB input-size validation.
- No migration, API, permission or database change is required.

## v0.15.1 - Loading states and skeletons (2026-07-24)

- Added reusable skeleton primitives and page compositions.
- Replaced generic session, profile and league-transition spinners with structured loading states.
- Added route skeletons for the most-used list, ranking, settings and detail screens.
- Skeleton animation respects reduced-motion preferences.
- No migration, API, permission or persistence change is required.

## v0.15.2 - Actionable empty states (2026-07-24)

- Added a shared empty-state component with context-specific actions.
- Replaced generic empty messages across matches, notifications, activity, suggestions, announcements, substitutes and statistics.
- Added compact variants for dense administrative screens.
- No migration, API, permission or persistence change is required.

## v0.15.3 - Contextual onboarding (2026-07-24)

- Added dismissible tips for Settings search, custom availability, Match actions and Season administration.
- Added a Help control to restore dismissed tips.
- Added Spanish, English and Basque onboarding copy.
- Tip state is local to the device and does not add server-side tracking.
- No migration, API, permission or remote persistence change is required.

## v0.15.4 - Lint cleanup (2026-07-24)

- Removed the unused translation binding reported by ESLint in `ProfileCompletionGate`.
- Preserved all profile completion, onboarding, and availability behavior.
- No migration, API, permission, or persistence change is required.

## v0.15.6 - Action feedback and connection recovery (2026-07-24)

- Added a global accessible action-feedback center above the bottom navigation.
- Added persistent offline status and a connection-restored confirmation.
- Added success/error feedback to profile, availability, notification, and suggestion actions.
- Added direct retry controls for recoverable availability, notification, and suggestion failures.
- No migration, API contract, permission, or database change is required.


## v0.16.1 - Location display consistency (2026-07-25)

- Centralized readable formatting for serialized schedule locations and courts.
- Fixed scheduled-match and upcoming-match notification bodies so legacy JSON values are never shown to users.
- Applied the formatter to Activity, match schedule summaries, calendar links and CSV exports.
- Added consistent Colorful-mode accents to notification, activity and schedule cards.
- No migration, API contract, permission or persistence change is required.

## v0.16.2 - Colorful appearance palettes (2026-07-25)

- Added five prepared palettes for Colorful mode: indigo/violet, blue/turquoise, emerald, coral/pink and orange/purple.
- Centralized palette values through CSS variables used by backgrounds, surfaces, navigation, cards, forms, standings and skeletons.
- Added device-local palette persistence and early startup application to avoid visual flashes.
- Preserved semantic match, payment, warning, success and error colours independently from the selected palette.
- Added Spanish, English and Basque labels plus Settings search terms.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.3 - Independent theme and visual style (2026-07-25)

- Split appearance into Light/Dark/System base theme and Plain/Colorful visual style.
- Added a compact Themes and appearance screen and reduced the main Settings block to one summary row.
- Added dedicated dark variants for all five Colorful palettes.
- Added automatic legacy localStorage migration and early startup application without visual flashes.
- Added Spanish, English and Basque copy plus updated Settings search routing.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.4 - Visual consistency, action feedback and image viewer (2026-07-25)

- Consolidated transient save confirmations in the global accessible feedback center.
- Improved Colorful-mode contrast for primary actions, secondary text, disabled controls and semantic notices, especially in dark mode.
- Added an accessible lightbox for main league logos and player profile images.
- Preserved inline contextual errors, retry behaviour, status colours and all existing business logic.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.5 - Visual closure and Settings search (2026-07-25)

- Extended the existing floating Settings search to the main navigation hubs for Settings, league administration, leagues and application administration.
- Kept concrete action and form screens free from the additional launcher.
- Contained Colorful card accent strips inside rounded borders without globally clipping card content.
- Added subtle interaction outlines to muted buttons and links on dark Colorful palettes.
- No database migration, API contract, permission or persistence change is required.

## v0.16.6 - Dark Colorful contrast closure (2026-07-26)

- Removed palette-coloured glow from fixed top action controls in dark Colorful themes.
- Added a dedicated compact primary treatment for the invite share control.
- Restored readable muted labels on palette-primary surfaces, including player statistics and MVP summaries.
- Centralized the correction in theme CSS so selected cards and equivalent components inherit the same contrast fix.
- No database migration, API contract, permission or persistence change is required.

## v0.16.7 - Colorful card accent strip alignment (2026-07-26)

- Replaced the absolutely positioned Colorful card accent strip with a layered card background.
- The strip is now clipped by the card padding box and follows the exact rounded border geometry.
- Preserved dedicated notification, activity and schedule gradients through a shared CSS variable.
- Avoided global overflow clipping, so menus and interactive card content remain unaffected.
- No database migration, API contract, permission or persistence change is required.

## v0.16.8 - Bottom navigation and panel accent cleanup (2026-07-26)

- Removed the blurred palette-coloured glow projected above the bottom navigation.
- Replaced it with a one-pixel separator and a minimal inner highlight in light and dark Colorful combinations.
- Restored the top accent gradient in row-based cards whose opaque children covered the layered card background.
- Applied the shared accent-reveal treatment to Settings, league administration and custom availability panels.
- Preserved exact rounded-corner clipping, active navigation gradients, safe-area layout and all navigation behavior.
- No database migration, API contract, permission or persistence change is required.


## v0.16.9 - Transparent league logos (2026-07-26)

- Added automatic alpha detection to the shared crop output.
- Transparent league logos preserve their background through PNG output, with transparent WebP fallback when needed to stay within the existing server size limit.
- Opaque logos keep the previous WebP format, dimensions and quality, so existing visual behavior remains unchanged.
- Audited all league-logo render paths; the shared component already uses a transparent container and `object-contain`.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.10 - Settings panel accent alignment (2026-07-26)

- Replaced the row-card padding workaround with an explicit internal accent strip rendered by `AppCard`.
- The strip is now clipped by the exact panel border radius and cannot be hidden or displaced by opaque rows.
- Applied the same shared treatment to Settings, league administration and custom day availability.
- Plain mode remains unchanged and does not reserve accent-strip space.
- No database migration, API contract, permission or persistence change is required.



## v0.16.11 · Paletas naturales y búsqueda de ligas

- Seis paletas Coloridas con variantes clara y oscura.
- Migración local de las cuatro paletas retiradas.
- Buscador contextual de ligas en `/leagues`.
- Sin migraciones ni cambios de API.
