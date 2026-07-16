# Production Hardening Decisions

## 2026-07-14 - Auth.js session plus server-side Supabase service role
- Decision: Keep Auth.js as the source of identity and move authorization into Next.js server routes backed by `SUPABASE_SERVICE_ROLE_KEY`.
- Why: The selected security strategy is already established in the project context and avoids introducing Supabase Auth or external JWT work during production hardening.
- Rejected alternatives:
  - migrate to Supabase Auth during hardening
  - trust the browser anon client plus RLS alone
  - accept client-provided email/user/role hints as authorization input
- Consequences:
  - every sensitive write path must be moved behind server routes
  - server helpers are required to normalize email and preserve DB-owned flags like `is_superuser`
- Affected files:
  - `src/auth.ts`
  - `src/lib/supabaseServer.ts`
  - `src/lib/serverLeagueAccess.ts`
  - API routes under `src/app/api`

## 2026-07-14 - Invite snapshot and claim flow must no longer fall back to browser Supabase writes
- Decision: Remove the direct-client fallback from invite snapshot resolution and route player claim through `/api/invites/[code]/claim`.
- Why: The previous fallback allowed sensitive invite and membership operations to depend on the public anon client.
- Rejected alternatives:
  - keep fallback behavior until all other tables are migrated
  - accept client email or player ownership claims in the request body
- Consequences:
  - invite lookup now depends on server credentials
  - claim flow must validate invite code, league, and player server-side
- Affected files:
  - `src/lib/supabaseInvites.ts`
  - `src/app/api/invites/[code]/route.ts`
  - `src/app/api/invites/[code]/claim/route.ts`
  - `src/components/invite/InviteFlow.tsx`
  - `src/context/LeagueAccessProvider.tsx`

## 2026-07-14 - Create a forward-only migration to lock down `public.invites`
- Decision: Add a new local migration `20260714213000_lock_down_public_invites.sql` instead of editing existing migrations.
- Why: The baseline and the already applied `20260714194452` migration are immutable by requirement.
- Rejected alternatives:
  - edit `20260714155912_initial_remote_schema.sql`
  - edit `20260714194452_restrict_rls_auto_enable_execute.sql`
  - change remote RLS manually in the dashboard
- Consequences:
  - remote DB must not be touched until local validation and preview checks pass
  - subsequent invite route behavior must be fully server-side before applying the migration
- Affected files:
  - `supabase/migrations/20260714213000_lock_down_public_invites.sql`

## 2026-07-14 - Add shared server-only auth and request helpers before expanding the migration
- Decision: Introduce common helpers for authenticated app-user resolution and request parsing/UUID validation before continuing domain-by-domain hardening.
- Why: The same `auth() + app_users upsert + service_role` pattern was already duplicating across new routes, and raw route-level DB error strings needed to be removed consistently.
- Rejected alternatives:
  - keep duplicating auth/upsert logic in each route
  - postpone helper extraction until all domains are migrated
- Consequences:
  - current invite/league routes now share the same identity bootstrap path
  - later domain migrations can reuse the same helpers instead of re-solving the same auth/request boundary
- Affected files:
  - `src/lib/serverAuth.ts`
  - `src/lib/serverRequest.ts`
  - `src/lib/serverLeagueAccess.ts`
  - `src/app/api/leagues/route.ts`
  - `src/app/api/invites/[code]/claim/route.ts`
  - `src/app/api/invites/[code]/route.ts`
  - `src/app/api/leagues/[id]/invite/route.ts`

## 2026-07-14 - Keep spectator cleanup best-effort after a successful claim
- Decision: Do not fail the player-claim API if the post-claim spectator cleanup fails.
- Why: The membership insert is the authoritative outcome; returning `500` after a successful claim would break the prior UI contract and leave the client believing the join failed.
- Rejected alternatives:
  - fail the whole API response after membership creation
  - try to treat spectator cleanup as a separate client concern again
- Consequences:
  - claim success remains stable for the UI
  - stale spectator rows may need later cleanup if a rare delete failure occurs
- Affected files:
  - `src/app/api/invites/[code]/claim/route.ts`

## 2026-07-14 - Use narrow SQL functions for atomic league regeneration and deletion
- Decision: Add small server-only SQL functions for invite regeneration and league deletion instead of keeping multi-step mutations in route handlers.
- Why: Those flows update multiple tables or rely on cascade behavior, and route-level step chains risk partial writes if a later statement fails.
- Rejected alternatives:
  - keep multi-step route logic and accept partial-state risk
  - move all league writes into one large all-purpose SQL function
