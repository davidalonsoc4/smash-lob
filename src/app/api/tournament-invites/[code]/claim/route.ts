import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_invite_claim", limit: 10, windowMs: 60_000 }); if (limited) return limited
  const auth = await requireAuthenticatedAppUser(); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { code } = await params; const playerId = validateUuid((await parseJsonBody<{ playerId?: unknown }>(request))?.playerId)
  if (!/^[A-Za-z0-9_-]{43}$/.test(code) || !playerId) return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
  const codeHash = createHash("sha256").update(code).digest("hex")
  const shared = await auth.actor.supabase.rpc("claim_rapid_tournament_join_invite", { p_code_hash: codeHash, p_user_id: auth.actor.user.id, p_player_id: playerId })
  if (shared.error) return NextResponse.json({ error: "invite_claim_failed" }, { status: 500 })
  const legacy = typeof shared.data === "string" ? null : await auth.actor.supabase.rpc("claim_rapid_tournament_invite", { p_code_hash: codeHash, p_user_id: auth.actor.user.id })
  if (legacy?.error) return NextResponse.json({ error: "invite_claim_failed" }, { status: 500 })
  const tournamentId = shared.data ?? legacy?.data
  if (typeof tournamentId !== "string") return NextResponse.json({ error: "invite_not_available" }, { status: 409 })
  return NextResponse.json({ tournamentId }, { headers: { "Cache-Control": "no-store" } })
}
