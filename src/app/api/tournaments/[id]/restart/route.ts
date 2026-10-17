import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"
import { canRestartRapidTournamentForTesting } from "@/lib/serverRapidTournamentTesting"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!canRestartRapidTournamentForTesting()) return NextResponse.json({ error: "testing_restart_unavailable" }, { status: 404 })
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_restart", limit: 10, windowMs: 60_000 })
  if (limited) return limited
  const { id } = await params
  const access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const { data, error } = await access.actor.supabase.rpc("restart_rapid_tournament_for_testing", { p_tournament_id: access.tournamentId, p_creator_user_id: access.actor.user.id })
  if (error) return NextResponse.json({ error: "tournament_restart_failed" }, { status: 500 })
  if (data !== true) return NextResponse.json({ error: "tournament_not_finished" }, { status: 409 })
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
