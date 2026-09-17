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
  unassignedMatchIds: string[]
  totalBotes: number
}

export type OpeningRoundBallAllocation = {
  fixedAssignmentsByMatchId: Record<string, string>
  additionalBotesByPlayerId: Record<string, number>
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

export function getOpeningRoundBallAllocation(
  matches: BallAssignmentMatch[],
  creatorPlayerId: string | null,
): OpeningRoundBallAllocation {
  if (!creatorPlayerId) {
    return { fixedAssignmentsByMatchId: {}, additionalBotesByPlayerId: {} }
  }

  const openingMatchIds = matches
    .filter((match) => Number(match.round) === 1 && [...match.teamA, ...match.teamB].some(Boolean))
    .map((match) => match.id)
    .sort(compareText)

  return {
    fixedAssignmentsByMatchId: Object.fromEntries(
      openingMatchIds.map((matchId) => [matchId, creatorPlayerId]),
    ),
    additionalBotesByPlayerId: {},
  }
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
  eligiblePlayerIds,
  playerNames = {},
  additionalBotesByPlayerId = {},
  fixedAssignmentsByMatchId = {},
}: {
  matches: BallAssignmentMatch[]
  seasonPlayerIds?: string[]
  priorityPlayerIds?: string[]
  eligiblePlayerIds?: string[]
  playerNames?: Record<string, string>
  additionalBotesByPlayerId?: Record<string, number>
  fixedAssignmentsByMatchId?: Record<string, string>
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
    const botesByPlayerId = Object.fromEntries(
      Object.entries(additionalBotesByPlayerId)
        .filter(([playerId, count]) => Boolean(playerId) && Number.isFinite(count) && count > 0)
        .map(([playerId, count]) => [playerId, Math.floor(count)]),
    )
    const custodianPlayerIds = Object.keys(botesByPlayerId)

    return {
      byMatchId: {},
      botesByPlayerId,
      custodianPlayerIds,
      unassignedMatchIds: [],
      totalBotes: Object.values(botesByPlayerId).reduce((total, count) => total + count, 0),
    }
  }

  const allPlayers = new Set<string>()
  usableMatches.forEach((match) => match.players.forEach((playerId) => allPlayers.add(playerId)))
  seasonPlayerIds.forEach((playerId) => allPlayers.add(playerId))
  Object.values(fixedAssignmentsByMatchId).forEach((playerId) => {
    if (playerId) allPlayers.add(playerId)
  })
  Object.entries(additionalBotesByPlayerId).forEach(([playerId, count]) => {
    if (playerId && Number.isFinite(count) && count > 0) allPlayers.add(playerId)
  })
  const priority = Array.from(new Set(priorityPlayerIds)).filter((playerId) => allPlayers.has(playerId))
  const candidateIds = [
    ...priority,
    ...Array.from(allPlayers).filter((playerId) => !priority.includes(playerId)).sort((first, second) =>
      compareText(playerNames[first] ?? first, playerNames[second] ?? second),
    ),
  ].filter((playerId) => eligiblePlayerIds === undefined || eligiblePlayerIds.includes(playerId))
  const candidateIndex = new Map(candidateIds.map((playerId, index) => [playerId, index]))
  const matchesNeedingCustodian = usableMatches.filter((match) => !fixedAssignmentsByMatchId[match.id])
  const matchCandidates = matchesNeedingCustodian.map((match) =>
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
    if (covered.size === matchesNeedingCustodian.length) {
      if (!best || chosen.length < best.length || (chosen.length === best.length && compareSelection(chosen, best) < 0)) {
        best = [...chosen]
      }
      return
    }
    if (best && chosen.length >= best.length) return
    const uncoveredCount = matchesNeedingCustodian.length - covered.size
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
  const counts: Record<string, number> = Object.fromEntries(
    candidateIds
      .filter((playerId, index) => selectedSet.has(index) || Object.values(fixedAssignmentsByMatchId).includes(playerId))
      .map((playerId) => [playerId, 0]),
  )
  const byMatchId: Record<string, string> = {}

  for (const match of usableMatches) {
    const fixedAssignment = fixedAssignmentsByMatchId[match.id]
    if (fixedAssignment) {
      byMatchId[match.id] = fixedAssignment
      counts[fixedAssignment] = (counts[fixedAssignment] ?? 0) + 1
      continue
    }

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

  Object.entries(additionalBotesByPlayerId).forEach(([playerId, count]) => {
    if (!playerId || !Number.isFinite(count) || count <= 0) return
    counts[playerId] = (counts[playerId] ?? 0) + Math.floor(count)
  })

  const custodianPlayerIds = Array.from(
    new Set([
      ...selected.map((index) => candidateIds[index]),
      ...Object.values(fixedAssignmentsByMatchId).filter(Boolean),
      ...Object.entries(additionalBotesByPlayerId)
        .filter(([playerId, count]) => Boolean(playerId) && Number.isFinite(count) && count > 0)
        .map(([playerId]) => playerId),
    ]),
  ).sort((first, second) => (candidateIndex.get(first) ?? Number.MAX_SAFE_INTEGER) - (candidateIndex.get(second) ?? Number.MAX_SAFE_INTEGER))

  return {
    byMatchId,
    botesByPlayerId: counts,
    custodianPlayerIds,
    unassignedMatchIds: usableMatches
      .filter((match) => !byMatchId[match.id])
      .map((match) => match.id),
    totalBotes: Object.values(counts).reduce((total, count) => total + count, 0),
  }
}