- Consequences:
  - `server_regenerate_league_invite` and `server_delete_league` must be validated locally before any remote push
  - only `service_role` should be able to execute these helpers
- Affected files:
  - `supabase/migrations/20260714231500_add_server_league_mutation_functions.sql`
  - `src/app/api/leagues/[id]/invite/route.ts`
  - `src/app/api/leagues/[id]/route.ts`

## 2026-07-14 - Resolve the current app user only through a server route
- Decision: Move browser-facing `app_users` synchronization behind `GET /api/app-user`, backed by `requireAuthenticatedAppUser()`.
- Why: The previous `src/lib/supabaseUsers.ts` helper still upserted `app_users` directly with the anon client from browser flows such as availability, season administration, and activity logging.
- Rejected alternatives:
  - keep direct browser `app_users` upserts until the later RLS migration
  - accept client-provided email/display-name/avatar inputs as the source of truth for account identity
- Consequences:
  - browser callers still obtain the same app-user shape, but identity now comes from `auth()` on the server
  - remaining direct `app_users` exposure is limited to later domain-specific reads such as activity feeds, which need their own scoped redesign
- Affected files:
  - `src/app/api/app-user/route.ts`
  - `src/lib/supabaseUsers.ts`

## 2026-07-14 - Hide claimed membership UUIDs from browser snapshots
- Decision: Replace claimed membership `userId` values in invite/access snapshots and membership mutation responses with the opaque marker `__claimed__`.
- Why: The UI only needs to know whether a slot is already linked, not the internal `app_users.id` of the linked account, and exposing those UUIDs widened the browser-visible data surface unnecessarily.
- Rejected alternatives:
  - keep exposing internal UUIDs and document the leak as acceptable
  - remove claimed membership rows entirely and force the UI to infer claim state indirectly
- Consequences:
  - the current UI keeps working for claim detection and admin updates
  - `playerProfiles.userId` still exists for broader cross-screen behaviors and will need a more careful redesign in later milestones if we want to eliminate that exposure too
- Affected files:
  - `src/app/api/access/route.ts`
  - `src/app/api/invites/[code]/route.ts`
  - `src/app/api/leagues/[id]/members/[playerId]/route.ts`
  - `src/context/LeagueAccessProvider.tsx`

## 2026-07-14 - Scope availability reads to self or real match participants
- Decision: Replace direct browser access to `player_availability` with two routes: one self-scoped route for the linked player and one match-scoped route that resolves the participant list on the server from the real match row.
- Why: A generic client query by `playerIds` made it too easy to turn guessed IDs into cross-user availability reads, while the existing UI only needs self-editing and match-participant scheduling hints.
- Rejected alternatives:
  - keep a general availability list endpoint that trusts client-supplied player IDs
  - allow admins to write availability for other players from the same route
- Consequences:
  - availability writes are now tied to the authenticated membership player only
  - schedule suggestions still work, but the server decides which players belong to the match
- Affected files:
  - `src/app/api/leagues/[id]/players/[playerId]/availability/route.ts`
  - `src/app/api/leagues/[id]/matches/[matchId]/availability/route.ts`
  - `src/lib/supabasePlayerAvailability.ts`
  - `src/app/availability/page.tsx`
  - `src/components/match/MatchAvailabilitySuggestions.tsx`
  - `src/components/match/MatchScheduleForm.tsx`

## 2026-07-14 - Prepare a dedicated lock-down migration for `player_availability`
- Decision: Add local migration `20260714234500_lock_down_player_availability.sql` as soon as the app stops depending on anon-client reads and writes to that table.
- Why: H05 is only materially complete once the runtime path is server-side and the database plan to revoke direct access is ready to validate locally.
- Rejected alternatives:
  - postpone the migration file until the end and risk drifting away from the code change
  - keep direct `anon` / `authenticated` grants in place after moving the runtime access path
- Consequences:
  - local Supabase reset/lint must later confirm that the new RLS/grant state applies cleanly from scratch
  - remote application remains deferred until the later migration milestones and preview checks
- Affected files:
  - `supabase/migrations/20260714234500_lock_down_player_availability.sql`

## 2026-07-15 - Resolve match-confirmation identity from the server-side match actor
- Decision: Introduce `src/lib/serverMatchAccess.ts` and make result-confirmation writes resolve the confirming player from the authenticated league membership tied to the real match.
- Why: The previous confirmation flow let the browser send `playerId` as the operative identity, which is precisely the spoofing surface H06 is supposed to remove.
- Rejected alternatives:
  - keep using client `playerId` and rely only on UI guards
  - build confirmation authorization directly in each route without a reusable match helper
