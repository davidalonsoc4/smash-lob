# Production Hardening Status

Last updated: 2026-07-16 13:35:45 +02:00
Current branch: `release/production-hardening`
Current HEAD: `1bdf65ea7e235d4749d04716577655fe903a3c3a`
Last confirmed remote commit: `8405e2708acbdb4b65be05ce7dabfb529324f426`

Active milestone: `H17 - Release commits and push`

Last completed action:
- Created five local H17 commits after reviewing/staging the validated work in domain-sized groups:
  - `9d4bdd2` `security: move league access behind server authorization`
  - `b244bf1` `security: protect match and season operations`
  - `0319d09` `security: protect activity and notification flows`
  - `820df86` `security: protect mvp qa and media flows`
  - `1bdf65e` `security: finalize database grants and rls hardening`
- The branch is now `ahead 5` of `origin/release/production-hardening`, and only the checkpoint docs/AGENTS files remain uncommitted before the release push.

Next exact action:
- Stage and commit `AGENTS.md` plus `docs/production-hardening/*` with the current checkpoint state.
- Run `git diff --check`, then push `release/production-hardening` and verify the remote branch HEAD explicitly before moving to H18 preview validation.

Modified files without commit:
- `AGENTS.md`
- `docs/production-hardening/PLAN.md`
- `docs/production-hardening/STATUS.md`
- `docs/production-hardening/DECISIONS.md`
- `docs/production-hardening/VALIDATION.md`
- `docs/production-hardening/ROLLBACK.md`
- `docs/production-hardening/TIMELOG.md`

