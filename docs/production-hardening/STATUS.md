# v1.8.23 — Propuestas propias con contenido más ligero (2026-08-16)

- CHAT conserva el color dominante del tema en el contenedor exterior de las propuestas propias.
- Fecha, ubicación, votación, detalle de votos y badges interiores vuelven a superficies claras con texto oscuro.
- Las propuestas recibidas mantienen su presentación blanca y no cambia la lógica de votación, coordinación, reserva ni API.
- La cabecera de una propuesta propia vuelve a usar el mismo contraste `on-primary` que los mensajes enviados normales; el texto auxiliar y la hora/recibos comparten su estilo sin contaminar las superficies interiores claras.
- No se añaden migraciones ni se modifica el esquema de Supabase.

# v1.8.22 — Ajustes visuales de Chat y bandeja (2026-08-15)

- Las propuestas de ubicación centran verticalmente el nombre mientras no exista acuerdo y reservan espacio para la etiqueta `Acuerdo 4/4` cuando aparece.
- CHATS elimina los chevrons laterales de las conversaciones y recupera ese espacio para el contenido.
- Se conservan el ocultado del panel Pendiente de reserva tras confirmar y la diferenciación visual entre propuestas propias y recibidas.
- No se añaden migraciones ni se modifica el esquema de Supabase.

# v1.8.21 — Reserva pendiente desde acuerdo de fecha (2026-08-15)

- El detalle de Programación usa el formato `Jueves · 19 de Febrero de 2026 · 19:00`.
- Una fecha/hora con aprobación 4/4 pasa directamente a `awaiting_booking`; la ubicación ya no es requisito previo.
- CHAT fija el estado Pendiente de reserva sobre el historial y permite confirmar fecha, ubicación y pista o invalidar las fechas acordadas para abrir una nueva propuesta.
- Las ubicaciones aprobadas 4/4 se respetan al confirmar; sin acuerdo previo se ofrecen las ubicaciones configuradas, mientras las rechazadas 4/4 quedan señaladas y bloqueadas.
- Los votos ✓/✕ son reversibles al pulsar de nuevo el mismo voto.
- Los avisos de acuerdo de fecha y de partido programado comparten el hilo de notificación del chat; ambos incluyen a los cuatro participantes y se silencian en el dispositivo que mantiene ese CHAT visible.
- No se añaden migraciones ni se modifica el esquema de Supabase.

# v1.8.20 — Perfiles enlazados desde Chat (2026-08-15)

- Los nombres de jugadores visibles en CHAT abren su perfil mediante el `playerId` real del participante.
- El enlace se aplica al autor del bloque, detalle de votos y referencias de respuesta cuando el participante puede resolverse de forma segura.
- No hay cambios de API, permisos, Supabase, migraciones ni datos persistidos.

# v1.2.13 — Accesos de cierre y preparación operativa (2026-08-06)

- Inicio añade accesos a Historial y estadísticas y a Compartir resumen cuando la temporada está terminada.
- Registro de cambios ofrece contenido público genérico y detalle técnico exclusivo para superadministración.
- Quedan preparados observabilidad opcional, rulesets de GitHub, QA autenticada de PRE y backups cifrados de Supabase.
- Las integraciones externas permanecen desactivadas hasta configurar sus credenciales y variables.
- No se añaden migraciones ni se modifican datos persistidos.

# v1.2.12 — Automatización de calidad (2026-08-06)

- Supabase local reconstruye y prueba migraciones, actualización histórica y restauración de backup en CI.
- La autorización de liga y partido se centraliza y queda cubierta por una matriz completa de actores.
- Todas las rutas API se inventarían automáticamente y la allowlist pública queda cerrada.
- Se añaden presupuestos de código, bundle y Lighthouse con artefactos de diagnóstico.
- GitHub Actions separa los gates de código, navegador, base de datos y rendimiento.
- El rate limiting admite Redis REST compartido cuando se configuran credenciales y conserva fallback local; los logs incluyen metadatos de despliegue.
- No hay migraciones nuevas ni cambios de producto o datos persistidos.

# v1.2.11 — Valores iniciales de Notion Avatar (2026-08-06)

- Todas las categorías de Notion Avatar comienzan en el índice cero, mostrado como Estilo 1.
- Restablecer devuelve la receta completa a Estilo 1.
- La clave local experimental avanza a `smash-lob-avatar-lab-notion-v3` para no recuperar selecciones antiguas de PRE.
- No hay cambios de permisos, autenticación, API, Supabase, migraciones ni datos persistidos.
- La promoción conserva como requisitos manuales el backup de PROD y la auditoría SQL de identidades.

# v1.2.10 — Endurecimiento previo a producción (2026-08-06)

- Rama prevista: `chore/v1.2-prepublication-hardening`, creada desde `staging` en `bf605dd07bee3659a315c3ee1b0bec06daa4bfbf`.
- Avatar Lab queda habilitado únicamente en `pre.smashandlob.com` y desarrollo local; Ajustes, búsqueda, páginas y API quedan bloqueados en PROD.
- Los renderizadores experimentales requieren sesión, aplican rate limiting y no generan cachés públicas compartidas.
- Las nuevas imágenes globales se generan a 256 × 256 y se limitan a 160 KB; la lectura mantiene compatibilidad con imágenes antiguas de hasta 512 KB.
- `/api/access` publica `X-Smash-Lob-Snapshot-Bytes` y registra una advertencia estructurada cuando el snapshot supera 1 MB.
- Se añaden `/api/health`, smoke tests PRE/PROD, validación de versión, auditoría de migraciones e identidad, y checklist de promoción.
- La publicación a PROD queda bloqueada hasta superar `npm run release:check`, el smoke de PRE, la auditoría SQL y las comprobaciones manuales autenticadas del checklist.
- No se modifica ninguna migración ya aplicada; cualquier reparación de datos debe añadirse en una migración posterior y reversible.
- La regresión visual detectada en Ajustes correspondía al test: ocultaba únicamente la fila experimental y dejaba la sección vacía; v1.2.10 oculta la sección completa sin renovar snapshots.
- `npm audit --omit=dev --audit-level=high` informa cero vulnerabilidades de producción; los avisos altos de `npm ci` quedan limitados a herramientas de desarrollo.

# Avatar Lab v1.2.8 — Notion compacto (2026-08-05)

- Editor Notion reorganizado en una única vista móvil con preview y controles visibles simultáneamente.
- Eliminados presets, selección de forma y selección de fondo.
- Lienzo Notion fijo, rectangular y blanco.
- Categorías accesibles con anterior/siguiente y selector nativo; estilos centrados en navegación anterior/siguiente.
- Sin cambios en perfil, Supabase o datos de liga.

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

- Added a compact `/settings/profile` screen that unifies account-name and global profile-image editing.
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

## v1.1 stability hardening — fixtures persistentes y exportaciones de PRE (2026-08-02)

- Una cuenta dedicada de pruebas con rol `creator` abrió tres ligas existentes de
  PRE, inició `Temporada 2` en `Liga prep pruebas última` y generó sus 14 partidos.
- El primer partido se programó para el 2 de agosto de 2026 a las 23:00 en
  Polideportivo de Lasesarre. Se registró el resultado 6-4, 3-6, 6-2, se editó
  después el tercer set a 6-3 y se verificó que la corrección persistía tras
  recargar y navegar.
- El cambio entre esa liga, con 1 de 14 partidos jugados, y `PREP LIGA`, finalizada
  con 14 de 14, mantuvo separadas sus temporadas, calendarios, resultados y
  clasificaciones. La comprobación de autorización directa con una cuenta ajena a
  la primera liga sigue pendiente.
- Desde una sesión autenticada real se ejecutó la acción Compartir del resumen
  final de `PREP LIGA` sin error de aplicación y se descargaron los archivos Excel
  y CSV de `Temporada 3`.
- El Excel descargado contiene las hojas `Clasificación` (8 jugadores) y
  `Resultados` (14 partidos). El CSV contiene 14 filas y las mismas 12 columnas de
  resultados. La importación estructural, la comparación celda a celda entre ambos
  formatos y la revisión visual de todas las hojas no detectaron diferencias ni
  errores de fórmula.
- Antes de consultar una invitación de fixture con la credencial de servicio, una
  guarda local verificó el destino configurado y detuvo la operación: el
  `NEXT_PUBLIC_SUPABASE_URL` de `.env.local` apunta al proyecto Production
  `szycbwdzestcmimziyey`, no al proyecto PRE `miadjotkucgluwbrgeih`. No se llegó a
  ejecutar ninguna consulta de base de datos. Las comprobaciones con service role
  quedan pausadas hasta alinear en `.env.local` la URL, la clave anónima y la clave
  de servicio del mismo proyecto PRE.
