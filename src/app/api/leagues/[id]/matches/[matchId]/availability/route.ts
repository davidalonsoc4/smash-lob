import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import {
  hasAvailabilityContent,
  mapProfileAvailability,
  type AvailabilitySource,
} from "@/lib/serverPlayerAvailability"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const lookupFailed = () =>
  NextResponse.json({ error: "player_availability_lookup_failed" }, { status: 500 })

/**
 * Availability belongs to the player (linked account, or the player profile when there is no account),
 * not to a league. The season setting only decides whether recommendations may use it, so nothing is
 * revealed to other players when the season does not use availability recommendations, nor to spectators.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id: leagueId, matchId } = await params

  if (!validateUuid(leagueId) || !validateUuid(matchId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerMatchActor(matchId, { requireLeagueAccess: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { match, supabase, isSpectator } = access.actor

  if (match.leagueId !== leagueId) {
    return NextResponse.json({ error: "match_not_found" }, { status: 404 })
  }

  const playerIds = match.participantIds

  if (playerIds.length === 0 || isSpectator) {
    return NextResponse.json({ items: [] })
  }

  const settings = await supabase
    .from("season_settings")
    .select("availability_recommendations_enabled")
    .eq("season_id", match.seasonId)
    .maybeSingle()

  if (settings.error) {
    return lookupFailed()
  }

  if (settings.data?.availability_recommendations_enabled !== true) {
    return NextResponse.json({ items: [] })
  }

  const [memberships, players] = await Promise.all([
    supabase
      .from("league_memberships")
      .select("player_id,user_id")
      .eq("league_id", leagueId)
      .in("player_id", playerIds),
    supabase
      .from("players")
      .select(
        "id,availability_timezone,availability_weekly_slots,availability_date_overrides,availability_updated_at"
      )
      .eq("league_id", leagueId)
      .in("id", playerIds),
  ])

  if (memberships.error || players.error) {
    return lookupFailed()
  }

  const userIdByPlayer = new Map<string, string>()

  for (const membership of memberships.data ?? []) {
    if (membership.player_id && membership.user_id) {
      userIdByPlayer.set(membership.player_id, membership.user_id)
    }
  }

  const userIds = [...new Set(userIdByPlayer.values())]
  const accounts = userIds.length
    ? await supabase
        .from("app_users")
        .select(
          "id,standard_availability_timezone,standard_availability_weekly_slots,standard_availability_date_overrides"
        )
        .in("id", userIds)
    : { data: [], error: null }

  if (accounts.error) {
    return lookupFailed()
  }

  const accountById = new Map((accounts.data ?? []).map((account) => [account.id, account]))
  const playerById = new Map((players.data ?? []).map((player) => [player.id, player]))
  const items = []

  for (const playerId of playerIds) {
    const userId = userIdByPlayer.get(playerId) ?? null
    const account = userId ? accountById.get(userId) : undefined
    const player = playerById.get(playerId)
    const source: AvailabilitySource | null = account
      ? {
          timezone: account.standard_availability_timezone,
          weeklySlots: account.standard_availability_weekly_slots,
          dateOverrides: account.standard_availability_date_overrides,
        }
      : player
        ? {
            timezone: player.availability_timezone,
            weeklySlots: player.availability_weekly_slots,
            dateOverrides: player.availability_date_overrides,
            updatedAt: player.availability_updated_at,
          }
        : null

    if (source && hasAvailabilityContent(source)) {
      items.push(
        mapProfileAvailability({ leagueId, seasonId: match.seasonId, playerId, userId, source })
      )
    }
  }

  return NextResponse.json({ items })
}