Commands executed and results:
- `git diff --cached --check` during H17 commit grouping -> PASS for each domain commit before `git commit`
- `git commit -m "security: move league access behind server authorization"` -> PASS (`9d4bdd2`)
- `git commit -m "security: protect match and season operations"` -> PASS (`b244bf1`)
- `git commit -m "security: protect activity and notification flows"` -> PASS (`0319d09`)
- `git commit -m "security: protect mvp qa and media flows"` -> PASS (`820df86`)
- `git commit -m "security: finalize database grants and rls hardening"` -> PASS (`1bdf65e`)
- `git status -sb` after the five domain commits -> PASS_WITH_REVIEW (`release/production-hardening...origin/release/production-hardening [ahead 5]`, only `AGENTS.md` and `docs/production-hardening/*` remain uncommitted)
- `git log --oneline -8` after the five domain commits -> PASS (`1bdf65e`, `820df86`, `0319d09`, `b244bf1`, `9d4bdd2` now sit on top of `8405e27`)
- `git status -sb` -> modified/untracked files present; branch still matches `origin/release/production-hardening`
- `git diff --stat` -> tracked diff now includes the season hardening routes/helpers plus the new local migrations for `matches` and the invite-regeneration SQL fix
- `npx tsc --noEmit` after season-admin route refactor -> PASS
- `Get-ChildItem src -Recurse | Select-String 'from("matches")','from("season_settings")','from("seasons")','active_season_id'` -> PASS (remaining hits are server routes/helpers only; `src/lib/supabaseSeasons.ts` no longer performs direct browser DML on those tables)
- `Get-ChildItem src -Recurse | Select-String '@/lib/supabase'` -> PASS_WITH_REVIEW (client callers still use fetch-based helpers such as `supabaseSeasons`, `supabaseMatches`, `supabasePlayerAvailability`, and `supabaseMatchConfirmations`; remaining direct browser `supabase` imports of interest are still `src/lib/activity.ts`, `src/lib/activitySettings.ts`, and `src/lib/supabaseMvp.ts`)
- `Get-ChildItem src -Recurse | Select-String 'supabaseServer','createSupabaseServiceClient','SUPABASE_SERVICE_ROLE_KEY'` -> PASS_WITH_REVIEW (hits are API/server files plus localized error strings only; no client component currently imports `supabaseServer.ts`)
- `npm run lint` after season-admin route refactor -> PASS
- `git diff --check` after season-admin route refactor -> PASS
- `npm run build` after season-admin route refactor -> FAIL in sandbox with Windows `spawn EPERM`, then PASS after elevated rerun; build output listed the new `/api/leagues/[id]/seasons/*` routes
- `npx supabase --version` -> FAIL in sandbox with `ENOTCACHED`, then PASS after elevated rerun (`2.109.1`)
- `docker --version` -> PASS (`Docker version 29.6.1`)
- `npx supabase start` with output suppressed -> PASS
- `npx supabase db reset` -> PASS; local reset applied migrations through `20260715002000_lock_down_matches.sql`
- `npx supabase db lint --local --schema public --level warning --fail-on none` -> FAIL_WITH_FINDING; reported ambiguous `invite_code` reference inside `public.server_regenerate_league_invite()`
- `npx supabase db reset` after adding `20260715003000_fix_server_regenerate_league_invite.sql` -> PASS
- `npx supabase db lint --local --schema public --level warning --fail-on none` rerun -> PASS (`No schema errors found`)
- `npx supabase stop` with output suppressed -> PASS
- `npx tsc --noEmit` after H09 MVP refactor -> PASS
- `npm run lint` after H09 MVP refactor -> PASS
- `git diff --check` after H09 MVP refactor -> PASS
- `Get-ChildItem src -Recurse -File | Select-String 'from("mvp_votes")','from("mvp_manual_selections")' -SimpleMatch` -> PASS (remaining hits are server-only helpers, QA, and cron/notification code; browser table access is gone)
- `Get-ChildItem src -Recurse -File | Select-String '@/lib/supabase' -SimpleMatch` -> PASS_WITH_REVIEW (`src/lib/supabaseMvp.ts` no longer imports the browser client; remaining direct browser `supabase` imports of interest are `src/lib/activity.ts` and `src/lib/activitySettings.ts`)
- `npm run build` after H09 MVP refactor -> FAIL in sandbox with Windows `spawn EPERM`, then PASS after elevated rerun; build output listed `/api/mvp`, `/api/matches/[matchId]/mvp-vote`, `/api/matches/[matchId]/mvp-votes`, and `/api/leagues/[id]/seasons/[seasonId]/mvp-selection`
- `npx supabase start` with output suppressed after H09 MVP refactor -> PASS
- `npx supabase db reset` after adding `20260715004000_lock_down_mvp_tables.sql` -> PASS
- `npx supabase db lint --local --schema public --level warning --fail-on none` after MVP migration -> PASS (`No schema errors found`)
- `npx supabase stop` with output suppressed after H09 MVP refactor -> PASS
- `npx tsc --noEmit` after H10 activity read/settings slice -> PASS
- `npm run lint` after H10 activity read/settings slice -> PASS
- `git diff --check` after H10 activity read/settings slice -> PASS
- `Get-ChildItem src -Recurse -File | Select-String '@/lib/supabase' -SimpleMatch` after H10 read/settings slice -> PASS_WITH_REVIEW (`src/lib/activitySettings.ts` no longer imports the browser client; the remaining direct browser `supabase` import of interest for H10 is isolated to `src/lib/activity.ts`)
- `Get-ChildItem src -Recurse -File | Select-String 'from("activity_events")','activity_settings' -SimpleMatch` after H10 read/settings slice -> PASS_WITH_REVIEW (`activity_settings` app access is now confined to `/api/leagues/[id]/activity-settings` plus server push helpers; the remaining browser `activity_events` access sits in `src/lib/activity.ts`)
- `npm run build` after H10 activity read/settings slice -> FAIL in sandbox with Windows `spawn EPERM`, then PASS after elevated rerun; build output listed `/api/leagues/[id]/activity` and `/api/leagues/[id]/activity-settings`
- `npx tsc --noEmit` after H10 activity write migration -> PASS
- `npm run lint` after H10 activity write migration -> PASS
- `git diff --check` after H10 activity write migration -> PASS
- `Get-ChildItem src -Recurse -File | Select-String '@/lib/supabase' -SimpleMatch` after H10 activity write migration -> PASS (`src/lib/activity.ts` no longer imports the browser Supabase client; remaining hits are fetch wrappers or server-only modules)
- `Get-ChildItem src -Recurse -File | Select-String 'from("activity_events")','activity_settings' -SimpleMatch` after H10 activity write migration -> PASS (app-visible `activity_events` / `activity_settings` access is now limited to server routes/helpers, notification cron, and QA/server utilities)
- `npm run build` after H10 activity write migration -> FAIL in sandbox with Windows `spawn EPERM`, then PASS after elevated rerun; build output listed `/api/leagues/[id]/seasons/[seasonId]/registration-reminder` and `/api/matches/[matchId]/court-booking/payment-reminder`
- `npx tsc --noEmit` after H11 notification hardening -> PASS
- `npm run lint` after H11 notification hardening -> PASS
- `git diff --check` after H11 notification hardening -> PASS
- `rg -n "notification_preferences|push_subscriptions|notifications/(preferences|subscribe|unsubscribe|dispatch|scheduled-check)" src supabase/migrations` after H11 hardening -> PASS (browser code only hits `/api/notifications/*`; table access is confined to server routes/helpers plus the new notification migration)
- `npm run build` after H11 notification hardening -> FAIL in sandbox with Windows `spawn EPERM`, then PASS after elevated rerun; build output retained `/api/notifications/dispatch`, `/preferences`, `/scheduled-check`, `/subscribe`, and `/unsubscribe`
- `npx supabase start` before H11 migration validation -> FAIL in sandbox with `ENOTCACHED`, then PASS after elevated rerun
- `npx supabase db reset` after adding `20260716004500_lock_down_notification_tables.sql` -> PASS
- `npx supabase db lint --local --schema public --level warning --fail-on none` after H11 migration -> PASS (`No schema errors found`)
- `npx supabase stop` after H11 migration validation -> PASS
- `rg -n "storage\.from\(|QA_MODE|NEXT_PUBLIC_QA_MODE|NEXT_PUBLIC_SUPERUSER_PLAYER_IDS" src` after H12 audit -> PASS_WITH_REVIEW (no active storage bucket writes in app code; QA env checks stay confined to QA UI/route gating; `NEXT_PUBLIC_SUPERUSER_PLAYER_IDS` remains only in a legacy client helper, not server authorization)
- `npx tsc --noEmit` after H12 QA/file hardening -> PASS
- `npm run lint` after H12 QA/file hardening -> PASS
- `git diff --check` after H12 QA/file hardening -> PASS
- `npm run build` after H12 QA/file hardening -> FAIL in sandbox with Windows `spawn EPERM`, then PASS after elevated rerun; build output retained `/api/qa` and the updated league/player admin routes
- `Select-String -Path 'supabase/migrations/20260714155912_initial_remote_schema.sql' -Pattern 'GRANT ALL ON TABLE ... TO \"(anon|authenticated)\"'` plus comparison against local lock-down migrations -> PASS (remaining open table surface narrowed to `activity_events`, `app_users`, `league_locations`, `league_memberships`, `leagues`, `players`, `season_players`, `season_settings`, and `seasons`)
- `Select-String -Path 'supabase/migrations/20260714155912_initial_remote_schema.sql' -Pattern 'ALTER DEFAULT PRIVILEGES|GRANT ALL ON FUNCTION|GRANT ALL ON TABLE'` -> PASS_WITH_FINDING (initial schema still grants default ALL on tables/functions/sequences to `anon` and `authenticated`; H13 must close those defaults forward)
- `npx supabase start` before H13 validation -> FAIL in sandbox with `ENOTCACHED`, then PASS after elevated rerun
- `npx supabase db reset` after the first H13 migration draft -> FAIL_WITH_FINDING (`permission denied to change default privileges` for `supabase_admin`)
- `docker exec` / `psql` role diagnostics against the local Supabase DB -> PASS_WITH_FINDING (`postgres` can reset the database but cannot alter `supabase_admin` default privileges or take ownership of `supabase_admin` objects)
- `npx supabase db reset` after downgrading the `supabase_admin` cleanup to best-effort notice handling -> PASS_WITH_NOTICE (current-object closure applied cleanly; notice logged that `supabase_admin` default privileges were skipped)
- `npx supabase db lint --local --schema public --level warning --fail-on none` after the H13 migration rerun -> PASS (`No schema errors found`)
- direct SQL audit for public tables without RLS -> PASS
- direct SQL audit for permissive public-table policies -> PASS
- direct SQL audit for direct table grants to `PUBLIC` / `anon` / `authenticated` -> PASS
- direct SQL audit for executable public-schema functions granted to `PUBLIC` / `anon` / `authenticated` -> PASS
- direct SQL audit for remaining `pg_default_acl` entries in schema `public` -> FAIL_WITH_FINDING (`supabase_admin` still owns inherited default grants for `anon` and `authenticated`)
- `npx supabase stop` after H13 validation -> PASS
- `npx supabase start` for deeper default-privilege probes -> PASS (local stack restarted for the H13 follow-up investigation; do not reuse the printed local credentials)
- `docker ps --filter "name=supabase_" --format "{{.Names}}"` -> PASS (`supabase_db_smash-lob` and companion services running locally)
- post-start `docker exec` probes before a fresh reset -> PASS_WITH_FINDING (`postgres` probe still showed function `EXECUTE` for anon/authenticated because the stack had started from its backup snapshot rather than the recreated migration state; `supabase_admin` probe remained wide open as expected)
- `npx supabase db reset` after adding `20260716014000_fix_function_default_execute_privileges.sql` -> PASS_WITH_NOTICE (full chain applied cleanly; both `supabase_admin` notices were emitted because the migration runner still cannot alter that role)
- `npx supabase db lint --local --schema public --level warning --fail-on none` after `20260716014000` -> PASS (`No schema errors found`)
- post-reset default-privilege row audit -> PASS_WITH_FINDING (`postgres` defaults now retain only `postgres` + `service_role`; `supabase_admin` defaults remain open for `anon` / `authenticated`)
- post-reset probe for fresh `postgres`-owned table/function/sequence privileges -> PASS (all anon/authenticated checks returned false)
- post-reset probe for fresh `supabase_admin`-owned table/function/sequence privileges -> FAIL_WITH_FINDING (all anon/authenticated checks still returned true)
- post-reset audit for public tables without RLS -> PASS
- post-reset audit for permissive public-table policies -> PASS
- post-reset audit for direct table grants to `PUBLIC` / `anon` / `authenticated` -> PASS
- post-reset audit for executable public-schema functions granted to `PUBLIC` / `anon` / `authenticated` -> PASS
- post-reset ownership audit for current business tables -> PASS (all audited tables are owned by `postgres`)
- `npx supabase stop` after the H13 post-fix validation cycle -> PASS
- repo-wide static audit for `process.env`, `@/lib/supabase*`, and `supabase.*` runtime calls -> PASS_WITH_REVIEW (runtime Supabase access is now confined to API/server modules; remaining hits in client files are fetch wrappers and public env flags)
- static audit for `use client` files importing `server-only` / `supabaseServer` helpers -> FAIL_WITH_FINDING first (`src/app/admin/qa/page.tsx` imported `QaAction` from `serverQa.ts` by type only), then PASS after extracting shared QA types
- `rg -n "server-only" src` -> PASS_WITH_FINDING (`serverPushDispatch.ts` and `serverQa.ts` were the only server modules missing the marker and were fixed immediately)
- `npx tsc --noEmit` after the H14 server-only / QA-type cleanup -> PASS
- `npm run lint` after the H14 server-only / QA-type cleanup -> PASS
- `git diff --check` after the H14 cleanup -> PASS
- static audit for `NEXT_PUBLIC_SUPERUSER_PLAYER_IDS` -> PASS after deleting the dead legacy helper pair (`src/lib/permissions.ts`, `src/lib/superuser.ts`)
- `npm ci` -> FAIL in sandbox with Windows `spawn EPERM`, then PASS after elevated rerun (386 packages installed)
- `npm audit` -> PASS (`found 0 vulnerabilities`)
- `npx tsc --noEmit` after fresh install -> PASS
- `npm run lint` after fresh install -> PASS
- `npm run build` after fresh install -> FAIL in sandbox with Windows `spawn EPERM`, then PASS after elevated rerun
- `npx supabase start` for H15 validation -> PASS (local stack restarted; do not reuse the printed local credentials)
- `npx supabase db reset` during H15 -> PASS_WITH_NOTICE (full migration chain reapplied cleanly; the expected `supabase_admin` notices were emitted)
- `npx supabase db lint --local --schema public --level warning --fail-on none` during H15 -> PASS (`No schema errors found`)
- H15 SQL audit: public tables without RLS -> PASS
- H15 SQL audit: permissive public-table policies -> PASS
- H15 SQL audit: direct table grants to `PUBLIC` / `anon` / `authenticated` -> PASS
- H15 SQL audit: executable public-schema functions for `PUBLIC` / `anon` / `authenticated` -> PASS
- H15 SQL audit: exposed `SECURITY DEFINER` functions for `PUBLIC` / `anon` / `authenticated` -> PASS
- repo-wide automated test discovery -> PASS_WITH_REVIEW (no `test` script in `package.json`, and no `__tests__`, `.test.*`, or `.spec.*` files found)
- `npx supabase stop` after H15 validation -> PASS