- Las tres variables locales se corrigieron después con sus valores de Preview
  `staging`. La URL apunta a `miadjotkucgluwbrgeih`, la clave pública fue aceptada
  por Auth de Supabase y una lectura controlada con service role devolvió las tres
  ligas de PRE.
- La prueba real de caducidad reveló un fallo bloqueante: después de regenerar la
  invitación de `PREP LIGA`, el enlace anterior seguía resolviendo la liga. La
  función SQL conservaba todas las filas históricas con `revoked_at` nulo y el GET
  público, al usar service role, no aplicaba explícitamente el filtro RLS.
- Se añadió una comprobación compartida de vigencia a la resolución y al canje,
  filtros explícitos de `revoked_at` y la migración
  `20260802233000_revoke_previous_league_invites.sql`, que revoca los códigos
  anteriores de cada liga y hace atómica esa revocación en futuras regeneraciones.
- La migración pasó `supabase db push --linked --dry-run` y el enlace se verificó
  contra PRE. Se creó antes una copia local mínima de las 12 filas de `invites`
  con solo `id`, `league_id` y `revoked_at`; no contiene códigos de invitación.
- La corrección local pasó la prueba focalizada (3/3), lint, TypeScript,
  `npm run validate` completo (16 archivos/60 pruebas y build), Playwright 8/8,
  `npm audit --audit-level=high` con 0 vulnerabilidades y `git diff --check`.
  La migración todavía no se ha aplicado y la corrección aún no está desplegada.
- Los commits `df41351` (código, prueba y migración) y `cfc1a68`
  (documentación/evidencia) se subieron a `origin/staging`, verificado exactamente
  en `cfc1a689adb57d194d7f0a3d56cc5ed01a9ce415`. `main` y `v1.0.0` continúan en
  `a4abbf06904cc48c9eb614d4b6c4f16214f52aac`.
- Vercel desplegó ese commit como `dpl_EFz6DA7qLrHg6YgSC2u26LKqEByA`; alcanzó
  `Ready`, quedó asociado a `pre.smashandlob.com` y el log de build confirmó
  rama `staging`, commit `cfc1a68`, 0 vulnerabilidades, TypeScript y build correctos.
- La aplicación de la migración a Supabase PRE queda pendiente de autorización
  remota explícita. El cálculo previo confirma que revocará 9 invitaciones
  históricas todavía activas y conservará las 3 invitaciones actuales, una por
  cada liga PRE.
- Tras la autorización explícita, la migración
  `20260802233000_revoke_previous_league_invites.sql` se aplicó únicamente en
  Supabase PRE y aparece alineada en el historial local/remoto. La verificación
  posterior confirmó 9 invitaciones revocadas, 3 activas y correspondencia exacta
  entre cada invitación activa y el código actual de su liga.
- Una primera sonda externa con `fetch` pareció devolver snapshots antiguos con
  `x-vercel-cache: HIT`, pero la inspección de la URL final demostró que la
  petición había seguido la redirección de Deployment Protection y estaba
  midiendo la página de acceso de Vercel, no la API de PRE. Se corrige aquí esa
  clasificación para no atribuir a la aplicación una respuesta que no emitió.
- Se añadieron cabeceras reutilizables `private, no-store` para las respuestas GET
  de invitaciones de jugador y espectador, más `revalidate = 0` y una prueba
  específica de las tres capas de caché. La corrección pasó `npm run validate`
  (17 archivos/61 pruebas y build), Playwright 8/8 y `git diff --check`.
- El commit `1224684` se subió a `origin/staging` y Vercel lo desplegó como
  `dpl_BqxEmdc1cajdKCg1HPmP6WWVcZQF`, `Ready` y asociado a
  `pre.smashandlob.com`. Las cabeceras `no-store` se mantienen como defensa en
  profundidad aunque no existía el snapshot obsoleto inicialmente diagnosticado.
- Con autorización explícita se ejecutó la purga CDN a nivel de proyecto. La
  operación vació también la caché CDN de Production, sin cambiar su código ni
  sus datos.
- La repetición autenticada contra PRE confirmó que la invitación revocada y una
  invitación inexistente devuelven `snapshot: null`, mientras que la invitación
  vigente resuelve el snapshot de su liga. Las sondas exactas con autenticación
  de Vercel contra el deployment devolvieron `404`, `Age: 0`,
  `X-Vercel-Cache: MISS` y las tres cabeceras `no-store` tanto para la ruta de
  jugador como para la de espectador. Queda cerrado el gate de invitaciones
  inválidas y caducadas en PRE.
- Una cuenta dedicada de miembro, perteneciente únicamente a `PREP LIGA`, mostró
  solo esa liga en el selector. El acceso directo al partido fixture de la liga
  del organizador devolvió «Partido no encontrado» sin exponer sus datos.
- La respuesta autenticada de `/api/access` para esa misma cuenta contenía
  exclusivamente `PREP LIGA` y no incluía ni la segunda liga ni su partido. Junto
  con el cambio de ligas previamente validado desde la cuenta `creator`, queda
  cerrado el gate de aislamiento cruzado con las dos ligas fixture de PRE.
- La cuenta dedicada de miembro se suspendió temporalmente solo en Supabase PRE.
  La aplicación mostró el bloqueo «Cuenta suspendida» y ocultó los datos de liga.
  La cuenta se reactivó inmediatamente, se limpiaron el motivo y la fecha de
  suspensión y se confirmó que recuperaba el acceso normal a `PREP LIGA`.
- El onboarding ya verificado con la segunda cuenta Google dedicada cubre el caso
  de usuario autenticado sin acceso a ninguna liga. Con ambas evidencias queda
  cerrado el gate de usuario suspendido y usuario sin acceso contra PRE.
- La inspección del workflow público de GitHub detectó que las siete ejecuciones
  de `v1.1 quality` habían fallado en el mismo test de URL, aunque el job
  `browser` de la ejecución más reciente había pasado sus 8/8 pruebas. El runner
  configura intencionadamente `NEXT_PUBLIC_APP_URL=http://localhost:3000`, pero
  `tests/unit/appUrl.test.ts` esperaba siempre el origen de Production al probar
  el rechazo de un host reenviado arbitrario.
- El test se aisló del entorno del runner fijando explícitamente la variante y la
  URL de Production solo durante ese caso y restaurando después las variables.
  La reproducción exacta pasó 4/4; `npm run validate` pasó los 17 archivos/61
  pruebas y el build con las variables del job, y `npm run test:e2e` pasó 8/8.
  Los avisos de deprecación de Node 20 emitidos por acciones de GitHub no fueron
  la causa del fallo.
- El commit correctivo `5bebfb2` se verificó en `origin/staging`. La ejecución
  remota `v1.1 quality #8` terminó en `Success`: el job `quality` pasó en 1m21s
  y el job `browser` pasó en 1m40s con 8/8 pruebas Playwright. El gate remoto
  queda restablecido.
- La prueba física en una PWA Android ya instalada confirmó la actualización
  visible a `v1.1.0-rc.1` y el alta/baja real de push. La baja eliminó exactamente
  un endpoint de Supabase PRE y el alta posterior creó exactamente uno nuevo
  habilitado, sin volver a solicitar un permiso Android que ya estaba concedido.
- El arranque posterior en modo avión reveló un fallo bloqueante: Android restauró
  la pantalla de acceso y Auth.js intentó consultar la sesión sin red, en lugar
  de mostrar la experiencia offline. La prueba anterior solo cubría una nueva
  navegación interceptada por el service worker y no la restauración de una PWA
  ya cargada.
- Se añadió `OfflineGate` antes de `AuthGate` y una vista offline compartida, de
  modo que la pérdida de red oculta el login y los datos privados antes de que
  Auth.js intente cargar. Playwright incorpora ahora un proyecto aislado con
  service workers reales que cubre pérdida de conexión sobre una página cargada,
  relanzamiento/navegación offline y recuperación mediante «Reintentar». La nueva
  prueba reproduce el fallo antes del cambio y pasa después de la corrección.

## v1.1 stability hardening — cobertura autenticada automatizada (2026-08-03)

- Playwright usa una sesión y datos demo exclusivamente locales para recorrer ocho
  pantallas autenticadas representativas en Chromium móvil y escritorio: inicio,
  partidos, clasificación, estadísticas, ajustes, invitación, administración de
  temporada y resumen de temporada. No intervienen cuentas personales, PRE ni
  Production.
- Axe descubrió contrastes insuficientes en las cinco áreas principales y en
  administración, además de campos de edición de jugadores sin nombre accesible.
  Se corrigieron todos los impactos críticos o graves detectados.
- La revisión también descubrió enlaces anidados en tarjetas de partidos. Los
  nombres conservan sus enlaces en contextos normales y se renderizan como texto
  cuando toda la tarjeta ya es un enlace.
