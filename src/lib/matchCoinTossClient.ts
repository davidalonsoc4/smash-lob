import type { CoinToss, CoinTossChoice, CoinTossTeam, CoinTossWindow } from "@/lib/matchCoinToss"

export type CoinTossKind = "league" | "friendly"
export type CoinTossState = { coinToss: CoinToss | null; window: CoinTossWindow }
export type CoinTossFailure = "closed" | "forbidden" | "failed"

const endpoint = (kind: CoinTossKind, matchId: string) =>
  kind === "league" ? `/api/matches/${encodeURIComponent(matchId)}/coin-toss` : `/api/personal-matches/${encodeURIComponent(matchId)}/coin-toss`

/**
 * The last toss the server told this tab about for each match (null: there was none yet). The panel of the match starts from it, so when
 * the person comes back to a match it already shows what it said, and the server only confirms it. It lives in memory: it is gone on reload.
 * The panel is also told when a newer one arrives (for example with the data of the friendly), and a request in flight is not repeated.
 */
type Remembered = { toss: CoinToss | null; at: number }
const lastKnownToss = new Map<string, Remembered>()
const listeners = new Map<string, Set<(toss: CoinToss | null) => void>>()
const inFlight = new Map<string, Promise<CoinTossState | null>>()
const MAX_REMEMBERED = 60
/** A toss heard about this recently is not asked for again. */
const FRESH_MS = 4_000
const keyOf = (kind: CoinTossKind, matchId: string) => `${kind}:${matchId}`
export const rememberedCoinToss = (kind: CoinTossKind, matchId: string): CoinToss | null | undefined => lastKnownToss.get(keyOf(kind, matchId))?.toss
export const isCoinTossFresh = (kind: CoinTossKind, matchId: string, now = Date.now()) => {
  const known = lastKnownToss.get(keyOf(kind, matchId))
  return Boolean(known) && now - (known?.at ?? 0) < FRESH_MS
}
export function rememberCoinToss(kind: CoinTossKind, matchId: string, toss: CoinToss | null) {
  const key = keyOf(kind, matchId)
  lastKnownToss.delete(key)
  lastKnownToss.set(key, { toss, at: Date.now() })
  if (lastKnownToss.size > MAX_REMEMBERED) lastKnownToss.delete(lastKnownToss.keys().next().value as string)
  listeners.get(key)?.forEach((listener) => listener(toss))
}
/** Tells the listener whenever a toss is remembered for that match. Returns the way to stop. */
export function subscribeCoinToss(kind: CoinTossKind, matchId: string, listener: (toss: CoinToss | null) => void) {
  const key = keyOf(kind, matchId)
  const set = listeners.get(key) ?? new Set()
  set.add(listener)
  listeners.set(key, set)
  return () => { set.delete(listener); if (!set.size) listeners.delete(key) }
}

/** The toss of a match, or null when the person cannot see it (then the panel does not show). Two calls at the same time share one request. */
export function fetchCoinToss(kind: CoinTossKind, matchId: string): Promise<CoinTossState | null> {
  const key = keyOf(kind, matchId)
  const running = inFlight.get(key)
  if (running) return running
  const request = (async () => {
    const response = await fetch(endpoint(kind, matchId), { cache: "no-store" }).catch(() => null)
    if (!response?.ok) return null
    const state = (await response.json().catch(() => null)) as CoinTossState | null
    if (state) rememberCoinToss(kind, matchId, state.coinToss)
    return state
  })().finally(() => inFlight.delete(key))
  inFlight.set(key, request)
  return request
}

/** Asks for the toss ahead of time (when the match screen opens), so the panel finds it already there. */
export function prefetchCoinToss(kind: CoinTossKind, matchId: string) {
  if (!isCoinTossFresh(kind, matchId)) void fetchCoinToss(kind, matchId)
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
