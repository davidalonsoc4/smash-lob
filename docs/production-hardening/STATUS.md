# Production Hardening Status

Last updated: 2026-07-16 23:20:03 +02:00
Current branch: `main`
Current HEAD: `2407b4f8464969ea18376c1d8de025f479b93d2c`
Last confirmed remote commit: `2407b4f8464969ea18376c1d8de025f479b93d2c`

Active milestone: `H20 - Integrate with production branch`

Last completed action:
- Contrasted this file against the real repo/remotes: it was stale. `main`, `origin/main`, `release/production-hardening`, and `origin/release/production-hardening` are all already aligned at `2407b4f8464969ea18376c1d8de025f479b93d2c`, not `07168b5`.
- Reconfirmed `git fetch --all --prune` on 2026-07-16 and verified both remote branches still point to `2407b4f8464969ea18376c1d8de025f479b93d2c`.
- The previous Production verification for SHA `2407b4f8464969ea18376c1d8de025f479b93d2c` remains valid as historical evidence only; it is no longer sufficient for release sign-off because a new UI-only change is now pending locally in `src/app/settings/page.tsx`.
- Added the requested non-intrusive settings-only label so the rendered footer now reads `Beta cerrada · v0.9.68` for both player and spectator settings views, without touching `package.json`, `package-lock.json`, or `src/lib/appVersion.ts`.

Next exact action:
- Run `git diff --check`, `npm run lint`, and `npm run build` on the current worktree.
- If validations pass, update the hardening docs with the new SHA flow, commit the UI/docs delta, push `release/production-hardening` and `main`, then verify the exact Vercel Preview/Production deployments and rerun the production smoke suite on the final SHA.

Modified files without commit:
- `docs/production-hardening/STATUS.md`
- `src/app/settings/page.tsx`

Commands executed and results:
- `npx vercel list --environment=preview --meta "githubCommitSha=07168b539b926bd7e8fc249a4d3c45d4da0e2e13"` -> PASS (`Ready` Preview deployment `https://smash-7vgg9yyao-davidalonsoc4-8740s-projects.vercel.app`)
- `npx vercel inspect https://smash-7vgg9yyao-davidalonsoc4-8740s-projects.vercel.app` -> PASS (deployment `dpl_EmRooXAtzhxC4KN3WW2uLHn3gpYQ`, alias `https://smash-lob-git-release-produ-7ebc68-davidalonsoc4-8740s-projects.vercel.app`, status `Ready`)
- Authenticated H18 smoke batch via `npx vercel curl -i -s <url>` -> PASS (Preview/stable alias root, manifest, icon assets, auth session/providers, invalid invite routes, cron-without-secret auth failure, and protected no-session routes all returned the expected results)
- `npx vercel inspect https://smash-7vgg9yyao-davidalonsoc4-8740s-projects.vercel.app --logs` after smoke tests -> PASS (post-smoke keyword scan found zero matches for `error`, `exception`, `500`, or `failed`)
- `npx supabase migration list --linked` before push -> PASS (remote project still showed only `20260714155912` and `20260714194452`)
- `npx supabase db push --linked --dry-run` -> PASS (would apply exactly the ten validated local-only hardening migrations)
- `npx supabase db push --linked` -> PASS_WITH_NOTICE (all ten hardening migrations applied; the known `pgdelta-target-ca.crt ENOENT` cache warning appeared afterward, so success was accepted only after explicit verification)
- `npx supabase migration list --linked` after push -> PASS (local and remote histories now match through `20260716014000`)
- `npx supabase db lint --linked --schema public --level warning --fail-on none` -> PASS (`No schema errors found`)
- Remote SQL audit summary via `npx supabase db query --linked --file <summary.sql>` -> PASS_WITH_FINDING (all current-object counts returned `0`; only `supabase_admin_default_acl_rows=3` remained)
- Remote default ACL detail via `npx supabase db query --linked --file <default-acl.sql>` -> PASS_WITH_FINDING (`postgres` defaults are limited to `postgres` + `service_role`; `supabase_admin` still exposes table/function/sequence defaults)
- Remote public-table ownership audit via `npx supabase db query --linked --file <ownership.sql>` -> PASS (all current public business tables are owned by `postgres`)
- `npx supabase db advisors --linked --type security --level info --fail-on none` -> PASS_WITH_INFO (only `RLS Enabled No Policy` infos on intentionally grants-closed/server-only tables)
- Earlier local validations, milestone checkpoints, and commit/push evidence remain recorded in `docs/production-hardening/VALIDATION.md`

Migrations created:
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

Migrations applied locally:
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

Known deployments:
- Preview deployment id: `dpl_EmRooXAtzhxC4KN3WW2uLHn3gpYQ`
- Preview URL: `https://smash-7vgg9yyao-davidalonsoc4-8740s-projects.vercel.app`
- Preview stable alias: `https://smash-lob-git-release-produ-7ebc68-davidalonsoc4-8740s-projects.vercel.app`
- Production URL: `https://smash-lob.vercel.app`
- Production deployment id: `dpl_EiMC9dX7XnVRpCW8jqDAbZuSMQCo`
- Production deployment SHA: `2407b4f8464969ea18376c1d8de025f479b93d2c`

Validations passed:
- H15 local validation suite (`npm ci`, `npm audit`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, local Supabase reset/lint/audits)
- H16 backup verification and fresh git bundle checkpoint
- H17 release commits, push, and explicit remote SHA verification
- H18 Preview deployment readiness, authenticated smoke tests, stable-alias OAuth provider host check, and clean post-smoke log scan
- H19 linked remote migration parity, linked remote lint, current-object SQL audits, and remote public-table ownership verification
- Historical final-sha verification for `2407b4f8464969ea18376c1d8de025f479b93d2c`: Preview `Ready`, Production `Ready`, production env-name presence confirmed, production smoke tests passed, and post-smoke production log scan found no repeated `500`/`error` keywords

Validations pending:
- `git diff --check` on the new `Beta cerrada` change
- `npm run lint` on the new `Beta cerrada` change
- `npm run build` on the new `Beta cerrada` change
- Commit/push of the new final SHA
- Exact Preview/Production deployment verification for the new final SHA
- Production smoke-test rerun for the new final SHA
- Final interactive Google OAuth two-account verification (manual-only)

Blockers:
- No current local blocker; the repo is waiting on validation and redeploy verification for the new settings-label SHA

Risks detected:
- Supabase platform defaults for `supabase_admin` in schema `public` remain open in `pg_default_acl`; this is currently documented as an environment-level residual because all current public business tables are owned by `postgres`
- Supabase security advisors still emit `RLS Enabled No Policy` infos for intentionally grants-closed/server-only tables; current-object grant/function audits are clean
- The repo still has no automated test suite, so runtime coverage depends on static audit plus Preview/Production smoke testing
- Interactive Google OAuth has not been executed end to end in this session; provider metadata and callback hosts were correct on the prior final SHA, but the real login round-trip remains a manual verification item for the new final SHA

Secrets or interactions needed later (do not print values):
- GitHub auth if PR-based production integration is used
- Vercel CLI auth/config for production deployment verification
- Existing linked Supabase credentials/config for any further remote DB inspection
- Possible manual Google OAuth verification at the end if browser automation cannot complete it safely