- El recorrido Axe pasó en móvil y escritorio. Se generaron 16 referencias
  visuales, se inspeccionaron y la repetición sin actualización pasó en ambos
  proyectos.
- La baja automática de endpoints push caducados se extrajo a una operación
  comprobable. Diez pruebas confirman que HTTP 404/410 elimina exactamente la
  suscripción afectada y que un fallo reintentable HTTP 500 no elimina nada.
- La evidencia visual real ya obtenida en PRE, combinada con Axe y regresión
  visual local sobre las mismas ocho rutas, cierra ese gate sin exigir una nueva
  intervención humana. Sigue pendiente únicamente reproducir en un dispositivo
  real la caducidad 404/410 de un endpoint push y repetir el arranque offline
  físico tras la corrección ya desplegada.
- `npm run validate` pasó entorno, secretos, seguridad, URLs, lint, TypeScript,
  17 archivos/64 pruebas y el build de producción. La primera ejecución conjunta
  de Playwright saturó el compilador de desarrollo al lanzar 12 workers y cuatro
  pruebas públicas agotaron su espera sobre la pantalla de compilación; no fue
  un fallo funcional. Se limitó la concurrencia a cuatro workers locales y dos
  en CI, y la repetición completa pasó 13/13, incluida la PWA con service worker.
  `npm audit --audit-level=high` confirmó 0 vulnerabilidades y
  `git diff --check` pasó.
- Las ejecuciones remotas `v1.1 quality #11` a `#14` aislaron una diferencia
  visual de 126 píxeles exclusivamente en el campo de fecha de administración de
  temporada. La instrumentación temporal situó el cambio dentro del texto de
  `input[type="date"]`: Windows lo dibuja según la configuración regional del
  sistema, independientemente del locale configurado en Playwright.
- La referencia visual conserva el campo y su icono, pero oculta únicamente el
  texto nativo de fecha durante la captura. Se retiró la instrumentación temporal
  una vez localizada la causa. La validación posterior pasó TypeScript, 4/4
  pruebas visuales sin regenerar referencias y 13/13 pruebas E2E en modo CI.
  El commit correctivo `7c78928` quedó verificado exactamente en
  `origin/staging`.
- La ejecución remota `v1.1 quality #15` (`30772604704`) terminó en `Success`:
  tanto el job `quality` como el job `browser` pasaron. Queda resuelto el último
  fallo visual específico del runner de Windows.
- La repetición física posterior en Android, con la PWA instalada y el modo avión
  activo, mostró correctamente la vista «Sin conexión» y la acción «Reintentar».
  Sin embargo, la continuación de la prueba demostró que el gate aún no estaba
  cerrado: al recuperar red la aplicación entraba en el formulario de perfil con
  un error de `fetch`, y un relanzamiento en frío sin red volvía a mostrar el
  login. La primera observación solo validaba la pérdida de conexión sobre una
  página ya abierta.
- La causa de la reconexión era que el evento `online` ocultaba el fallback antes
  de que Auth.js renovase la sesión que había fallado sin red. El fallback queda
  ahora fijado hasta pulsar «Reintentar», acción que realiza una navegación
  completa y crea una sesión limpia.
- El service worker redirige los arranques offline nuevos a `/offline` y sirve esa
  ruta desde caché, evitando depender de la hidratación de la ruta privada o del
  valor inicial de `navigator.onLine`. Dos regresiones con service worker real
  cubren una sesión autenticada durante pérdida/recuperación de red y un
  relanzamiento desde una página cerrada.
- La corrección pasó `npm run validate` completo (17 archivos/64 pruebas y build)
  y 14/14 pruebas Playwright en modo CI. Quedan pendientes el despliegue en PRE y
  la repetición física en Android antes de cerrar el gate.
- Vercel desplegó `bd7d156` únicamente en Preview como
  `dpl_FbbAA1B6RShWsradNCgZc23YcxTa`, `Ready` y asociado a
  `pre.smashandlob.com`; el log confirmó rama `staging`, el commit exacto,
  TypeScript, build y 0 vulnerabilidades.
- GitHub Actions `v1.1 quality #18` pasó `quality`, pero la regresión de sesión
  falló en `browser` porque simulaba el evento offline antes de confirmar que la
  aplicación autenticada había terminado de hidratar. Se añadió una espera
  observable sobre la navegación autenticada; las dos regresiones PWA se
  repitieron cinco veces cada una en modo CI y pasaron 10/10. La corrección
  funcional no cambió.
- La ejecución remota posterior `v1.1 quality #19` terminó en `Success` con
  `quality` y `browser` correctos. El deployment final de esa revisión,
  `dpl_7cxM6CiYA36vvCxJTwZAqAREkYvW`, quedó `Ready`, asociado a PRE y sirviendo
  el service worker con la redirección offline esperada.
- Al instalar esa revisión en la PWA Android, el aviso de nueva versión apareció,
  pero «Actualizar ahora» no produjo una respuesta visible y fue necesario
  refrescar manualmente. El mensaje `SKIP_WAITING` queda ahora unido mediante
  `event.waitUntil` al ciclo de vida del service worker; el botón muestra
  «Actualizando…» y programa una recarga de respaldo a los cuatro segundos si
  Android no emite `controllerchange`.
- Tres pruebas unitarias cubren el ciclo de vida solicitado, la recarga de
  respaldo y el caso de worker ya no disponible. La corrección pasó
  `npm run validate` completo (17 archivos/66 pruebas y build) y 14/14 pruebas
  Playwright en modo CI. Quedan pendientes el despliegue y la repetición física.
- El commit `c9ad883` quedó verificado en `origin/staging`; GitHub Actions
  `v1.1 quality #20` terminó en `Success` con `quality` y `browser` correctos.
  Vercel lo desplegó en Preview como `dpl_7qD9985sfzA7PTxcmgoyFpEqmGYi`,
  `Ready` y asociado a `pre.smashandlob.com`; la sonda autenticada confirmó
  `event.waitUntil(self.skipWaiting())` en el service worker servido.
- La repetición física en Android mostró el aviso, «Actualizar ahora» cambió a
  «Actualizando…» y la PWA se recargó automáticamente. Queda validado en
  dispositivo real el flujo de actualización controlada; sigue pendiente repetir
  el arranque offline en frío y la recuperación de sesión con este worker.

## v1.1.0 — aceptación final y autorización de publicación (2026-08-03)

- La prueba física pendiente de arranque offline en frío se completó correctamente
  en Android con el worker final: al abrir sin conexión apareció `/offline`, no se
  mostró Google Login ni onboarding y, al recuperar Internet y pulsar **Reintentar**,
  se restauró la sesión mediante una navegación completa.
- El alta y la baja push normales ya estaban verificadas físicamente en Android y
  Supabase PRE. La reproducción física de un endpoint caducado `404/410` se omite
  por decisión explícita de aceptación porque el comportamiento está cubierto por
  diez pruebas automatizadas. Se acepta como riesgo residual bajo la posible
  permanencia temporal de una suscripción obsoleta; no afecta a datos de ligas ni a
  suscripciones válidas.
- Con esta decisión quedan cerrados los criterios de aceptación de PRE para la rama
  `feature/v1.1-stability-hardening`. Se autoriza promover `v1.1.0-rc.1` a
  `v1.1.0`, aplicar en PROD únicamente la migración
  `20260802233000_revoke_previous_league_invites.sql`, fusionar `staging` en `main`
  y crear la etiqueta anotada `v1.1.0`.
- La publicación debe detenerse si el dry-run de Supabase detecta una migración
  pendiente distinta de la esperada o si falla cualquier gate local. No se autoriza
  `db reset`, `migration repair`, `npm audit fix`, `push --force` ni la reactivación
  de códigos de invitación antiguos.
- Este checkpoint documenta la aceptación y autorización. La evidencia del commit,
  deployment y smoke tests de Producción se registrará tras ejecutar la publicación.

## v1.2.1 - Candidata descartada por error de concepto (2026-08-03)

- La candidata de PRE introdujo `league_memberships.league_avatar_url` y una imagen distinta por liga. El modelo fue rechazado antes de promoverlo a Producción.
- Se conserva como antecedente técnico la migración aplicada `20260803160000_add_league_avatars_and_restore_unlinked_identity.sql`; no se modifica porque las migraciones aplicadas son inmutables.
- La parte válida de la candidata es `players.link_identity_snapshot` y la restauración de nombre e iniciales al desvincular una cuenta.
- La fotografía no forma parte de la identidad histórica recuperable y debe desaparecer al eliminar el vínculo.

## v1.2.2 - Imagen global e identidad histórica corregidas (2026-08-03)

