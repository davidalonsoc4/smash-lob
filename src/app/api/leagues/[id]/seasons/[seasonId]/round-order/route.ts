import { NextResponse } from "next/server"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import {
  isSeasonMutationError,
  updateServerSeasonRoundOrder,
} from "@/lib/serverSeasonMutations"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RoundOrderBody = {
  roundOrder?: unknown
}

function parseRoundOrder(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return null
  }

  const roundOrder = value
    .map((round) => Number(round))
    .filter((round) => Number.isInteger(round) && round > 0)

  if (
    roundOrder.length !== value.length ||
    new Set(roundOrder).size !== roundOrder.length
  ) {
    return null
  }

  return roundOrder
}

export async function PUT(
  request: Request,
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

  const roundOrder = parseRoundOrder(
    (await parseJsonBody<RoundOrderBody>(request))?.roundOrder
  )

  if (!roundOrder) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  try {
    await updateServerSeasonRoundOrder({
      supabase: access.actor.supabase,
      seasonId,
      roundOrder,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (isSeasonMutationError(error)) {
      return NextResponse.json({ error: error.code }, { status: error.status })
    }

    return NextResponse.json(
      { error: "season_round_order_update_failed" },
      { status: 500 }
    )
  }
}
