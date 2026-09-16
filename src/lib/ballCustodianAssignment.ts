export type BallAssignmentMatch = {
  id: string
  round: number
  teamA: string[]
  teamB: string[]
}

export type BallCustodianAssignment = {
  byMatchId: Record<string, string>
  botesByPlayerId: Record<string, number>
  custodianPlayerIds: string[]
  totalBotes: number
}

function compareText(first: string, second: string) {
  return first.localeCompare(second, "es", { sensitivity: "base" }) || first.localeCompare(second)
}

function compareSelection(first: number[], second: number[]) {
  const length = Math.min(first.length, second.length)
  for (let index = 0; index < length; index += 1) {
    if (first[index] !== second[index]) return first[index] - second[index]
  }
  return first.length - second.length
}

/**
 * Finds a minimum-cardinality set of players that intersects every match.
 * The candidate order is the configured priority order followed by the
 * remaining season players, so equal-sized solutions are deterministic.
 */
export function calculateBallCustodianAssignment({
  matches,
  seasonPlayerIds = [],
  priorityPlayerIds = [],
  playerNames = {},
}: {
  matches: BallAssignmentMatch[]
  seasonPlayerIds?: string[]
  priorityPlayerIds?: string[]
  playerNames?: Record<string, string>
}): BallCustodianAssignment {
  const usableMatches = matches
    .map((match) => ({
      id: match.id,
      round: Number(match.round) || 0,
      players: Array.from(new Set([...match.teamA, ...match.teamB].filter(Boolean))),
    }))
    .filter((match) => match.players.length > 0)
    .sort((first, second) => first.round - second.round || compareText(first.id, second.id))

  if (usableMatches.length === 0) {
    return { byMatchId: {}, botesByPlayerId: {}, custodianPlayerIds: [], totalBotes: 0 }
  }

  const allPlayers = new Set<string>()
  usableMatches.forEach((match) => match.players.forEach((playerId) => allPlayers.add(playerId)))
  seasonPlayerIds.forEach((playerId) => allPlayers.add(playerId))
  const priority = Array.from(new Set(priorityPlayerIds)).filter((playerId) => allPlayers.has(playerId))
  const candidateIds = [
    ...priority,
    ...Array.from(allPlayers).filter((playerId) => !priority.includes(playerId)).sort((first, second) =>
      compareText(playerNames[first] ?? first, playerNames[second] ?? second),
    ),
  ]
  const candidateIndex = new Map(candidateIds.map((playerId, index) => [playerId, index]))
  const matchCandidates = usableMatches.map((match) =>
    match.players.map((playerId) => candidateIndex.get(playerId)).filter((index): index is number => index !== undefined),
  )
  const coverage = candidateIds.map((_, candidate) => {
    const covered = new Set<number>()
    matchCandidates.forEach((candidates, matchIndex) => {
      if (candidates.includes(candidate)) covered.add(matchIndex)
    })
    return covered
  })
  let best: number[] | null = null

  function search(chosen: number[], covered: Set<number>) {
    if (covered.size === usableMatches.length) {
      if (!best || chosen.length < best.length || (chosen.length === best.length && compareSelection(chosen, best) < 0)) {
        best = [...chosen]
      }
      return
    }
    if (best && chosen.length >= best.length) return
    const uncoveredCount = usableMatches.length - covered.size
    const maxAdditionalCoverage = Math.max(
      1,
      ...coverage
        .filter((_, candidate) => !chosen.includes(candidate))
        .map((candidateCoverage) => {
          let count = 0
          candidateCoverage.forEach((matchIndex) => {
            if (!covered.has(matchIndex)) count += 1
          })
          return count
        }),
    )
    if (best && chosen.length + Math.ceil(uncoveredCount / maxAdditionalCoverage) > best.length) return

    let selectedMatch = -1
    let selectedOptions: number[] = []
    for (let matchIndex = 0; matchIndex < matchCandidates.length; matchIndex += 1) {
      if (covered.has(matchIndex)) continue
      const options = matchCandidates[matchIndex].filter((candidate) => !chosen.includes(candidate))
      if (options.length === 0) return
      if (selectedMatch === -1 || options.length < selectedOptions.length) {
        selectedMatch = matchIndex
        selectedOptions = options
      }
    }

    selectedOptions.sort((first, second) => {
      const firstGain = [...coverage[first]].filter((matchIndex) => !covered.has(matchIndex)).length
      const secondGain = [...coverage[second]].filter((matchIndex) => !covered.has(matchIndex)).length
      return secondGain - firstGain || first - second
    })
    for (const candidate of selectedOptions) {
      const nextCovered = new Set(covered)
      coverage[candidate].forEach((matchIndex) => nextCovered.add(matchIndex))
      search([...chosen, candidate].sort((first, second) => first - second), nextCovered)
    }
  }

  search([], new Set<number>())
  const selected: number[] = best ? [...best] : []
  const selectedSet = new Set(selected)
  const counts: Record<string, number> = Object.fromEntries(candidateIds.filter((_, index) => selectedSet.has(index)).map((playerId) => [playerId, 0]))
  const byMatchId: Record<string, string> = {}

  for (const match of usableMatches) {
    const eligible = match.players.filter((playerId) => {
      const index = candidateIndex.get(playerId)
      return index !== undefined && selectedSet.has(index)
    })
    eligible.sort((first, second) => {
      const firstCount = counts[first] ?? 0
      const secondCount = counts[second] ?? 0
      return firstCount - secondCount || (candidateIndex.get(first) ?? 0) - (candidateIndex.get(second) ?? 0)
    })
    const assigned = eligible[0]
    if (assigned) {
      byMatchId[match.id] = assigned
      counts[assigned] = (counts[assigned] ?? 0) + 1
    }
  }

  return {
    byMatchId,
    botesByPlayerId: counts,
    custodianPlayerIds: selected.map((index) => candidateIds[index]),
    totalBotes: Object.values(counts).reduce((total, count) => total + count, 0),
  }
}