- Consequences:
  - participant confirmation writes now fail closed if the session user is not actually one of the match players
  - later match and MVP milestones can reuse the same match-access helper instead of re-solving participant/admin checks
- Affected files:
  - `src/lib/serverMatchAccess.ts`
  - `src/app/api/result-confirmations/[matchId]/route.ts`
  - `src/context/MatchDataProvider.tsx`
  - `src/lib/supabaseMatchConfirmations.ts`

## 2026-07-15 - Fetch result confirmations only for matches already visible to the session
- Decision: Replace direct browser reads of `match_result_confirmations` with `POST /api/result-confirmations`, which first scopes the requested match IDs to leagues the session can already access.
- Why: Confirmation state is part of protected league data, so a guessed match UUID must not become a free read path.
- Rejected alternatives:
  - expose a public batch confirmation endpoint keyed only by match IDs
  - fetch confirmations one match at a time from the browser anon client
- Consequences:
  - members, admins, spectators, and superusers can still load confirmation state for matches they may already view
  - direct anonymous reads to the table can now be revoked once the migration is validated locally
- Affected files:
  - `src/app/api/result-confirmations/route.ts`
  - `src/lib/supabaseMatchConfirmations.ts`
  - `src/context/MatchDataProvider.tsx`

## 2026-07-15 - Prepare a dedicated lock-down migration for `match_result_confirmations`
- Decision: Add local migration `20260714240000_lock_down_match_result_confirmations.sql` immediately after removing the last browser write/read path to that table.
- Why: H06 is only complete if the code path is server-side and the pending database hardening for the same table is tracked beside it.
- Rejected alternatives:
  - defer the migration file until the end of the hardening project
  - leave direct anon/authenticated grants in place while pretending the domain is complete
- Consequences:
  - local reset/lint later needs to prove the confirmation table now survives from-scratch builds with RLS/grants closed
  - remote rollout stays deferred until the preview and migration milestones
- Affected files:
  - `supabase/migrations/20260714240000_lock_down_match_result_confirmations.sql`

## 2026-07-15 - Move match-detail mutations behind dedicated `/api/matches/[matchId]/*` routes
- Decision: Replace the remaining match-detail anon-client writes with focused server routes for scheduling, postponing, result save/clear, result locking, court-booking update/clear, and transfer payment status changes.
- Why: `src/lib/supabaseMatches.ts` still let the browser update sensitive `matches` fields directly, including `result_reported_by_player_id`, `result_locked`, and booking transfer state, all behind guessed match IDs.
- Rejected alternatives:
  - keep direct `supabase.from("matches")` helpers and rely on page-level UI guards
  - collapse all match mutations into one generic route that accepts arbitrary field updates
  - continue trusting client-supplied reporter or transfer context for result and booking writes
- Consequences:
  - `src/lib/supabaseMatches.ts` is now fetch-based for Supabase-backed matches
  - server authorization now distinguishes participant/admin result actions, admin-only destructive/locking actions, and payer/debtor/admin booking permissions using the real session membership plus current match row
  - result saves now clear stale `match_result_confirmations` server-side instead of depending on a client follow-up call
- Affected files:
  - `src/app/api/matches/[matchId]/schedule/route.ts`
  - `src/app/api/matches/[matchId]/postpone/route.ts`
  - `src/app/api/matches/[matchId]/result/route.ts`
  - `src/app/api/matches/[matchId]/result-lock/route.ts`
  - `src/app/api/matches/[matchId]/court-booking/route.ts`
  - `src/app/api/matches/[matchId]/court-booking/transfers/[transferId]/route.ts`
  - `src/lib/serverMatchAccess.ts`
  - `src/lib/supabaseMatches.ts`
  - `src/context/MatchDataProvider.tsx`

## 2026-07-15 - Defer the `matches` lock-down migration until season-admin match writes move server-side
- Decision: Keep H07 marked `IN_PROGRESS` and do not create the local `matches` lock-down migration yet.
- Why: The static audit still shows browser-side `matches` INSERT/UPDATE/DELETE in `src/lib/supabaseSeasons.ts` for season creation, round deletion/reordering, and balanced-calendar repair. Revoking anon/authenticated DML now would break those admin flows.
- Rejected alternatives:
  - create a partial `matches` migration now and hope later season/admin work catches up
  - mark H07 done after only the match-detail routes were migrated
