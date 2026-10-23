import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { getPublicAppBaseUrl } from "@/lib/appUrl"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_join_invite_create", limit: 10, windowMs: 60_000 })
  if (limited) return limited
  const { id } = await params
  const access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const token = randomBytes(32).toString("base64url"), codeHash = createHash("sha256").update(token).digest("hex"), expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString()
  const { data, error } = await access.actor.supabase.rpc("create_rapid_tournament_join_invite", { p_tournament_id: access.tournamentId, p_creator_user_id: access.actor.user.id, p_code_hash: codeHash, p_expires_at: expiresAt })
  if (error) return NextResponse.json({ error: "tournament_invite_create_failed" }, { status: 500 })
  if (data !== true) return NextResponse.json({ error: "tournament_invite_not_available" }, { status: 409 })
  return NextResponse.json({ url: new URL(`/tournament-invite/${encodeURIComponent(token)}`, getPublicAppBaseUrl(request)).toString(), expiresAt }, { headers: { "Cache-Control": "no-store" } })
}
