import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody } from "@/lib/serverRequest"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"
import { executeTraditionalTournamentCommand, type TraditionalCommand } from "@/lib/serverTraditionalTournaments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "traditional_tournament_manage", limit: 120, windowMs: 60_000 })
  if (limited) return limited
  const access = await requireRapidTournamentCreator((await params).id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const body = await parseJsonBody<TraditionalCommand>(request)
  if (!body) return NextResponse.json({ error: "invalid_traditional_action" }, { status: 400 })
  const result = await executeTraditionalTournamentCommand(access.actor, access.tournamentId, body)
  return result.ok ? NextResponse.json({ ok: true, revision: result.revision }, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } })
}