- Consequences:
  - the next H07 action is to move the remaining `supabaseSeasons.ts` match mutations behind admin server routes
  - only after that audit passes should the repo add a local migration to revoke direct `matches` access
- Affected files:
  - `src/lib/supabaseSeasons.ts`
  - `docs/production-hardening/STATUS.md`
  - `docs/production-hardening/PLAN.md`
  - `docs/production-hardening/VALIDATION.md`

## 2026-07-15 - Move the remaining Supabase-backed season administration behind league-scoped admin routes
- Decision: Replace the last direct browser writes in `src/lib/supabaseSeasons.ts` with dedicated server routes for season creation, finish/start, round-settings updates, balanced-calendar repair, round-order changes, round deletion, and full season deletion.
- Why: Even after the first H07 slice, season administration still let the browser mutate `matches`, `season_settings`, `seasons`, and `leagues.active_season_id` through the anon client. That left one of the highest-value admin surfaces outside the `auth() + service_role` boundary.
- Rejected alternatives:
  - keep `src/lib/supabaseSeasons.ts` partially direct-Supabase until the end of the hardening project
  - accept client-provided identity hints again when linking the creator/player relationship during season creation
  - create one generic admin mutation route that accepts arbitrary season field updates
- Consequences:
  - `src/lib/supabaseSeasons.ts` is now fetch-based for all Supabase-backed season/admin flows
  - season creation now resolves the authenticated app user and membership on the server, validates supplied player IDs against the league, and refuses self-player reassignment across memberships
  - H07 can now add the local `matches` lock-down migration without breaking season-admin flows, while H08 inherits the broader follow-up audit for season/player table migration boundaries
- Affected files:
  - `src/lib/supabaseSeasons.ts`
  - `src/lib/serverSeasonAccess.ts`
  - `src/lib/serverSeasonMutations.ts`
  - `src/app/api/leagues/[id]/seasons/route.ts`
  - `src/app/api/leagues/[id]/seasons/[seasonId]/route.ts`
  - `src/app/api/leagues/[id]/seasons/[seasonId]/finish/route.ts`
  - `src/app/api/leagues/[id]/seasons/[seasonId]/start/route.ts`
  - `src/app/api/leagues/[id]/seasons/[seasonId]/settings/route.ts`
  - `src/app/api/leagues/[id]/seasons/[seasonId]/repair-calendar/route.ts`
  - `src/app/api/leagues/[id]/seasons/[seasonId]/round-order/route.ts`
  - `src/app/api/leagues/[id]/seasons/[seasonId]/rounds/[round]/matches/route.ts`
  - `src/app/admin/season/page.tsx`
  - `src/app/page.tsx`
  - `src/context/MatchDataProvider.tsx`
  - `supabase/migrations/20260715002000_lock_down_matches.sql`

## 2026-07-15 - Fix the local invite-regeneration SQL helper with a forward migration
- Decision: Add `20260715003000_fix_server_regenerate_league_invite.sql` instead of editing `20260714231500_add_server_league_mutation_functions.sql`.
- Why: `npx supabase db lint --local --schema public --level warning --fail-on none` found an ambiguous `invite_code` reference inside `public.server_regenerate_league_invite()` after the full local reset. The earlier migration had already been applied locally during validation, so the safe fix is forward-only.
- Rejected alternatives:
  - edit the already applied local migration in place
  - ignore the lint finding because the route currently catches generic SQL failures
- Consequences:
  - local `db reset` + `db lint` now validate the full migration chain cleanly
  - the server invite-regeneration RPC keeps the same external contract while removing a latent runtime/lint failure
- Affected files:
  - `supabase/migrations/20260715003000_fix_server_regenerate_league_invite.sql`
  - `docs/production-hardening/STATUS.md`
  - `docs/production-hardening/VALIDATION.md`

## 2026-07-15 - Close H08 by treating the remaining `players` browser lookup as activity work, not season-admin work
- Decision: Mark H08 complete after confirming that the remaining `seasons`, `season_settings`, and `season_players` access in `src` is now server-side, and that the only leftover browser `players` table lookup sits in `src/lib/activity.ts`.
- Why: The unresolved client read no longer belongs to season or calendar administration. Keeping H08 open would blur milestone ownership and make the migration boundary harder to reason about.
- Rejected alternatives:
  - keep H08 open until every `players` read anywhere in the app is server-side
  - move straight to RLS/grant lock-down for `players` before the activity feed is migrated
