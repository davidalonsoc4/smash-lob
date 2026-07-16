import { NextResponse } from "next/server"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import { fetchLeaguePlayerNameMap, recordServerActorActivity } from "@/lib/serverActivityWrite"
import {
  getSeasonRegistrationPendingPayments,
  normalizeSeasonRegistrationFee,
} from "@/lib/seasonRegistration"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  const { id: leagueId, seasonId } = await params

  if (!validateUuid(leagueId) || !validateUuid(seasonId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerSeasonAdmin(leagueId, seasonId)

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (!access.actor.user.isSuperuser && access.actor.membership?.role !== "creator") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { supabase } = access.actor
  const [{ data: settingsRow, error: settingsError }, { data: seasonPlayers, error: seasonPlayersError }, { data: leagueRow, error: leagueError }] =
    await Promise.all([
      supabase
        .from("season_settings")
        .select("registration_fee")
        .eq("league_id", leagueId)
        .eq("season_id", seasonId)
        .maybeSingle(),
      supabase
        .from("season_players")
        .select("player_id")
        .eq("season_id", seasonId),
      supabase
        .from("leagues")
        .select("created_by_user_id")
        .eq("id", leagueId)
        .maybeSingle(),
    ])

  if (settingsError || seasonPlayersError || leagueError) {
    return NextResponse.json(
      { error: "season_registration_reminder_lookup_failed" },
      { status: 500 }
    )
  }

  const playerIds = (seasonPlayers ?? [])
    .map((row) => row.player_id)
    .filter((playerId): playerId is string => typeof playerId === "string")
  let settledPlayerIds: string[] = []

  if (leagueRow?.created_by_user_id) {
    const { data: creatorMembership } = await supabase
      .from("league_memberships")
      .select("player_id")
      .eq("league_id", leagueId)
      .eq("user_id", leagueRow.created_by_user_id)
      .maybeSingle()

    settledPlayerIds =
      typeof creatorMembership?.player_id === "string"
        ? [creatorMembership.player_id]
        : []
  }

  const registrationFee = normalizeSeasonRegistrationFee(
    settingsRow?.registration_fee
  )
  const pendingPlayerIds = getSeasonRegistrationPendingPayments({
    registrationFee,
    playerIds,
    settledPlayerIds,
  })

  if (pendingPlayerIds.length === 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const playerNameMap = await fetchLeaguePlayerNameMap({
    supabase,
    leagueId,
    playerIds: settledPlayerIds,
  }).catch(() => new Map<string, string>())
  const organizerName =
    settledPlayerIds.length > 0
      ? playerNameMap.get(settledPlayerIds[0]) ?? "organizador de la liga"
      : "organizador de la liga"

  await recordServerActorActivity({
    supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId,
    seasonId,
    type: "season_registration_payment_reminder",
    title: "Recordatorio de inscripcion",
    description: `Inscripcion pendiente · ${registrationFee.amount}`,
    metadata: {
      amount: registrationFee.amount,
      organizerName,
      pendingPlayerIds,
      pendingCount: pendingPlayerIds.length,
    },
  }).catch(() => null)

  return NextResponse.json({ ok: true })
}