- Retirada de la interfaz, contratos, tipos, carga de acceso, invitaciones, actividad y duplicación de temporadas toda dependencia del avatar específico por liga.
- La edición de imagen de Ajustes actualiza ahora `app_users.avatar_url`, por lo que la imagen es global para la cuenta y se refleja en todas sus ligas.
- La prioridad actual queda como imagen global de la cuenta vinculada y, si no existe, avatar predeterminado con iniciales. Los jugadores sin cuenta vinculada quedan siempre sin fotografía.
- La instantánea `link_identity_snapshot` conserva únicamente `displayName` y `avatarInitials`; al desvincular se restauran esos datos, se limpia `avatar_url` y vuelve el avatar predeterminado.
- Añadida la migración de avance `20260803203000_remove_league_avatars_and_keep_account_identity.sql`, que elimina `league_avatar_url` de PRE, limpia cualquier fotografía almacenada en `players` y redefine el trigger sin fotografías históricas.
- El futuro editor de avatares queda fuera de esta versión y deberá guardar un avatar global del usuario, independiente de sus ligas y de la fotografía subida.
- Versión incrementada a `v1.2.2`; changelog y caché PWA actualizados.
- Validación disponible en este entorno: los 24 archivos TypeScript/TSX modificados transpilan sin errores de sintaxis; los contratos estructurales de imagen global, API de cuenta, ausencia de escritura de imágenes por jugador, migración y versión pasan; también pasan la línea base de seguridad, las URLs públicas y el escaneo de secretos. `npm ci` no puede completarse aquí porque el registro interno devuelve 404 para `web-push@3.6.7`, por lo que lint, TypeScript completo, Vitest y build quedan como gate obligatorio del comando de aplicación antes de publicar PRE.

## v1.2.3 - Editor de imagen accesible en móvil (2026-08-03)

- El editor de recorte se monta mediante un portal en `document.body`, fuera de los contextos de apilamiento de la aplicación, y utiliza `z-[1000]` para quedar por encima de la navegación inferior y los controles flotantes.
- El diálogo se centra también en pantallas pequeñas, respeta las zonas seguras del dispositivo y limita su altura al viewport dinámico.
- El marco de recorte adapta su tamaño al espacio disponible; los cálculos de arrastre, zoom, rotación y exportación utilizan el tamaño real mostrado.
- El contenido central puede desplazarse de forma independiente y la barra con `Cancelar` y `Usar imagen` permanece fija y accesible.
- Añadida una prueba de contrato visual para impedir regresiones del portal, apilamiento, centrado, tamaño responsive y acciones visibles.
- No se requieren migraciones de Supabase ni cambios de persistencia.
- Validación disponible en este entorno: pasan el escaneo de secretos, la línea base de seguridad, las URLs públicas, `git diff --check`, la transpilación sintáctica de los cinco archivos TypeScript/TSX afectados y los contratos de portal, apilamiento, centrado, tamaño responsive, acciones visibles, versión y caché PWA. `npm ci` queda bloqueado aquí por un 404 del registro interno para `zod-validation-error@4.0.2`; el comando de aplicación mantiene `npm run validate` completo como gate obligatorio antes de publicar PRE.

## Avatar Lab DEMO 0.1 - experimento aislado de mundos de avatar (2026-08-03)

- Rama experimental independiente: `feature/avatar-worlds-demo`, creada desde el estado `staging` aprobado en `v1.2.3`. No modifica `main`, no añade migraciones y mantiene la versión global de la aplicación en `1.2.3`.
- Añadida la ruta PRE-only `/experimental/avatar-lab`, ausente de la navegación normal, con `noindex` y una rama propia en `AppRouteBoundary` que conserva autenticación y perfil completo, pero evita cargar proveedores de liga, partidos, temporada, MVP y `AppShell`.
- Implementada una única `AvatarRecipe` neutral y versionada, separada de `AvatarWorldPreference`. El espectador puede usar `pixel_chibi`; `chibi_illustrated` queda declarado, visible como «Próximamente» y sin renderer ni assets provisionales.
- El renderer Pixel Chibi utiliza SVG modular de coordenadas enteras sobre una plantilla lógica `192 × 240`, `shape-rendering="crispEdges"`, `image-rendering: pixelated`, paleta limitada y capas independientes para fondo, cuerpo, cabeza y pala. La referencia canónica queda guardada solo en documentación y no se usa como imagen plana.
- La orientación zurda refleja la geometría alrededor de x=96, pero la letra B de la pala se vuelve a dibujar fuera del grupo reflejado. Manga y muñequera se resuelven mediante lados relativos `dominant`/`non_dominant`.
- La DEMO incluye dos tonos de piel; tres estados de pelo; tres estados de barba; ojos y cejas configurables; gorra/cinta excluyentes; colores primario y secundario de camiseta; dos pantalones; manga, muñequera, calcetines, zapatillas y dos palas; además de aleatorización, restablecimiento, depuración y persistencia local versionada.
- Se añadieron manifest, paletas, esquemas portables, catálogos por categoría, guía de estilo, plantilla maestra, reglas de compatibilidad, arquitectura, alcance y roadmap bajo `public/avatars` y `docs/avatars`.
- Validación ejecutada en este entorno: `npm run avatars:check` pasa con 26 primitivas modulares; 28 archivos TS/TSX transpilan sin errores sintácticos; el typecheck estricto aislado de Avatar Lab pasa; las comprobaciones de ejecución de receta, normalización, aleatorización, persistencia y render diestro/zurdo pasan; todos los JSON cargan correctamente; la vista canónica se rasterizó desde el renderer real y se inspeccionó; `git diff --check` pasa.
- `npm ci` y, por tanto, `npm run validate` completo no pueden ejecutarse en este entorno porque el registro interno devuelve 404 para `zod-validation-error@4.0.2`. El script de entrega mantiene `npm ci`, `npm run avatars:check` y `npm run validate` como gates obligatorios antes del commit, push y publicación exclusiva en PRE.

## v1.2.4 - Laboratorio móvil de avatares limitado a PRE (2026-08-05)

- La rama experimental `feature/avatar-worlds-demo` se reduce a dos opciones viables: DiceBear Big Smile y Notion Avatar.
- Se eliminan Ready Player Me, Pacovqzz/Avatune, el prototipo Pixel Chibi y todos sus endpoints, recursos, modelos, documentación y pruebas huérfanas.
- Ajustes incorpora un acceso para usuarios autenticados; toda la ruta `/experimental/avatar-lab` permanece protegida por el layout PRE-only, `noindex` y el `AppShell` normal.
- Ambos editores adoptan componentes, anchura, tarjetas, navegación, tamaños táctiles y zonas seguras coherentes con la PWA móvil.
- Las recetas se conservan solo en `localStorage`; no existe integración con perfil, jugadores, Supabase ni migraciones.
- Notion Avatar se compone mediante un endpoint local cacheado a partir de los SVG abiertos del proyecto oficial, evitando la dependencia `react-notion-avatar` y su árbol de paquetes obsoleto.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.4`.
- La entrega debe superar el validador específico, Vitest focalizado, lint, TypeScript, suite completa y build antes de cualquier commit o publicación en PRE.

## v1.2.5 - Corrección de la línea base para publicar Avatar Lab en PRE (2026-08-05)

- Se mantiene el alcance funcional de v1.2.4: únicamente DiceBear Big Smile y Notion Avatar, sin escritura de perfil ni Supabase.
- La poda de dependencias reubicó tres copias heredadas de `brace-expansion@1.1.17` bajo plugins concretos de ESLint.
- El validador permite solo esas rutas exactas y exige que el lockfile las marque como dependencias de desarrollo; no se amplía la autorización al runtime.
- La copia principal de `brace-expansion` sigue obligada a `5.0.8` o superior.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.5`.
- Todos los gates se ejecutan antes del commit y de nuevo sobre el merge candidato a `staging`.

## v1.2.6 - Compatibilidad React del laboratorio de avatares (2026-08-05)

- Se eliminan las actualizaciones síncronas de estado ejecutadas directamente desde efectos en Big Smile y Notion Avatar.
- La restauración desde `localStorage` se realiza mediante tareas cancelables y las vistas previas derivan su estado de la URL o receta activa.
- El paginado de Notion se reinicia desde la acción de cambio de categoría.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.6`.
- No hay migraciones de Supabase ni cambios en datos persistidos.


## v1.2.7 - Limpieza de tipos generados y compatibilidad ES2017 (2026-08-05)

- La validación elimina `.next` y `tsconfig.tsbuildinfo` antes del typecheck para evitar referencias generadas a rutas experimentales ya retiradas.
- El renderer de Notion sustituye el flag `s` de expresión regular por un patrón multilínea compatible con el objetivo ES2017 del proyecto.
- Se mantiene el alcance de Avatar Lab: únicamente DiceBear Big Smile y Notion Avatar, limitado a PRE y sin persistencia en perfiles o Supabase.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.7`.
- No hay migraciones de Supabase ni cambios en datos persistidos.

## v1.9.0 - Resumen de jornada (2026-08-16)

