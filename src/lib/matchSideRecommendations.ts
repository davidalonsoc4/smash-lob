type PreferredSide = "drive" | "reves" | "versatile" | null | undefined
export type RecommendedSide = "drive" | "reves"
type PairPlayer = { preferredSide?: PreferredSide; rankingPosition?: number | null }

const opposite = (side: RecommendedSide): RecommendedSide => side === "drive" ? "reves" : "drive"
const fixed = (side: PreferredSide): side is RecommendedSide => side === "drive" || side === "reves"

/** Suggestions only: a missing preference or tied ranking never breaks ties arbitrarily. */
export function recommendPairSides(pair: readonly PairPlayer[]): [RecommendedSide | null, RecommendedSide | null] {
  if (pair.length !== 2) return [null, null]
  const [a, b] = pair
  if (fixed(a.preferredSide) && fixed(b.preferredSide)) {
    if (a.preferredSide !== b.preferredSide) return [a.preferredSide, b.preferredSide]
    const rankA = a.rankingPosition
    const rankB = b.rankingPosition
    if (typeof rankA !== "number" || typeof rankB !== "number" || !Number.isInteger(rankA) || !Number.isInteger(rankB) || rankA <= 0 || rankB <= 0 || rankA === rankB) return [null, null]
    return rankA < rankB ? [a.preferredSide, opposite(b.preferredSide)] : [opposite(a.preferredSide), b.preferredSide]
  }
  if (fixed(a.preferredSide) && b.preferredSide === "versatile") return [a.preferredSide, opposite(a.preferredSide)]
  if (a.preferredSide === "versatile" && fixed(b.preferredSide)) return [opposite(b.preferredSide), b.preferredSide]
  return [null, null]
}
