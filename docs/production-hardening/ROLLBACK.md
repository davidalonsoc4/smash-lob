# Rollback Notes

Last updated: 2026-07-16 13:35:45 +02:00

Last stable commit:
- local release checkpoint: `1bdf65e security: finalize database grants and rls hardening`
- last confirmed remote checkpoint: `8405e27 security: restrict rls auto-enable execution`

Last stable production deployment:
- Production URL known: `https://smash-lob.vercel.app`
- Exact deployment ID / SHA: not verified in this session yet

Backup artifacts verified:
- `D:\BACKUPS\smash-lob-backup-2026-07-14.7z`
- `D:\BACKUPS\smash-lob-backup-2026-07-14.sha256.txt`
- SHA256 verification: PASS on `2026-07-16`

Fresh bundle created:
- `D:\BACKUPS\smash-lob-release-production-hardening-20260716-131924.bundle`
- `D:\BACKUPS\smash-lob-release-production-hardening-20260716-131924.bundle.sha256.txt`

Remote changes already performed in the current hardening run:
- none

Current local release-only commits not pushed yet:
- `9d4bdd2 security: move league access behind server authorization`
- `b244bf1 security: protect match and season operations`
- `0319d09 security: protect activity and notification flows`
- `820df86 security: protect mvp qa and media flows`
- `1bdf65e security: finalize database grants and rls hardening`

Migrations already applied:
- local known: `20260714155912`, `20260714194452`
- remote known: `20260714155912`, `20260714194452`
- pending local-only migration: `20260714213000_lock_down_public_invites.sql`
- pending local-only migration: `20260714231500_add_server_league_mutation_functions.sql`
- pending local-only migration: `20260714234500_lock_down_player_availability.sql`
- pending local-only migration: `20260714240000_lock_down_match_result_confirmations.sql`
- pending local-only migration: `20260715002000_lock_down_matches.sql`
- pending local-only migration: `20260715003000_fix_server_regenerate_league_invite.sql`
- pending local-only migration: `20260715004000_lock_down_mvp_tables.sql`
- pending local-only migration: `20260716004500_lock_down_notification_tables.sql`
- pending local-only migration: `20260716013000_finalize_public_rls_and_grants.sql`
- pending local-only migration: `20260716014000_fix_function_default_execute_privileges.sql`

