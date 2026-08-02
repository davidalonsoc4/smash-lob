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

## v0.17.0 - Advanced statistics foundation (2026-07-26)

- Added season player comparisons with recent form, direct rivalry results and individual progress.
- Added the most frequent opponent to the existing individual season analysis.
- Brought Match scheduling and scoreboard panels into the shared Colorful accent treatment and removed the schedule-header divider.
- Made Home winner and MVP headers inherit the active Colorful palette while preserving Classic styling.
- No database migration, API contract, permission or remote persistence change is required.


## v0.17.1 - Season evolution and records (2026-07-26)

- Added global season records and personal competitive milestones.
- Added best/worst position, personal streaks and opponent records.
- Added compact period records to player profiles.
- Kept all calculations client-side over counted finished matches.
- No database migration, API contract or persistence change is required.


## v0.17.2 - Competitive progress charts (2026-07-26)

- Added comparative position and cumulative-points charts by round.
- Reused the player comparison selectors and existing calculated progress.
- Added palette-aware series and accessible SVG descriptions.
- Added no external chart dependency.
- No database migration, API contract or persistence change is required.


## v0.17.3 - Shareable final season summary (2026-07-26)

- Added a final-season card with champion, MVP, podium and competitive highlights.
- Added local PNG generation and native file sharing with download fallback.
- Adapted generated image colors to Classic and Colorful appearance settings.
- Added no external capture or chart dependency.
- No database migration, API contract or persistence change is required.


## v0.17.4 - Advanced statistics hardening (2026-07-26)

- Added tie-aware positions and shared champion handling.
- Excluded empty, tied or otherwise invalid finished results from all statistical calculations.
- Added data-quality visibility for pending, excluded and invalid matches plus roster changes.
- Precomputed progress once per selected season and skipped it in historical summaries.
- Fixed position chart scaling and shared-summary edge cases.
- No database migration, API contract or persistence change is required.

## v0.17.5 - Schedule accent consistency (2026-07-26)

- Removed the scheduling-only warm/accent card gradient.
- Match scheduling now inherits the same shared Colorful accent strip as standard application panels.
- Preserved panel clipping, rounded corners, layout and all scheduling behavior.
- No database migration, API contract, permission or persistence change is required.

## v0.17.6 - Statistics information architecture (2026-07-26)

- Replaced the overloaded statistics landing page with a compact overview.
- Split standings, comparison, individual analysis, records and season summary into dedicated routes.
- Preserved the selected season across statistics navigation through URL state.
- Reused one shared counted-match and statistics workspace across every detail page.
- Kept all v0.17 calculations available without changing formulas, APIs or persisted data.
- No database migration, API contract, permission or persistence change is required.

## v0.17.7 - Statistics callback dependency cleanup (2026-07-26)

- Replaced the type-only dependency on the full statistics object with the shared `MatchData` type.
- Removed the `react-hooks/exhaustive-deps` warning from the statistics workspace callback.
- Preserved all v0.17.6 routes, calculations and behavior.
- No database migration, API contract, permission or persistence change is required.


## v0.17.8 - Individual statistics refinement (2026-07-27)

- Added floating confirmation after creating or editing a match result.
- Added an all-player evolution route with position and accumulated-points views.
- Removed statistical pair rankings and shared-match counters from the v0.17 workspace.
- Ranked the strongest teammate by set differential and then game differential.
- Hid habitual-opponent frequency in balanced calendars.
- Reused the season selected on the statistics landing page across detail routes.
- Strengthened chart distinction through categorical colors, dash patterns and marker shapes.
- No database migration, API contract, permission or persistence change is required.

## v0.17.9 - Head-to-head and compact league evolution (2026-07-27)

