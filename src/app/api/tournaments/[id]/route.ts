import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { mapTournamentData, requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_read", limit: 120, windowMs: 60_000 })
  if (limited) return limited
  const { id } = await params
  const access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status, headers: { "Cache-Control": "no-store" } })
  const result = await mapTournamentData(access.actor, access.tournamentId)
  if (result.error || !result.data) return NextResponse.json({ error: "tournament_read_failed" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  return NextResponse.json({ ...result.data, serverNow: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } })
}