Migrations created:
- `20260714213000_lock_down_public_invites.sql` -> created locally, not applied remotely
- `20260714234500_lock_down_player_availability.sql` -> created locally, not applied remotely
- `20260714240000_lock_down_match_result_confirmations.sql` -> created locally, not applied remotely
- `20260715002000_lock_down_matches.sql` -> created locally, validated with local `db reset` / `db lint`, not applied remotely
- `20260715003000_fix_server_regenerate_league_invite.sql` -> created locally as a forward fix after local lint, not applied remotely
- `20260715004000_lock_down_mvp_tables.sql` -> created locally, validated with local `db reset` / `db lint`, not applied remotely
- `20260716004500_lock_down_notification_tables.sql` -> created locally, validated with local `db reset` / `db lint`, not applied remotely
- `20260716013000_finalize_public_rls_and_grants.sql` -> created locally, validated with local `db reset` / `db lint`, not applied remotely
- `20260716014000_fix_function_default_execute_privileges.sql` -> created locally as a forward fix for future function default privileges, validated with local `db reset` / `db lint`, not applied remotely

Migrations applied locally:
- verified via `npx supabase db reset` on 2026-07-15:
  - `20260714155912_initial_remote_schema.sql`
  - `20260714194452_restrict_rls_auto_enable_execute.sql`
  - `20260714213000_lock_down_public_invites.sql`
  - `20260714231500_add_server_league_mutation_functions.sql`
  - `20260714234500_lock_down_player_availability.sql`
  - `20260714240000_lock_down_match_result_confirmations.sql`
  - `20260715002000_lock_down_matches.sql`
  - `20260715003000_fix_server_regenerate_league_invite.sql`
  - `20260715004000_lock_down_mvp_tables.sql`
