import { getPublicAppBaseUrl, PRODUCTION_APP_URL } from "@/lib/appUrl"

/** Coin toss for who serves first, in league matches and friendlies. Shared by the screen and the server. */
export type CoinTossTeam = 1 | 2
/** The two faces of the coin are the smash ("heads") and the lob ("tails"): the stored values keep the usual heads and tails. */
export type CoinTossFace = "heads" | "tails"
/** What the winning team picks: serve or return (the other team gets what is left). The side is not chosen: the courts are the same for everyone. */
export type CoinTossChoice = "serve" | "return"

export type CoinToss = {
  /** The team that called heads; the other team called tails. */
  calledHeadsTeam: CoinTossTeam
  result: CoinTossFace
  winnerTeam: CoinTossTeam
  winnerChoice: CoinTossChoice | null
  /** The team that serves first, once it is known. */
  servingTeam: CoinTossTeam | null
  /** How many times it has been tossed; repeating replaces the previous toss. */
  tossCount: number
  tossedAt: string
}

/** The toss is for being on the court: it opens before the booked time and closes some hours after it. */
export const COIN_TOSS_OPENS_BEFORE_MS = 30 * 60_000
export const COIN_TOSS_CLOSES_AFTER_MS = 4 * 3_600_000

/**
 * Whether the toss is only available around the booked time (from 30 minutes before it until a few hours after it, so it can also be
 * tossed during the match). It is so in production only: in preproduction and when developing the toss is always available, to be able
 * to test it. Pass the request on the server (it says where the app is running); in the browser the address of the page says it.
 */
export function isCoinTossTimeWindowEnforced(request?: Request): boolean {
  return getPublicAppBaseUrl(request) === PRODUCTION_APP_URL
}

export type CoinTossWindow = {
  state: "open" | "early" | "late" | "unscheduled"
  /** When it opens, if the match has a time and it has not opened yet. */
  opensAt: string | null
}

/**
 * With `enforce` off the toss is always open. With it on: a league match must have a time (that is what keeps the toss for the court, not for home); a friendly without a
 * time can toss whenever, since there is nothing to compare with.
 */
export function getCoinTossWindow({ scheduledAt, now, requireTime, enforce }: { scheduledAt: string | null; now: number; requireTime: boolean; enforce: boolean }): CoinTossWindow {
  if (!enforce) return { state: "open", opensAt: null }
  const start = scheduledAt ? Date.parse(scheduledAt) : Number.NaN
  if (Number.isNaN(start)) return { state: requireTime ? "unscheduled" : "open", opensAt: null }
  const opensAt = start - COIN_TOSS_OPENS_BEFORE_MS
  if (now < opensAt) return { state: "early", opensAt: new Date(opensAt).toISOString() }
  if (now > start + COIN_TOSS_CLOSES_AFTER_MS) return { state: "late", opensAt: null }
  return { state: "open", opensAt: null }
}

export const otherCoinTossTeam = (team: CoinTossTeam): CoinTossTeam => (team === 1 ? 2 : 1)

/** The face that a team called. */
export const faceCalledByTeam = (calledHeadsTeam: CoinTossTeam, team: CoinTossTeam): CoinTossFace => (calledHeadsTeam === team ? "heads" : "tails")

/** Who serves first given the winner's choice (null while it is not made). */
export function resolveServingTeam(winnerTeam: CoinTossTeam, winnerChoice: CoinTossChoice | null): CoinTossTeam | null {
  if (winnerChoice === "serve") return winnerTeam
  if (winnerChoice === "return") return otherCoinTossTeam(winnerTeam)
  return null
}

/** What is left to choose: the pick of the winner, or nothing. */
export function pendingCoinTossStep(toss: CoinToss): "winner" | null {
  return toss.winnerChoice ? null : "winner"
}

export const isCoinTossTeam = (value: unknown): value is CoinTossTeam => value === 1 || value === 2
export const isCoinTossChoice = (value: unknown): value is CoinTossChoice => value === "serve" || value === "return"

/** A notice that the toss is open is only worth sending soon after it opens: from 30 minutes before the match until 30 minutes after it starts. */
export const COIN_TOSS_NOTICE_GRACE_MS = 30 * 60_000
export function isCoinTossOpenNoticeDue(scheduledAt: string | null, now: number): boolean {
  if (!scheduledAt) return false
  const start = Date.parse(scheduledAt)
  if (!Number.isFinite(start)) return false
  return now >= start - COIN_TOSS_OPENS_BEFORE_MS && now <= start + COIN_TOSS_NOTICE_GRACE_MS
}
