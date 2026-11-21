import { NextResponse } from "next/server"
import { getCoinTossWindow } from "@/lib/matchCoinToss"
import { loadCoinToss, runCoinTossAction } from "@/lib/serverMatchCoinToss"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ matchId: string }> }
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })
const noStore = { "Cache-Control": "private, no-store" }

/** The players of the match and the administrators of the league: spectators only watch the result. */
async function loadAccess(matchId: string, mutate: boolean) {
  const access = await getServerMatchActor(matchId, { requireLeagueAccess: true, requireMutableSeason: mutate })
  if (!access.ok) return { error: fail(access.error, access.status) }
  const { actor } = access
  if (actor.isSpectator || !(actor.isAdmin || actor.participantPlayerId)) return { error: fail("forbidden", 403) }
  // A league match needs its time: the window is counted from it.
  const window = getCoinTossWindow({ scheduledAt: actor.match.scheduledAt, now: Date.now(), requireTime: true })
  return { actor, window }
}

export async function GET(_request: Request, context: Context) {
  const matchId = validateUuid((await context.params).matchId)
  if (!matchId) return fail("invalid_match_id", 400)
  const loaded = await loadAccess(matchId, false)
  if (loaded.error) return loaded.error
  const found = await loadCoinToss(loaded.actor.supabase, { kind: "league", matchId })
  if (!found.ok) return fail("coin_toss_failed", 500)
  return NextResponse.json({ coinToss: found.toss, window: loaded.window }, { headers: noStore })
}

/** Toss the coin (or repeat it), or let the winning team pick: `{ action: "toss", headsTeam }` / `{ action: "choose", choice }`. */
export async function POST(request: Request, context: Context) {
  const rateLimited = await enforceRequestRateLimit({ request, scope: "match_coin_toss", limit: 30, windowMs: 60_000 })
  if (rateLimited) return rateLimited
  const matchId = validateUuid((await context.params).matchId)
  if (!matchId) return fail("invalid_match_id", 400)
  const loaded = await loadAccess(matchId, true)
  if (loaded.error) return loaded.error
  if (loaded.actor.match.status !== "scheduled") return fail("coin_toss_closed", 409)
  const result = await runCoinTossAction({
    supabase: loaded.actor.supabase, target: { kind: "league", matchId }, userId: loaded.actor.user.id,
    body: await parseJsonBody(request), window: loaded.window,
  })
  return NextResponse.json(result.json, { status: result.status, headers: noStore })
}