- Consequences:
  - H08 can close as an admin-surface hardening milestone
  - the `players` read boundary now becomes an explicit H10 input together with `activity_events`, `app_users`, and `league_memberships`
- Affected files:
  - `docs/production-hardening/PLAN.md`
  - `docs/production-hardening/STATUS.md`
  - `docs/production-hardening/TIMELOG.md`

## 2026-07-15 - Move MVP reads and votes behind server routes and derive the voter from the real match actor
- Decision: Replace direct browser access to `mvp_votes`, `mvp_manual_selections`, and related duplicate-award checks with server routes backed by `getServerMatchActor()` / `getServerSeasonAdmin()`.
- Why: The old browser flow trusted `voterPlayerId`, wrote MVP rows directly with the anon client, and read `activity_events` directly to decide whether award notifications already existed.
- Rejected alternatives:
  - keep the browser-side MVP writes and rely on UI guards against self-vote or spoofing
  - add only a write route but keep direct browser reads of MVP and award-event tables
  - defer the MVP migration until activity hardening even though the vote spoof surface is narrower and ready now
- Consequences:
  - match MVP votes now derive the acting player from the authenticated membership tied to the real match row
  - manual selection remains season-admin-only
  - the local migration boundary is now ready to revoke direct anon/authenticated access to `mvp_votes` and `mvp_manual_selections`
- Affected files:
  - `src/lib/serverMatchAccess.ts`
  - `src/lib/serverMvp.ts`
  - `src/app/api/mvp/route.ts`
  - `src/app/api/matches/[matchId]/mvp-vote/route.ts`
  - `src/app/api/matches/[matchId]/mvp-votes/route.ts`
  - `src/app/api/leagues/[id]/seasons/[seasonId]/mvp-selection/route.ts`
  - `src/lib/supabaseMvp.ts`
  - `src/context/MvpProvider.tsx`
  - `supabase/migrations/20260715004000_lock_down_mvp_tables.sql`

## 2026-07-15 - Split H10 so feed/settings move first and event generation follows route-by-route
- Decision: Start H10 by moving activity feed reads and `leagues.activity_settings` reads/writes behind server routes, while leaving `recordActivityEvent()` migration as the second half of the milestone.
- Why: Feed/settings had a contained browser-read surface with a clean authorization story, while generic event insertion cannot safely move behind one permissive endpoint without recreating the forgery problem H10 is meant to remove.
- Rejected alternatives:
  - create one generic `/api/activity` insert endpoint that trusts client-supplied event `type`, `title`, `description`, and actor hints
  - keep `activitySettings.ts` on the browser client until the entire event-generation migration is finished
  - postpone all H10 work until every event-producing route can be refactored in one pass
- Consequences:
  - `/activity`, `/notifications`, and `/payments` now read activity through a league-scoped server route
  - activity notification settings now read/write through an admin-scoped server route
  - the remaining browser `activity_events` access is isolated to `recordActivityEvent()` and becomes the explicit next H10 step
- Affected files:
  - `src/lib/serverLeagueAccess.ts`
  - `src/lib/serverActivity.ts`
  - `src/app/api/leagues/[id]/activity/route.ts`
  - `src/app/api/leagues/[id]/activity-settings/route.ts`
  - `src/lib/activity.ts`
  - `src/lib/activitySettings.ts`
  - `src/app/activity/page.tsx`
  - `docs/production-hardening/PLAN.md`
  - `docs/production-hardening/STATUS.md`

## 2026-07-16 - Finish H10 by making activity emission route-owned and server-derived
- Decision: Replace the generic browser-side `recordActivityEvent()` write path with route-owned server activity helpers, plus dedicated reminder endpoints for the remaining UI-triggered activity cases.
- Why: The old client path still looked up `app_users` / `league_memberships` / `players`, inserted `activity_events`, and tried to infer derived dispute and award events in the browser. That kept the main activity forgery surface alive even after feed/settings moved server-side.
- Rejected alternatives:
  - add one generic `/api/activity` insert endpoint that trusts client-supplied event `type`, `title`, and metadata
  - keep derived dispute/MVP award event creation in `MvpProvider` and `MatchDataProvider`
  - postpone reminder-triggered activity until the notification milestone
- Consequences:
  - new server-only helpers now own actor resolution, activity inserts, push-dispatch handoff, and automatic round-MVP/result-dispute derivation
  - invite regeneration, league/player/member admin actions, season mutations, match scheduling/result/booking flows, and MVP award logic now emit activity inside their server mutation boundaries
  - `src/lib/activity.ts` becomes a thin client shim, while the final RLS/grant closure for `activity_events` remains part of H13
