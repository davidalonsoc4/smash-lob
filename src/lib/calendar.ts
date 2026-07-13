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
  resultReportedByPlayerId: null
  resultLocked: false
}

export type ManualCalendarMatchDraft = {
  round: number
  teamA: string[]
  teamB: string[]
}

export type SeasonScheduleMode = "single" | "double" | "extended"

const newPlayerTokenPrefix = "__new_player__"

type CyclicWhistPlayer = number | "fixed"

type CyclicWhistGame = {
  teamA: [CyclicWhistPlayer, CyclicWhistPlayer]
  teamB: [CyclicWhistPlayer, CyclicWhistPlayer]
}

/**
 * Starter rounds for resolvable Whist tournaments.
 *
 * Translating every numeric position modulo playerCount - 1 produces a full
 * calendar where every pair of players are teammates exactly once and rivals
 * exactly twice. The fixed position is not translated.
 *
 * The app currently supports 8, 12 and 16-player seasons, so keeping the
 * verified starters explicit makes generation deterministic and instant in
 * the browser.
 */
const cyclicWhistStarters: Record<number, CyclicWhistGame[]> = {
  8: [
    { teamA: ["fixed", 0], teamB: [1, 3] },
    { teamA: [2, 6], teamB: [4, 5] },
  ],
  12: [
    { teamA: ["fixed", 0], teamB: [7, 10] },
    { teamA: [1, 2], teamB: [4, 6] },
    { teamA: [3, 8], teamB: [5, 9] },
  ],
  16: [
    { teamA: ["fixed", 0], teamB: [1, 2] },
    { teamA: [3, 6], teamB: [9, 11] },
    { teamA: [4, 13], teamB: [8, 12] },
    { teamA: [5, 10], teamB: [7, 14] },
  ],
}

function getPairKey(firstPlayerId: string, secondPlayerId: string) {
  return [firstPlayerId, secondPlayerId].sort().join("|")
}

function translateWhistPlayer({
  player,
  roundIndex,
  playerIds,
}: {
  player: CyclicWhistPlayer
  roundIndex: number
  playerIds: string[]
}) {
  if (player === "fixed") {
    return playerIds[playerIds.length - 1]
  }

  const rotatingPlayerCount = playerIds.length - 1
  return playerIds[(player + roundIndex) % rotatingPlayerCount]
}

function generateCyclicWhistCalendar({
  leagueId,
  seasonId,
  playerIds,
}: {
  leagueId: string
  seasonId: string
  playerIds: string[]
}) {
  const starter = cyclicWhistStarters[playerIds.length]

  if (!starter) {
    return []
  }

  const baseRoundCount = playerIds.length - 1
  const matches: GeneratedMatch[] = []

  for (let roundIndex = 0; roundIndex < baseRoundCount; roundIndex += 1) {
    starter.forEach((game, matchIndex) => {
      const resolvePlayer = (player: CyclicWhistPlayer) =>
        translateWhistPlayer({ player, roundIndex, playerIds })

      matches.push(
        buildEmptyMatch({
          id: `${seasonId}-round-${roundIndex + 1}-match-${matchIndex + 1}`,
          leagueId,
          seasonId,
          round: roundIndex + 1,
          teamA: game.teamA.map(resolvePlayer),
          teamB: game.teamB.map(resolvePlayer),
        })
      )
    })
  }

  return matches
}

export type CalendarBalanceAudit = {
  playerCount: number
  roundCount: number
  matchCount: number
  expectedRoundCount: number
  expectedMatchCount: number
  invalidMatchCount: number
  invalidRoundAppearanceCount: number
  teammatePairCounts: Record<string, number>
  opponentPairCounts: Record<string, number>
  invalidTeammatePairCount: number
  invalidOpponentPairCount: number
  isPerfectlyBalanced: boolean
}

