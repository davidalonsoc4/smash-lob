import type { CoinToss, CoinTossChoice, CoinTossTeam, CoinTossWindow } from "@/lib/matchCoinToss"

export type CoinTossKind = "league" | "friendly"
export type CoinTossState = { coinToss: CoinToss | null; window: CoinTossWindow }
export type CoinTossFailure = "closed" | "forbidden" | "failed"

const endpoint = (kind: CoinTossKind, matchId: string) =>
  kind === "league" ? `/api/matches/${encodeURIComponent(matchId)}/coin-toss` : `/api/personal-matches/${encodeURIComponent(matchId)}/coin-toss`

/**
 * The last toss the server told this tab about for each match (null: there was none yet). The panel of the match starts from it, so when
 * the person comes back to a match it already shows what it said, and the server only confirms it. It lives in memory: it is gone on reload.
 */
const lastKnownToss = new Map<string, CoinToss | null>()
const MAX_REMEMBERED = 60
const keyOf = (kind: CoinTossKind, matchId: string) => `${kind}:${matchId}`
export const rememberedCoinToss = (kind: CoinTossKind, matchId: string): CoinToss | null | undefined => lastKnownToss.get(keyOf(kind, matchId))
export function rememberCoinToss(kind: CoinTossKind, matchId: string, toss: CoinToss | null) {
  const key = keyOf(kind, matchId)
  lastKnownToss.delete(key)
  lastKnownToss.set(key, toss)
  if (lastKnownToss.size > MAX_REMEMBERED) lastKnownToss.delete(lastKnownToss.keys().next().value as string)
}

/** The toss of a match, or null when the person cannot see it (then the panel does not show). */
export async function fetchCoinToss(kind: CoinTossKind, matchId: string): Promise<CoinTossState | null> {
  const response = await fetch(endpoint(kind, matchId), { cache: "no-store" }).catch(() => null)
  if (!response?.ok) return null
  const state = (await response.json().catch(() => null)) as CoinTossState | null
  if (state) rememberCoinToss(kind, matchId, state.coinToss)
  return state
}

async function send(kind: CoinTossKind, matchId: string, body: Record<string, unknown>): Promise<{ ok: true; state: CoinTossState } | { ok: false; error: CoinTossFailure }> {
  const response = await fetch(endpoint(kind, matchId), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
  if (!response) return { ok: false, error: "failed" }
  const payload = (await response.json().catch(() => null)) as (CoinTossState & { error?: string }) | null
  if (response.ok && payload?.coinToss) {
    rememberCoinToss(kind, matchId, payload.coinToss)
    return { ok: true, state: payload }
  }
  return { ok: false, error: response.status === 409 ? "closed" : response.status === 403 ? "forbidden" : "failed" }
}

/** Toss (or repeat): `headsTeam` is the team that calls heads. The server decides the face. */
export const tossCoinRequest = (kind: CoinTossKind, matchId: string, headsTeam: CoinTossTeam) => send(kind, matchId, { action: "toss", headsTeam })

/** The winner picks serve or return. */
export const chooseCoinTossRequest = (kind: CoinTossKind, matchId: string, choice: CoinTossChoice) => send(kind, matchId, { action: "choose", choice })