- Nueva rama funcional prevista: `feature/v1.9.0-product-expansion`, basada en `main` v1.8.23 y destinada a agrupar las mejoras de producto posteriores al bloque de CHAT.
- `CALENDARIO` convierte la cabecera completa de cada jornada con partidos en un acceso pulsable a `/round/[id]`; no se añade un chevron ni una ruta duplicada.
- `/round/[id]` se redefine como `Resumen · Jornada X` y muestra estado/progreso, partidos, sets y juegos disputados, resultados compactos enlazados al detalle del partido, MVP y clasificación histórica.
- Con MVP por `voting` se muestran los MVP de cada partido; con `automatic` o `automatic_advanced` se muestra el MVP de jornada; `none` oculta el bloque.
- Mientras la jornada no está completa, la clasificación se etiqueta como provisional y los destacados definitivos permanecen bloqueados. Al completarse se calculan cambio de líder, mayor subida, partido más igualado y/o mejor racha según los datos disponibles.
- La clasificación histórica se calcula ignorando resultados de jornadas posteriores y muestra movimiento respecto a la clasificación anterior.
- El exportable de jornada y `Compartir resumen` quedan fuera de v1.9.0 inicial y son el siguiente desarrollo previsto.
- Se documentan en `docs/V1_9_PRODUCT_EXPANSION.md` los frentes posteriores ya acordados para valoración: nivel global orientado a amistosos, auditoría/expansión de estadísticas globales de parejas, sustituciones, cierre de temporada y panel de salud de administración.
- No hay cambios de API, Supabase ni migraciones en esta iteración.

## v1.9.1 - Pulido del Resumen de jornada (2026-08-16)

- El panel superior de la jornada usa `AppCard accentStrip` sin padding exterior para que la franja de acento quede anclada al borde superior; el titular deja el progreso `X/X partidos` exclusivamente en las métricas.
- `RESULTADOS` reutiliza `MatchDetailPairingPanel`, exactamente el componente del detalle de PARTIDO, con `linkPlayers={false}` para que el panel completo siga enlazando al partido sin enlaces anidados.
- Los destacados que representan un partido incorporan `matchId` y reutilizan el mismo `MatchDetailPairingPanel`; el resto de destacados mantiene su tarjeta textual.
- El contexto bajo `Resumen · Jornada X` vuelve a reflejar el estado real de la temporada y no el estado de la jornada.
- Se elimina la etiqueta aislada `JX` de la cabecera de clasificación.
- Se incorpora al pie el botón `Compartir resumen de jornada` con el mismo tratamiento primario del resumen de temporada. La generación/compartición de la imagen continúa pendiente para el siguiente desarrollo.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.2 - Destacados editoriales en Resumen de jornada (2026-08-16)

- `RESULTADOS` conserva el `MatchDetailPairingPanel` completo como representación canónica de los partidos.
- `LO MÁS DESTACADO` deja de repetir ese panel: los destacados ligados a un partido usan una tarjeta editorial compacta con motivo, explicación, parejas, marcador global, sets y acceso al detalle.
- `Partido más igualado` expresa por qué fue igualado mediante la diferencia total de juegos, en lugar de volver a usar los nombres de las parejas como titular.
- Los destacados no ligados a partidos mantienen la misma jerarquía de etiqueta, titular y detalle para que la sección funcione como lectura editorial de la jornada.
- El exportable de Resumen de Jornada continúa pendiente como siguiente desarrollo.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.3 - Comparaciones directas en destacados de jornada (2026-08-16)

- `LO MÁS DESTACADO` demuestra el motivo de cada tarjeta mediante una comparación directa, en lugar de añadir una segunda descripción genérica.
- `Partido más igualado` mantiene el marcador global de sets y enfrenta los juegos totales de ambas parejas, mostrando además la diferencia que origina el destacado.
- `Nuevo líder` y `Mayor subida` muestran posición anterior frente a posición actual; `En racha` compara la racha previa con la actual.
- Se elimina el texto `Ver partido`; la tarjeta completa continúa enlazando al detalle cuando el destacado corresponde a un encuentro.
- Se converge el contrato legacy de v1.9.1 al `matchId` real usado desde v1.9.2.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.4 - Tie-break decisivo como destacado de jornada (2026-08-16)

- `LO MÁS DESTACADO` detecta partidos finalizados cuyo tercer set termina exactamente `7-6` o `6-7` y crea el momento `Decidido en tie-break`.
- El destacado mantiene el marcador global del encuentro y compara de forma directa el tercer set con `Tie-break` como dato central.
- Los encuentros ya destacados por tie-break se excluyen del cálculo de `Partido más igualado` para evitar duplicar el mismo partido en la sección.
- La selección de destacados reserva espacio suficiente para conservar los tie-breaks decisivos aunque coincidan con movimientos relevantes de clasificación.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.5 - Borrado estable al registrar resultado (2026-08-16)

- `MatchResultForm` mantiene el avance automático al siguiente casillero únicamente cuando se introduce un valor válido.
- Borrar un marcador ya no mueve el foco al casillero anterior, tanto si se elimina un valor existente como si se pulsa Backspace/Delete sobre un campo vacío.
- El test histórico de destacados v1.9.2 deja de reutilizar un partido con tercer set `7-6`, evitando que choque con la clasificación `Decidido en tie-break` incorporada en v1.9.4.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.6 - Resumen conectado y destacados simples compactos (2026-08-16)

- El título `Jornada X` de PARTIDO pasa a ser un enlace directo a `/round/X`, reutilizando la ficha `Resumen · Jornada X`.
- `LO MÁS DESTACADO` compacta en una sola fila los momentos sin partido (`Nuevo líder`, `Mayor subida` y `En racha`) y conserva protagonista + comparación directa.
- Los momentos ligados a un encuentro (`Partido más igualado` y `Decidido en tie-break`) mantienen el formato detallado con parejas, marcador y comparación porque necesitan más contexto.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.7 - Jerarquía visual de destacados simples (2026-08-16)

- `NUEVO LÍDER`, `MAYOR SUBIDA` y `EN RACHA` recuperan su etiqueta como título independiente en la primera línea de cada tarjeta.
- La segunda línea compacta únicamente el contenido: protagonista a la izquierda y comparación directa a la derecha (`2.º → 1.º`, `3 victorias → 4 victorias`, etc.).
- `PARTIDO MÁS IGUALADO` y `DECIDIDO EN TIE-BREAK` mantienen intacto el formato detallado con parejas, marcador y comparación.
- No hay cambios de cálculo, API, Supabase ni migraciones.

## v1.9.8 - Pulido de PWA, CHAT y destacados (2026-08-16)

- El aviso de instalación PWA se limita a HOME, a sesiones autenticadas y a cuentas con una pertenencia a liga ya registrada; invitaciones, acceso inicial y rutas públicas dejan de mostrarlo.
- El resumen fijado de reserva de CHAT usa fecha numérica `DD/MM/YYYY` manteniendo la hora para reducir anchura.
- El `mt-px` entre mensajes consecutivos ya era común; la diferencia visual se corrige dando a los enviados la misma geometría de borde que los recibidos mediante borde transparente con `background-clip`, sin modificar el margen correcto de entrada.
- `EN RACHA` deja de mostrar la racha anterior y conserva únicamente las victorias consecutivas actuales.
- Los destacados asociados a un resultado muestran los dos nombres de cada pareja en líneas separadas y eliminan `/`, manteniendo marcador y comparación.
- `MatchReservationConfirmation` memoriza los arrays de ubicaciones aprobadas/rechazadas y elimina los dos warnings `react-hooks/exhaustive-deps`.
- No hay cambios de API, Supabase ni migraciones.

## Product evolution v1.9.9 (2026-08-16)

- Resumen de Jornada incorpora exportable PNG compartible con resultados, MVP, destacados y clasificación.
- Reutiliza el lenguaje visual de los exportables de temporada y mantiene fallback de descarga cuando Web Share de archivos no está disponible.
- Sin cambios de API, Supabase ni migraciones.


## Product evolution v1.10.0 (2026-08-16)

- Imagen opcional en onboarding de perfil, conservando almacenamiento global y fallback de Google.
- Override competitivo de imagen por jugador, exclusivo de superadmin y separado de identidad de cuenta.
- Fecha/hora programada de inicio de temporada con countdown, activación server-side y bloqueo competitivo preinicio.
- Centro de Difusión para admins con cinco exportables PNG 4:5 basados en datos reales.
- Nueva migración aditiva `20260816173000_add_competitive_player_images_and_scheduled_seasons.sql`.
- Scope excluido a propósito: pulido del PNG de Jornada, nivel global y estadísticas de parejas.

## Product evolution v1.10.2 — Media Kit visual rework (2026-08-17, en curso)

