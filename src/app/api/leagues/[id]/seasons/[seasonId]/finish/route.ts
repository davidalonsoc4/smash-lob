import { NextResponse } from "next/server"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import {
  finishServerActiveSeason,
  isSeasonMutationError,
} from "@/lib/serverSeasonMutations"
import { validateUuid } from "@/lib/serverRequest"
import { getServerSeasonAwards } from "@/lib/serverSeasonAwards"

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

  try {
    const awards = await getServerSeasonAwards({
      supabase: access.actor.supabase,
      leagueId,
      seasonId,
    }).catch(() => ({
      winnerPlayerIds: [],
      winnerNames: [],
      mvpPlayerIds: [],
      mvpNames: [],
    }))
    const snapshot = await finishServerActiveSeason({
      supabase: access.actor.supabase,
      leagueId,
      season: access.season,
    })
    const winnerText = awards.winnerNames.join(" / ")
    const mvpText = awards.mvpNames.join(" / ")

    await recordServerActorActivity({
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: access.actor.membership,
      leagueId,
      seasonId,
      type: "season_finished",
      title: "Temporada finalizada",
      description: [
        winnerText ? `Ganador: ${winnerText}.` : null,
        mvpText ? `MVP: ${mvpText}.` : null,
      ]
        .filter((item): item is string => Boolean(item))
        .join(" ") || "La temporada ha finalizado.",
      metadata: {
        automatic: false,
        totalRounds: access.season.totalRounds,
        includeActor: true,
        winnerName: awards.winnerNames[0] ?? null,
        winnerPlayerIds: awards.winnerPlayerIds,
        winnerNames: awards.winnerNames,
        mvpName: awards.mvpNames[0] ?? null,
        mvpPlayerIds: awards.mvpPlayerIds,
        mvpNames: awards.mvpNames,
      },
    }).catch(() => null)

    return NextResponse.json({ snapshot })
  } catch (error) {
    if (isSeasonMutationError(error)) {
      return NextResponse.json({ error: error.code }, { status: error.status })
    }

    return NextResponse.json({ error: "season_finish_failed" }, { status: 500 })
  }
}