- verified via `npx supabase db reset` on 2026-07-16:
  - `20260714155912_initial_remote_schema.sql`
  - `20260714194452_restrict_rls_auto_enable_execute.sql`
  - `20260714213000_lock_down_public_invites.sql`
  - `20260714231500_add_server_league_mutation_functions.sql`
  - `20260714234500_lock_down_player_availability.sql`
  - `20260714240000_lock_down_match_result_confirmations.sql`
  - `20260715002000_lock_down_matches.sql`
  - `20260715003000_fix_server_regenerate_league_invite.sql`
  - `20260715004000_lock_down_mvp_tables.sql`
  - `20260716004500_lock_down_notification_tables.sql`
  - `20260716013000_finalize_public_rls_and_grants.sql`
  - `20260716014000_fix_function_default_execute_privileges.sql`

Migrations applied remotely:
- `20260714155912_initial_remote_schema.sql` (known from prompt)
- `20260714194452_restrict_rls_auto_enable_execute.sql` (known from prompt)
- all later hardening migrations remain local-only and have NOT been applied remotely

Known deployments:
- Preview stable alias: `https://smash-lob-git-release-produ-7ebc68-davidalonsoc4-8740s-projects.vercel.app`
- Production URL: `https://smash-lob.vercel.app`
- Deployment readiness/logs for current SHA: NOT revalidated in this session

