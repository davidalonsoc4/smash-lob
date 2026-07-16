# Production Hardening Time Log

Last updated: 2026-07-16 13:35:45 +02:00

This is a planning/reference log, not a stopwatch export. Times below are approximate active-work estimates based on the completed validation slices and current repo state.

## Quick summary

- Closed milestones already completed: `27.0h`
- Open-milestone work already spent (`H17`): `1.0h`
- Total active effort already invested: `28.0h`
- Active effort still forecast to finish: `4.0h to 8.5h`
- For wall-clock planning, use the active estimate plus roughly `25% to 40%` extra for builds, Supabase/Docker spin-up, reruns, rereads, and checkpoint maintenance

## How to read this log

- `Approx. active time` means hands-on engineering time: audit, coding, validation, and fix iteration.
- It does **not** mean exact wall-clock elapsed time.
- It does **not** represent token cooldown or any platform wait-state accounting.
- Short pauses between iterations, rereads, command retries, and ordinary process overhead are only reflected if they materially belonged to the active slice being estimated.
- The current active-invested total is `28.0h`, including the ongoing H17 commit-grouping and checkpoint pass.
- If you need a calendar estimate rather than an engineering-effort estimate, budget the active numbers with a multiplier of about `1.25x` to `1.4x`.

## Why total process time can look larger than this file

- This log tracks estimated engineering effort by milestone, not literal elapsed conversation time.
- Time spent waiting on builds, sandbox retries, elevated reruns, context reloads, rereading files, and checkpoint/doc maintenance is real process time, but it is only folded in here when it materially belongs to a specific hardening slice.
- So if the end-to-end process feels longer than the sum of the milestone rows, that gap is usually ordinary execution/coordination overhead, not token cooldown accounting.
- The most common overhead buckets in this project are `npm`/Next build waits, local Supabase reset/lint cycles, Docker spin-up, Windows sandbox/elevation reruns, and the checkpoint updates needed to keep the work resumable.

## Time categories in the current estimate

| Category | Approx. active time invested so far | Included here |
| --- | --- | --- |
| Audit and design | 7.0h to 8.0h | repo review, static audits, migration-boundary decisions, route planning, H13 default-ACL diagnostics, and the later H14 boundary audit |
| Implementation and refactor | 10.0h to 11.0h | helpers, routes, client wrapper rewrites, hardening refactors |
| Validation, diagnostics, and forward fixes | 8.0h to 9.0h | lint/build/tsc/db reset/lint reruns, invite SQL forward fix, H13 reset/audit loops, the later function-default forward fix, H14 cleanup validation, and the end-to-end H15 sweep |
| Release prep and recovery | 0.5h to 1.0h | backup verification, bundle creation, checksum generation, and rollback prep |
| Total active estimate already invested | 28.0h | Working estimate, not stopwatch time |

## Completed work (approximate active time)

| Milestone | Scope | Status | Approx. active time | Notes |
| --- | --- | --- | --- | --- |
| H00 | Inventory, diff review, resumable docs bootstrap | DONE | 0.5h | Initial classification and checkpoint setup |
| H01 | Shared auth, request parsing, server-only helpers | DONE | 1.0h | Foundational refactor used by later routes |
| H02 | Invites, claim flow, spectators | DONE | 1.5h | Included claim hardening and fallback removal |
| H03 | League create/edit/delete | DONE | 1.5h | Included SQL helper route migration |
| H04 | `app_users` and `league_memberships` | DONE | 1.5h | Account sync and membership admin flows |
| H05 | `player_availability` | DONE | 1.0h | Routes plus local lock-down migration |
| H06 | `match_result_confirmations` | DONE | 1.0h | Participant-scoped auth plus migration |
| H07 | Match-detail writes and `matches` lock-down | DONE | 2.0h | Included match-detail routes, season-admin `matches` route migration, and local `matches` migration |
| H08 | Seasons/settings/calendar server migration plus season/player audit closure | DONE | 2.5h | Included season creation/start/finish/settings/calendar/delete routes and the migration-boundary decision that the remaining `players` client lookup belongs to activity |
| H09 | MVP hardening | DONE | 2.0h | Added server-side MVP read/write routes, rewired `supabaseMvp`, and validated the local MVP lock-down migration |
| H10 | Activity feed/settings plus server-side activity write migration | DONE | 3.0h | Completed feed/settings routing, removed direct browser `activity_events` writes, and moved reminder/dispute/MVP-derived activity generation into server routes/helpers |
| H11 | Notifications, cron, and notification-table lock-down | DONE | 1.5h | Closed league membership checks for notification routes, made dispatch admin-only, hardened cron secret comparison, and validated the local notification-table migration |
| H12 | QA, superuser, storage, and file validation | DONE | 1.0h | Hardened QA route inputs/error exposure, confirmed superuser env gating is no longer server-authoritative, and validated avatar/logo image inputs while preserving custom account avatars |
| H13 | Final RLS/policy/function migration set | DONE | 3.0h | Closed current public objects, fixed future `postgres`-owned function defaults, and isolated the remaining platform-owned `supabase_admin` defaults for later remote audit |
| H14 | Full static audit | DONE | 1.0h | Confirmed runtime Supabase access is server-confined, fixed `server-only` boundary gaps for QA/push helpers, and removed the dead public superuser helper |
| H15 | End-to-end local validation | DONE | 1.5h | Passed `npm ci`, `npm audit`, typecheck, lint, build, and a fresh local Supabase reset/lint/audit/stop cycle; no automated test suite exists in the repo |
| H16 | Backup verification | DONE | 0.5h | Verified the `2026-07-14` encrypted backup checksum and created a fresh release-branch git bundle plus SHA256 |
| Validation + SQL forward fix | Build/reset/lint reruns and invite RPC fix | DONE | 1.5h | Includes local Supabase reruns, the invite SQL forward fix, and the later MVP migration validation pass |

Estimated active work completed so far: `28.0h`

## Remaining work (forecast)

| Milestone | Scope | Status | Estimated remaining time | Notes |
| --- | --- | --- | --- | --- |
| H17 | Commits and push | IN_PROGRESS | 0.25h to 0.5h | Five local commits are already created; remaining work is the docs checkpoint plus verified push |
| H18 | Preview deployment and smoke tests | PENDING | 1h to 2h | Includes reruns if preview uncovers regressions |
| H19 | Remote migrations and remote audit | PENDING | 1h to 2h | Depends on linked environment behaving cleanly |
| H20 | Integrate with production branch | PENDING | 0.5h to 1.5h | Merge/rebase plus validation rerun |
| H21 | Production deployment | PENDING | 0.5h to 1h | Operational step |
| H22 | Production smoke tests | PENDING | 0.5h to 1.5h | Manual/automated checks on the live app |
| H23 | Final report and cleanup | PENDING | 0.5h to 1h | Wrap-up and residual risk summary |

Estimated active work remaining: `4.0h to 8.5h`

## Planning notes

- `H13` through `H16` are now locally closed for current objects, future `postgres`-owned migration objects, client/server boundary audit work, end-to-end local validation, and rollback/bundle preparation.
- The remaining `supabase_admin` default-privilege issue is not token-related; it is a platform-owned environment concern to re-audit later in H19, not an unresolved local app-migration gap.
- The DB-heavy milestones (`H13`, `H19`) may compress if the remaining audits come back cleaner than expected, or expand if they reveal more helper SQL fixes like the invite regeneration lint finding.
- Operational milestones (`H18` through `H22`) are more sensitive to environment/tooling friction than code complexity.