- Renamed the two-player comparison route to Cara a cara and removed its duplicated evolution chart.
- Kept player summaries, recent form and direct-rivalry information focused on exactly two selected players.
- Replaced the league-evolution Top 4 shortcut with Top 3.
- Placed chart-mode and visibility selectors on one compact row and removed the repeated internal heading.
- Added one tick for every visible integer position and made seven rounds fit without horizontal scrolling.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript syntax and chart-logic checks pass; full lint, project type-check and build remain pending in the local worktree because this review archive excluded `node_modules` and the package registry returned HTTP 503.

## v0.17.10 - Statistics usability and richer comparisons (2026-07-27)

- Differentiated participant and spectator invitation actions with dedicated user-plus and share icons.
- Removed the provisional podium, progress percentage, technical result counters and redundant navigation badges from the statistics landing page.
- Added sticky, editable player selectors to Head-to-head and Individual analysis.
- Expanded Head-to-head with direct set/game totals and performance against common opponents without double-counting aggregate matches.
- Reworked global and personal season records into plain-language cards with match context.
- Removed the standalone data-quality panel from the season summary, moved incomplete status beside the season label and blocked image export until the summary is complete.
- Rebuilt the shareable summary highlights and added cumulative game differential to league evolution.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript transpilation and structural checks pass; full lint, project type-check and build remain pending in the local staging worktree because this review archive excludes `node_modules`.

## v0.17.11 - Floating statistics selectors and Classic accents (2026-07-27)

- Replaced the CSS-only sticky selectors with a shared intersection-driven fixed selector in Head-to-head and Individual analysis.
- Preserved the original selector height while floating to prevent content jumps and kept every player field editable.
- Positioned the floating layer below the existing top controls and restored it to normal flow when scrolling upward.
- Added restrained grayscale gradient accent strips to cards in Classic light and Classic dark while leaving Colorful palettes unchanged.
- Added reduced-motion handling for the selector entrance transition.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript transpilation and structural checks pass; full lint, project type-check and build remain pending in the local staging worktree because this review archive excludes `node_modules`.

## v0.17.12 - League-wide statistics and individual evolution chart (2026-07-27)

- Made the fixed Head-to-head and Individual analysis selectors fully opaque with theme-aware borders and stronger exterior shadows.
- Added a `Toda la liga` statistics scope whenever a league contains more than one season; single-season leagues keep the selector hidden.
- Aggregated valid matches, rankings, comparisons, player details and records across all real seasons while resetting win streaks at season boundaries.
- Replaced the Individual analysis round table with a line chart for position, points and cumulative game differential.
- Preserved teammate, opponents, result and round context for every individual chart point.
- Rebuilt whole-league progress from each real season so metrics restart correctly, season boundaries are visible and lines do not imply continuity between competitions.
- Kept shareable final-summary images season-specific to avoid mixing champions, MVPs and podiums from different seasons.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript syntax, semantic and aggregation smoke checks pass; full lint, project type-check and build remain pending in the local staging worktree because this review archive excludes installed dependencies.

## v0.17.13 - Taller and clearer season summary image (2026-07-27)

- Switched the generated season-summary asset used for both sharing and downloading to a taller vertical format.
- Reworked the image layout so champion, MVP, podium and highlights use the extra height with clearer spacing and hierarchy.
- Enlarged highlight cards and simplified podium rows to improve readability in the exported image.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript syntax checks pass locally on the modified renderer; full lint, project type-check and build remain pending in the staging worktree with installed dependencies.


## v0.17.14 - Exported season summary readability fix (2026-07-27)

- Rebuilt the exported season-summary image with a taller single-column layout to avoid text collisions.
- Split champion and MVP into independent hero cards with more vertical space and stronger hierarchy.
- Stacked highlight cards vertically and constrained long copy to controlled wrapped lines with ellipsis.
- Kept sharing and downloading on the same generated asset.
- No database migration, API contract, permission or persistence change is required.
- Full lint, type-check and build remain pending in the local worktree with installed dependencies.


## v0.17.15 - Season summary export polish (2026-07-27)

