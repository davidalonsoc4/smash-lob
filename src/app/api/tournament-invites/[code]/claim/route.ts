import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_invite_claim", limit: 10, windowMs: 60_000 })
  if (limited) return limited
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { code } = await params
  if (!/^[A-Za-z0-9_-]{43}$/.test(code)) return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
  const codeHash = createHash("sha256").update(code).digest("hex")
  const { data, error } = await auth.actor.supabase.rpc("claim_rapid_tournament_invite", { p_code_hash: codeHash, p_user_id: auth.actor.user.id })
  if (error) return NextResponse.json({ error: "invite_claim_failed" }, { status: 500 })
  if (typeof data !== "string") return NextResponse.json({ error: "invite_not_available" }, { status: 409 })
  return NextResponse.json({ tournamentId: data }, { headers: { "Cache-Control": "no-store" } })
}
