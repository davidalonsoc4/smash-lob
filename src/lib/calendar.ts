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

export type ManualCalendarMatchDraft = {
  round: number
  teamA: string[]
  teamB: string[]
}

const newPlayerTokenPrefix = "__new_player__"

function rotatePlayers(players: string[]) {
  return [
    players[0],
    players[players.length - 1],
    ...players.slice(1, players.length - 1),
  ]
}

function buildEmptyMatch({
  id,
  leagueId,
  seasonId,
  round,
  teamA,
  teamB,
}: {
  id: string
  leagueId: string
  seasonId: string
  round: number
  teamA: string[]
  teamB: string[]
}): GeneratedMatch {
  return {
    id,
    leagueId,
    seasonId,
    round,
    status: "scheduling",
    teamA,
    teamB,
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: null,
    dateLabel: null,
    location: null,
    resultRecordedAt: null,
  }
}

export function getNewPlayerToken(index: number) {
  return `${newPlayerTokenPrefix}${index}`
}

export function isNewPlayerToken(value: string) {
  return value.startsWith(newPlayerTokenPrefix)
}

export function getNewPlayerIndexFromToken(value: string) {
  if (!isNewPlayerToken(value)) {
    return null
  }

  const index = Number(value.slice(newPlayerTokenPrefix.length))

  return Number.isInteger(index) && index >= 0 ? index : null
}

export function resolveManualCalendarDraft({
  matches,
  newPlayerIds,
}: {
  matches: ManualCalendarMatchDraft[]
  newPlayerIds: string[]
}): ManualCalendarMatchDraft[] {
  function resolvePlayerId(playerId: string) {
    const newPlayerIndex = getNewPlayerIndexFromToken(playerId)

    if (newPlayerIndex === null) {
      return playerId
    }

    return newPlayerIds[newPlayerIndex] ?? ""
  }

  return matches
    .map((match) => ({
      round: match.round,
      teamA: match.teamA.map(resolvePlayerId).filter(Boolean),
      teamB: match.teamB.map(resolvePlayerId).filter(Boolean),
    }))
    .filter((match) => match.teamA.length === 2 && match.teamB.length === 2)
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
      matches.push(
        buildEmptyMatch({
          id: `${seasonId}-round-${round}-match-${matchIndex + 1}`,
          leagueId,
          seasonId,
          round,
          teamA: teams[matchIndex],
          teamB: teams[teams.length - 1 - matchIndex],
        })
      )
    }

    rotatedPlayers = rotatePlayers(rotatedPlayers)
  }

  return matches
}

export function generateManualCalendar({
  leagueId,
  seasonId,
  matches,
}: {
  leagueId: string
  seasonId: string
  matches: ManualCalendarMatchDraft[]
}): GeneratedMatch[] {
  return matches.map((match, index) =>
    buildEmptyMatch({
      id: `${seasonId}-round-${match.round}-manual-match-${index + 1}`,
      leagueId,
      seasonId,
      round: match.round,
      teamA: match.teamA,
      teamB: match.teamB,
    })
  )
}
