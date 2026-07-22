import { NextResponse } from "next/server"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import {
  isSeasonMutationError,
  startServerExistingSeason,
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
    const result = await startServerExistingSeason({
      supabase: access.actor.supabase,
      leagueId,
      seasonId,
      actorUserId: access.actor.user.id,
      actorIsSuperuser: access.actor.user.isSuperuser,
    })

    await recordServerActorActivity({
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: access.actor.membership,
      leagueId,
      seasonId,
      type: "season_started",
      title:
        access.season.status === "finished"
          ? "Temporada reabierta"
          : "Temporada comenzada",
      description:
        access.season.status === "finished"
          ? "La temporada se ha reabierto manualmente para corregir partidos o resultados."
          : "La temporada ha pasado de proximamente a activa.",
    }).catch(() => null)

    return NextResponse.json(result)
  } catch (error) {
    if (isSeasonMutationError(error)) {
      return NextResponse.json({ error: error.code }, { status: error.status })
    }

    return NextResponse.json({ error: "season_start_failed" }, { status: 500 })
  }
}
