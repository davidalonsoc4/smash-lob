import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"
import { generateAndPersistMexicanoRound } from "@/lib/serverDynamicMexicano"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_start", limit: 10, windowMs: 60_000 })
  if (limited) return limited
  const { id } = await params
  const access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const tournament = await access.actor.supabase.from("rapid_tournaments").select("format").eq("id", access.tournamentId).single()
  if (tournament.error) return NextResponse.json({ error: "tournament_read_failed" }, { status: 500 })
  if (tournament.data.format === "dynamic_mexicano") {
    const generated = await generateAndPersistMexicanoRound(access.actor, access.tournamentId, access.actor.user.id)
    return generated.ok ? NextResponse.json({ ok: true, round: generated.round }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: generated.error }, { status: generated.status })
  }
  const { data, error } = await access.actor.supabase.rpc("start_rapid_tournament", { p_tournament_id: access.tournamentId, p_creator_user_id: access.actor.user.id })
  if (error) return NextResponse.json({ error: "tournament_start_failed" }, { status: 500 })
  if (data !== true) return NextResponse.json({ error: "tournament_start_locked" }, { status: 409 })
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
