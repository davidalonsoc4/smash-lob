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

export type SeasonCalendarAudit = {
  mode: SeasonScheduleMode
  playerCount: number
  baseRoundCount: number
  roundCount: number
  matchCount: number
  expectedRoundCount: number
  expectedMatchCount: number
  expectedMatchesPerRound: number
  invalidMatchCount: number
  invalidRoundMatchCount: number
  invalidRoundAppearanceCount: number
  expectedTeammateCount: number
  expectedOpponentCount: number
  invalidTeammatePairCount: number
  invalidOpponentPairCount: number
  firstLegBalanced: boolean
  secondLegBalanced: boolean | null
  repeatedMatchCount: number
  repeatedRoundCount: number
  modeStructureCorrect: boolean
  isPerfectlyBalanced: boolean
}

function getTeamSignature(team: string[]) {
  return [...team].sort().join("+")
}

function getMatchSignature(match: { teamA: string[]; teamB: string[] }) {
  return [getTeamSignature(match.teamA), getTeamSignature(match.teamB)]
    .sort()
    .join(" vs ")
}

function getRoundSignature(
  matches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[],
  round: number
) {
  return matches
    .filter((match) => match.round === round)
    .map(getMatchSignature)
    .sort()
    .join(" || ")
}

function countSharedSignatures(first: string[], second: string[]) {
  const remaining = new Map<string, number>()

  first.forEach((signature) => {
    remaining.set(signature, (remaining.get(signature) ?? 0) + 1)
  })

  return second.reduce((count, signature) => {
    const available = remaining.get(signature) ?? 0

    if (available <= 0) {
      return count
    }

    remaining.set(signature, available - 1)
    return count + 1
  }, 0)
}

