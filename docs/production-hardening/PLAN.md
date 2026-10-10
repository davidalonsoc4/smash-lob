# Production Hardening Plan

## C01 - Audit correction: validation toolchain (BUG-040)
- Status: DONE (2026-10-10; BUG-040 fixed in the local correction branch and validated in isolation)
- Objective: Remove vulnerable test dependencies and obsolete overrides before executing further code or advancing to functional corrections.
- Acceptance: complete dependency audit has no high/critical findings; compatible tools retain existing validation coverage.
- Validation: `npm audit --json`, `npm audit --omit=dev --json`, then (only if the security gate passes) `npm run validate` and `npm run test:e2e` in the isolated placeholder checkout.
- Remote changes allowed: package registry reads/downloads only; no push, deployment or database operations.
- Stop condition: an unresolved high/critical finding keeps this milestone incomplete and blocks subsequent milestones. Do not silence advisories or downgrade the Next.js lint configuration to bypass them.
- Depends on: completed documentary audit A03.

Last updated: 2026-07-16 23:31:46 +02:00

## C02 - Auth, invitation and Push trust boundaries (BUG-001/005/008/009)
- Status: DONE (2026-10-10; full validate passed, 887 tests / 224 files)
- Acceptance: auth reads cannot overwrite profile/privileges; wrong invitation codes fail closed; public invitation previews exclude financial/private incident information; only supported Push providers can be stored or sent to, including stored/retry endpoints.
- Validation: installed full dependency audit; targeted in-memory auth/invite/Push regressions; `npm run validate` in the isolated placeholder checkout. No real network Push or user data.
- Remote changes allowed: documentation/registry reads only; no push, deploy or data writes.
- Depends on: C01.

## C03 - Account export and localized confirmation (BUG-002/004)
- Status: DONE (2026-10-10; 13 targeted tests, lint and TypeScript passed)
- Acceptance: export uses account IDs, player IDs and email columns correctly; query errors fail explicitly; localized confirmation matches the displayed instruction while sending a stable API token.
- Validation: in-memory account export and localized confirmation regression tests, targeted ESLint and TypeScript in the isolated checkout.
- Remote changes allowed: none.
- Depends on: C02. Account deletion transaction/privacy lifecycle (BUG-003) is a separate database milestone, not claimed resolved here.

## C04 - Score and ranking consistency (BUG-030/031)
- Status: DONE (2026-10-10; targeted tests, lint, TypeScript and typography passed; final visual regression gate will review changed tie labels)
- Acceptance: completed results have a winner across supported formats; tied ranking positions are consistent in UI/export. Cent allocation (BUG-029) must also update the existing SQL booking rebuild and belongs to the later financial database milestone.
- Validation: targeted arithmetic/result/ranking regression suites, targeted ESLint, TypeScript and relevant source checks in isolation.
- Remote changes allowed: none.
- Depends on: C03.

## C05 - Document language, modal keyboard focus and version docs (BUG-034/036/038)
- Status: DONE (2026-10-10; 10 targeted tests, lint, onboarding check and TypeScript passed)
- Acceptance: document lang follows selected locale; guided tour traps focus and restores it on close; README does not describe an obsolete release as current.
- Validation: jsdom language/focus regressions, existing onboarding tests/check, targeted lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C04.

## C06 - Waitlist membership and position (BUG-006/007/010)
- Status: DONE (2026-10-10; nine targeted tests, lint and TypeScript passed)
- Acceptance: own queue position is derived from the full waiting order without exposing other users; cancelled entries can rejoin at the end; own promotion identified by authenticated account ID rather than player ID.
- Validation: waitlist API/helper regressions with in-memory data, targeted lint, TypeScript.
- Remote changes allowed: none.
- Depends on: C05. Capacity reservation and promotion expiration (BUG-011/012) remain separate atomic database work.

## C07 - Chat coordination history and activity pagination (BUG-027/039)
- Status: DONE (2026-10-10; nine targeted tests, lint and TypeScript passed)
- Acceptance: chat coordination does not depend on the recent text window; equal activity timestamps do not skip records between pages and visibility filtering does not terminate pagination prematurely.
- Validation: API/helper regression tests with synthetic data, targeted lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C06.

