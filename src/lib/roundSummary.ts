import type { MatchData } from "@/context/MatchDataProvider"
import type { RankingPlayer } from "@/lib/ranking"

export type RoundSummaryHighlightComparison = {
  leftLabel: string
  leftValue: string
  centerValue: string
  rightLabel: string
  rightValue: string
}

export type RoundSummaryHighlight = {
  id: string
  eyebrow: string
  title: string
  comparison: RoundSummaryHighlightComparison
  matchId?: string
}

export type RoundRankingMovement = {
  playerId: string
  from: number | null
  to: number
  delta: number
}

function getSetPoints(match: MatchData, team: "A" | "B") {
  const explicit = team === "A" ? match.pointsA : match.pointsB
  if (explicit !== null) return explicit

  return match.sets.filter((set) =>
    team === "A" ? set.a > set.b : set.b > set.a,
  ).length
}

function getTeamGames(match: MatchData, team: "A" | "B") {
  return match.sets.reduce(
    (total, set) => total + (team === "A" ? set.a : set.b),
    0,
  )
}

function formatWinCount(value: number) {
  return `${value} ${value === 1 ? "victoria" : "victorias"}`
}

function isDecidingThirdSetTieBreak(match: MatchData) {
  const decidingSet = match.sets[2]
  if (!decidingSet) return false

  return (
    (decidingSet.a === 7 && decidingSet.b === 6) ||
    (decidingSet.a === 6 && decidingSet.b === 7)
  )
}

function getWinningTeam(match: MatchData) {
  const pointsA = getSetPoints(match, "A")
  const pointsB = getSetPoints(match, "B")

  if (pointsA > pointsB) return "A" as const
  if (pointsB > pointsA) return "B" as const
  return null
}

export function formatRoundMatchScore(match: MatchData) {
  if (match.sets.length === 0) return "Sin marcador"
  return match.sets.map((set) => `${set.a}-${set.b}`).join(" · ")
}

export function getRoundRankingMovements({
  previousRanking,
  currentRanking,
}: {
  previousRanking: RankingPlayer[]
  currentRanking: RankingPlayer[]
}) {
  const previousPositions = new Map(
    previousRanking.map((player, index) => [player.id, index + 1]),
  )

  return currentRanking.map<RoundRankingMovement>((player, index) => {
    const to = index + 1
    const from = previousPositions.get(player.id) ?? null
    return {
      playerId: player.id,
      from,
      to,
      delta: from === null ? 0 : from - to,
    }
  })
}

function getCurrentWinStreak({
  playerId,
  matches,
  round,
}: {
  playerId: string
  matches: MatchData[]
  round: number
}) {
  const playerMatches = matches
    .filter(
      (match) =>
        match.round <= round &&
        match.status === "finished" &&
        match.resultCounts !== false &&
        [...match.teamA, ...match.teamB].includes(playerId) &&
        match.sets.length > 0,
    )
    .sort((first, second) => second.round - first.round)

  let streak = 0
  for (const match of playerMatches) {
    const winner = getWinningTeam(match)
    const playerWon =
      (winner === "A" && match.teamA.includes(playerId)) ||
      (winner === "B" && match.teamB.includes(playerId))

    if (!playerWon) break
    streak += 1
  }

  return streak
}

