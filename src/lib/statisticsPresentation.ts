import type { MatchData } from "@/context/MatchDataProvider"
import type { StatisticsMatchData } from "@/lib/seasonStatistics"

export type FriendlyMatchSummary = {
  round: number
  roundLabel: string
  matchup: string
  score: string
  winnerNames: string
  gamesMargin: number
}

function getTeamGames(match: MatchData, team: "A" | "B") {
  return match.sets.reduce(
    (total, set) => total + (team === "A" ? set.a : set.b),
    0,
  )
}

function getTeamSetWins(match: MatchData, team: "A" | "B") {
  return match.sets.filter((set) =>
    team === "A" ? set.a > set.b : set.b > set.a,
  ).length
}

export function getWinningTeam(match: MatchData) {
  const pointsA = match.pointsA ?? getTeamSetWins(match, "A")
  const pointsB = match.pointsB ?? getTeamSetWins(match, "B")

  if (pointsA > pointsB) return "A" as const
  if (pointsB > pointsA) return "B" as const
  return null
}

export function formatPlayerNames(
  playerIds: string[],
  playersById: Map<string, string>,
) {
  return playerIds
    .map((playerId) => playersById.get(playerId) ?? "Jugador")
    .join(" / ")
}

export function formatMatchScore(match: MatchData) {
  return match.sets.map((set) => `${set.a}-${set.b}`).join(", ")
}

export function getMatchGamesMargin(match: MatchData) {
  return Math.abs(getTeamGames(match, "A") - getTeamGames(match, "B"))
}

export function getFriendlyMatchSummary(
  match: MatchData,
  playersById: Map<string, string>,
): FriendlyMatchSummary {
  const winner = getWinningTeam(match)
  const teamAName = formatPlayerNames(match.teamA, playersById)
  const teamBName = formatPlayerNames(match.teamB, playersById)

  const statisticsMatch = match as StatisticsMatchData

  return {
    round: match.round,
    roundLabel: statisticsMatch.statisticsRoundShortLabel ?? `J${match.round}`,
    matchup: `${teamAName} vs ${teamBName}`,
    score: formatMatchScore(match),
    winnerNames:
      winner === "A"
        ? teamAName
        : winner === "B"
          ? teamBName
          : "Sin ganador",
    gamesMargin: getMatchGamesMargin(match),
  }
}


export function formatGamesDifference(gamesMargin: number) {
  if (gamesMargin === 0) return "Empate total en juegos"
  if (gamesMargin === 1) return "1 juego de diferencia"
  return `${gamesMargin} juegos de diferencia`
}

export function formatFriendlyMatchLine(summary: FriendlyMatchSummary) {
  return `${summary.roundLabel} · ${summary.matchup}${
    summary.score ? ` · ${summary.score}` : ""
  }`
}
