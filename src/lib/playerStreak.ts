type StreakMatch = {
  seasonId?: string | null
  round: number
  status: string
  teamA: readonly string[]
  teamB: readonly string[]
  pointsA?: number | null
  pointsB?: number | null
  sets?: readonly { a: number; b: number }[]
}

function playerWonMatch(match: StreakMatch, playerId: string) {
  const playerSide = match.teamA.includes(playerId)
    ? "A"
    : match.teamB.includes(playerId)
      ? "B"
      : null

  if (!playerSide) return false

  if (
    typeof match.pointsA === "number" &&
    typeof match.pointsB === "number" &&
    match.pointsA !== match.pointsB
  ) {
    return playerSide === "A"
      ? match.pointsA > match.pointsB
      : match.pointsB > match.pointsA
  }

  const setsA = (match.sets ?? []).filter((set) => set.a > set.b).length
  const setsB = (match.sets ?? []).filter((set) => set.b > set.a).length

  return setsA !== setsB && (playerSide === "A" ? setsA > setsB : setsB > setsA)
}

export function getBestWinStreakRoundRange(
  matches: readonly StreakMatch[],
  playerId: string,
) {
  const matchesBySeason = new Map<string, StreakMatch[]>()

  for (const match of matches) {
    if (
      match.status !== "finished" ||
      (!match.teamA.includes(playerId) && !match.teamB.includes(playerId))
    ) {
      continue
    }

    const seasonKey = match.seasonId ?? "__season__"
    matchesBySeason.set(seasonKey, [...(matchesBySeason.get(seasonKey) ?? []), match])
  }

  let bestLength = 0
  let bestStartRound: number | null = null
  let bestEndRound: number | null = null

  for (const seasonMatches of matchesBySeason.values()) {
    let currentLength = 0
    let currentStartRound: number | null = null

    for (const match of [...seasonMatches].sort((a, b) => a.round - b.round)) {
      if (!playerWonMatch(match, playerId)) {
        currentLength = 0
        currentStartRound = null
        continue
      }

      currentStartRound ??= match.round
      currentLength += 1

      if (currentLength > bestLength) {
        bestLength = currentLength
        bestStartRound = currentStartRound
        bestEndRound = match.round
      }
    }
  }

  if (
    bestLength === 0 ||
    bestStartRound === null ||
    bestEndRound === null
  ) {
    return null
  }

  return {
    length: bestLength,
    startRound: bestStartRound,
    endRound: bestEndRound,
  }
}

export function formatBestWinStreakRoundRange(
  matches: readonly StreakMatch[],
  playerId: string,
) {
  const streak = getBestWinStreakRoundRange(matches, playerId)

  return streak
    ? `Jornada ${streak.startRound} – Jornada ${streak.endRound}`
    : null
}
