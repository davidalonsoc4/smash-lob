import { NextResponse } from "next/server"
import { generateAndPersistMexicanoRound } from "@/lib/serverDynamicMexicano"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_next_round", limit: 20, windowMs: 60_000 })
  if (limited) return limited
  const { id } = await params, access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const generated = await generateAndPersistMexicanoRound(access.actor, access.tournamentId, access.actor.user.id)
  return generated.ok ? NextResponse.json({ ok: true, round: generated.round }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: generated.error }, { status: generated.status })
}
