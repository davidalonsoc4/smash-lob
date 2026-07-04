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

export type SeasonScheduleMode = "single" | "double" | "extended"

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


function getBaseRoundCount(matches: { round: number }[]) {
  return Math.max(...matches.map((match) => match.round), 0)
}

function cloneMatchForRound({
  match,
  round,
  matchIndex,
  idSuffix,
}: {
  match: GeneratedMatch
  round: number
  matchIndex: number
  idSuffix: string
}): GeneratedMatch {
  return buildEmptyMatch({
    id: `${match.seasonId}-round-${round}-${idSuffix}-match-${matchIndex + 1}`,
    leagueId: match.leagueId,
    seasonId: match.seasonId,
    round,
    teamA: match.teamA,
    teamB: match.teamB,
  })
}

function rotateTeamsForExtendedRound({
  teams,
  roundIndex,
}: {
  teams: string[][]
  roundIndex: number
}) {
  if (teams.length <= 2) {
    return teams
  }

  const shift = (roundIndex % (teams.length - 1)) + 1

  return [...teams.slice(shift), ...teams.slice(0, shift)]
}

function extendCalendarMatches({
  baseMatches,
  mode,
}: {
  baseMatches: GeneratedMatch[]
  mode: SeasonScheduleMode
}): GeneratedMatch[] {
  if (mode === "single") {
    return baseMatches
  }

  const baseRoundCount = getBaseRoundCount(baseMatches)

  if (baseRoundCount <= 0) {
    return baseMatches
  }

  if (mode === "double") {
    const secondLegMatches = baseMatches.map((match, index) =>
      cloneMatchForRound({
        match,
        round: match.round + baseRoundCount,
        matchIndex: index,
        idSuffix: "double",
      })
    )

    return [...baseMatches, ...secondLegMatches]
  }

  const remixedMatches: GeneratedMatch[] = []

  for (let round = 1; round <= baseRoundCount; round += 1) {
    const roundMatches = baseMatches.filter((match) => match.round === round)
    const teams = roundMatches.flatMap((match) => [match.teamA, match.teamB])
    const rotatedTeams = rotateTeamsForExtendedRound({
      teams,
      roundIndex: round - 1,
    })

    for (let index = 0; index < rotatedTeams.length; index += 2) {
      const teamA = rotatedTeams[index]
      const teamB = rotatedTeams[index + 1]

      if (!teamA || !teamB) {
        continue
      }

      remixedMatches.push(
        buildEmptyMatch({
          id: `${roundMatches[0]?.seasonId ?? "season"}-round-${round + baseRoundCount}-extended-match-${index / 2 + 1}`,
          leagueId: roundMatches[0]?.leagueId ?? "league",
          seasonId: roundMatches[0]?.seasonId ?? "season",
          round: round + baseRoundCount,
          teamA,
          teamB,
        })
      )
    }
  }

  return [...baseMatches, ...remixedMatches]
}

export function getSeasonScheduleRoundMultiplier(mode: SeasonScheduleMode) {
  return mode === "single" ? 1 : 2
}

export function getSeasonScheduleRoundCount({
  playerCount,
  mode,
}: {
  playerCount: number
  mode: SeasonScheduleMode
}) {
  return Math.max(playerCount - 1, 1) * getSeasonScheduleRoundMultiplier(mode)
}

export function generateBalancedCalendar({
  leagueId,
  seasonId,
  playerIds,
  scheduleMode = "single",
}: {
  leagueId: string
  seasonId: string
  playerIds: string[]
  scheduleMode?: SeasonScheduleMode
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

  return extendCalendarMatches({ baseMatches: matches, mode: scheduleMode })
}

export function generateManualCalendar({
  leagueId,
  seasonId,
  matches,
  scheduleMode = "single",
}: {
  leagueId: string
  seasonId: string
  matches: ManualCalendarMatchDraft[]
  scheduleMode?: SeasonScheduleMode
}): GeneratedMatch[] {
  const baseMatches = matches.map((match, index) =>
    buildEmptyMatch({
      id: `${seasonId}-round-${match.round}-manual-match-${index + 1}`,
      leagueId,
      seasonId,
      round: match.round,
      teamA: match.teamA,
      teamB: match.teamB,
    })
  )

  return extendCalendarMatches({ baseMatches, mode: scheduleMode })
}