## C08 - Season duplication length and round order input (BUG-017/021)
- Status: DONE (2026-10-10; four targeted tests, lint and TypeScript passed)
- Acceptance: duplication retains valid custom schedule length; partial/invalid round permutations fail before writing any match.
- Validation: duplication and round order regression tests, targeted lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C07. Atomic duplication/round mutation failures remain separate database work (BUG-018/019/022).

## C09 - Push retry persistence errors (BUG-033)
- Status: DONE (2026-10-10; 32 directed tests, lint and TypeScript passed)
- Acceptance: queue reads/writes cannot silently fail; a delivery persistence error is not handled as a transport failure or counted as durable success.
- Validation: synthetic error injection for queue operations, existing Push regressions, lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C08. Push transport remains at-least-once; this milestone does not claim exactly-once delivery.

## C10 - Protect edited drafts from idle PWA updates (BUG-035)
- Status: DONE (2026-10-10; six directed tests, lint and TypeScript passed)
- Acceptance: blurring an edited field and waiting cannot silently reload the app; clean sessions still update automatically. A generic edited control is conservatively protected for the rest of the app session because it cannot prove successful persistence.
- Validation: idle update/draft regressions, targeted lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C09.

## C11 - Availability time zone comparisons (BUG-026)
- Status: DONE (2026-10-10; nine targeted tests, lint and TypeScript passed)
- Acceptance: availability intervals refer to actual instants in each player's saved time zone; date overrides and daylight saving transitions do not produce false full coverage.
- Validation: cross-zone/date override/DST recommendations and existing availability suites, targeted lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C10.

## C12 - Extended calendar capacity independent of player IDs (BUG-020)
- Status: DONE (2026-10-10; 29 targeted tests including 85 boundary cases, lint and TypeScript passed)
- Acceptance: advertised custom duration boundaries work with arbitrary real IDs, not only the names used to precompute maximums; all existing calendar invariants remain enforced.
- Validation: 8–24-player boundary sweep with arbitrary IDs, existing flexible duration and calendar suites, lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C11.

## C13 - Cumulative local regression gate
- Status: DONE (2026-10-10; validate, 922 tests, 76 E2E, full/runtime audits and diff check passed)
- Acceptance: all local non-database corrections pass complete validation and isolated browser regressions; changed visuals are reviewed before accepting any baseline updates.
- Validation: `npm run validate`, `npm run test:e2e`, full and runtime dependency audits, `git diff --check` in the isolated placeholder checkout.
- Remote changes allowed: registry reads only; no push, deployments, user data or PRE/Production writes.
- Depends on: C12.

## C14 - Database transaction validation prerequisite
- Status: DONE (2026-10-10; identical database quality script passed in worker-local disposable Supabase, GitHub Actions 38078565124/job 114290558197; workstation Docker remains unavailable)
- Acceptance: an isolated disposable local Supabase/PostgreSQL engine can replay migrations, run pgTAP/schema lint and verify restore/upgrade before transactional corrections are accepted.
- Validation: `npm run database:quality` in the isolated checkout, using synthetic data only.
- Remote changes allowed: following the user's PRE publication request and delegated judgment, push the validated correction candidate and open a PR to staging solely to run the existing isolated GitHub Actions database gate. No remote database writes or deployment before that gate passes. The worker-local disposable Supabase stack uses synthetic data only.
- Stop condition: missing local engine or failed database gate blocks transactional implementation/acceptance; preserve the 17 open findings and do not bypass the database gate with mocks.
- Depends on: C13. Following domains: account lifecycle BUG-003; league/season transactions BUG-013/014/015/016/018/019/037; result/calendar/incident atomicity BUG-022/023/024/025; financial/participant consistency BUG-028/029/032; waitlist reservation/expiration BUG-011/012.