- Affected files:
  - `src/lib/serverActivityWrite.ts`
  - `src/lib/serverActivityDerivations.ts`
  - `src/lib/activity.ts`
  - `src/lib/serverMvp.ts`
  - `src/app/api/result-confirmations/[matchId]/route.ts`
  - `src/app/api/matches/[matchId]/result/route.ts`
  - `src/app/api/matches/[matchId]/court-booking/payment-reminder/route.ts`
  - `src/app/api/leagues/[id]/seasons/[seasonId]/registration-reminder/route.ts`
  - `src/context/MatchDataProvider.tsx`
  - `src/context/MvpProvider.tsx`

## 2026-07-16 - Keep notification settings and device subscriptions league-scoped on the server
- Decision: Make `/api/notifications/preferences`, `/api/notifications/subscribe`, and `/api/notifications/unsubscribe` derive authorization from the real session plus league access, while changing `push_subscriptions` uniqueness from global `endpoint` to per-league `league_id + endpoint`.
- Why: The earlier routes only trusted session email and a client-supplied `leagueId`, which allowed arbitrary preference/subscription rows for guessed leagues. The global endpoint uniqueness also meant enabling the same browser device in one league could silently displace another league's subscription row.
- Rejected alternatives:
  - keep email-only notification routes and rely on RLS/grants later
  - keep the global `push_subscriptions.endpoint` uniqueness and accept cross-league overwrites
  - leave `/api/notifications/dispatch` callable by any authenticated session
- Consequences:
  - notification settings and device registration now require real league membership context on the server
  - manual push dispatch is now admin-scoped to the event's league
  - the local notification migration now revokes anon/authenticated table grants and allows one device endpoint per league instead of one row globally
- Affected files:
  - `src/app/api/notifications/preferences/route.ts`
  - `src/app/api/notifications/subscribe/route.ts`
  - `src/app/api/notifications/unsubscribe/route.ts`
  - `src/app/api/notifications/dispatch/route.ts`
  - `src/app/api/notifications/scheduled-check/route.ts`
  - `src/app/settings/notifications/page.tsx`
  - `supabase/migrations/20260716004500_lock_down_notification_tables.sql`

## 2026-07-16 - Treat avatar/logo values as validated image inputs and preserve custom account avatars
- Decision: Keep avatar/logo writes on the existing server routes, but validate them as safe image sources (`https` or bounded `data:image/*` payloads) and stop `requireAuthenticatedAppUser()` from overwriting an existing custom account avatar with the OAuth provider image on every request.
- Why: The app does not currently write to Supabase storage buckets; it stores avatar/logo values as strings. Before H12, the server accepted arbitrary strings for those fields, and the auth bootstrap could silently replace a custom uploaded avatar with `session.user.image`.
- Rejected alternatives:
  - keep accepting any string and defer all file validation until a future storage migration
  - keep preferring the OAuth session image in `app_users.avatar_url` even after a user uploads a custom avatar
  - rely only on client-side resize/`accept="image/*"` constraints
- Consequences:
  - avatar/logo writes now fail closed on unsafe or oversized image values
  - existing unsafe avatar/logo strings are ignored at render time by the shared image helpers instead of being passed straight to `<img>`
  - current QA/admin/player flows keep their UI contract, but the server owns the final file/value boundary
- Affected files:
  - `src/lib/imageUrl.ts`
  - `src/lib/serverImageValidation.ts`
  - `src/lib/serverAuth.ts`
  - `src/app/api/leagues/[id]/route.ts`
  - `src/app/api/leagues/[id]/players/[playerId]/route.ts`
  - `src/lib/avatarResolution.ts`
  - `src/components/player/PlayerAvatar.tsx`
  - `src/components/league/LeagueLogo.tsx`
  - `src/components/activity/ActivityAvatar.tsx`
  - `src/app/settings/page.tsx`

## 2026-07-16 - Keep QA mode admin-only and return only known QA error codes
- Decision: Leave QA enabled only when `QA_MODE=true`, but make `/api/qa` validate UUID inputs and collapse unknown failures to generic QA error codes instead of returning raw internal exception messages.
- Why: QA is intentionally a privileged surface, but production hardening still should not leak database or runtime error text through an admin-only tool.
- Rejected alternatives:
  - expose raw thrown errors from `fetchQaSnapshot()` and `runQaAction()`
  - trust arbitrary `leagueId` / `matchId` / `playerId` strings from the browser because the route is already admin-only
