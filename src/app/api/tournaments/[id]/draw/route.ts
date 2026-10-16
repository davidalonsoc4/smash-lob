import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { shuffleTournamentNames, validateTournamentParticipants } from "@/lib/rapidTournament"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_draw", limit: 30, windowMs: 60_000 })
  if (limited) return limited
  const { id } = await params
  const access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const { data: players, error: playersError } = await access.actor.supabase.from("rapid_tournament_players").select("full_name").eq("tournament_id", access.tournamentId).order("slot")
  const validated = validateTournamentParticipants(players?.map((player) => player.full_name))
  if (playersError || !validated.ok) return NextResponse.json({ error: "tournament_players_read_failed" }, { status: 500 })
  const { data, error } = await access.actor.supabase.rpc("reroll_rapid_tournament", {
    p_tournament_id: access.tournamentId,
    p_creator_user_id: access.actor.user.id,
    p_shuffled_names: shuffleTournamentNames(validated.names),
  })
  if (error) return NextResponse.json({ error: "tournament_draw_failed" }, { status: 500 })
  if (data !== true) return NextResponse.json({ error: "tournament_draw_locked" }, { status: 409 })
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
