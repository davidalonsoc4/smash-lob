import "server-only"

import { randomInt } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isCoinTossChoice, isCoinTossTeam, otherCoinTossTeam, pendingCoinTossStep, resolveServingTeam, type CoinToss, type CoinTossChoice, type CoinTossFace, type CoinTossTeam, type CoinTossWindow } from "@/lib/matchCoinToss"

/** A league match or a friendly: each one has its own column in the table. */
export type CoinTossTarget = { kind: "league" | "friendly"; matchId: string }

const FIELDS = "called_heads_team,result,winner_team,winner_choice,serving_team,toss_count,tossed_at"
/** The columns of a toss, for the places that read several at once (the data of the league). */
export const COIN_TOSS_FIELDS = FIELDS
const columnOf = (target: CoinTossTarget) => (target.kind === "league" ? "match_id" : "personal_match_id")

export type CoinTossRow = {
  called_heads_team: CoinTossTeam
  result: CoinTossFace
  winner_team: CoinTossTeam
  winner_choice: CoinTossChoice | null
  serving_team: CoinTossTeam | null
  toss_count: number
  tossed_at: string
}

export const toCoinToss = (row: CoinTossRow): CoinToss => ({
  calledHeadsTeam: row.called_heads_team, result: row.result, winnerTeam: row.winner_team, winnerChoice: row.winner_choice,
  servingTeam: row.serving_team, tossCount: row.toss_count, tossedAt: row.tossed_at,
})

export async function loadCoinToss(supabase: SupabaseClient, target: CoinTossTarget): Promise<{ ok: true; toss: CoinToss | null } | { ok: false }> {
  const found = await supabase.from("match_coin_tosses").select(FIELDS).eq(columnOf(target), target.matchId).maybeSingle()
  if (found.error) return { ok: false }
  return { ok: true, toss: found.data ? toCoinToss(found.data as CoinTossRow) : null }
}

/**
 * Tosses the coin: the server decides, 50 % for each face, so nobody can repeat it until it suits them.
 * Repeating replaces the toss that was there (and the choices made on it) and counts one more.
 */
export async function tossCoin(supabase: SupabaseClient, target: CoinTossTarget, userId: string, calledHeadsTeam: CoinTossTeam): Promise<{ ok: true; toss: CoinToss } | { ok: false }> {
  const column = columnOf(target)
  const previous = await supabase.from("match_coin_tosses").select("toss_count").eq(column, target.matchId).maybeSingle()
  if (previous.error) return { ok: false }
  const result: CoinTossFace = randomInt(2) === 0 ? "heads" : "tails"
  const winnerTeam = result === "heads" ? calledHeadsTeam : otherCoinTossTeam(calledHeadsTeam)
  const now = new Date().toISOString()
  const saved = await supabase.from("match_coin_tosses").upsert({
    [column]: target.matchId, called_heads_team: calledHeadsTeam, result, winner_team: winnerTeam,
    winner_choice: null, serving_team: null, tossed_by_user_id: userId,
    toss_count: ((previous.data?.toss_count as number | undefined) ?? 0) + 1, tossed_at: now, updated_at: now,
  }, { onConflict: column }).select(FIELDS).single()
  return saved.error || !saved.data ? { ok: false } : { ok: true, toss: toCoinToss(saved.data as CoinTossRow) }
}

export type CoinTossChooseError = "no_toss" | "already_chosen" | "failed"

/** The winner picks serve or return; the other team gets what is left. */
export async function chooseCoinToss(supabase: SupabaseClient, target: CoinTossTarget, choice: CoinTossChoice): Promise<{ ok: true; toss: CoinToss } | { ok: false; error: CoinTossChooseError }> {
  const column = columnOf(target)
  const current = await loadCoinToss(supabase, target)
  if (!current.ok) return { ok: false, error: "failed" }
  if (!current.toss) return { ok: false, error: "no_toss" }
  if (!pendingCoinTossStep(current.toss)) return { ok: false, error: "already_chosen" }
  const patch = { winner_choice: choice, serving_team: resolveServingTeam(current.toss.winnerTeam, choice) }
  // Only while that step is still empty, so two taps at once cannot both win.
  const saved = await supabase.from("match_coin_tosses").update({ ...patch, updated_at: new Date().toISOString() })
    .eq(column, target.matchId).is("winner_choice", null).select(FIELDS).maybeSingle()
  if (saved.error) return { ok: false, error: "failed" }
  if (!saved.data) return { ok: false, error: "already_chosen" }
  return { ok: true, toss: toCoinToss(saved.data as CoinTossRow) }
}

/** The answer of the toss routes: the toss and where the window stands. `window` only affects tossing, not reading. */
export async function runCoinTossAction({ supabase, target, userId, body, window }: {
  supabase: SupabaseClient
  target: CoinTossTarget
  userId: string
  body: { action?: unknown; headsTeam?: unknown; choice?: unknown } | null
  window: CoinTossWindow
}): Promise<{ status: number; json: Record<string, unknown> }> {
  if (body?.action === "toss") {
    if (!isCoinTossTeam(body.headsTeam)) return { status: 400, json: { error: "invalid_coin_toss" } }
    if (window.state !== "open") return { status: 409, json: { error: "coin_toss_closed", window } }
    const tossed = await tossCoin(supabase, target, userId, body.headsTeam)
    return tossed.ok ? { status: 200, json: { coinToss: tossed.toss, window } } : { status: 500, json: { error: "coin_toss_failed" } }
  }
  if (body?.action === "choose") {
    if (!isCoinTossChoice(body.choice)) return { status: 400, json: { error: "invalid_coin_toss" } }
    const chosen = await chooseCoinToss(supabase, target, body.choice)
    if (chosen.ok) return { status: 200, json: { coinToss: chosen.toss, window } }
    return chosen.error === "failed"
      ? { status: 500, json: { error: "coin_toss_failed" } }
      : { status: 409, json: { error: `coin_toss_${chosen.error}` } }
  }
  return { status: 400, json: { error: "invalid_coin_toss" } }
}
