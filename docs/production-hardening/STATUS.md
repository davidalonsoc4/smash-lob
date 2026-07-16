# Production Hardening Status

Last updated: 2026-07-16 23:31:46 +02:00
Current branch at status update: `main`
Production branch confirmed from Git + Vercel: `main`
Final application release commit validated in this run: `b805faf5a146f5bfa93b4646fbef3dbb0d8d399b`
Active milestone state: `H20-H23 complete`

## Final state summary

- `git fetch --all --prune` was rerun on 2026-07-16, and `git ls-remote --heads origin main release/production-hardening` confirmed both remote branches point to the same release line.
- The requested UI-only change is in place: the settings footer now renders `Beta cerrada · v0.9.68` for both player and spectator settings screens without changing `package.json`, `package-lock.json`, or `src/lib/appVersion.ts`.
- Local release gates for this final change passed: `git diff --check`, `npm run lint`, and `npm run build`.
- Preview and Production deployments for the release run reached `Ready`, and Vercel build logs tied them to `release/production-hardening` / `main` for the final release commit during rollout.
- Production env-name presence was confirmed without printing values, and the normalized checks for `QA_MODE=false`, `NEXT_PUBLIC_QA_MODE=false`, and `NEXT_PUBLIC_APP_URL=https://smash-lob.vercel.app` passed.
- The live production smoke suite passed for root, manifest, auth session/providers, Google provider metadata, cron-without-secret, protected no-session routes, and controlled invalid invite responses.
- A direct REST write probe using the deployed public anon key was blocked with HTTP `401`, and the post-smoke Production log scan found zero repeated `500` / `error` keywords.

## Verified deployments

- Preview deployment id: `dpl_2XA51Wn1LKR67ZDifQtpzon6uSdo`
- Preview URL: `https://smash-iw3095qvd-davidalonsoc4-8740s-projects.vercel.app`
- Preview stable alias: `https://smash-lob-git-release-produ-7ebc68-davidalonsoc4-8740s-projects.vercel.app`
- Preview status: `Ready`
- Production deployment id: `dpl_sMFbcwiqc5bC3sSEPPmHpH1dfGtc`
- Production URL: `https://smash-la8pe2hvc-davidalonsoc4-8740s-projects.vercel.app`
- Production aliases:
  - `https://smash-lob.vercel.app`
  - `https://smash-lob-davidalonsoc4-8740s-projects.vercel.app`
  - `https://smash-lob-git-main-davidalonsoc4-8740s-projects.vercel.app`
- Production status: `Ready`

## Smoke-test snapshot

- `/` -> `200 text/html`
- `/manifest.webmanifest` -> `200 application/manifest+json`
- `/api/auth/session` -> `200 application/json` with controlled anonymous response
- `/api/auth/providers` -> `200 application/json`; Google provider present; sign-in and callback URLs use `https://smash-lob.vercel.app`
- `/api/notifications/scheduled-check` without secret -> `401 {"reason":"invalid_cron_secret"}`
- `/api/leagues/11111111-1111-4111-8111-111111111111/users` without session -> `401 {"error":"unauthenticated"}`
- `/api/leagues/11111111-1111-4111-8111-111111111111/activity` without session -> `401 {"error":"unauthenticated"}`
- `/api/leagues/11111111-1111-4111-8111-111111111111/activity-settings` without session -> `401 {"error":"unauthenticated"}`
- `/api/invites/INVALID-CODE` -> `404 {"snapshot":null}`
- `/api/spectator-invites/INVALID-CODE` -> `404 {"error":"invite_not_found"}`
- Direct anon REST write probe against `matches` -> blocked `401 Invalid API key`
- Post-smoke Production log scan -> `0` matches for `error|exception|500|failed`

## Manual verification still pending

The interactive two-Google-account walkthrough has not been executed by Codex in this run, so it remains a required human check:

- organizer sign-in
- open the league
- generate an invite
- join with a second Google account
- claim a player
- save availability
- verify calendar and ranking
- register or review a result
- verify confirmations and MVP voting
- open a spectator invite

## Known residual risks

- Supabase platform defaults for `supabase_admin` in schema `public` remain an environment-level residual in `pg_default_acl`, although current public business tables remain owned by `postgres` and current-object grant/function audits are clean.
- Supabase security advisors still emit `RLS Enabled No Policy` informational findings on intentionally grants-closed server-only tables.
- The repo still has no automated test suite, so runtime confidence comes from static review plus Preview/Production smoke testing.
- The real Google OAuth organizer/member/spectator round-trip remains manual-only evidence until a human executes it on Production.

## Blockers

- No current technical blocker for the automated production-verification scope.
- Do not declare the app fully released without the manual two-account Google walkthrough.