Validations passed:
- tracked diff reviewed
- invite hardening partial implementation reviewed
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- resumable docs/checkpoint files created
- shared auth/request helpers created and adopted in current invite/league routes
- spectator invite/access/self routes aligned with server-side session helpers
- league admin edits moved behind `PATCH /api/leagues/[id]`
- invite regeneration and league deletion now have local transactional SQL helpers prepared
- `app_users` browser upsert path moved behind `/api/app-user`
- league access snapshot moved behind `/api/access`
- membership role/unlink and player name/avatar admin flows moved behind server routes
- claimed membership snapshots no longer expose internal `app_users.id` values
- `player_availability` browser reads/writes moved behind self-scoped and match-scoped API routes
- scheduling suggestions no longer fetch availability for arbitrary client-supplied player ID lists
- local migration prepared to revoke direct anon/authenticated access to `player_availability`
- `match_result_confirmations` browser reads/writes moved behind server routes with participant/admin checks
- confirmation writes now resolve the confirming player from session membership on the server instead of trusting client `playerId`
- local migration prepared to revoke direct anon/authenticated access to `match_result_confirmations`
- match-detail scheduling, results, locking, court-booking edits, and transfer payment status changes now run through dedicated `/api/matches/[matchId]/*` routes
- result saves now resolve `result_reported_by_player_id` from the authenticated match actor and clear existing confirmations on the server instead of trusting or chaining client follow-up writes
- court-booking writes now rebuild allowed payments server-side from real match participants and enforce payer/debtor/admin transfer permissions on the server
- Supabase-backed season creation, season finish/start/reopen, season-settings saves, balanced-calendar repair, round-order changes, round deletion, and season deletion now run through league-scoped admin routes
- `src/lib/supabaseSeasons.ts` no longer performs direct browser writes to `matches`, `season_settings`, `seasons`, or `leagues.active_season_id`
- local migration prepared to revoke direct anon/authenticated access to `matches`
- elevated local Supabase validation now passes: `npx supabase start`, `npx supabase db reset`, `npx supabase db lint --local --schema public --level warning --fail-on none`, and `npx supabase stop`
- forward fix migration prepared for `public.server_regenerate_league_invite()` after lint found the ambiguous `invite_code` reference
- H08 season/player audit closed with the decision that the only remaining browser `players` access belongs to `src/lib/activity.ts`, so the unresolved client read boundary moves forward as H10 rather than blocking season administration
- Supabase-backed MVP reads, match voting, vote clearing, and manual selections now run through server routes; `src/lib/supabaseMvp.ts` no longer performs direct browser reads/writes to `mvp_votes`, `mvp_manual_selections`, or `activity_events`
- local migration prepared to revoke direct anon/authenticated access to `mvp_votes` and `mvp_manual_selections`
- activity feed reads now run through `/api/leagues/[id]/activity`, using spectator-aware league viewer authorization instead of direct browser reads from `activity_events`
- `activitySettings.ts` is now fetch-based through `/api/leagues/[id]/activity-settings`; direct browser reads/writes of `leagues.activity_settings` have been removed from the H10 slice
- the browser-side `recordActivityEvent()` path has now been removed; `src/lib/activity.ts` no longer imports the browser Supabase client or writes `activity_events` directly
- activity-producing mutations now write through server routes/helpers, including registration reminders, court-booking payment reminders, result disputes, and automatic MVP award derivation
- notification preferences and push-device registration now require league-scoped server authorization; `/api/notifications/dispatch` is admin-only, and `scheduled-check` now compares the cron secret with a timing-safe check
- local migration prepared to revoke direct anon/authenticated access to `notification_preferences` and `push_subscriptions`, while allowing one push endpoint row per league instead of one global endpoint row
- local `supabase db reset` and `db lint --local` now also validate `20260716004500_lock_down_notification_tables.sql`
- `/api/qa` now validates UUID inputs, stays admin-only behind real server auth, and no longer returns raw internal exception text for unknown failures
- avatar/logo writes now reject unsafe or oversized image strings on the server, and shared image helpers prevent unsafe persisted values from rendering directly in the UI
- `requireAuthenticatedAppUser()` now preserves an existing custom account avatar instead of clobbering it with the OAuth session image on later requests
- the H12 audit confirmed there are no active `storage.from(...)` bucket writes left in app code, and the only `NEXT_PUBLIC_SUPERUSER_PLAYER_IDS` reference is legacy client-side helper code rather than live server authorization logic
- the H13 inventory now has a concrete remaining open DB surface: `activity_events`, `app_users`, `league_locations`, `league_memberships`, `leagues`, `players`, `season_players`, `season_settings`, `seasons`, plus the initial permissive default privileges for future tables/functions/sequences
- the current local H13 rerun closes the public-table grant/policy/function surface for `activity_events`, `app_users`, `league_locations`, `league_memberships`, `leagues`, `players`, `season_players`, `season_settings`, and `seasons`
- local H13 audit queries now pass for public-table RLS coverage, permissive policy removal, direct table grants, and public-schema function execute grants
- fresh local probes now confirm that new `postgres`-owned tables, sequences, and functions do not inherit anon/authenticated privileges after `20260716014000_fix_function_default_execute_privileges.sql`
- all current business tables in schema `public` are owned by `postgres`, not `supabase_admin`
- the remaining environment finding is narrowly scoped to inherited `pg_default_acl` entries owned by `supabase_admin`, which the local migration runner cannot alter directly and which will be re-audited in H19
- H14 static audit confirms that the client-side `supabase` surface is now fetch-based, with direct `supabase.*` runtime calls confined to API/server code only
- `src/lib/serverPushDispatch.ts` and `src/lib/serverQa.ts` are now explicitly `server-only`, and the QA page no longer imports a server module even for shared types
- the last runtime reference to `NEXT_PUBLIC_SUPERUSER_PLAYER_IDS` has been removed with the deletion of unused legacy helpers
- H15 local validation now passes end to end on the current tree, but the repo still has no automated test suite; that remains a residual coverage risk rather than a failing check

Validations pending:
- anon direct-access verification
- preview smoke tests
- remote migration dry-run / push / audit
- production deployment and smoke tests

Blockers:
- no current local blocker; H16 backup verification is the next active milestone

Risks detected:
- Supabase platform defaults for `supabase_admin` in schema `public` remain open in local `pg_default_acl`; current app-owned objects are unaffected, but H19 must confirm whether any remote/public objects created by that role matter for this project
- the repo still has no automated test suite, so runtime coverage after H15 depends on static audit plus preview/production smoke testing

Secrets or interactions needed later (do not print values):
- linked Supabase credentials/config already expected in environment for remote DB work
- Vercel CLI auth/config for preview and production checks
- GitHub auth if PR-based merge flow is used
- possible manual Google OAuth verification at the end if browser automation cannot complete it safely