- Creada la rama local `codex/media-kit-visual-rework` desde `feature/v1.9.0-product-expansion`; `main`, Production y la etiqueta `v1.0.0` permanecen intactos.
- Aplicado y conservado `stash@{0}` (`WIP Media Kit v1.10.2 untracked`), que recupera dos recursos visuales de `opening_day_premium_01` y dos tests focalizados.
- El trabajo queda limitado a local: sin push, PRE, merge ni cambios remotos.
- Checkpoint inicial completado: implementación recuperada auditada y plantilla principal rehecha contra la referencia obligatoria.
- Implementada `opening_day_premium_01` como cartel dinámico 1080×1350 sobre la base artística recuperada: fondo carbón, máscara de acento tintable, viñeta, partículas, geometría premium, titular metálico, fecha enmarcada, metadatos y firma inferior.
- `Centro de difusión` incorpora editor completo, logo de liga con override temporal, seis acentos, vista previa del PNG real y acciones separadas para compartir o descargar.
- Reglas, Inscripciones, Próxima jornada, Inicio de temporada y Cuenta atrás derivan ahora de la misma familia Premium 01.
- Primera iteración visual revisada en `http://localhost:3000/admin/media-kit`; corregido el layout estrecho detectado en navegador.
- Validación focalizada: `npx tsc --noEmit` correcto y 11/11 tests de Media Kit correctos.
- Validación final local: `npm run lint`, `npx tsc --noEmit`, `npm run build`, 11/11 tests focalizados y `git diff --check` correctos.
- La app queda arrancada en `http://localhost:3000`; no se ha realizado push, merge, PRE ni ninguna otra operación remota.
- La segunda recarga del navegador quedó bloqueada por el onboarding de la sesión local con `app_user_lookup_failed`; no se rellenó el perfil ni se forzó acceso con datos personales. La inspección visual del PNG se completó antes de ese bloqueo.
- Corrección posterior: la firma inferior deja de ser editable y reutiliza el patrón de los exportables de temporada con el icono de la app, `CREADO CON` y `SMASH & LOB`.
- El titular principal incorpora cuatro tratamientos seleccionables (`Impacto`, `Condensada`, `Editorial` y `Atlética`) con familia, proporción, tamaño, contorno y, cuando corresponde, inclinación propias en el Canvas exportado.
- La elección tipográfica se aplica también a las piezas equivalentes de la familia Premium 01.
- Revisión visual completada en navegador para `Impacto`, `Condensada`, `Editorial` y `Atlética`; las cuatro variantes mantienen jerarquía, encaje y legibilidad, y el nuevo pie fijo aparece integrado sin desbordes ni errores de consola.
- Validación de la corrección: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` y 13/13 tests focalizados correctos.
- Nueva iteración local: el catálogo de piezas pasa a funcionar como `Presets` y se sitúa antes de la composición; cada preset carga sus textos en una única `Personalización y vista previa`, desde la que se comparte o descarga el resultado.
- La composición identifica el preset activo, permite restablecerlo y renombra los seis campos según su función visual (`Titular`, `Subtítulo`, `Bloque destacado`, `Dato central` y etiquetas laterales) en vez de asumir siempre Jornada de apertura.
- El color de acento conserva la paleta curada y añade una opción `Personalizado` desplegable con selector visual y código hexadecimal validado.
- La observación incompleta del usuario sobre borrar texto queda pendiente de concretar; no se ha inferido ni aplicado ningún comportamiento adicional.
- A petición posterior, `Centro de difusión` abandona la sucesión de tarjetas grandes: los seis presets se compactan en una barra, mientras vista previa, compartir/descargar y personalización conviven en un único espacio de trabajo a dos columnas desde anchura tablet.
- Botones, campos, variantes tipográficas, acentos y control de logo reducen altura y espaciado; con el color personalizado cerrado, el conjunto está diseñado para quedar visible de un solo vistazo en escritorio.
- El preset conserva el nombre corto `Apertura` en la biblioteca, mientras su composición inicial recupera el titular `Jornada de apertura` y genera el subtítulo `Un día, X partido(s), el mejor comienzo` con el número real de encuentros de la primera jornada y concordancia singular/plural.
- La revisión en la anchura real del shell de la app (columna central estrecha) corrige el primer intento que desbordaba: cartel a 155 px, seis presets abreviados en una fila y controles en una columna lateral flexible de 158 px.
- Tipografía pasa a selector compacto, acento y logo comparten bloque, y las acciones quedan bajo el cartel; el estado cerrado completo se ve antes de la navegación inferior en la captura final.
- Interacción real verificada: `Altas` carga todos sus textos en la composición activa y `Color personalizado` acepta `#22AACC`, actualizando tanto selector como borrador hexadecimal.
- Validación final de esta iteración: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` y 16/16 tests focalizados correctos.
- Ajuste móvil posterior: se descarta la división lateral de preview e inputs; personalización ocupa primero todo el ancho y la vista previa crece a 285 px debajo, con compartir/PNG unidos al cartel.
- La capa `opening-day-premium-01-accent.png` se reconstruye desde el fondo actual: 1080×1350, RGBA real y alfa derivado de la luminosidad del propio fondo, por lo que focos, líneas, pala, pelota y polvo quedan alineados al píxel y el centro oscuro permanece transparente.
- Dos propuestas del generador visual se descartaron por incumplir dimensiones y canal alfa; solo se aprovechó su dirección visual y el recurso final se normalizó de forma determinista contra `opening-day-premium-01-base.webp`.
- Rediseño móvil integral de `Centro de difusión`: los presets pasan a una biblioteca horizontal táctil y el espacio de trabajo separa `Vista previa` y `Personalizar` en dos modos, evitando comprimir simultáneamente cartel y formularios.
- Seleccionar un preset carga sus datos y vuelve automáticamente a la preview; el modo de edición ofrece campos a ancho cómodo, tipografía, acentos y logo agrupados, más un único CTA para regresar al cartel.
- Primera versión de `Premium 02 · Formato`: nuevo preset informativo 4:5 con título medio, introducción, filas numeradas y cierre, conservando fondo carbón, acento configurable, logo y firma fija de Smash & Lob.
- El preset explica clasificación individual, parejas diferentes, repetición mínima de rivales y calendario automático; carga cuatro filas de partida.
- El editor específico de Premium 02 admite entre 3 y 5 filas, edición de titular/descripción, reordenación, eliminación y alta de bloques; el Canvas adapta altura, espaciado y densidad al número de filas.
- Ajuste de la plantilla informativa: el título baja 35 px, desaparece toda etiqueta visible `Premium 02` del PNG y de la biblioteca, y las filas dejan de estar numeradas.
- Cada fila admite ahora un icono de imagen opcional con controles para cargar, cambiar o quitar; sin icono, el diseño utiliza una barra vertical del color de acento como marcador neutro.
- Corrección de jerarquía en Premium 01: los titulares de dos líneas reducen tamaño y separación vertical, mientras el subtítulo baja y gana aire; se elimina el solapamiento visible en presets como Reglas, Inicio y Cuenta atrás.
- El preset `Inscripciones` se redefine como aviso de cuota o fianza: prioriza reserva de plaza, importe por jugador y pago único, reutilizando el importe real configurado para la temporada cuando está disponible.
- Premium 01 y Premium 02 comparten una cabecera de temporada editable, inicializada con la temporada activa pero independiente de los presets para preparar piezas de una temporada futura.
- Primera versión de `Jornada` con diseño Premium 03: genera una pieza 4:5 por enfrentamiento, permite cargar cualquier partido de la jornada con jugadores, fecha, hora y sede reales, y mantiene todos esos campos editables antes de compartir o descargar.
- Pulido de Premium 03: nombres de ambas parejas centrados ópticamente y marcadores verticales desplazados al interior. Las sedes cargadas desde partidos se normalizan en todos los presets como `Municipio · Nombre corto`, evitando mostrar el JSON persistido del selector de ubicación.
- El formato automático de sede queda diferenciado por plantilla: Premium 01 usa `Municipio Nombre corto` sin separador, Premium 03 conserva `Municipio · Nombre corto` y Premium 02 no incorpora ubicación por defecto.
- El preset `Reglas` migra a Premium 02 y carga filas editables con la configuración real: obligatoriedad de tres sets, reparto de puntos por sets, desempate por diferencia de juegos y juegos a favor, y sistema MVP solo cuando está activo.
- Nuevo preset informativo `En pista` sobre Premium 02: coloca primero un calentamiento guiado de 10/15 minutos y explica después la variante STAR Point de la liga y el tie-break mediante cuándo se juega, cómo se gana y cómo rota el saque; se descarta el bloque de cambios de lado y resultado final.
- `Inscripción` fija su composición inicial en `Cuota de inscripción`, `Para gastos derivados de la liga`, `20€`, `Fianza`, `Pago único` y `Por jugador`; los campos se precargan con capitalización normal y el cartel mantiene el tratamiento visual en mayúsculas de Premium 01.
- El control de icono de cada fila informativa abre ahora una galería de 25 SVG precargados y coloreados con el acento activo; la carga de una imagen personalizada permanece disponible como acción independiente dentro del selector.
- Compilación local de esta iteración completada correctamente con `npm run build`; no se ejecutan comprobaciones adicionales durante esta fase de ajuste visual.
- El fondo compartido por las plantillas Premium se sustituye de forma reversible por una variante 1080×1350 que prolonga la textura de la pista hasta el borde inferior y elimina la franja negra visible; la máscara de acento se regenera con las mismas dimensiones a partir del nuevo fondo.
- La variante de fondo extendida queda integrada y compila correctamente con `npm run build`; los recursos anteriores se conservan sin sobrescribir como respaldo durante la prueba visual.
- Corrección posterior del render: se detecta que los degradados del Canvas volvían a ocultar la pista extendida al eliminar casi toda la luminosidad inferior; el fondo recupera progresivamente su textura solo desde `y=1040` hasta el borde, manteniendo intacto el oscurecimiento del área tipográfica.
- La corrección compila con `npm run build` y el servidor local se deja activo en `http://localhost:3000` para revisar la preview y la descarga contra el bundle actualizado.
- Se elimina la línea horizontal detectada en la recuperación del suelo: la máscara `destination-in` pasa a cubrir todo el lienzo, conservando alfa cero sobre el inicio del degradado en vez de dejar opaca la mitad superior del buffer auxiliar.
- La corrección de continuidad compila con `npm run build` y el servidor local permanece activo en el puerto 3000 para la siguiente revisión visual.
- La inspección de la preview real de `Apertura` confirma que la máscara PNG de acento no contiene una discontinuidad horizontal; el corte procedía del `floorGlow` del Canvas, que terminaba en `y=1260` conservando su intensidad máxima. La capa pasa a recorrer hasta el borde y desvanece de nuevo a alfa cero.
- El nuevo desvanecido de acento compila con `npm run build` y la preview local de `Apertura` se recarga contra el bundle actualizado.
- La apariencia de dispositivos sin preferencias guardadas cambia a `Claro + Colorido + Grafito` tanto en el script previo a hidratación como en `ThemeProvider`; las elecciones existentes en `localStorage` se siguen respetando.
- HOME unifica la línea de temporada simple y el selector para varias temporadas mediante `SeasonContextLine`: comparten contenido, tipografía, color, altura y posición, mientras la variante interactiva conserva semántica de botón y foco accesible sin indicios visuales en reposo.
- La iteración de apariencia predeterminada y cabecera de temporada compila correctamente con `npm run build`; no se ejecutan comprobaciones adicionales durante esta fase visual.
- Premium 02 y Premium 03 ya reutilizaban el fondo artístico común, pero sus velos negros al 78 % y 72 % lo ocultaban casi por completo; se reducen al 58 % y 54 % para recuperar de forma sutil focos, pista, pala y textura sin comprometer la lectura.
- Los presets informativos cargan iconos SVG de partida editables: Formato usa gráfico, dos jugadores, rayo y calendario; Reglas usa repetición, gráfico, balanza y trofeo cuando hay MVP; En pista usa pala, estrella, objetivo y rotación.
- Revisión local en navegador: Premium 02 y Premium 03 regeneran sus previews sin errores; el editor muestra 4 iconos en Formato, 3 en Reglas para la temporada actual sin MVP y 4 en En pista. La iteración compila correctamente con `npm run build`.
- Todas las imágenes del Media Kit usan ahora el icono oficial de Smash & Lob como logo de cabecera cuando la liga no tiene uno definido; un logo propio u override sigue teniendo prioridad y la firma inferior no cambia.
- El fallback de logo compila correctamente con `npm run build`; no se ejecutan comprobaciones adicionales en esta fase visual.
- Premium 02 y Premium 03 separan la cabecera lateral del marco decorativo: sus dos esquinas superiores bajan de `y=72` a `y=148`, justo después del logo, nombre de liga y temporada. Premium 01 conserva el marco original para su cabecera centrada.
- La variante de marco por composición compila correctamente con `npm run build`; no se ejecutan comprobaciones adicionales durante esta fase visual.
### Ajustes Media Kit — tipografías y preset En pista (2026-08-17)

