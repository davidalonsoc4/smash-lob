import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { getPublicAppBaseUrl } from "@/lib/appUrl"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { validateUuid } from "@/lib/serverRequest"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ id: string; playerId: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_invite_create", limit: 20, windowMs: 60_000 })
  if (limited) return limited
  const { id, playerId: rawPlayerId } = await params
  const access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const playerId = validateUuid(rawPlayerId)
  if (!playerId) return NextResponse.json({ error: "invalid_tournament_player" }, { status: 400 })
  const token = randomBytes(32).toString("base64url")
  const codeHash = createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString()
  const { data, error } = await access.actor.supabase.rpc("create_rapid_tournament_invite", {
    p_tournament_id: access.tournamentId,
    p_player_id: playerId,
    p_creator_user_id: access.actor.user.id,
    p_code_hash: codeHash,
    p_expires_at: expiresAt,
  })
  if (error) return NextResponse.json({ error: "tournament_invite_create_failed" }, { status: 500 })
  if (data !== true) return NextResponse.json({ error: "tournament_invite_not_available" }, { status: 409 })
  const url = new URL(`/tournament-invite/${encodeURIComponent(token)}`, getPublicAppBaseUrl(request)).toString()
  return NextResponse.json({ url, expiresAt }, { headers: { "Cache-Control": "no-store" } })
}