- Combined champion and MVP into a single panel whenever they refer to the same player set.
- Added key player stats (points, wins, games difference) to hero panels in the page preview and exported image.
- Added games difference to podium rows in both the preview card and the exported image.
- Removed the intermediate badges for highlighted positions/moments and increased spacing between podium and highlights.
- Switched the generated summary image to a primarily light background regardless of the active app theme.
- No database migration, API contract, permission or persistence change is required.


## v0.17.16 - Compact monochrome season summary (2026-07-27)

- Replaced theme-driven export colors with a stable monochrome palette.
- Rendered separate champion and MVP panels side by side instead of vertically.
- Reduced hero, podium and highlight-card heights and tightened typographic hierarchy.
- Rendered highlights as a 2x2 grid in the exported image and two columns in the page preview when space allows.
- Switched the export canvas to a substantially shorter dynamic height.
- No database migration, API contract, permission or persistence change is required.


## v0.17.17 - Taller season summary readability pass (2026-07-27)

- Replaced the 2x2 highlight grid with a single-column list so long highlight text remains readable.
- Restored full-width champion/MVP hero cards to avoid displaced names and unused horizontal space.
- Increased the export canvas height slightly to improve breathing room and visual rhythm.
- Synced the in-page preview card with the same stacked hero/highlight presentation.
- No database migration, API contract, permission or persistence change is required.
## v1.1 stability hardening — checkpoint inicial (2026-08-02)

- Validación final local del árbol exacto: `npm ci` pasó; comprobación de secretos,
  seguridad y URLs pasó; `npm audit --json` informó 0 vulnerabilidades; lint,
  TypeScript y build pasaron; Vitest pasó 15 archivos/57 pruebas; Playwright pasó
  8/8 pruebas móvil/escritorio, incluidas Axe y referencias visuales; `git diff
  --check` pasó.
- `npm run env:check` detectó correctamente que la credencial
  `SUPABASE_SERVICE_ROLE_KEY` no está disponible en el entorno local real. El script
  pasó con un marcador de validación no secreto, demostrando el contrato sin fingir
  una credencial ni habilitar pruebas remotas.
- La revisión completa contra `staging` no encontró migraciones, secretos, dominios
  Vercel funcionales ni cambios de producto ajenos al objetivo.
- La rama permanece local, sin despliegue ni commits remotos. PRE no se ha modificado
  porque faltan credencial dedicada, pruebas OAuth/fixtures y autorización adicional
  para push, merge y despliegue. `main` y PROD permanecen intactos.
- Segundo bloque implementado: rate limiting reutilizable con respuesta 429,
  `Retry-After` y log seguro en invitaciones, espectadores, sugerencias y dispatch;
  baja push y endpoints 404/410 ahora se eliminan en lugar de quedar deshabilitados.
- El service worker usa caché `smash-lob-v1.1.0-rc.1`, elimina cachés anteriores,
  conserva un shell mínimo/offline y solo activa una revisión cuando el usuario lo
  solicita desde el nuevo aviso de actualización.
- Playwright descubrió y permitió corregir CSP de desarrollo, semántica ARIA de los
  skeletons y contraste del pie público. La ejecución móvil/escritorio terminó con
  8/8 pruebas E2E, Axe y visuales superadas.
- La candidata ya declara `1.1.0-rc.1`, incorpora CI, comprobación local de secretos,
  documentación de operación/aceptación y carga diferida del generador Excel.
- Se añadieron pruebas de autorización para anónimo, outsider entre ligas, jugador,
  espectador, admin, creator y superusuario, sin conceder una membresía de creator
  implícita al superusuario.
- No hay migraciones nuevas ni cambios remotos. OAuth real, flujos persistentes con
  fixtures y las ocho pantallas autenticadas siguen como validaciones manuales de PRE.
- Primer bloque implementado: entorno Auth.js explícito, logging estructurado seguro,
  página de error de autenticación con incidencia, retorno exacto de invitaciones,
  límites de host para URLs, páginas de error/offline y cabeceras de seguridad.