- Consequences:
  - QA remains useful for expected scenario errors such as `result_not_recorded`, while unknown/internal failures now stay generic
  - the production-disabled behavior continues to fail closed with a `404`
- Affected files:
  - `src/app/api/qa/route.ts`

## 2026-07-16 - Close public-table grants and permissive policies now, but treat `supabase_admin` default privileges as an environment-level follow-up
- Decision: Add `20260716013000_finalize_public_rls_and_grants.sql` to revoke direct `PUBLIC` / `anon` / `authenticated` access and drop permissive policies across the current public business tables, while making the `supabase_admin` default-privilege cleanup best-effort instead of hard-failing the migration.
- Why: The current runtime tables and functions can be fully closed by a normal migration, but the inherited `pg_default_acl` rows belong to `supabase_admin` and the local migration runner (`postgres`) is neither superuser nor a member of that role, so a strict `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin ...` aborts `db reset`.
- Rejected alternatives:
  - leave the current business tables and public-schema functions open until the remote phase
  - keep the migration hard-failing on `supabase_admin` default privileges and lose from-scratch local validation
  - grant `supabase_admin` membership to `postgres` inside the migration
- Consequences:
  - current public tables/functions are now closed and locally auditable from scratch
  - the remaining `supabase_admin` default privileges stay explicitly documented as an H13/H19 follow-up that needs an environment-compatible superuser path
  - local `db reset` now emits a notice rather than failing when that role-specific cleanup cannot be applied by the migration runner
- Affected files:
  - `supabase/migrations/20260716013000_finalize_public_rls_and_grants.sql`
  - `docs/production-hardening/PLAN.md`
  - `docs/production-hardening/STATUS.md`
  - `docs/production-hardening/VALIDATION.md`
  - `docs/production-hardening/ROLLBACK.md`

## 2026-07-16 - Fix future function exposure with a forward migration and close H13 for app-owned objects
- Decision: Add `20260716014000_fix_function_default_execute_privileges.sql` to revoke the global `PUBLIC` default `EXECUTE` grant for future `postgres`-owned functions, then treat H13 as locally complete because the remaining open defaults belong only to `supabase_admin` while all current business tables and migration-created app objects remain owned by `postgres`.
- Why: Fresh probes after the first H13 migration showed that new `postgres`-owned tables and sequences were clean, but new functions still inherited `EXECUTE` for `anon` / `authenticated` through the global `PUBLIC` function default. A small forward migration fixes the real gap. After that fix, current-object audits are clean, fresh `postgres`-owned probe objects inherit no anon/authenticated access, and the only leftover default ACL exposure is a platform-owned role that the local migration runner cannot alter.
- Rejected alternatives:
  - edit `20260716013000_finalize_public_rls_and_grants.sql` after it had already been applied locally during validation
  - keep H13 open indefinitely waiting for a local way to alter `supabase_admin`
  - ignore the future-function default `EXECUTE` issue because current-object audits were already passing
- Consequences:
  - future app-owned functions created by the migration runner no longer inherit `PUBLIC` execute
  - H13 can close locally with strong evidence instead of a known latent default-privilege gap on `postgres`
  - H19 still needs to re-audit the platform-owned `supabase_admin` defaults in the linked remote environment
- Affected files:
  - `supabase/migrations/20260716014000_fix_function_default_execute_privileges.sql`
  - `docs/production-hardening/PLAN.md`
  - `docs/production-hardening/STATUS.md`
  - `docs/production-hardening/DECISIONS.md`
  - `docs/production-hardening/VALIDATION.md`
  - `docs/production-hardening/ROLLBACK.md`
  - `docs/production-hardening/TIMELOG.md`

## 2026-07-16 - Make QA/push helpers explicitly server-only and remove the dead public superuser helper
- Decision: Mark `src/lib/serverPushDispatch.ts` and `src/lib/serverQa.ts` with `import "server-only"`, move shared QA action types into `src/lib/qaTypes.ts`, and delete the unused `src/lib/permissions.ts` / `src/lib/superuser.ts` pair.
- Why: The H14 static audit found one client page still importing a type from `serverQa.ts`, plus two server-oriented helper modules that were missing the explicit `server-only` marker. It also confirmed that the last runtime use of `NEXT_PUBLIC_SUPERUSER_PLAYER_IDS` lived only in dead legacy helpers that were no longer imported anywhere in the repo.
- Rejected alternatives:
  - keep the type-only client import from `serverQa.ts` and rely on TypeScript erasure alone

