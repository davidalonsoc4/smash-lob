import { NextResponse } from "next/server"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import {
  getServerSeasonPlayerIds,
  saveServerMvpManualSelection,
} from "@/lib/serverMvp"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ManualSelectionBody = {
  scope?: unknown
  round?: unknown
  selectedPlayerId?: unknown
}

function parseScope(value: unknown) {
  return value === "round" || value === "season" ? value : null
}

function parseOptionalRound(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const round = Number(value)

  if (!Number.isInteger(round) || round <= 0) {
    return null
  }

  return round
}

function parseOptionalPlayerId(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  return validateUuid(value)
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

  const body = await parseJsonBody<ManualSelectionBody>(request)
  const scope = parseScope(body?.scope)
  const round = parseOptionalRound(body?.round)
  const selectedPlayerId = parseOptionalPlayerId(body?.selectedPlayerId)

  if (
    !scope ||
    (scope === "round" && (round === null || round > access.season.totalRounds)) ||
    (scope === "season" && round !== null) ||
    (body?.selectedPlayerId && !selectedPlayerId)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (selectedPlayerId) {
    try {
      const seasonPlayerIds = await getServerSeasonPlayerIds({
        supabase: access.actor.supabase,
        seasonId,
      })

      if (!seasonPlayerIds.includes(selectedPlayerId)) {
        return NextResponse.json({ error: "invalid_request" }, { status: 400 })
      }
    } catch {
      return NextResponse.json(
        { error: "mvp_manual_selection_lookup_failed" },
        { status: 500 }
      )
    }
  }

  try {
    await saveServerMvpManualSelection({
      supabase: access.actor.supabase,
      leagueId,
      seasonId,
      scope,
      round,
      selectedPlayerId,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "mvp_manual_selection_save_failed" },
      { status: 500 }
    )
  }
}
