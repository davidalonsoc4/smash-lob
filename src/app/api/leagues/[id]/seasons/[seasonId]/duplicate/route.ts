import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import {
  duplicateServerSeason,
  SeasonDuplicationError,
} from "@/lib/serverSeasonDuplication"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type DuplicateBody = { name?: unknown }

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonId: string }> },
) {
  const { id: leagueId, seasonId } = await params

  if (!validateUuid(leagueId) || !validateUuid(seasonId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<DuplicateBody>(request)
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : ""

  if (name.length < 2) {
    return NextResponse.json({ error: "invalid_season_name" }, { status: 400 })
  }

  try {
    const result = await duplicateServerSeason({
      actor: access.actor,
      leagueId,
      sourceSeasonId: seasonId,
      name,
    })

    await recordServerActorActivity({
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: access.actor.membership,
      leagueId,
      seasonId: result.duplicatedSeason.id,
      type: "season_duplicated",
      title: "Temporada duplicada",
      description: `${result.sourceSeason.name} → ${result.duplicatedSeason.name} · ${result.snapshot.seasonPlayers.length} jugadores · ${result.duplicatedSeason.totalRounds} jornadas`,
      metadata: {
        sourceSeasonId: result.sourceSeason.id,
        duplicatedSeasonId: result.duplicatedSeason.id,
        playerCount: result.snapshot.seasonPlayers.length,
        totalRounds: result.duplicatedSeason.totalRounds,
      },
    }).catch(() => null)

    return NextResponse.json({
      snapshot: result.snapshot,
      matches: result.matches,
    })
  } catch (error) {
    if (error instanceof SeasonDuplicationError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.status },
      )
    }

    return NextResponse.json(
      { error: "season_duplicate_failed" },
      { status: 500 },
    )
  }
}