Backward compatibility status:
- current uncommitted work has not been pushed or deployed
- pending migration `20260714213000` must not be applied remotely until invite flows are fully server-side and validated
- `app_users` browser upsert behavior now depends on `/api/app-user`; rollback should restore `src/lib/supabaseUsers.ts` together with that route if this milestone is reverted
- availability editing and scheduling hints now depend on server routes under `/api/leagues/[id]/players/[playerId]/availability` and `/api/leagues/[id]/matches/[matchId]/availability`; rollback should restore `src/lib/supabasePlayerAvailability.ts` together with those routes if H05 is reverted
- result-confirmation reads/writes now depend on `/api/result-confirmations` plus `/api/result-confirmations/[matchId]`; rollback should restore `src/lib/supabaseMatchConfirmations.ts` together with those routes if H06 is reverted
- match-detail scheduling, results, locking, and court-booking writes now depend on `/api/matches/[matchId]/schedule`, `/postpone`, `/result`, `/result-lock`, `/court-booking`, and `/court-booking/transfers/[transferId]`; rollback should restore `src/lib/supabaseMatches.ts`, `src/context/MatchDataProvider.tsx`, and those routes together if this H07 slice is reverted
- Supabase-backed season creation, season finish/start, season-settings saves, balanced-calendar repair, round-order changes, round deletion, and season deletion now depend on the new `/api/leagues/[id]/seasons/*` routes plus `src/lib/serverSeasonAccess.ts` and `src/lib/serverSeasonMutations.ts`; rollback should restore `src/lib/supabaseSeasons.ts`, `src/app/admin/season/page.tsx`, `src/app/page.tsx`, and those season routes together if this H07/H08 slice is reverted
- Supabase-backed MVP reads and writes now depend on `/api/mvp`, `/api/matches/[matchId]/mvp-vote`, `/api/matches/[matchId]/mvp-votes`, `/api/leagues/[id]/seasons/[seasonId]/mvp-selection`, plus `src/lib/serverMvp.ts`; rollback should restore `src/lib/supabaseMvp.ts`, `src/context/MvpProvider.tsx`, and those MVP routes together if H09 is reverted
- Activity feed reads, league activity-settings reads/writes, and activity-event creation now depend on `/api/leagues/[id]/activity`, `/api/leagues/[id]/activity-settings`, `src/lib/serverActivity.ts`, `src/lib/serverActivityWrite.ts`, `src/lib/serverActivityDerivations.ts`, and the spectator-aware `getServerLeagueViewer()` helper; rollback should restore `src/lib/activity.ts`, `src/lib/activitySettings.ts`, the client-side reminder/event call sites, and the updated activity-producing routes together if H10 is reverted
- Registration reminders and court-booking payment reminders now flow through `/api/leagues/[id]/seasons/[seasonId]/registration-reminder` and `/api/matches/[matchId]/court-booking/payment-reminder`; rollback should restore the companion client-triggered activity behavior in `src/lib/activity.ts`, `src/lib/supabaseMatches.ts`, and `src/context/MatchDataProvider.tsx` together with those routes
- Notification preferences and push-device registration now depend on league-scoped server routes under `/api/notifications/*`, plus `20260716004500_lock_down_notification_tables.sql` for table grants and per-league endpoint uniqueness; rollback should restore the prior notification route behavior together with `src/app/settings/notifications/page.tsx` and that migration if H11 is reverted locally
- QA now depends on stricter `/api/qa` UUID validation and generic error handling; rollback should restore `src/app/api/qa/route.ts` together with its prior admin QA client expectations if this H12 slice is reverted
- avatar/logo handling now depends on `src/lib/imageUrl.ts`, `src/lib/serverImageValidation.ts`, the updated league/player admin routes, and `src/lib/serverAuth.ts` preserving existing custom avatars instead of preferring the OAuth session image; rollback should restore those helpers plus the avatar/logo components together if H12 is reverted
- current-table public RLS/grant closure now depends on `20260716013000_finalize_public_rls_and_grants.sql`; rollback should revert that migration locally only with a new forward fix if H13 changes again, and the `supabase_admin` default-privilege follow-up remains a separate environment-level concern because the migration runner cannot alter that role directly
- future `postgres`-owned function exposure is now also closed by `20260716014000_fix_function_default_execute_privileges.sql`; if H13 changes again, fix forward with another migration instead of editing either H13 migration in place
- QA and push-dispatch server boundaries now depend on `src/lib/serverQa.ts` and `src/lib/serverPushDispatch.ts` being explicitly `server-only`, while shared QA action types live in `src/lib/qaTypes.ts`; rollback should restore those files together if the H14 cleanup is reverted
- the dead legacy `src/lib/permissions.ts` / `src/lib/superuser.ts` pair has been removed because it was unused and carried the last runtime reference to `NEXT_PUBLIC_SUPERUSER_PLAYER_IDS`; rollback would require restoring both files together, but no current route or component depends on them
- local `supabase db reset` and `db lint --local` have already validated `20260715002000_lock_down_matches.sql` and `20260715003000_fix_server_regenerate_league_invite.sql`; if later work regresses, fix forward with new migrations rather than editing these files
- local `supabase db reset` and `db lint --local` have now also validated `20260715004000_lock_down_mvp_tables.sql`; any later regression in MVP hardening should be fixed forward with a new migration instead of editing this file
- local `supabase db reset` and `db lint --local` have now also validated `20260716004500_lock_down_notification_tables.sql`; any later notification-table regression should be fixed forward with a new migration instead of editing this file
- local `supabase db reset` and `db lint --local` have now also validated `20260716013000_finalize_public_rls_and_grants.sql` plus `20260716014000_fix_function_default_execute_privileges.sql`; current public objects are closed and fresh `postgres`-owned probe objects inherit no anon/authenticated access
- the remaining default-privilege risk is limited to platform-owned `supabase_admin` defaults, which are not alterable by the local migration runner and therefore must be re-audited later in the linked remote environment
- H14 static audit is locally closed: client/server import boundaries are clean, runtime `supabase.*` access is confined to API/server code, and the legacy public superuser helper has been removed
- H15 local validation is now closed: `npm ci`, `npm audit`, typecheck, lint, build, and a fresh local Supabase reset/lint/audit/stop cycle all passed on the current tree; there is still no automated test suite to run
- H16 backup verification is now closed: the prior encrypted backup has been checksum-verified, and a fresh git bundle checkpoint exists in `D:\BACKUPS`
- production compatibility of later milestones remains to be verified before remote DB changes

Recovery procedure:
1. If local code work becomes unstable before any remote action, revert only the local uncommitted domain changes with non-destructive file edits.
2. If release commits are pushed but preview fails, add follow-up fix commits or revert commits; do not rewrite history.
3. If a preview deployment is bad, redeploy a known-good commit or revert the offending commits on `release/production-hardening`.
4. Before any remote migration, verify backups and generate a fresh git bundle.
5. If a remote migration fails partially, stop, inspect migration state, and repair with a new forward migration. Do not edit an applied migration.
6. If production deployment fails critically after merge, restore the last Production Ready deployment and, if needed, revert the merge with a new commit.

Do not revert destructively:
- applied Supabase migrations
- production data
- git history via `reset --hard` / force push
- existing user changes in the worktree
