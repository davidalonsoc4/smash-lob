export type MatchOutcome = "victory" | "defeat"

type MatchPresentationInput = {
  status: string
  teamA: string[]
  teamB: string[]
  pointsA: number | null
  pointsB: number | null
  sets: Array<{ a: number; b: number }>
}

export function getMatchTeamScores(match: MatchPresentationInput) {
  const teamASetWins = match.sets.filter((set) => set.a > set.b).length
  const teamBSetWins = match.sets.filter((set) => set.b > set.a).length

  return {
    teamA: match.pointsA ?? teamASetWins,
    teamB: match.pointsB ?? teamBSetWins,
  }
}

export function getCurrentUserMatchOutcome(
  match: MatchPresentationInput,
  currentUserId?: string | null,
): MatchOutcome | null {
  if (match.status !== "finished" || !currentUserId) {
    return null
  }

  const currentUserTeam = match.teamA.includes(currentUserId)
    ? "A"
    : match.teamB.includes(currentUserId)
      ? "B"
      : null

  if (!currentUserTeam) {
    return null
  }

  const scores = getMatchTeamScores(match)
  if (scores.teamA === scores.teamB) {
    return null
  }

  const winningTeam = scores.teamA > scores.teamB ? "A" : "B"
  return currentUserTeam === winningTeam ? "victory" : "defeat"
}