function getCalendarPairCounts({
  matches,
}: {
  matches: Pick<GeneratedMatch, "teamA" | "teamB">[]
}) {
  const teammateCounts = new Map<string, number>()
  const opponentCounts = new Map<string, number>()

  matches.forEach((match) => {
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

  return { teammateCounts, opponentCounts }
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

function normalizeLegRounds({
  matches,
  roundOffset,
}: {
  matches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[]
  roundOffset: number
}) {
  return matches.map((match) => ({
    ...match,
    round: match.round - roundOffset,
  }))
}

export function inferSeasonScheduleMode({
  matches,
  playerCount,
  totalRounds,
}: {
  matches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[]
  playerCount: number
  totalRounds: number
}): SeasonScheduleMode | null {
  const baseRoundCount = Math.max(playerCount - 1, 1)

  if (totalRounds === baseRoundCount) {
    return "single"
  }

  if (totalRounds !== baseRoundCount * 2) {
    return null
  }

  const firstLegSignatures = matches
    .filter((match) => match.round <= baseRoundCount)
    .map(getMatchSignature)
  const secondLegSignatures = matches
    .filter((match) => match.round > baseRoundCount)
    .map(getMatchSignature)
  const repeatedMatchCount = countSharedSignatures(
    firstLegSignatures,
    secondLegSignatures
  )

  return repeatedMatchCount === firstLegSignatures.length
    ? "double"
    : "extended"
}

export function auditSeasonCalendar({
  matches,
  playerIds,
  mode,
}: {
  matches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[]
  playerIds: string[]
  mode: SeasonScheduleMode
}): SeasonCalendarAudit {
  const baseRoundCount = Math.max(playerIds.length - 1, 1)
  const roundMultiplier = getSeasonScheduleRoundMultiplier(mode)
  const expectedRoundCount = baseRoundCount * roundMultiplier
  const expectedMatchesPerRound = playerIds.length / 4
  const expectedMatchCount = expectedRoundCount * expectedMatchesPerRound
  const expectedTeammateCount = roundMultiplier
  const expectedOpponentCount = roundMultiplier * 2
  const playerIdSet = new Set(playerIds)
  const appearancesByRoundPlayer = new Map<string, number>()
  let invalidMatchCount = 0

  matches.forEach((match) => {
    const participants = [...match.teamA, ...match.teamB]

    if (
      match.teamA.length !== 2 ||
      match.teamB.length !== 2 ||
      new Set(participants).size !== 4 ||
      participants.some((playerId) => !playerIdSet.has(playerId))
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
  })

  let invalidRoundMatchCount = 0
  let invalidRoundAppearanceCount = 0

  for (let round = 1; round <= expectedRoundCount; round += 1) {
    if (
      matches.filter((match) => match.round === round).length !==
      expectedMatchesPerRound
    ) {
      invalidRoundMatchCount += 1
    }

    playerIds.forEach((playerId) => {
      if ((appearancesByRoundPlayer.get(`${round}|${playerId}`) ?? 0) !== 1) {
        invalidRoundAppearanceCount += 1
      }
    })
  }

  const { teammateCounts, opponentCounts } = getCalendarPairCounts({ matches })
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

      if ((teammateCounts.get(pairKey) ?? 0) !== expectedTeammateCount) {
        invalidTeammatePairCount += 1
      }

      if ((opponentCounts.get(pairKey) ?? 0) !== expectedOpponentCount) {
        invalidOpponentPairCount += 1
      }
    }
  }

  const firstLegMatches = matches.filter(
    (match) => match.round <= baseRoundCount
  )
  const secondLegMatches = matches.filter(
    (match) => match.round > baseRoundCount
  )
  const firstLegAudit = auditBalancedCalendar({
    matches: firstLegMatches,
    playerIds,
  })
  const secondLegAudit =
    mode === "single"
      ? null
      : auditBalancedCalendar({
          matches: normalizeLegRounds({
            matches: secondLegMatches,
            roundOffset: baseRoundCount,
          }),
          playerIds,
        })
  const repeatedMatchCount =
    mode === "single"
      ? 0
      : countSharedSignatures(
          firstLegMatches.map(getMatchSignature),
          secondLegMatches.map(getMatchSignature)
        )
  let repeatedRoundCount = 0

  if (mode !== "single") {
    for (let round = 1; round <= baseRoundCount; round += 1) {
      const firstRoundSignature = getRoundSignature(firstLegMatches, round)
      const secondRoundSignature = getRoundSignature(
        secondLegMatches,
        round + baseRoundCount
      )

      if (
        firstRoundSignature &&
        firstRoundSignature === secondRoundSignature
      ) {
        repeatedRoundCount += 1
      }
    }
  }

  const modeStructureCorrect =
    mode === "single"
      ? true
      : mode === "double"
        ? repeatedMatchCount === firstLegMatches.length &&
          repeatedRoundCount === baseRoundCount
        : repeatedMatchCount === 0 && repeatedRoundCount === 0
  const roundCount = new Set(matches.map((match) => match.round)).size

  return {
    mode,
    playerCount: playerIds.length,
    baseRoundCount,
    roundCount,
    matchCount: matches.length,
    expectedRoundCount,
    expectedMatchCount,
    expectedMatchesPerRound,
    invalidMatchCount,
    invalidRoundMatchCount,
    invalidRoundAppearanceCount,
    expectedTeammateCount,
    expectedOpponentCount,
    invalidTeammatePairCount,
    invalidOpponentPairCount,
    firstLegBalanced: firstLegAudit.isPerfectlyBalanced,
    secondLegBalanced: secondLegAudit?.isPerfectlyBalanced ?? null,
    repeatedMatchCount,
    repeatedRoundCount,
    modeStructureCorrect,
    isPerfectlyBalanced:
      roundCount === expectedRoundCount &&
      matches.length === expectedMatchCount &&
      invalidMatchCount === 0 &&
      invalidRoundMatchCount === 0 &&
      invalidRoundAppearanceCount === 0 &&
      invalidTeammatePairCount === 0 &&
      invalidOpponentPairCount === 0 &&
      firstLegAudit.isPerfectlyBalanced &&
      (secondLegAudit?.isPerfectlyBalanced ?? true) &&
      modeStructureCorrect,
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

function getCalendarPlayerIds(matches: GeneratedMatch[]) {
  return Array.from(
    new Set(matches.flatMap((match) => [...match.teamA, ...match.teamB]))
  )
}

function buildExtendedCandidate({
  baseMatches,
  playerIds,
  rotation,
}: {
  baseMatches: GeneratedMatch[]
  playerIds: string[]
  rotation: number
}) {
  const rotatedPlayerIds = [
    ...playerIds.slice(rotation),
    ...playerIds.slice(0, rotation),
  ]
  const sampleMatch = baseMatches[0]

  if (!sampleMatch) {
    return []
  }

  return generateCyclicWhistCalendar({
    leagueId: sampleMatch.leagueId,
    seasonId: sampleMatch.seasonId,
    playerIds: rotatedPlayerIds,
  })
}

function generateRemixedBalancedSecondLeg({
  baseMatches,
  playerIds,
}: {
  baseMatches: GeneratedMatch[]
  playerIds: string[]
}) {
  const baseRoundCount = getBaseRoundCount(baseMatches)
  let bestCandidate: GeneratedMatch[] | null = null
  let bestRepeatedMatchCount = Number.POSITIVE_INFINITY
  let bestRepeatedRoundCount = Number.POSITIVE_INFINITY

  for (let rotation = 1; rotation < playerIds.length; rotation += 1) {
    const candidate = buildExtendedCandidate({
      baseMatches,
      playerIds,
      rotation,
    })
    const candidateAudit = auditBalancedCalendar({
      matches: candidate,
      playerIds,
    })

    if (!candidateAudit.isPerfectlyBalanced) {
      continue
    }

    const repeatedMatchCount = countSharedSignatures(
      baseMatches.map(getMatchSignature),
      candidate.map(getMatchSignature)
    )
    let repeatedRoundCount = 0

    for (let round = 1; round <= baseRoundCount; round += 1) {
      if (
        getRoundSignature(baseMatches, round) ===
        getRoundSignature(candidate, round)
      ) {
        repeatedRoundCount += 1
      }
    }

    if (
      repeatedMatchCount < bestRepeatedMatchCount ||
      (repeatedMatchCount === bestRepeatedMatchCount &&
        repeatedRoundCount < bestRepeatedRoundCount)
    ) {
      bestCandidate = candidate
      bestRepeatedMatchCount = repeatedMatchCount
      bestRepeatedRoundCount = repeatedRoundCount
    }

    if (repeatedMatchCount === 0 && repeatedRoundCount === 0) {
      break
    }
  }

  if (!bestCandidate) {
    throw new Error(
      "No se ha podido generar una segunda vuelta larga equilibrada."
    )
  }

  return bestCandidate.map((match, matchIndex) =>
    cloneMatchForRound({
      match,
      round: match.round + baseRoundCount,
      matchIndex,
      idSuffix: "extended",
    })
  )
}

function extendCalendarMatches({
  baseMatches,
  mode,
  playerIds,
}: {
  baseMatches: GeneratedMatch[]
  mode: SeasonScheduleMode
  playerIds?: string[]
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

  const remixedMatches = generateRemixedBalancedSecondLeg({
    baseMatches,
    playerIds: playerIds ?? getCalendarPlayerIds(baseMatches),
  })

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

  const fullCalendar = extendCalendarMatches({
    baseMatches,
    mode: scheduleMode,
    playerIds,
  })
  const fullAudit = auditSeasonCalendar({
    matches: fullCalendar,
    playerIds,
    mode: scheduleMode,
  })

  if (!fullAudit.isPerfectlyBalanced) {
    throw new Error(
      `No se ha podido completar un calendario ${scheduleMode} equilibrado para ${playerIds.length} jugadores.`
    )
  }

  return fullCalendar
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