- Se corrigió `localhost:300` a `localhost:3000` y se retiró `AUTH_URL` del ejemplo
  porque la versión/configuración actual no demuestra que sea necesario.
- CSV y Excel neutralizan valores de texto que empiezan por `=`, `+`, `-` o `@`.
- Se añadió infraestructura Vitest, Testing Library, Playwright y Axe, con las primeras
  pruebas de Auth, URLs, clasificación/desempates, exportaciones, acceso anónimo,
  errores, accesibilidad y regresión visual.
- Primer control: lint pasó. TypeScript señaló fixtures incompletos que se corrigieron.
  Vitest quedó sin ejecutar por `spawn EPERM` dentro del sandbox y debe repetirse con
  permiso. La comprobación de entorno detectó `SUPABASE_SERVICE_ROLE_KEY` ausente sin
  imprimir valores; las pruebas reales de PRE siguen bloqueadas por esa credencial.
- Se verificó un árbol de trabajo limpio y se ejecutó `git fetch origin --prune`.
- `staging` coincide con `origin/staging` en `3495324` y declara v1.0.0.
- El árbol de archivos de `staging` es idéntico al de `main`; `main` solo añade el
  commit de merge de la versión estable.
- Se creó `feature/v1.1-stability-hardening` desde `staging`; no se reutilizó v0.19.
- `npm ci` reproducible pasó tras repetirlo fuera del sandbox por un `spawn EPERM`
  local. No se ejecutó ningún `npm audit fix`.
- El inventario y las prioridades están registrados en `docs/V1_1_PLAN.md`.
- No se ha modificado `main`, ningún remoto, ninguna base de datos ni ningún despliegue.

## v1.1 stability hardening — merge local en staging (2026-08-02)

- La credencial de servicio dedicada de PRE está presente en `.env.local` y en la
  variable sensible `SUPABASE_SERVICE_ROLE_KEY` de Vercel Preview para `staging`;
  no se registró ningún valor y Production permaneció intacta.
- `npm run env:check` pasó con las siete variables obligatorias presentes y sus
  valores ocultos.
- La reinstalación reproducible con `npm ci` terminó con código 0. Aunque su resumen
  inicial mostró un aviso de auditoría no reproducible, `npm audit --json` y
  `npm audit --audit-level=high` se repitieron después y confirmaron 0
  vulnerabilidades; no se ejecutó ningún comando de corrección automática.
- `npm run validate` pasó completo: entorno, secretos, seguridad, URLs públicas,
  lint, TypeScript, 15 archivos/57 pruebas Vitest y build de producción.
- `npm run test:e2e` pasó 8/8 pruebas en Chromium móvil y escritorio, incluidas Axe
  y referencias visuales; `git diff --check` también pasó.
- `feature/v1.1-stability-hardening` se subió y se verificó directamente en GitHub
  en `0b960bd41e959c97768dfc7bd599fbb999c0c753`.
- `staging` se sincronizó por avance rápido en `3495324` y recibió localmente el
  merge `515c542`; el merge aún no se ha subido ni desplegado.
- `main`, Production, la etiqueta `v1.0.0`, las bases de datos y las migraciones
  permanecen intactas.
- Siguen pendientes el despliegue y smoke tests de PRE, OAuth Google real, fixtures
  persistentes, pruebas autenticadas, aislamiento entre dos ligas y push real.

## v1.1 stability hardening — actualización de seguridad previa a PRE (2026-08-02)

- La repetición final de `npm ci` sobre el merge local descubrió 5 avisos altos
  nuevos de `npm audit`, todos originados por `brace-expansion` 1.1.16 en la cadena
  de herramientas de ESLint. La promoción se detuvo antes de validar, subir
  `staging` o desplegar PRE.
- El aviso `GHSA-mh99-v99m-4gvg` establece 1.1.17 como primera revisión corregida
  de la rama 1.x. Se actualizó únicamente el override 1.x de 1.1.16 a 1.1.17,
  sin salto mayor de ESLint ni corrección automática de npm.
