import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { fetchServerMvpData } from "@/lib/serverMvp"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type QueryBody = {
  leagueIds?: unknown
}

function parseLeagueIds(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  const leagueIds = value
    .map((leagueId) => validateUuid(leagueId))
    .filter((leagueId): leagueId is string => Boolean(leagueId))

  if (leagueIds.length !== value.length || leagueIds.length > 200) {
    return null
  }

  return Array.from(new Set(leagueIds))
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  const leagueIds = parseLeagueIds(
    (await parseJsonBody<QueryBody>(request))?.leagueIds
  )

  if (!leagueIds) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (leagueIds.length === 0) {
    return NextResponse.json({
      votes: [],
      manualSelections: [],
    })
  }

  const {
    supabase,
    user: { id: userId, isSuperuser },
  } = authResult.actor

  let accessibleLeagueIds = leagueIds

  if (!isSuperuser) {
    const [membershipResult, spectatorResult] = await Promise.all([
      supabase
        .from("league_memberships")
        .select("league_id")
        .eq("user_id", userId),
      supabase
        .from("league_spectators")
        .select("league_id")
        .eq("user_id", userId),
    ])

    if (membershipResult.error || spectatorResult.error) {
      return NextResponse.json(
        { error: "mvp_access_lookup_failed" },
        { status: 500 }
      )
    }

    const allowedLeagueIds = new Set<string>([
      ...(membershipResult.data ?? [])
        .map((row) => row.league_id)
        .filter((leagueId): leagueId is string => typeof leagueId === "string"),
      ...(spectatorResult.data ?? [])
        .map((row) => row.league_id)
        .filter((leagueId): leagueId is string => typeof leagueId === "string"),
    ])

    accessibleLeagueIds = leagueIds.filter((leagueId) =>
      allowedLeagueIds.has(leagueId)
    )
  }

  if (accessibleLeagueIds.length === 0) {
    return NextResponse.json({
      votes: [],
      manualSelections: [],
    })
  }

  try {
    return NextResponse.json(
      await fetchServerMvpData({
        supabase,
        leagueIds: accessibleLeagueIds,
      })
    )
  } catch {
    return NextResponse.json({ error: "mvp_lookup_failed" }, { status: 500 })
  }
}
