export type RankingOrderRow = {
  id: string
  points: number
  gamesDiff: number
  gamesFor: number
}

export function compareRankingOrder(a: RankingOrderRow, b: RankingOrderRow) {
  if (b.points !== a.points) return b.points - a.points
  if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
  return b.gamesFor - a.gamesFor
}

export function sortRankingRows<T extends RankingOrderRow>(players: T[]) {
  return [...players].sort(compareRankingOrder)
}

export function getRankingDisplayPosition<T extends RankingOrderRow>(
  players: T[],
  playerId: string,
) {
  const sorted = sortRankingRows(players)
  const player = sorted.find((row) => row.id === playerId)
  return player ? sorted.findIndex((row) => compareRankingOrder(row, player) === 0) + 1 : null
}
