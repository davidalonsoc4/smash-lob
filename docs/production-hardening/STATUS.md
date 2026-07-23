
## v0.13.2 cumulative application-admin package (2026-07-23)

- Rebuilt the complete v0.13.x delivery from the original staging snapshot plus the v0.13.0 application-administration changes.
- Retains the v0.12.7 scheduling-panel and compact statistics season-selector refinements.
- Corrects the v0.13.1 upcoming-roster refresh so Supabase snapshots replace stale season/player membership data for the leagues represented by the snapshot.
- The correction is client-state-only and does not add or modify database migrations beyond `20260723133000_add_application_admin_controls.sql`.
- Version advanced to v0.13.2 because the previously delivered v0.13.1 package did not pass TypeScript validation.

# Production Hardening Status

Last updated: 2026-07-20 18:49:40 +02:00
Current branch at status update: `staging`
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