export function buildRoundSummaryHighlights({
  round,
  matches,
  roundMatches,
  previousRanking,
  currentRanking,
}: {
  round: number
  matches: MatchData[]
  roundMatches: MatchData[]
  previousRanking: RankingPlayer[]
  currentRanking: RankingPlayer[]
}) {
  const highlights: RoundSummaryHighlight[] = []
  const previousHasResults = previousRanking.some((player) => player.matchesPlayed > 0)
  const previousLeader = previousHasResults ? previousRanking[0] : null
  const currentLeader = currentRanking[0] ?? null

  if (previousLeader && currentLeader && previousLeader.id !== currentLeader.id) {
    const previousLeaderPosition = previousRanking.findIndex(
      (player) => player.id === currentLeader.id,
    )

    highlights.push({
      id: "new-leader",
      eyebrow: "Nuevo líder",
      title: currentLeader.displayName,
      comparison: {
        leftLabel: "Antes",
        leftValue: previousLeaderPosition >= 0 ? `${previousLeaderPosition + 1}º` : "—",
        centerValue: "→",
        rightLabel: "Ahora",
        rightValue: "1º",
      },
    })
  }

  if (round > 1 && previousHasResults) {
    const movement = getRoundRankingMovements({ previousRanking, currentRanking })
      .filter((item) => item.delta > 0)
      .sort((first, second) => second.delta - first.delta)[0]
    const climber = movement
      ? currentRanking.find((player) => player.id === movement.playerId) ?? null
      : null

    if (movement && climber) {
      highlights.push({
        id: "biggest-climb",
        eyebrow: "Mayor subida",
        title: `${climber.displayName} · +${movement.delta} ${movement.delta === 1 ? "posición" : "posiciones"}`,
        comparison: {
          leftLabel: "Antes",
          leftValue: movement.from === null ? "—" : `${movement.from}º`,
          centerValue: "→",
          rightLabel: "Ahora",
          rightValue: `${movement.to}º`,
        },
      })
    }
  }

  const decidingTieBreakMatches = roundMatches.filter(
    (match) =>
      match.status === "finished" &&
      match.resultCounts !== false &&
      isDecidingThirdSetTieBreak(match),
  )

  for (const tieBreakMatch of decidingTieBreakMatches) {
    const decidingSet = tieBreakMatch.sets[2]
    highlights.push({
      id: `deciding-tiebreak-${tieBreakMatch.id}`,
      eyebrow: "Decidido en tie-break",
      title: "El tercer set se decidió en el desempate",
      comparison: {
        leftLabel: "3.er set",
        leftValue: String(decidingSet.a),
        centerValue: "Tie-break",
        rightLabel: "3.er set",
        rightValue: String(decidingSet.b),
      },
      matchId: tieBreakMatch.id,
    })
  }

  const decidingTieBreakIds = new Set(decidingTieBreakMatches.map((match) => match.id))
  const closestMatch = roundMatches
    .filter(
      (match) =>
        match.status === "finished" &&
        match.resultCounts !== false &&
        match.sets.length > 0 &&
        !decidingTieBreakIds.has(match.id),
    )
    .map((match) => {
      const gamesA = getTeamGames(match, "A")
      const gamesB = getTeamGames(match, "B")
      return {
        match,
        gamesA,
        gamesB,
        gameGap: Math.abs(gamesA - gamesB),
        totalGames: gamesA + gamesB,
      }
    })
    .sort((first, second) => {
      if (first.gameGap !== second.gameGap) return first.gameGap - second.gameGap
      return second.totalGames - first.totalGames
    })[0] ?? null

  if (closestMatch) {
    const gapCopy =
      closestMatch.gameGap === 0
        ? "Las parejas terminaron igualadas a juegos"
        : closestMatch.gameGap === 1
          ? "Solo 1 juego separó a las parejas"
          : `Solo ${closestMatch.gameGap} juegos separaron a las parejas`

    highlights.push({
      id: "closest-match",
      eyebrow: "Partido más igualado",
      title: gapCopy,
      comparison: {
        leftLabel: "Juegos",
        leftValue: String(closestMatch.gamesA),
        centerValue: `Dif. ${closestMatch.gameGap}`,
        rightLabel: "Juegos",
        rightValue: String(closestMatch.gamesB),
      },
      matchId: closestMatch.match.id,
    })
  }

  if (highlights.length < 4) {
    const bestStreak = currentRanking
      .map((player) => ({
        player,
        streak: getCurrentWinStreak({ playerId: player.id, matches, round }),
      }))
      .filter((item) => item.streak >= 2)
      .sort((first, second) => second.streak - first.streak)[0]

    if (bestStreak) {
      highlights.push({
        id: "win-streak",
        eyebrow: "En racha",
        title: bestStreak.player.displayName,
        comparison: {
          leftLabel: "Racha actual",
          leftValue: formatWinCount(bestStreak.streak),
          centerValue: "",
          rightLabel: "",
          rightValue: "",
        },
      })
    }
  }

  return highlights.slice(0, Math.max(4, decidingTieBreakMatches.length + 2))
}

export function getRoundSummaryMetrics(roundMatches: MatchData[]) {
  const finishedMatches = roundMatches.filter((match) => match.status === "finished")
  const countedMatches = finishedMatches.filter((match) => match.resultCounts !== false)

  return {
    totalMatches: roundMatches.length,
    finishedMatches: finishedMatches.length,
    countedMatches: countedMatches.length,
    totalSets: countedMatches.reduce((total, match) => total + match.sets.length, 0),
    totalGames: countedMatches.reduce(
      (total, match) =>
        total +
        match.sets.reduce((matchTotal, set) => matchTotal + set.a + set.b, 0),
      0,
    ),
  }
}
