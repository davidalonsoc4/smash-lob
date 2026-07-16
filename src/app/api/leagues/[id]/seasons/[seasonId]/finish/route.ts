import { NextResponse } from "next/server"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import {
  finishServerActiveSeason,
  isSeasonMutationError,
} from "@/lib/serverSeasonMutations"
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

  try {
    const snapshot = await finishServerActiveSeason({
      supabase: access.actor.supabase,
      leagueId,
      season: access.season,
    })

    await recordServerActorActivity({
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: access.actor.membership,
      leagueId,
      seasonId,
      type: "season_finished",
      title: "Temporada finalizada",
      description: "La temporada ha finalizado.",
      metadata: {
        automatic: false,
        totalRounds: access.season.totalRounds,
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
