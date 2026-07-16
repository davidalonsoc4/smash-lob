import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import type { MatchResultConfirmation } from "@/lib/supabaseMatchConfirmations"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type QueryBody = {
  matchIds?: unknown
}

type ConfirmationRow = {
  match_id: string
  player_id: string
  status: "confirmed" | "disputed"
  updated_at: string
}

function toConfirmation(row: ConfirmationRow): MatchResultConfirmation {
  return {
    matchId: row.match_id,
    playerId: row.player_id,
    status: row.status,
    updatedAt: row.updated_at,
  }
}

function parseMatchIds(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  const matchIds = value
    .map((matchId) => validateUuid(matchId))
    .filter((matchId): matchId is string => Boolean(matchId))

  if (matchIds.length !== value.length || matchIds.length > 200) {
    return null
  }

  return Array.from(new Set(matchIds))
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  const matchIds = parseMatchIds(
    (await parseJsonBody<QueryBody>(request))?.matchIds
  )

  if (!matchIds) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (matchIds.length === 0) {
    return NextResponse.json({ items: [] })
  }

  const {
    supabase,
    user: { id: userId, isSuperuser },
  } = authResult.actor

  let accessibleMatchIds = matchIds

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
        { error: "result_confirmation_access_lookup_failed" },
        { status: 500 }
      )
    }

    const accessibleLeagueIds = Array.from(
      new Set([
        ...(membershipResult.data ?? [])
          .map((row) => row.league_id)
          .filter((leagueId): leagueId is string => typeof leagueId === "string"),
        ...(spectatorResult.data ?? [])
          .map((row) => row.league_id)
          .filter((leagueId): leagueId is string => typeof leagueId === "string"),
      ])
    )

    if (accessibleLeagueIds.length === 0) {
      return NextResponse.json({ items: [] })
    }

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id")
      .in("id", matchIds)
      .in("league_id", accessibleLeagueIds)

    if (matchesError) {
      return NextResponse.json(
        { error: "result_confirmation_access_lookup_failed" },
        { status: 500 }
      )
    }

    accessibleMatchIds = (matches ?? [])
      .map((match) => match.id)
      .filter((matchId): matchId is string => typeof matchId === "string")
  }

  if (accessibleMatchIds.length === 0) {
    return NextResponse.json({ items: [] })
  }

  const { data, error } = await supabase
    .from("match_result_confirmations")
    .select("match_id,player_id,status,updated_at")
    .in("match_id", accessibleMatchIds)

  if (error) {
    return NextResponse.json(
      { error: "result_confirmation_lookup_failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    items: (data ?? []).map((row) => toConfirmation(row as ConfirmationRow)),
  })
}
