import { NextResponse } from "next/server"
import type { SeasonScheduleMode } from "@/lib/calendar"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import {
  assertLeaguePlayerIds,
  isSeasonMutationError,
  replaceServerUpcomingSeasonBalancedCalendar,
} from "@/lib/serverSeasonMutations"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RepairCalendarBody = {
  playerIds?: unknown
  scheduleMode?: unknown
}

function parsePlayerIds(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  const playerIds = value
    .map((item) => validateUuid(item))
    .filter((item): item is string => Boolean(item))

  if (playerIds.length !== value.length || new Set(playerIds).size !== playerIds.length) {
    return null
  }

  return playerIds
}

function parseScheduleMode(value: unknown): SeasonScheduleMode | null {
  return value === "single" || value === "double" || value === "extended"
    ? value
    : null
}

export async function POST(
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

  const body = await parseJsonBody<RepairCalendarBody>(request)
  const playerIds = parsePlayerIds(body?.playerIds)
  const scheduleMode = parseScheduleMode(body?.scheduleMode)

  if (!playerIds || !scheduleMode) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  try {
    const validatedPlayerIds = await assertLeaguePlayerIds({
      supabase: access.actor.supabase,
      leagueId,
      playerIds,
    })
    const matches = await replaceServerUpcomingSeasonBalancedCalendar({
      supabase: access.actor.supabase,
      season: access.season,
      playerIds: validatedPlayerIds,
      scheduleMode,
    })

    return NextResponse.json({ matches })
  } catch (error) {
    if (isSeasonMutationError(error)) {
      const body: { error: string; message?: string } = {
        error: error.code,
      }

      if (error.message && error.message !== error.code) {
        body.message = error.message
      }

      return NextResponse.json(body, { status: error.status })
    }

    return NextResponse.json(
      { error: "season_calendar_repair_failed" },
      { status: 500 }
    )
  }
}
