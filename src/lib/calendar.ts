export type GeneratedMatch = {
  id: string
  leagueId: string
  seasonId: string
  round: number
  status: "scheduling"
  teamA: string[]
  teamB: string[]
  pointsA: null
  pointsB: null
  sets: []
  scheduledAt: null
  dateLabel: null
  location: null
  resultRecordedAt: null
}

function rotatePlayers(players: string[]) {
  return [
    players[0],
    players[players.length - 1],
    ...players.slice(1, players.length - 1),
  ]
}

export function generateBalancedCalendar({
  leagueId,
  seasonId,
  playerIds,
}: {
  leagueId: string
  seasonId: string
  playerIds: string[]
}): GeneratedMatch[] {
  if (playerIds.length < 4 || playerIds.length % 4 !== 0) {
    return []
  }

  const matches: GeneratedMatch[] = []
  let rotatedPlayers = [...playerIds]

  for (let roundIndex = 0; roundIndex < playerIds.length - 1; roundIndex += 1) {
    const round = roundIndex + 1
    const teams = Array.from(
      { length: rotatedPlayers.length / 2 },
      (_, index) => [
        rotatedPlayers[index],
        rotatedPlayers[rotatedPlayers.length - 1 - index],
      ]
    )

    for (let matchIndex = 0; matchIndex < teams.length / 2; matchIndex += 1) {
      matches.push({
        id: `${seasonId}-round-${round}-match-${matchIndex + 1}`,
        leagueId,
        seasonId,
        round,
        status: "scheduling",
        teamA: teams[matchIndex],
        teamB: teams[teams.length - 1 - matchIndex],
        pointsA: null,
        pointsB: null,
        sets: [],
        scheduledAt: null,
        dateLabel: null,
        location: null,
        resultRecordedAt: null,
      })
    }

    rotatedPlayers = rotatePlayers(rotatedPlayers)
  }

  return matches
}
