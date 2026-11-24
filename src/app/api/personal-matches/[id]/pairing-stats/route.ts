import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { validateUuid } from "@/lib/serverRequest"
import { loadManageablePersonalMatch } from "@/lib/serverPersonalMatches"
import { loadPairingStats } from "@/lib/serverPairingStats"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const matchId = validateUuid(id)
  if (!matchId) return NextResponse.json({ error: "invalid_personal_match_id" }, { status: 400 })

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  try {
    const match = await loadManageablePersonalMatch(authResult.actor, matchId)
    if (!match) return NextResponse.json({ error: "personal_match_not_found" }, { status: 404 })
    if (match === "forbidden") return NextResponse.json({ error: "personal_match_forbidden" }, { status: 403 })
    return NextResponse.json({ stats: await loadPairingStats(authResult.actor, matchId) })
  } catch {
    return NextResponse.json({ error: "pairing_stats_failed" }, { status: 500 })
  }
}