export function auditBalancedCalendar({
  matches,
  playerIds,
}: {
  matches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[]
  playerIds: string[]
}): CalendarBalanceAudit {
  const expectedRoundCount = Math.max(playerIds.length - 1, 0)
  const expectedMatchCount =
    playerIds.length > 0
      ? (playerIds.length * expectedRoundCount) / 4
      : 0
  const teammateCounts = new Map<string, number>()
  const opponentCounts = new Map<string, number>()
  const appearancesByRoundPlayer = new Map<string, number>()
  let invalidMatchCount = 0

  matches.forEach((match) => {
    const participants = [...match.teamA, ...match.teamB]

    if (
      match.teamA.length !== 2 ||
      match.teamB.length !== 2 ||
      new Set(participants).size !== 4 ||
      participants.some((playerId) => !playerIds.includes(playerId))
    ) {
      invalidMatchCount += 1
    }

    participants.forEach((playerId) => {
      const appearanceKey = `${match.round}|${playerId}`
      appearancesByRoundPlayer.set(
        appearanceKey,
        (appearancesByRoundPlayer.get(appearanceKey) ?? 0) + 1
      )
    })

    ;[match.teamA, match.teamB].forEach((team) => {
      if (team.length !== 2) {
        return
      }

      const pairKey = getPairKey(team[0], team[1])
      teammateCounts.set(pairKey, (teammateCounts.get(pairKey) ?? 0) + 1)
    })

    match.teamA.forEach((teamAPlayerId) => {
      match.teamB.forEach((teamBPlayerId) => {
        const pairKey = getPairKey(teamAPlayerId, teamBPlayerId)
        opponentCounts.set(pairKey, (opponentCounts.get(pairKey) ?? 0) + 1)
      })
    })
  })

  const teammatePairCounts: Record<string, number> = {}
  const opponentPairCounts: Record<string, number> = {}
  let invalidTeammatePairCount = 0
  let invalidOpponentPairCount = 0

  for (let firstIndex = 0; firstIndex < playerIds.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < playerIds.length;
      secondIndex += 1
    ) {
      const pairKey = getPairKey(
        playerIds[firstIndex],
        playerIds[secondIndex]
      )
      const teammateCount = teammateCounts.get(pairKey) ?? 0
      const opponentCount = opponentCounts.get(pairKey) ?? 0

      teammatePairCounts[pairKey] = teammateCount
      opponentPairCounts[pairKey] = opponentCount

      if (teammateCount !== 1) {
        invalidTeammatePairCount += 1
      }

      if (opponentCount !== 2) {
        invalidOpponentPairCount += 1
      }
    }
  }

  let invalidRoundAppearanceCount = 0

  for (let round = 1; round <= expectedRoundCount; round += 1) {
    playerIds.forEach((playerId) => {
      if ((appearancesByRoundPlayer.get(`${round}|${playerId}`) ?? 0) !== 1) {
        invalidRoundAppearanceCount += 1
      }
    })
  }

  const roundCount = new Set(matches.map((match) => match.round)).size

  return {
    playerCount: playerIds.length,
    roundCount,
    matchCount: matches.length,
    expectedRoundCount,
    expectedMatchCount,
    invalidMatchCount,
    invalidRoundAppearanceCount,
    teammatePairCounts,
    opponentPairCounts,
    invalidTeammatePairCount,
    invalidOpponentPairCount,
    isPerfectlyBalanced:
      roundCount === expectedRoundCount &&
      matches.length === expectedMatchCount &&
      invalidMatchCount === 0 &&
      invalidRoundAppearanceCount === 0 &&
      invalidTeammatePairCount === 0 &&
      invalidOpponentPairCount === 0,
  }
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
    resultReportedByPlayerId: null,
    resultLocked: false,
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

function getUniquePlayerCount(matches: { teamA: string[]; teamB: string[] }[]) {
  return new Set(matches.flatMap((match) => [...match.teamA, ...match.teamB])).size
}

function isAlreadyFullManualCalendar({
  matches,
  mode,
}: {
  matches: GeneratedMatch[]
  mode: SeasonScheduleMode
}) {
  if (mode === "single") {
    return true
  }

  const uniquePlayerCount = getUniquePlayerCount(matches)
  const baseRoundCount = Math.max(uniquePlayerCount - 1, 1)

  return getBaseRoundCount(matches) > baseRoundCount
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

  const baseMatches = generateCyclicWhistCalendar({
    leagueId,
    seasonId,
    playerIds,
  })

  if (baseMatches.length === 0) {
    return []
  }

  const audit = auditBalancedCalendar({
    matches: baseMatches,
    playerIds,
  })

  if (!audit.isPerfectlyBalanced) {
    throw new Error(
      `No se ha podido generar un calendario equilibrado para ${playerIds.length} jugadores.`
    )
  }

  return extendCalendarMatches({ baseMatches, mode: scheduleMode })
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

  if (isAlreadyFullManualCalendar({ matches: baseMatches, mode: scheduleMode })) {
    return baseMatches
  }

  return extendCalendarMatches({ baseMatches, mode: scheduleMode })
}
