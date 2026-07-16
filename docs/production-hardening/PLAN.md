# Production Hardening Plan

Last updated: 2026-07-16 15:42:07 +02:00

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
- Status: IN_PROGRESS
- Current checkpoint: H19 is closed on the linked database, so the next action is to determine the real production branch from GitHub/Vercel state, fetch/prune remotes, and integrate the latest production changes into `release/production-hardening` before rerunning validations on the final pre-production SHA.
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
- Status: PENDING
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
- Status: PENDING
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
- Status: PENDING
- Objective: Deliver the final evidence-based report and leave repo state clean.
- Domains: report, final git state, validation summary, residual manual checks
- Acceptance:
  - final report covers all required sections
  - remaining manual-only checks are called out honestly
  - repo state and recent history captured
- Validation:
  - final `git status -sb`
  - final `git log --oneline -10`
  - cross-check against objective requirements
- Remote changes allowed: none
- Rollback: documentation only
- Depends on: H22
