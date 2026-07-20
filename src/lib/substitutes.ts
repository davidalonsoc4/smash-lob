export type SeasonSubstitute = {
  id: string
  leagueId: string
  seasonId: string
  playerId: string
  active: boolean
}

export type MatchSubstitution = {
  id: string
  leagueId: string
  seasonId: string
  matchId: string
  originalPlayerId: string
  substitutePlayerId: string
  type: "single" | "permanent"
}

export type SeasonReplacement = {
  id: string
  leagueId: string
  seasonId: string
  outgoingPlayerId: string
  incomingPlayerId: string
  fromRound: number
}

export type SubstituteSnapshot = {
  substitutes: SeasonSubstitute[]
  matchSubstitutions: MatchSubstitution[]
  replacements: SeasonReplacement[]
}

export type SubstituteStats = {
  playerId: string
  points: number
  gamesFor: number
  gamesAgainst: number
  gamesDiff: number
  matchesPlayed: number
  wins: number
  losses: number
}

type StatsMatch = {
  id: string
  seasonId: string
  status: string
  teamA: string[]
  teamB: string[]
  pointsA: number | null
  pointsB: number | null
  sets: Array<{ a: number; b: number }>
  resultCounts?: boolean
}

type StatsSubstitution = {
  match_id: string
  substitute_player_id: string
  substitution_type: "single" | "permanent"
}

function getMatchPoints(match: StatsMatch, team: "A" | "B") {
  if (team === "A" && match.pointsA !== null) return match.pointsA
  if (team === "B" && match.pointsB !== null) return match.pointsB

  return match.sets.filter((set) =>
    team === "A" ? set.a > set.b : set.b > set.a,
  ).length
}

export function calculateSubstituteStats({
  seasonId,
  substitutePlayerIds,
  matchSubstitutions,
  matches,
}: {
  seasonId: string
  substitutePlayerIds: string[]
  matchSubstitutions: StatsSubstitution[]
  matches: StatsMatch[]
}) {
  const stats = new Map<string, SubstituteStats>()
  substitutePlayerIds.forEach((playerId) => {
    stats.set(playerId, {
      playerId,
      points: 0,
      gamesFor: 0,
      gamesAgainst: 0,
      gamesDiff: 0,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    })
  })

  const matchesById = new Map(
    matches
      .filter((match) => match.seasonId === seasonId)
      .map((match) => [match.id, match]),
  )

  matchSubstitutions
    .filter((substitution) => substitution.substitution_type === "single")
    .forEach((substitution) => {
      const item = stats.get(substitution.substitute_player_id)
      const match = matchesById.get(substitution.match_id)

      if (
        !item ||
        !match ||
        match.status !== "finished" ||
        match.resultCounts === false
      ) {
        return
      }

      const isTeamA = match.teamA.includes(substitution.substitute_player_id)
      const isTeamB = match.teamB.includes(substitution.substitute_player_id)

      if (!isTeamA && !isTeamB) {
        return
      }

      const pointsA = getMatchPoints(match, "A")
      const pointsB = getMatchPoints(match, "B")
      const gamesA = match.sets.reduce((sum, set) => sum + set.a, 0)
      const gamesB = match.sets.reduce((sum, set) => sum + set.b, 0)
      const points = isTeamA ? pointsA : pointsB
      const gamesFor = isTeamA ? gamesA : gamesB
      const gamesAgainst = isTeamA ? gamesB : gamesA
      const won = isTeamA ? pointsA > pointsB : pointsB > pointsA

      item.points += points
      item.gamesFor += gamesFor
      item.gamesAgainst += gamesAgainst
      item.gamesDiff = item.gamesFor - item.gamesAgainst
      item.matchesPlayed += 1
      if (won) item.wins += 1
      else item.losses += 1
    })

  return Array.from(stats.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
    return b.gamesFor - a.gamesFor
  })
}