- Premium 01 usa `Editorial` como tipografía inicial y también como fallback del exportador.
- El selector amplía sus opciones con cuatro estilos adicionales: `Monumental`, `Geométrica`, `Didona` y `Técnica`.
- El preset `En pista` cambia su titular precargado a `DURANTE EL PARTIDO`.
- Validación solicitada: `npm run build` completado correctamente (compilación, TypeScript y generación estática).

### Media Kit — cinco presets y Premium 04/05 (2026-08-17)

- Se incorporan los presets `Resultados`, `Clasificación`, `MVP`, `Próxima jornada` y `Final de temporada`, alimentados inicialmente con datos de la temporada activa y editables antes de exportar.
- `Premium 04 · Marcador` introduce una composición de filas densas para marcadores y top 5, con jerarquía específica para posiciones y cifras.
- `Premium 05 · Protagonista` introduce una composición editorial con fotografía central para MVP y campeón, nombre destacado y hasta tres datos o puestos de apoyo.
- `Próxima jornada` reutiliza Premium 01 para priorizar fecha, hora, sede y número de jornada.
- La biblioteca, los editores y los exportadores aceptan las cinco nuevas clases de pieza; Premium 05 permite sustituir o quitar temporalmente la fotografía protagonista.
- Validación solicitada: `npm run build` completado correctamente con TypeScript y generación estática.

### Media Kit — Premium 06 para Resultados (2026-08-18)

- `Resultados` deja de compartir Premium 04 con `Clasificación`; Premium 04 queda reservado al ranking y su top 5.
- Se crea `Premium 06 · Resultados`, inspirado en la lectura de la pantalla PARTIDO: nombres apilados de cada pareja a la izquierda, juegos de cada set en columnas y sets ganados en un bloque de mayor peso visual.
- El preset carga los partidos terminados de la última jornada disponible, usa un mínimo de 2 tarjetas y admite hasta 4 para temporadas de 16 jugadores.
- El personalizador permite editar los cuatro nombres, los juegos de cada set, añadir o quitar partidos entre 2 y 4, y recalcula automáticamente los sets ganados.
- Validación solicitada: `npm run build` completado correctamente con la nueva plantilla, editor y tipos de datos de resultados.
- RESULTADOS incorpora un selector de jornada completa; se inicializa con la última jornada cerrada y, al cambiarla, recarga parejas, juegos y sets antes de permitir el retoque manual.
- Personalización incorpora un selector común de `Temporada origen`: al cambiarlo, el preset activo vuelve a cargar los datos reales de esa temporada, mientras la cabecera superior permanece editable e independiente.
- Validación solicitada: `npm run build` completado correctamente con ambos selectores y la recarga de presets por temporada.
- Preparación de publicación: el Media Kit adopta los tokens tipográficos semánticos globales y elimina la descripción genérica de cabecera detectada por `typography:check`.
- El presupuesto global de fuente se actualiza de 102.300 a 104.000 líneas para registrar las nuevas plantillas y editores, manteniendo sin cambios los límites de clientes, páginas cliente, rutas API y archivos críticos; el árbol actual ocupa 103.599 líneas.

### Preparación de publicación Media Kit (2026-08-18)

- Playwright usa un servidor dedicado en `127.0.0.1:3100` y un `distDir` independiente (`.next-playwright`), por lo que ya no puede reutilizar accidentalmente una sesión local del puerto 3000 ni interferir con ella.
- Las pruebas visuales fijan el reloj en una fecha conocida y actualizan las versiones vigentes de los tutoriales de HOME, Ajustes y Administración de temporada; las capturas dejan de depender del día de ejecución o de overlays caducados.
- El grafito claro oscurece sus tonos secundarios para conservar la nueva apariencia predeterminada y cumplir contraste WCAG AA también en las pantallas públicas.
- Referencias visuales revisadas y actualizadas para HOME, Calendario, Administración de temporada y las pantallas públicas afectadas por el nuevo grafito predeterminado.
- Puerta local completa superada con `npm run release:check`: 146 archivos / 480 tests unitarios e integración, 56 tests Playwright, build de producción dentro de presupuesto y `npm audit --omit=dev --audit-level=high` con 0 vulnerabilidades.
- No hay migraciones nuevas ni cambios sobre migraciones ya aplicadas; el siguiente paso autorizado es publicar el mismo estado en `staging`/PRE y, tras verificarlo, promocionarlo a `main`/Producción.

### Corrección del aislamiento de Avatar Lab en Producción (2026-08-18)

