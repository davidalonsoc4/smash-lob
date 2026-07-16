import { NextResponse } from "next/server"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import {
  deleteServerRoundMatches,
  isSeasonMutationError,
} from "@/lib/serverSeasonMutations"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseRound(value: string) {
  const round = Number(value)

  return Number.isInteger(round) && round > 0 ? round : null
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; seasonId: string; round: string }> }
) {
  const { id: leagueId, seasonId, round: roundParam } = await params
  const round = parseRound(roundParam)

  if (!validateUuid(leagueId) || !validateUuid(seasonId) || round === null) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerSeasonAdmin(leagueId, seasonId)

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    await deleteServerRoundMatches({
      supabase: access.actor.supabase,
      seasonId,
      round,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (isSeasonMutationError(error)) {
      return NextResponse.json({ error: error.code }, { status: error.status })
    }

    return NextResponse.json(
      { error: "season_round_delete_failed" },
      { status: 500 }
    )
  }
}
