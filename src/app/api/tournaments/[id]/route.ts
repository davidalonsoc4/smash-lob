import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { mapTournamentData, requireRapidTournamentAccess, requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"
import { canRestartRapidTournamentForTesting } from "@/lib/serverRapidTournamentTesting"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_read", limit: 120, windowMs: 60_000 })
  if (limited) return limited
  const { id } = await params
  const access = await requireRapidTournamentAccess(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status, headers: { "Cache-Control": "no-store" } })
  const result = await mapTournamentData(access.actor, access.tournamentId, access.role === "creator")
  if (result.error || !result.data) return NextResponse.json({ error: "tournament_read_failed" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  return NextResponse.json({ ...result.data, access: { role: access.role }, canRestartForTesting: !result.data.traditional && access.role === "creator" && canRestartRapidTournamentForTesting(), serverNow: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_delete", limit: 10, windowMs: 60_000 })
  if (limited) return limited
  const { id } = await params
  const access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const { data, error } = await access.actor.supabase.rpc("delete_finished_rapid_tournament", { p_tournament_id: access.tournamentId, p_creator_user_id: access.actor.user.id })
  if (error) return NextResponse.json({ error: "tournament_delete_failed" }, { status: 500 })
  if (data !== true) return NextResponse.json({ error: "tournament_not_finished" }, { status: 409 })
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
