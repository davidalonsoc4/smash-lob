type PreferredSide = "drive" | "reves" | "versatile" | null | undefined
export type RecommendedSide = "drive" | "reves"
import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile, SeasonPlayer } from "@/data/fakeData"
import { calculateSeasonRanking } from "@/lib/ranking"
export type SideStatistics = { matchesPlayed: number; wins: number; gamesFor: number; gamesAgainst: number }
type PairPlayer = { preferredSide?: PreferredSide; rankingPosition?: number | null; statistics?: SideStatistics }

/** Same counted league results as profiles/rankings, merged only by registered identity. */
export function buildSideStatistics(matches: MatchData[], profiles: PlayerProfile[], roster: SeasonPlayer[]) {
  const identity = new Map(profiles.map(player => [player.id, player.userId || player.id]))
  const totals = new Map<string, SideStatistics>()
  for (const seasonId of new Set(matches.map(match => match.seasonId))) {
    for (const row of calculateSeasonRanking({ seasonId, matches, playerProfiles: profiles, seasonPlayers: roster })) {
      const key = identity.get(row.id) ?? row.id
      const total = totals.get(key) ?? { matchesPlayed: 0, wins: 0, gamesFor: 0, gamesAgainst: 0 }
      for (const field of ["matchesPlayed", "wins", "gamesFor", "gamesAgainst"] as const) total[field] += row[field]
      totals.set(key, total)
    }
  }
  return Object.fromEntries(profiles.map(player => [player.id, totals.get(identity.get(player.id)!) ?? { matchesPlayed: 0, wins: 0, gamesFor: 0, gamesAgainst: 0 }]))
}

function comparePriority(a: PairPlayer, b: PairPlayer) {
  const left = a.statistics, right = b.statistics
  const hasLeft = Boolean(left && left.matchesPlayed > 0), hasRight = Boolean(right && right.matchesPlayed > 0)
  if (hasLeft !== hasRight) return hasLeft ? 1 : -1
  if (!hasLeft || !hasRight) return 0
  const wins = left!.wins * right!.matchesPlayed - right!.wins * left!.matchesPlayed
  if (wins) return wins
  const games = left!.gamesFor * (right!.gamesFor + right!.gamesAgainst) - right!.gamesFor * (left!.gamesFor + left!.gamesAgainst)
  if (games) return games
  const ranks = [a.rankingPosition, b.rankingPosition]
  return ranks.every(rank => typeof rank === "number" && Number.isInteger(rank) && rank > 0) ? b.rankingPosition! - a.rankingPosition! : 0
}

const opposite = (side: RecommendedSide): RecommendedSide => side === "drive" ? "reves" : "drive"
const fixed = (side: PreferredSide): side is RecommendedSide => side === "drive" || side === "reves"

/** Suggestions only: a missing preference or tied ranking never breaks ties arbitrarily. */
export function recommendPairSides(pair: readonly PairPlayer[]): [RecommendedSide | null, RecommendedSide | null] {
  if (pair.length !== 2) return [null, null]
  const [a, b] = pair
  if (fixed(a.preferredSide) && fixed(b.preferredSide)) {
    if (a.preferredSide !== b.preferredSide) return [a.preferredSide, b.preferredSide]
    const priority = comparePriority(a, b)
    if (!priority) return [null, null]
    return priority > 0 ? [a.preferredSide, opposite(b.preferredSide)] : [opposite(a.preferredSide), b.preferredSide]
  }
  if (fixed(a.preferredSide) && b.preferredSide === "versatile") return [a.preferredSide, opposite(a.preferredSide)]
  if (a.preferredSide === "versatile" && fixed(b.preferredSide)) return [opposite(b.preferredSide), b.preferredSide]
  return [null, null]
}
