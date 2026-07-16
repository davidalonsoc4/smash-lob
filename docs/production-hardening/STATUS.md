# Production Hardening Status

Last updated: 2026-07-16 15:42:07 +02:00
Current branch: `release/production-hardening`
Current HEAD: `07168b539b926bd7e8fc249a4d3c45d4da0e2e13`
Last confirmed remote commit: `07168b539b926bd7e8fc249a4d3c45d4da0e2e13`

Active milestone: `H20 - Integrate with production branch`

Last completed action:
- Closed H19 on the linked Supabase project; remote migration parity, linked lint, current-object SQL audits, and public-table ownership verification all passed, leaving only the documented `supabase_admin` default ACL residual.
- Confirmed the real production branch is `main` from both Git and Vercel:
  - Git: `origin/HEAD -> origin/main` and `git symbolic-ref refs/remotes/origin/HEAD` both resolve to `refs/remotes/origin/main`.
  - Vercel project API: `link.productionBranch` is `main`.
  - Current Production deployment is `dpl_CPxBspxp7wNw19R3vv527aaA57s9`, `Ready`, built from commit `d4209a65300d6c5357cf7afa9adbf9876f38882a` on branch `main`.
- `git fetch --all --prune` completed, and `git rev-list --left-right --count origin/main...HEAD` returned `0 11`, so `release/production-hardening` already contains the current tip of `origin/main` and sits 11 commits ahead with no incoming main-only commits.

Next exact action:
- Create a clean checkpoint commit for the updated hardening docs on `release/production-hardening`, then integrate `release/production-hardening` into `main` using the standard non-destructive flow.
- Rerun the required validations on the resulting pre-production SHA before allowing the Production deployment step to proceed.

Modified files without commit:
- `docs/production-hardening/DECISIONS.md`
- `docs/production-hardening/PLAN.md`
- `docs/production-hardening/STATUS.md`
- `docs/production-hardening/VALIDATION.md`
- `docs/production-hardening/ROLLBACK.md`
- `docs/production-hardening/TIMELOG.md`

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
- Production deployment id / SHA: not verified in this session yet

Validations passed:
- H15 local validation suite (`npm ci`, `npm audit`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, local Supabase reset/lint/audits)
- H16 backup verification and fresh git bundle checkpoint
- H17 release commits, push, and explicit remote SHA verification
- H18 Preview deployment readiness, authenticated smoke tests, stable-alias OAuth provider host check, and clean post-smoke log scan
- H19 linked remote migration parity, linked remote lint, current-object SQL audits, and remote public-table ownership verification

Validations pending:
- Determine and verify the real production branch
- Merge/integrate the latest production branch state into `release/production-hardening`
- Rerun the required validation suite on the final pre-production SHA after integration
- Anon direct-access verification with the public anon key path (without printing secrets)
- Production deployment verification
- Production smoke tests
- Final interactive Google OAuth end-to-end verification if no safe automated browser session becomes available

Blockers:
- No current local blocker; H20 production-branch detection and integration is the next active milestone

Risks detected:
- Supabase platform defaults for `supabase_admin` in schema `public` remain open in `pg_default_acl`; this is currently documented as an environment-level residual because all current public business tables are owned by `postgres`
- Supabase security advisors still emit `RLS Enabled No Policy` infos for intentionally grants-closed/server-only tables; current-object grant/function audits are clean
- The repo still has no automated test suite, so runtime coverage depends on static audit plus Preview/Production smoke testing
- Interactive Google OAuth has not been executed end to end in this session; provider metadata and callback hosts are correct, but the real login round-trip remains a later manual verification item if no safe authenticated browser session is available

Secrets or interactions needed later (do not print values):
- GitHub auth if PR-based production integration is used
- Vercel CLI auth/config for production deployment verification
- Existing linked Supabase credentials/config for any further remote DB inspection
- Possible manual Google OAuth verification at the end if browser automation cannot complete it safely
