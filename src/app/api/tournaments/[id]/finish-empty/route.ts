import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_finish_empty", limit: 10, windowMs: 60_000 })
  if (limited) return limited
  const { id } = await params
  const access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const { data, error } = await access.actor.supabase.rpc("finish_empty_rapid_tournament", {
    p_tournament_id: access.tournamentId,
    p_creator_user_id: access.actor.user.id,
  })
  if (error) return NextResponse.json({ error: "tournament_finish_empty_failed" }, { status: 500 })
  if (data !== true) return NextResponse.json({ error: "tournament_has_results_or_closed" }, { status: 409 })
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
