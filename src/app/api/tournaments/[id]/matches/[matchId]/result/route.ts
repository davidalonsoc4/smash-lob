import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"
import { parseTournamentPoints } from "@/lib/tournamentResult"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ResultBody = { scoreA?: unknown; scoreB?: unknown }

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_result", limit: 120, windowMs: 60_000 })
  if (limited) return limited
  const { id, matchId: rawMatchId } = await params
  const access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const matchId = validateUuid(rawMatchId)
  if (!matchId) return NextResponse.json({ error: "invalid_match_id" }, { status: 400 })
  const body = await parseJsonBody<ResultBody>(request)
  const { scoreA, scoreB } = body ?? {}
  const score = parseTournamentPoints(scoreA, scoreB)
  if (!score) {
    return NextResponse.json({ error: "invalid_score" }, { status: 400 })
  }
  const { data, error } = await access.actor.supabase.rpc("record_rapid_tournament_result", {
    p_tournament_id: access.tournamentId,
    p_match_id: matchId,
    p_creator_user_id: access.actor.user.id,
    p_score_a: score.a,
    p_score_b: score.b,
  })
  if (error) return NextResponse.json({ error: "tournament_result_save_failed" }, { status: 500 })
  if (data !== true) return NextResponse.json({ error: "tournament_result_locked_or_not_found" }, { status: 409 })
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
