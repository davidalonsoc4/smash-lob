import "server-only"

import type { AuthenticatedAppUser } from "@/lib/serverAuth"
import {
  isSeasonMutationError,
  prepareServerSelfRegistrationSeasonCalendar,
  startServerExistingSeason,
} from "@/lib/serverSeasonMutations"

/**
 * Prepares calendars for scheduled self-registration seasons as soon as the roster is complete.
 * This never activates the season: players keep the pre-start lock until scheduled_start_at.
 * The operation is idempotent and is retried from /api/access so already-created seasons are covered too.
 */
export async function prepareScheduledSeasonCalendars({
  actor,
  leagueIds,
}: {
  actor: AuthenticatedAppUser
  leagueIds: string[]
}) {
  if (leagueIds.length === 0) return

  const { supabase } = actor
  const { data, error } = await supabase
    .from("season_settings")
    .select("league_id,season_id,scheduled_start_at,roster_mode,seasons!inner(status)")
    .in("league_id", leagueIds)
    .eq("roster_mode", "self_registration")
    .not("scheduled_start_at", "is", null)

  if (error) throw new Error("scheduled_season_prepare_lookup_failed")

  for (const row of data ?? []) {
    const joinedSeason = Array.isArray(row.seasons) ? row.seasons[0] : row.seasons
    if (!joinedSeason || joinedSeason.status !== "upcoming") continue

    try {
      await prepareServerSelfRegistrationSeasonCalendar({
        supabase,
        leagueId: String(row.league_id),
        seasonId: String(row.season_id),
        actorUserId: actor.user.id,
        actorIsSuperuser: true,
      })
    } catch (prepareError) {
      if (
        isSeasonMutationError(prepareError) &&
        ["roster_incomplete", "season_not_scheduled", "season_prepare_not_allowed"].includes(
          prepareError.code,
        )
      ) {
        continue
      }
      throw prepareError
    }
  }
}

/**
 * Activates due scheduled seasons from a server-side access snapshot.
 * The service-role client is the trust boundary; callers cannot promote themselves.
 * Self-registration still reuses the transactional start RPC, including roster/payment gates.
 */
export async function activateDueScheduledSeasons({
  actor,
  leagueIds,
}: {
  actor: AuthenticatedAppUser
  leagueIds: string[]
}) {
  if (leagueIds.length === 0) return

  const { supabase } = actor
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from("season_settings")
    .select("league_id,season_id,scheduled_start_at,seasons!inner(status)")
    .in("league_id", leagueIds)
    .not("scheduled_start_at", "is", null)
    .lte("scheduled_start_at", nowIso)

  if (error) throw new Error("scheduled_season_lookup_failed")

  for (const row of data ?? []) {
    const joinedSeason = Array.isArray(row.seasons) ? row.seasons[0] : row.seasons
    if (!joinedSeason || joinedSeason.status !== "upcoming") continue

    try {
      await startServerExistingSeason({
        supabase,
        leagueId: String(row.league_id),
        seasonId: String(row.season_id),
        actorUserId: actor.user.id,
        actorIsSuperuser: true,
      })
    } catch (startError) {
      if (
        isSeasonMutationError(startError) &&
        ["roster_incomplete", "registration_unsettled", "season_calendar_invalid"].includes(startError.code)
      ) {
        continue
      }
      throw startError
    }
  }
}
