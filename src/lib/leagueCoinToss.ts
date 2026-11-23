import type { CoinToss } from "@/lib/matchCoinToss"

/** A match with what the data of the league says about its toss (null: there is none; absent: it does not say). */
export type WithCoinToss<T> = T & { coinToss?: CoinToss | null }

/**
 * What the data of the league says about the coin toss of a match for the person who loads it: the toss (or null when there is none yet)
 * when she can see it, and undefined when the data says nothing (then the card asks for it on its own). It follows the rule of the toss
 * route: the players of the match and the administrators of the league (in the administration view), never the spectators.
 */
export function coinTossForViewer({ match, membership, isSpectator, tosses }: {
  match: { id: string; teamA: string[]; teamB: string[] }
  membership: { playerId?: string | null; role: string; experienceMode?: string | null } | null | undefined
  isSpectator: boolean
  /** The tosses of the leagues by match, or null when they could not be read. */
  tosses: Map<string, CoinToss> | null
}): CoinToss | null | undefined {
  if (!tosses || isSpectator || !membership) return undefined
  const playerId = membership.playerId
  const plays = Boolean(playerId) && (match.teamA.includes(playerId as string) || match.teamB.includes(playerId as string))
  const administers = (membership.role === "creator" || membership.role === "admin") && membership.experienceMode === "admin"
  if (!plays && !administers) return undefined
  return tosses.get(match.id) ?? null
}