## C15 - Publish validated audit corrections to PRE
- Status: DONE (2026-10-10; v1.15.10 published to PRE, PR #20/staging 33604cee verified; all four final candidate and staging CI jobs passed; deployment/alias/health/access smoke verified)
- Acceptance: coherent new app/PWA version, all local release gates pass, final candidate CI passes, staging merge and PRE deployment/alias/health are explicitly verified. No unresolved transactional finding is represented as fixed.
- Validation: version/source/secret checks, npm run validate, npm run test:e2e, dependency audits; existing four release-quality jobs; authenticated PRE smoke and remote SHA verification.
- Remote changes allowed: candidate branch/PR, staging merge and PRE deployment only. No remote database writes; main, Production and v1.0.0 untouched.
- Depends on: C14. Seventeen database transaction findings remain OPEN for separately scoped correction milestones.

## C16 - Correct installed app system surfaces
- Status: IN PROGRESS
- Acceptance: remove artificial bottom overlay; startup/runtime share black for dark and white for light; standalone canvas follows mode without extra space; new PWA cache version.
- Validation: startup theme regressions, npm run validate in isolation; candidate CI; verified PRE deployment/version. Native Android/iOS rendering remains a physical device gate.
- Remote changes allowed: candidate PR and PRE only, explicitly authorized by user. No Production or database changes.
- Depends on: C15.

## H00 - Inventory and initial diff review
- Status: DONE
- Objective: Review the existing uncommitted hardening work and establish the exact starting point.
- Domains: git state, existing invite hardening diff, migrations, current validations
- Acceptance:
  - `git status`, `git diff --stat`, `git diff --check`, and current modified files reviewed
  - partial invite hardening work classified as valid / incomplete / risky
  - resumable docs created with real state
- Validation:
  - `git status -sb`
  - `git diff --stat`
  - `git diff --check`
  - targeted file review of modified hardening files
- Remote changes allowed: none
- Rollback: no rollback required; documentation only
- Depends on: none

## H01 - Common auth and authorization helpers
- Status: DONE
- Objective: Centralize session, app user, request parsing, UUID validation, and safe server error handling.
- Domains: `src/auth.ts`, `src/lib/supabaseServer.ts`, `src/lib/serverLeagueAccess.ts`, new server-only helpers
- Acceptance:
  - session identity always comes from `auth()`
  - email normalization happens on the server
  - shared helpers exist for auth/app user/request validation
  - server modules are marked `server-only` where appropriate
  - routes stop returning SQL/internal messages to the client
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted route review
- Remote changes allowed: none
- Rollback: revert local helper refactors before any remote action
- Depends on: H00

## H02 - Invites, player claim, and spectators
- Status: DONE
- Objective: Finish hardening invite read/claim flows and spectator access behind server authorization.
- Domains: `invites`, `spectator_invites`, `league_spectators`, invite UI/API
- Acceptance:
  - no client fallback from invite snapshot to anon Supabase
  - claim flow runs only through server API
  - invite code, league, player, and occupancy validated server-side
  - spectator cleanup happens server-side
  - no client-controlled identity or role is trusted
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - static search for direct client writes to `invites`
- Remote changes allowed: local migration creation only
- Rollback: revert local invite route/helper changes before remote migration
- Depends on: H01

## H03 - League create, edit, and delete
- Status: DONE
- Objective: Move sensitive league lifecycle operations behind server-side authorization.
- Domains: `leagues`, `invites`, `league_locations`, destructive league operations
- Acceptance:
  - create/regenerate/delete run only on server
  - creator/admin/superuser checks enforced server-side
  - multi-step destructive operations are consistent and do not leak partial state
  - UI contracts remain compatible
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - targeted route review
- Remote changes allowed: local migration creation only
- Rollback: revert local league lifecycle changes before remote migration
- Depends on: H01

## H04 - Users and memberships
- Status: DONE
- Objective: Protect `app_users` and `league_memberships` from direct client abuse.
- Domains: `app_users`, `league_memberships`, user profile/avatar flows, role changes
- Acceptance:
  - no unrestricted browser reads of all user emails
  - no client can set `is_superuser` or `can_create_leagues`
  - role changes and unlink actions require server-side authorization
  - membership APIs return minimum required data
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted authz review
- Remote changes allowed: local migration creation only
- Rollback: revert local membership/user hardening before remote migration
- Depends on: H01, H03

## H05 - Availability
- Status: DONE
- Objective: Protect `player_availability`.
- Domains: availability UI/API, `player_availability`
- Acceptance:
  - only the linked user can modify their own availability
  - admin/member reads are limited to their league scope
  - no cross-league reads or writes by guessed IDs
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted availability review/tests
- Remote changes allowed: local migration creation only
- Rollback: revert availability route/data changes
- Depends on: H01, H04

## H06 - Result confirmations
- Status: DONE
- Objective: Protect `match_result_confirmations`.
- Domains: confirmations UI/API, participant authorization
- Acceptance:
  - only match participants can confirm
  - user identity comes from session + membership, never client `playerId`
  - conflict/race handling is safe
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted confirmation review/tests
- Remote changes allowed: local migration creation only
- Rollback: revert confirmation hardening changes
- Depends on: H01, H04, H07

## H07 - Matches and results
- Status: DONE
- Current checkpoint: match-detail mutations plus the remaining season-admin `matches` writes now run through server routes, and the local `matches` lock-down migration has been created and validated with `supabase db reset` + `db lint --local`.
- Objective: Protect `matches` operations and field-level writes.
- Domains: scheduling, results, locks, admin match actions
- Acceptance:
  - reads require league access
  - writes require explicit participant/admin authorization
  - only allowed fields are writable from each operation
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - targeted route/data review
- Remote changes allowed: local migration creation only
- Rollback: revert match/result hardening changes
- Depends on: H01, H04

## H08 - Seasons, settings, players, and calendars
- Status: DONE
- Current checkpoint: Supabase-backed season creation, finish/start/reopen, round-settings saves, round-order changes, balanced-calendar repair, round deletion, and season deletion now run through league-scoped admin routes. The remaining `players` client lookup was confirmed to live in `src/lib/activity.ts`, so the unresolved browser read boundary now belongs to H10 instead of season/player administration.
- Objective: Protect season and player administration.
- Domains: `seasons`, `season_settings`, `season_players`, `players`
- Acceptance:
  - only admins can manage seasons/settings/calendars/admin player edits
  - members only read their league data
  - avatar flows distinguish account/player/admin cases
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- Remote changes allowed: local migration creation only
- Rollback: revert season/player hardening changes
- Depends on: H01, H04

## H09 - MVP
- Status: DONE
- Current checkpoint: Supabase-backed MVP reads, match voting, vote clearing, and manual selections now run through server routes; the browser no longer mutates `mvp_votes` or `mvp_manual_selections` directly, and a local lock-down migration has been validated with `supabase db reset` + `db lint --local`.
- Objective: Protect `mvp_votes` and `mvp_manual_selections`.
- Domains: MVP voting/manual selection flows
- Acceptance:
  - only participants can vote
  - no self-voting
  - no identity spoofing via client voter/player IDs
  - manual selection remains admin-only
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted MVP review/tests
- Remote changes allowed: local migration creation only
- Rollback: revert MVP hardening changes
- Depends on: H01, H04, H07

## H10 - Activity
- Status: DONE
- Current checkpoint: activity feed reads and `leagues.activity_settings` reads/writes run through league-scoped server routes, and the browser no longer inserts `activity_events` or resolves activity actors directly. Event creation now lives in the owning server routes/helpers, while the final RLS/grant closure for `activity_events` remains part of H13.
- Objective: Move activity writes fully server-side and scope reads by league access.
- Domains: `activity_events`, activity generation and feeds
- Acceptance:
  - browser writes to `activity_events` are gone
  - client cannot forge activity events through app routes
  - feed reads are scoped to members/spectators with access
  - final DB policy/grant closure for `activity_events` is explicitly tracked in H13
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted activity review/tests
- Remote changes allowed: local migration creation only
- Rollback: revert activity hardening changes
- Depends on: H01, H04

## H11 - Notifications and cron
- Status: DONE
- Current checkpoint: notification preferences and push subscriptions now require league-scoped server authorization, admin-only push dispatch, constant-time cron secret comparison, and a validated local migration for notification-table grants plus per-league device uniqueness.
- Objective: Protect notification tables and preserve cron hardening.
- Domains: `notification_preferences`, `push_subscriptions`, cron routes
- Acceptance:
  - service-role-only server routes remain the write path
  - users can modify only their own preferences/subscriptions
  - cron fails closed without valid secret
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted notification review/tests
- Remote changes allowed: local migration creation only
- Rollback: revert notification hardening changes
- Depends on: H01

## H12 - QA, superuser, storage, and files
- Status: DONE
- Current checkpoint: QA mode now stays admin-gated behind server authorization with generic failure codes, and the avatar/logo path is explicitly treated as validated image input instead of accepting arbitrary strings or silently overwriting custom account avatars from the OAuth session image.
- Objective: Protect QA/superuser-only operations and audit storage/file uploads.
- Domains: QA APIs, superuser gates, storage buckets, upload validation
- Acceptance:
  - QA routes require real authorization
  - production QA disabled behavior is safe
  - storage writes are scoped and validated
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted QA/storage review
- Remote changes allowed: local migration creation only
- Rollback: revert QA/storage hardening changes
- Depends on: H01

## H13 - RLS policies, grants, and privileged functions
- Status: DONE
- Current checkpoint: the local migration chain now closes current-table grants/policies across all public business tables, fixes the remaining global `PUBLIC` execute default for future `postgres`-owned functions via `20260716014000_fix_function_default_execute_privileges.sql`, and passes `db reset` + `db lint` from scratch. Fresh local probes confirm that new `postgres`-owned tables, sequences, and functions no longer inherit anon/authenticated access, while the remaining `supabase_admin` default privileges are explicitly treated as a platform-owned H19 audit item because the local migration runner cannot alter that role directly and all current business tables remain owned by `postgres`.
- Objective: Create the final migration set for RLS/grants/function exposure.
- Domains: all public tables, policies, grants, helper SQL functions
- Acceptance:
  - every public table has RLS enabled
  - no `dev all` policies remain
  - no always-true write policies remain
  - anon/authenticated DML is closed except explicit safe cases
  - privileged functions are not exposed to PUBLIC/anon/authenticated
- Validation:
  - `npx supabase db reset`
  - `npx supabase db lint --local --schema public --level warning --fail-on none`
  - local SQL audit queries
- Remote changes allowed: local migrations only until H19
- Rollback: add forward-fix migrations only; do not edit applied migrations
- Depends on: H02 through H12

## H14 - Full static audit
- Status: DONE
- Current checkpoint: repo-wide static searches now show `supabase.*` runtime calls confined to API/server modules, all `use client` modules free of `server-only` / `supabaseServer` imports, `serverPushDispatch.ts` and `serverQa.ts` explicitly marked `server-only`, shared QA action types extracted to `src/lib/qaTypes.ts`, and the dead legacy `NEXT_PUBLIC_SUPERUSER_PLAYER_IDS` helper removed.
- Objective: Audit all Supabase access paths and remaining client/server boundaries.
- Domains: entire `src` tree, env usage, client imports, sensitive writes
- Acceptance:
  - all `@/lib/supabase` usage classified
  - no client imports of server-only modules
  - no sensitive direct browser writes remain
- Validation:
  - `rg` audit across `src`
  - targeted diff review
- Remote changes allowed: none
- Rollback: documentation/audit only
- Depends on: H02 through H13

## H15 - Tests, lint, build, and local Supabase
- Status: DONE
- Current checkpoint: `npm ci`, `npm audit`, `npx tsc --noEmit`, `npm run lint`, and an elevated `npm run build` now pass on the current repo state. A fresh local Supabase start/reset/lint/audit/stop cycle also passes, and the repo still has no automated test suite or test files to execute.
- Objective: Run required local validations end to end.
- Domains: npm install, lint, build, tests, local Supabase reset/lint, local SQL audits
- Acceptance:
  - `npm ci`, lint, build, and tests pass
  - local Supabase starts, resets, and lints
  - local SQL audits confirm expected RLS/policy/grant state
- Validation:
  - `git diff --check`
  - `npm ci`
  - `npm run lint`
  - `npm run build`
  - test command(s)
  - `npx supabase start`
  - `npx supabase db reset`
  - `npx supabase db lint --local --schema public --level warning --fail-on none`
  - `npx supabase stop`
- Remote changes allowed: none
- Rollback: no remote changes yet
- Depends on: H13, H14

## H16 - Backup before remote changes
- Status: DONE
- Current checkpoint: the existing `2026-07-14` encrypted backup archive and SHA256 file were verified in `D:\BACKUPS`, and a fresh `release/production-hardening` git bundle plus SHA256 was created there for rollback coverage before any remote DB action.
- Objective: Verify backup artifacts and create a fresh git bundle before remote DB changes.
- Domains: `D:\BACKUPS`, git bundle, sha256
- Acceptance:
  - encrypted backup and SHA256 from 2026-07-14 verified present
  - fresh bundle created with checksum
- Validation:
  - filesystem checks in `D:\BACKUPS`
  - checksum generation
- Remote changes allowed: none
- Rollback: no remote changes yet
- Depends on: H15

## H17 - Release commits and push
- Status: DONE
- Current checkpoint: `release/production-hardening` now contains six H17 commits ending at `07168b5`, the push to `origin/release/production-hardening` succeeded, and `git ls-remote --heads origin release/production-hardening` verified the remote branch HEAD explicitly.
- Objective: Commit validated local work in small domain-based commits and push release branch.
- Domains: git history on `release/production-hardening`
- Acceptance:
  - diff reviewed and clean
  - commits created with no secrets or temp files
  - branch pushed without force
- Validation:
  - `git diff --check`
  - `git status -sb`
  - `git log --oneline`
- Remote changes allowed: push to release branch only
- Rollback: new revert commits only
- Depends on: H15, H16

## H18 - Preview deployment and smoke tests
- Status: DONE
- Current checkpoint: Preview deployment `dpl_EmRooXAtzhxC4KN3WW2uLHn3gpYQ` for SHA `07168b539b926bd7e8fc249a4d3c45d4da0e2e13` is `Ready`, and authenticated `npx vercel curl` smoke checks now pass against both the Preview URL and the stable alias. Verified responses include `/`, `/manifest.webmanifest`, icon assets, `/api/auth/session`, `/api/auth/providers`, invalid invite routes, cron without secret (`401`), and protected member/admin routes without session (`401`). The stable alias provider metadata returns the alias host in the Google sign-in/callback URLs, so the registered OAuth callback surface is aligned; only a later interactive end-to-end login remains manual.
- Objective: Validate the release SHA on Vercel Preview.
- Domains: Vercel preview deploy, preview smoke tests, anon write checks
- Acceptance:
  - preview for exact SHA is `Ready`
  - automated smoke checks pass
  - stable preview alias works for invite routes and OAuth callback registration
- Validation:
  - `npx vercel list --environment=preview --meta "githubCommitSha=<SHA>"`
  - HTTP smoke checks against preview
- Remote changes allowed: Vercel preview only
- Rollback: redeploy previous preview or revert release commits
- Depends on: H17

## H19 - Remote migrations and remote audit
- Status: DONE
- Current checkpoint: The linked remote project now has the full validated hardening migration chain through `20260716014000`, `npx supabase db lint --linked --schema public --level warning --fail-on none` passes, remote SQL audits return zero current-object RLS/grant/function regressions, and the remaining `supabase_admin` default ACL rows are confirmed as the same platform-owned residual seen locally while all current public tables remain owned by `postgres`.
- Objective: Apply only the planned new migrations and verify remote DB state.
- Domains: linked Supabase migrations, remote lint, remote SQL audits
- Acceptance:
  - linked migration list understood
  - dry-run matches expected new migrations only
  - push succeeds and local/remote migration lists match
  - remote SQL audits show no hardening regressions
- Validation:
  - `npx supabase migration list --linked`
  - `npx supabase db push --linked --dry-run`
  - `npx supabase db push --linked`
  - `npx supabase db lint --linked --schema public --level warning --fail-on none`
- Remote changes allowed: linked Supabase only
- Rollback: forward-fix migrations only; no destructive rollback
- Depends on: H18

## H20 - Integrate with production branch
- Status: DONE
- Current checkpoint: The real production branch was verified as `main`, `git fetch --all --prune` completed successfully, and the final UI-only beta-label commit was pushed through the existing release flow. `origin/main` and `origin/release/production-hardening` now point to the same final release line, and the required pre-production validations (`git diff --check`, `npm run lint`, `npm run build`) passed before the rollout continued.
- Objective: Merge the validated release work with the real production branch.
- Domains: git integration with production branch
- Acceptance:
  - production branch identified from current remote config
  - release branch updated with latest production changes
  - validations rerun on final SHA
- Validation:
  - `git fetch --all --prune`
  - `git status -sb`
  - validation suite from H15
- Remote changes allowed: non-destructive merge/push
- Rollback: revert merge with a new commit if needed
- Depends on: H19

## H21 - Production deployment
- Status: DONE
- Current checkpoint: The Production deployment for the final release run reached `Ready` on `https://smash-lob.vercel.app`, and Vercel build logs confirmed the deployment was built from the intended `main` commit during the rollout. Production env-name presence was confirmed without printing secrets, and the QA/app-url checks passed after normalizing the pulled env-file format.
- Objective: Ship the validated production branch to Vercel Production.
- Domains: Vercel production deployment, env presence check
- Acceptance:
  - production deployment `Ready`
  - expected env var names present
  - forbidden public env exposure absent
- Validation:
  - Vercel deployment inspection
  - production build/log checks
- Remote changes allowed: Vercel production only
- Rollback: restore prior production deployment or revert merge
- Depends on: H20

## H22 - Production smoke tests
- Status: DONE
- Current checkpoint: The live production domain passed the automated smoke suite for `/`, `/manifest.webmanifest`, `/api/auth/session`, `/api/auth/providers`, Google provider metadata, cron without secret (`401`), protected admin/member routes without session (`401`), invalid invite routes with controlled `404` responses, and a direct REST write probe using the deployed anon key returned a blocked `401 Invalid API key` response. A post-smoke production log scan found zero repeated `500`/`error` keywords. On 2026-07-18, the project owner also completed the documented two-Google-account Production walkthrough for organizer, member/player, availability, calendar/ranking, results, confirmations, MVP, and spectator access.
- Objective: Verify the live production app and protected data surface.
- Domains: live app routes, cron, PWA, anon access restrictions
- Acceptance:
  - public routes and auth endpoints respond correctly
  - protected routes fail closed without session
  - anon writes remain blocked
  - no major runtime/log regressions
- Validation:
  - HTTP smoke checks against `https://smash-lob.vercel.app`
  - anon access tests
- Remote changes allowed: read-only checks only
- Rollback: production deployment restore and/or revert commit
- Depends on: H21

## H23 - Final report and cleanup
- Status: DONE
- Current checkpoint: The release run has an evidence-backed final report, updated hardening docs, explicit residual risks, captured repo/release history, and completed human acceptance for the two-account Google organizer/member/spectator walkthrough on Production. The closed-beta release has no remaining documented release blocker.
- Objective: Deliver the final evidence-based report and leave repo state clean.
- Domains: report, final git state, validation summary, residual manual checks
- Acceptance:
  - final report covers all required sections
  - human-only checks are recorded with their evidence source and completion state
  - repo state and recent history captured
- Validation:
  - final `git status -sb`
  - final `git log --oneline -10`
  - cross-check against objective requirements
- Remote changes allowed: none
- Rollback: documentation only
- Depends on: H22