- El primer smoke de Producción detectó que el layout ejecutaba `notFound()` pero Next.js conservaba un estado HTTP 200 al resolver el 404 dentro de una respuesta en streaming; la API experimental sí devolvía 404 correctamente.
- `src/proxy.ts` intercepta ahora exclusivamente `/experimental/avatar-lab/:path*` antes del render: continúa en PRE y local, y devuelve un 404 HTTP real con `no-store` en cualquier otro host, incluido Producción.
- El layout y las APIs conservan sus comprobaciones propias como defensa adicional; el contrato de assets y 13 tests focalizados de acceso, aislamiento y proxy pasan, junto con TypeScript.
- La republicación queda preparada para desplegar primero en `staging`/PRE y verificar después `main`/Producción.
- El preset `Apertura` precarga ahora su fecha únicamente como día y mes; el año se omite solo en esta pieza y el formato completo de `Jornada` y los demás presets no cambia.
- Puerta local final superada con `npm run release:check`: 147 archivos / 482 tests unitarios e integración, 56 tests Playwright, build de producción dentro de presupuesto y auditoría runtime con 0 vulnerabilidades.
- Publicación de aplicación verificada en PRE: `staging` `f3dce430b093bdbac043b88e4864d1f0bacf80e7`, despliegue Vercel `dpl_8YdcQKSyCYVhNqKwzEbFxjnpYmmz` READY y alias `pre.smashandlob.com`; el smoke autenticado confirma health v1.10.8/pre, página experimental disponible y API protegida con 401. El smoke público conserva el 302 previsto por la protección SSO de Vercel.
- Publicación de aplicación verificada en Producción: `main` `395f863bfdb295d7cbad404c111952102253a591`, despliegue Vercel `dpl_6q7GdrxqWQfCtKzZgE59HYtnebQb` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.10.8/prod, portada disponible y Avatar Lab bloqueado con 404 tanto en página como en API.

### Media Kit — acentos de logo y preset Inicio (2026-08-18)

- La paleta curada incorpora `#53B401` como color de acento frecuente.
- Cuando existe un logo de liga o se carga uno temporal, el editor lo analiza automáticamente en el navegador y ofrece hasta cuatro colores útiles: tonos dominantes del propio logo y variantes armónicas; logos sin color aprovechable o bloqueados por CORS mantienen intacta la paleta manual.
- `Inicio` precarga `Volvemos con más ganas`, el número real de jugadores como etiqueta izquierda, `1 campeón` como dato central y el número real de jornadas como etiqueta derecha; el resto de su composición no cambia.
- Validación local: 11/11 tests focalizados, ESLint, TypeScript, build de producción y presupuesto de fuente correctos (103.756/104.000 líneas).
- Ajuste visual posterior: las etiquetas `PRESET`, `INFORMATIVO` y `SIN FECHA` de la biblioteca usan un rol tipográfico micro, menor tracking y una sola línea para permanecer dentro de cada burbuja sin alterar el nombre del preset.
- La biblioteca ordena sus presets según el recorrido de la temporada: Formato, Reglas, En pista, Cuota, Inicio, Cuenta atrás, Apertura, Agenda, Próxima, Jornada, Resultados, Clasificación, MVP y Final.
- Puerta local final superada con `npm run release:check`: 148 archivos / 487 tests unitarios e integración, 56 tests Playwright, build de producción dentro de presupuesto (828.623 bytes gzip en 85 chunks) y auditoría runtime con 0 vulnerabilidades.
- No hay migraciones nuevas ni cambios sobre migraciones ya aplicadas; este mismo estado queda autorizado para promoción secuencial a `staging`/PRE y, tras su verificación, a `main`/Producción.
- Publicación de aplicación verificada en PRE: `staging` `224d764430eccb6a9f6c76ad052a020d7f7ddf49`, despliegue Vercel `dpl_5sk895g3DVBgVFpjwsViMsdiWJ8k` READY y alias `pre.smashandlob.com`; el smoke autenticado confirma health v1.10.8/pre, página experimental disponible y API protegida con 401. El smoke público conserva el 302 previsto por la protección SSO de Vercel.
- Publicación de aplicación verificada en Producción: `main` `1316a8fddf5d916285d06027406e8f53f128836d`, despliegue Vercel `dpl_9Z4ZDi9aXCgfTqc1R4jBsfLkMNGo` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.10.8/prod, portada disponible y Avatar Lab bloqueado con 404 tanto en página como en API.

### Recuperación de invitaciones al instalar la PWA (2026-08-18)

- El flujo existente se conserva: los enlaces de jugador y espectador siguen volviendo a su ruta exacta después de Google, y el aviso propio de instalación continúa limitado a HOME tras confirmar una liga.
- El límite de petición registra durante tres días la última invitación visitada en una cookie `HttpOnly`, `SameSite=Lax`, de ruta raíz y segura bajo HTTPS; solo acepta destinos internos `/invite/:code` y `/spectate/:code`, sin redirecciones externas.
- El manifiesto declara un identificador estable `/` y arranca la PWA mediante `/launch`; esa ruta recupera una incorporación incompleta o entra en HOME cuando no existe ninguna.
- Las APIs de alta de jugador y espectador eliminan la intención en la misma respuesta de éxito. Los flujos cliente repiten la limpieza como respaldo y HOME ofrece continuar o descartar una invitación abandonada.
- El acceso anónimo adapta título, explicación y CTA al enlace recibido sin modificar el callback de OAuth ni el proceso actual de reglas, selección de jugador, perfil o espectador.
- Validación focalizada: 20/20 tests de intención, redirección OAuth, proxy de Avatar Lab y PWA, más 2/2 recorridos Playwright móvil/escritorio; TypeScript, ESLint, `git diff --check` y revisión real de `/launch` en navegador correctos, sin errores de consola.
- El endpoint público solo permite consultar o borrar la cookie propia, no acepta cuerpos ni modifica datos de aplicación, y queda registrado explícitamente en el inventario de seguridad: 81 rutas y 117 métodos.
- El presupuesto de fuente registra la nueva ruta de arranque, API y aviso recuperable: 104.142 líneas y 153 clientes, sin cambiar límites de páginas cliente, rutas API ni archivos críticos.
- Puerta completa superada con `npm run release:check`: 149 archivos / 495 tests unitarios e integración, 58 tests Playwright —incluida la recuperación de invitación en móvil y escritorio—, build de producción dentro de presupuesto (829.664 bytes gzip en 85 chunks) y auditoría runtime con 0 vulnerabilidades.
- No se añaden migraciones ni se modifican datos persistentes.
- Publicación de aplicación verificada en PRE: `staging` `43086ce404a744d012925ca07a53004afb42ee5c`, despliegue Vercel `dpl_BiKce4SGhUPkxRbTePeJXkWTJe1x` READY y alias `pre.smashandlob.com`; el smoke autenticado confirma health v1.10.8/pre, manifiesto con `id` estable y arranque `/launch`, cookie de invitación `Secure`/`HttpOnly`/`SameSite=Lax`, recuperación sin intención hacia HOME y API protegida con 401. El smoke público conserva el 302 previsto por la protección SSO de Vercel.
- Publicación de aplicación verificada en Producción: `main` `02e943137f119e4e079cc7f42ac0e487da6fc4be`, despliegue Vercel `dpl_LS5hQaRiBX79M2UfrRV836seTyfh` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.10.8/prod, portada disponible y Avatar Lab bloqueado. La comprobación específica confirma manifiesto con `id` estable y arranque `/launch`, endpoint de intención operativo, cookie de invitación `Secure`/`HttpOnly`/`SameSite=Lax` y redirección sin intención hacia HOME.

### Registro de cambios público agrupado (2026-08-18)

- La vista pública agrupa versiones consecutivas de la misma serie cuando comparten categoría y texto general; muestra un único rango de versiones y fechas en lugar de repetir el mismo panel.
- Las entradas con categoría `Novedad` conservan su título y resumen funcional reales para explicar qué capacidad se incorporó, sin exponer el detalle técnico reservado.
- Creadores, administradores de liga y superusuarios reciben el historial detallado únicamente cuando `Vista admin` está activa; al desactivarla ven exactamente el mismo resumen público que un jugador normal.
- El detalle completo solo se entrega desde servidor a cuentas autorizadas. Los usuarios normales no reciben ese contenido oculto en el cliente.
- El presupuesto registra 104.263 líneas, 154 clientes y 47 páginas cliente; el límite puntual de `src/lib/changelog.ts` sube a 2.410 líneas para sus tres campos opcionales de rango.
- Validación local: 10/10 tests focalizados, ESLint, TypeScript, build de producción, presupuesto de fuente y `git diff --check` correctos. La revisión real en navegador confirma el detalle por versión con `Vista admin`, el resumen agrupado al desactivarla y los rangos de fecha sin concatenaciones. Cambio aislado en `codex/public-changelog-groups`, todavía no publicado.