- La línea base interna exige ahora 1.1.17 o superior para las cuatro copias
  limitadas a herramientas de lint; la copia principal de runtime permanece en
  la revisión corregida 5.0.8.
- `npm install --package-lock-only --ignore-scripts`, `npm run security:check`,
  `npm audit --audit-level=high` y `git diff --check` pasaron; la auditoría
  confirmó 0 vulnerabilidades.
- `staging` sigue solo local y `main`, Production, PRE, las bases de datos y las
  migraciones permanecen intactas. Todos los gates completos deben repetirse
  sobre este nuevo árbol antes de cualquier push.
- Tras crear `b5ae653`, la repetición desde cero terminó correctamente: `npm ci`
  informó 0 vulnerabilidades, `npm audit --audit-level=high` confirmó 0,
  `npm run validate` pasó entorno, secretos, seguridad, URLs, lint, TypeScript,
  15 archivos/57 pruebas y build, y `npm run test:e2e` pasó 8/8 pruebas.
- La candidata corregida queda lista localmente para subir `staging`; el despliegue
  y los smoke tests de PRE siguen pendientes y no se ha tocado `main` ni Production.

## v1.1 stability hardening — deployment y smoke de PRE (2026-08-02)

- `origin/staging` se verificó en
  `e1e9b3efeb17a57b90b243d8ca9371c73a963d7e`; `main` y el commit de la etiqueta
  `v1.0.0` permanecen en `a4abbf06904cc48c9eb614d4b6c4f16214f52aac`.
- Vercel creó `dpl_DPYZ5cj88FfrqDKUuiu1q7JhG2QW` para ese SHA. El deployment quedó
  `Ready` y asignado a `pre.smashandlob.com` y al alias estable de `staging`.
- Las sondas autenticadas mediante la protección de Vercel devolvieron `200` para
  raíz, manifiesto, icono, sesión y proveedores; `401` para cron sin secreto y dos
  rutas de liga protegidas sin sesión; y `404` controlado para códigos sintácticamente
  válidos pero inexistentes de jugador y espectador.
- Los metadatos Google de Auth.js usan
  `https://pre.smashandlob.com/api/auth/signin/google` y
  `https://pre.smashandlob.com/api/auth/callback/google`.
- El manifiesto publicado identifica `Smash & Lob PRE` y el service worker contiene
  el marcador `smash-lob-v1.1.0-rc.1`. La consulta posterior de logs del deployment
  devolvió cero entradas de nivel error.
- Quedan como gates manuales el recorrido OAuth real, la versión visible dentro de
  la aplicación autenticada, los fixtures persistentes, aislamiento entre ligas,
  exportaciones, PWA y push en dispositivo real. No se ha tocado Production.

## v1.1 stability hardening — primer acceso OAuth real en PRE (2026-08-02)

- Una cuenta Google dedicada de pruebas completó el retorno OAuth real a
  `https://pre.smashandlob.com/` y cargó correctamente su liga existente
  `PREP LIGA`.
- La interfaz autenticada mostró `PRE · v1.1.0-rc.1` en la cabecera y
  `Smash & Lob · v1.1.0-rc.1` en Ajustes, cerrando la comprobación visible de
  versión.
- La cuenta no expone controles de administración en Ajustes, por lo que este
  recorrido valida el caso de miembro existente. Siguen pendientes una cuenta
  nueva/organizadora, los retornos exactos desde invitaciones y el resto de
  flujos persistentes manuales.
- Una segunda cuenta Google dedicada completó después su primer acceso a PRE y
  mostró el onboarding inicial para crear o unirse a una liga. Con ello quedan
  verificados los recorridos OAuth real de cuenta existente y cuenta nueva.
- La segunda cuenta no tiene habilitado el permiso de creación de ligas, por lo
  que aún no puede utilizarse como organizadora hasta preparar explícitamente
  ese fixture solo en Supabase PRE.
