import { NextResponse } from "next/server"
import { getCoinTossWindow } from "@/lib/matchCoinToss"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { loadCoinToss, runCoinTossAction } from "@/lib/serverMatchCoinToss"
import { loadManageablePersonalMatch, loadPersonalMatch } from "@/lib/serverPersonalMatches"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ id: string }> }
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })
const noStore = { "Cache-Control": "private, no-store" }

/** Any participant of the friendly sees the toss. */
export async function GET(_request: Request, context: Context) {
  const matchId = validateUuid((await context.params).id)
  if (!matchId) return fail("invalid_personal_match_id", 400)
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return fail(auth.error, auth.status)
  try {
    const item = await loadPersonalMatch(auth.actor, matchId)
    if (!item) return fail("personal_match_not_found", 404)
    const found = await loadCoinToss(auth.actor.supabase, { kind: "friendly", matchId })
    if (!found.ok) return fail("coin_toss_failed", 500)
    // A friendly without a time can toss whenever.
    const window = getCoinTossWindow({ scheduledAt: item.scheduledAt, now: Date.now(), requireTime: false })
    return NextResponse.json({ coinToss: found.toss, window }, { headers: noStore })
  } catch {
    return fail("coin_toss_failed", 500)
  }
}

/** Toss the coin (or repeat it), or let the winning team pick. Same permissions as editing the friendly. */
export async function POST(request: Request, context: Context) {
  const rateLimited = await enforceRequestRateLimit({ request, scope: "personal_match_coin_toss", limit: 30, windowMs: 60_000 })
  if (rateLimited) return rateLimited
  const matchId = validateUuid((await context.params).id)
  if (!matchId) return fail("invalid_personal_match_id", 400)
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return fail(auth.error, auth.status)
  try {
    const row = await loadManageablePersonalMatch(auth.actor, matchId)
    if (!row) return fail("personal_match_not_found", 404)
    if (row === "forbidden") return fail("forbidden", 403)
    if (row.status !== "scheduled") return fail("coin_toss_closed", 409)
    const window = getCoinTossWindow({ scheduledAt: row.played_at ?? null, now: Date.now(), requireTime: false })
    const result = await runCoinTossAction({
      supabase: auth.actor.supabase, target: { kind: "friendly", matchId }, userId: auth.actor.user.id,
      body: await parseJsonBody(request), window,
    })
    return NextResponse.json(result.json, { status: result.status, headers: noStore })
  } catch {
    return fail("coin_toss_failed", 500)
  }
}