## 2026-07-16 - Split H17 into small release commits by hardening domain
- Decision: Group the validated production-hardening diff into separate release commits for league/invite access, match/season operations, activity/notifications, MVP/QA/media, and final database RLS/grants before any remote push.
- Why: The repo had already passed the local H15/H16 validation gates, but the uncommitted diff still spanned many risk domains. Splitting the history keeps rollback/follow-up fixes targeted and makes the remote preview/migration phases easier to audit.
- Rejected alternatives:
  - ship one large hardening commit covering every local change
  - delay commit grouping until after the remote preview phase
  - leave `serverPushDispatch.ts` and `serverQa.ts` unmarked because current imports happened to be server-side already
  - keep the dead `superuser` helper around as harmless legacy code
- Consequences:
  - the QA page now depends only on a shared type module rather than a server helper
  - the server-only boundary is explicit for the push-dispatch and QA helper modules
  - `NEXT_PUBLIC_SUPERUSER_PLAYER_IDS` is no longer referenced anywhere in runtime code
- Affected files:
  - `src/lib/serverPushDispatch.ts`
  - `src/lib/serverQa.ts`
  - `src/lib/qaTypes.ts`
  - `src/app/admin/qa/page.tsx`
  - `src/app/api/qa/route.ts`
  - `src/lib/permissions.ts`
  - `src/lib/superuser.ts`
  - `docs/production-hardening/PLAN.md`
  - `docs/production-hardening/STATUS.md`
  - `docs/production-hardening/VALIDATION.md`

## 2026-07-16 - Use authenticated `vercel curl` instead of browser-only Preview access for H18 smoke checks
- Decision: Close H18 with authenticated `npx vercel curl` probes against the exact Preview deployment URL and the stable alias instead of relying on unauthenticated browser access through Vercel Preview protection.
- Why: The Preview deployment itself was healthy, but unauthenticated browser/HTTP probes were intercepted by `Login – Vercel`. The Vercel CLI already had authenticated access, and `vercel curl` returned the live app/API responses we needed to validate routing, auth failures, manifest/assets, invite routes, and the host-specific OAuth provider metadata without weakening Preview protection.
- Rejected alternatives:
  - treat Preview protection as an H18 blocker and stop before any smoke validation
  - disable or bypass Preview protection just to run automated checks
  - claim OAuth callback readiness without verifying that the stable alias host appears in the provider metadata
- Consequences:
  - H18 can close with real evidence on the pushed release SHA while keeping Preview protection intact
  - the stable alias host is now explicitly verified in the Google provider metadata
  - only the fully interactive Google OAuth round-trip remains a later manual verification item if no safe authenticated browser session is available
- Affected files:
  - `docs/production-hardening/PLAN.md`
  - `docs/production-hardening/STATUS.md`
  - `docs/production-hardening/DECISIONS.md`
  - `docs/production-hardening/VALIDATION.md`
  - `docs/production-hardening/ROLLBACK.md`
  - `docs/production-hardening/TIMELOG.md`

## 2026-07-16 - Accept the remote `supabase_admin` default ACL rows as a documented residual, not an H19 blocker
- Decision: Treat the linked remote `supabase_admin` default ACL rows as the same environment-level residual already identified locally, and allow H19 to close because the post-push SQL audits show zero current-object RLS/grant/function regressions while all current public tables remain owned by `postgres`.
- Why: After the remote push, `migration list --linked`, `db lint --linked`, direct SQL summary checks, default-ACL detail, and public-table ownership audits all aligned with the validated local picture. The only remaining open surface is the platform-owned default ACL set for future `supabase_admin`-owned objects, and it is not currently affecting any public business table in this project.
- Rejected alternatives:
  - block H19 until the platform-owned `supabase_admin` defaults can be altered directly from the migration runner
  - treat advisor `RLS Enabled No Policy` infos as hard failures even though direct grants are already zero and access is intentionally server-only
  - ignore the remote ownership audit and assume the residual is harmless without evidence
- Consequences:
  - H19 can close with explicit remote evidence instead of staying open on a non-regressing platform default
  - the residual remains documented for future audits, especially if any remote/public object later appears with owner `supabase_admin`
  - downstream milestones can proceed, but the final report must still call out this environment-level residual honestly
- Affected files:
  - `docs/production-hardening/PLAN.md`
  - `docs/production-hardening/STATUS.md`
  - `docs/production-hardening/DECISIONS.md`
  - `docs/production-hardening/VALIDATION.md`
  - `docs/production-hardening/ROLLBACK.md`
  - `docs/production-hardening/TIMELOG.md`
