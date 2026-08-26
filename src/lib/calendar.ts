import { generateFlexibleCalendarRounds } from "@/lib/flexibleCalendar"
import {
  getSeasonBaseRoundCount,
  getSeasonByeCountPerRound,
  getSeasonMatchesPerRound,
  isSeasonPlayerCountInRange,
  seasonRequiresByes,
} from "@/lib/seasonPlayerCount"

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
 * Keeping the verified starters explicit makes generation deterministic and
 * instant in the browser. v1.12.0 supports perfectly balanced seasons from
 * 8 to 24 players in multiples of four.
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
  20: [
    { teamA: ["fixed", 0], teamB: [14, 15] },
    { teamA: [16, 18], teamB: [1, 10] },
    { teamA: [4, 7], teamB: [6, 13] },
    { teamA: [5, 9], teamB: [12, 17] },
    { teamA: [2, 8], teamB: [3, 11] },
  ],
  24: [
    { teamA: [17, 18], teamB: [3, 13] },
    { teamA: [20, 22], teamB: [6, 9] },
    { teamA: [15, 19], teamB: [8, 16] },
    { teamA: [5, 10], teamB: [2, 11] },
    { teamA: ["fixed", 0], teamB: [21, 4] },
    { teamA: [7, 14], teamB: [1, 12] },
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

function generateFlexibleByeCalendar({
  leagueId,
  seasonId,
  playerIds,
}: {
  leagueId: string
  seasonId: string
  playerIds: string[]
}) {
  const rounds = generateFlexibleCalendarRounds(playerIds.length)

  return rounds.flatMap((round) =>
    round.games.map((game, matchIndex) =>
      buildEmptyMatch({
        id: `${seasonId}-round-${round.round}-match-${matchIndex + 1}`,
        leagueId,
        seasonId,
        round: round.round,
        teamA: game.teamA.map((index) => playerIds[index]),
        teamB: game.teamB.map((index) => playerIds[index]),
      }),
    ),
  )
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
  hasByes: boolean
  expectedByesPerRound: number
  expectedByesPerPlayer: number
  invalidByeRoundCount: number
  invalidByePlayerCount: number
  consecutiveByeCount: number
  repeatedTeammatePairCount: number
  maxTeammatePairCount: number
  maxOpponentPairCount: number
  repeatedQuartetCount: number
  completeLegCount: number
  partialRoundCount: number
  playerMatchCountMin: number
  playerMatchCountMax: number
  byeCountMin: number
  byeCountMax: number
  durationBalance: boolean
  isBalanced: boolean
  isPerfectlyBalanced: boolean
}

export type SeasonCalendarAuditCheckKey =
  | "matchStructure"
  | "roundStructure"
  | "roundMatchCount"
  | "roundAppearanceCount"
  | "byeRoundCount"
  | "byePlayerCount"
  | "consecutiveByes"
  | "quartets"
  | "partners"
  | "opponents"
  | "firstLeg"
  | "secondLeg"
  | "modeStructure"
  | "durationBalance"

export type SeasonCalendarAuditCheck = {
  key: SeasonCalendarAuditCheckKey
  ok: boolean
}

export function getSeasonCalendarAuditChecks(
  audit: SeasonCalendarAudit,
): SeasonCalendarAuditCheck[] {
  const checks: SeasonCalendarAuditCheck[] = [
    { key: "matchStructure", ok: audit.invalidMatchCount === 0 },
  ]

  if (audit.hasByes) {
    checks.push(
      { key: "roundMatchCount", ok: audit.invalidRoundMatchCount === 0 },
      { key: "roundAppearanceCount", ok: audit.invalidRoundAppearanceCount === 0 },
      { key: "byeRoundCount", ok: audit.invalidByeRoundCount === 0 },
      { key: "byePlayerCount", ok: audit.invalidByePlayerCount === 0 },
      { key: "consecutiveByes", ok: audit.consecutiveByeCount === 0 },
      { key: "quartets", ok: audit.repeatedQuartetCount === 0 },
    )
  } else {
    checks.push({
      key: "roundStructure",
      ok:
        audit.invalidRoundMatchCount === 0 &&
        audit.invalidRoundAppearanceCount === 0,
    })
  }

  checks.push(
    { key: "partners", ok: audit.invalidTeammatePairCount === 0 },
    { key: "opponents", ok: audit.invalidOpponentPairCount === 0 },
  )

  if (audit.mode === "extended") {
    checks.push(
      { key: "durationBalance", ok: audit.durationBalance },
      { key: "modeStructure", ok: audit.modeStructureCorrect },
    )
  } else {
    checks.push({ key: "firstLeg", ok: audit.firstLegBalanced })
    if (audit.mode === "double") {
      checks.push(
        { key: "secondLeg", ok: audit.secondLegBalanced === true },
        { key: "modeStructure", ok: audit.modeStructureCorrect },
      )
    }
  }

  return checks
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
  const baseRoundCount = getSeasonBaseRoundCount(playerCount)

  if (totalRounds === baseRoundCount) {
    return "single"
  }

  if (!isValidSeasonTargetRoundCount({ playerCount, targetRoundCount: totalRounds })) {
    return null
  }

  if (totalRounds !== baseRoundCount * 2) {
    return "extended"
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

type FlexibleCalendarLegAudit = {
  roundCount: number
  matchCount: number
  expectedRoundCount: number
  expectedMatchCount: number
  expectedMatchesPerRound: number
  invalidMatchCount: number
  invalidRoundMatchCount: number
  invalidRoundAppearanceCount: number
  expectedByesPerRound: number
  expectedByesPerPlayer: number
  invalidByeRoundCount: number
  invalidByePlayerCount: number
  consecutiveByeCount: number
  repeatedTeammatePairCount: number
  maxTeammatePairCount: number
  maxOpponentPairCount: number
  invalidOpponentPairCount: number
  repeatedQuartetCount: number
  isBalanced: boolean
}

function getFlexibleCalendarMaxOpponentPairCount(playerCount: number) {
  return playerCount === 9 ? 3 : 2
}

function auditFlexibleCalendarLeg({
  matches,
  playerIds,
}: {
  matches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[]
  playerIds: string[]
}): FlexibleCalendarLegAudit {
  const expectedRoundCount = getSeasonBaseRoundCount(playerIds.length)
  const expectedMatchesPerRound = getSeasonMatchesPerRound(playerIds.length)
  const expectedMatchCount = expectedRoundCount * expectedMatchesPerRound
  const expectedByesPerRound = getSeasonByeCountPerRound(playerIds.length)
  const expectedByesPerPlayer = expectedByesPerRound
  const maxAllowedOpponentPairCount = getFlexibleCalendarMaxOpponentPairCount(playerIds.length)
  const playerIdSet = new Set(playerIds)
  const appearancesByRoundPlayer = new Map<string, number>()
  const byeCountByPlayer = new Map(playerIds.map((playerId) => [playerId, 0]))
  const quartetCounts = new Map<string, number>()
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
      const key = `${match.round}|${playerId}`
      appearancesByRoundPlayer.set(key, (appearancesByRoundPlayer.get(key) ?? 0) + 1)
    })

    const quartetKey = [...participants].sort().join("+")
    quartetCounts.set(quartetKey, (quartetCounts.get(quartetKey) ?? 0) + 1)
  })

  let invalidRoundMatchCount = 0
  let invalidRoundAppearanceCount = 0
  let invalidByeRoundCount = 0
  let consecutiveByeCount = 0
  const previousRoundWasBye = new Map(playerIds.map((playerId) => [playerId, false]))

  for (let round = 1; round <= expectedRoundCount; round += 1) {
    if (matches.filter((match) => match.round === round).length !== expectedMatchesPerRound) {
      invalidRoundMatchCount += 1
    }

    let roundByeCount = 0
    playerIds.forEach((playerId) => {
      const appearances = appearancesByRoundPlayer.get(`${round}|${playerId}`) ?? 0
      if (appearances > 1) {
        invalidRoundAppearanceCount += 1
      }

      const isBye = appearances === 0
      if (isBye) {
        roundByeCount += 1
        byeCountByPlayer.set(playerId, (byeCountByPlayer.get(playerId) ?? 0) + 1)
        if (previousRoundWasBye.get(playerId)) {
          consecutiveByeCount += 1
        }
      }
      previousRoundWasBye.set(playerId, isBye)
    })

    if (roundByeCount !== expectedByesPerRound) {
      invalidByeRoundCount += 1
    }
  }

  const invalidByePlayerCount = playerIds.filter(
    (playerId) => (byeCountByPlayer.get(playerId) ?? 0) !== expectedByesPerPlayer,
  ).length
  const { teammateCounts, opponentCounts } = getCalendarPairCounts({ matches })
  let repeatedTeammatePairCount = 0
  let maxTeammatePairCount = 0
  let maxOpponentPairCount = 0
  let invalidOpponentPairCount = 0

  for (let firstIndex = 0; firstIndex < playerIds.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < playerIds.length; secondIndex += 1) {
      const pairKey = getPairKey(playerIds[firstIndex], playerIds[secondIndex])
      const teammateCount = teammateCounts.get(pairKey) ?? 0
      const opponentCount = opponentCounts.get(pairKey) ?? 0
      maxTeammatePairCount = Math.max(maxTeammatePairCount, teammateCount)
      maxOpponentPairCount = Math.max(maxOpponentPairCount, opponentCount)
      if (teammateCount > 1) repeatedTeammatePairCount += 1
      if (opponentCount > maxAllowedOpponentPairCount) invalidOpponentPairCount += 1
    }
  }

  const repeatedQuartetCount = Array.from(quartetCounts.values()).filter((count) => count > 1).length
  const roundCount = new Set(matches.map((match) => match.round)).size
  const isBalanced =
    roundCount === expectedRoundCount &&
    matches.length === expectedMatchCount &&
    invalidMatchCount === 0 &&
    invalidRoundMatchCount === 0 &&
    invalidRoundAppearanceCount === 0 &&
    invalidByeRoundCount === 0 &&
    invalidByePlayerCount === 0 &&
    consecutiveByeCount === 0 &&
    repeatedTeammatePairCount === 0 &&
    invalidOpponentPairCount === 0 &&
    repeatedQuartetCount === 0

  return {
    roundCount,
    matchCount: matches.length,
    expectedRoundCount,
    expectedMatchCount,
    expectedMatchesPerRound,
    invalidMatchCount,
    invalidRoundMatchCount,
    invalidRoundAppearanceCount,
    expectedByesPerRound,
    expectedByesPerPlayer,
    invalidByeRoundCount,
    invalidByePlayerCount,
    consecutiveByeCount,
    repeatedTeammatePairCount,
    maxTeammatePairCount,
    maxOpponentPairCount,
    invalidOpponentPairCount,
    repeatedQuartetCount,
    isBalanced,
  }
}

function auditFlexibleSeasonCalendar({
  matches,
  playerIds,
  mode,
}: {
  matches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[]
  playerIds: string[]
  mode: SeasonScheduleMode
}): SeasonCalendarAudit {
  const baseRoundCount = getSeasonBaseRoundCount(playerIds.length)
  const roundMultiplier = getSeasonScheduleRoundMultiplier(mode)
  const expectedRoundCount = baseRoundCount * roundMultiplier
  const expectedMatchesPerRound = getSeasonMatchesPerRound(playerIds.length)
  const expectedMatchCount = expectedRoundCount * expectedMatchesPerRound
  const firstLegMatches = matches.filter((match) => match.round <= baseRoundCount)
  const secondLegMatches = matches.filter((match) => match.round > baseRoundCount)
  const firstLegAudit = auditFlexibleCalendarLeg({ matches: firstLegMatches, playerIds })
  const secondLegAudit =
    mode === "single"
      ? null
      : auditFlexibleCalendarLeg({
          matches: normalizeLegRounds({ matches: secondLegMatches, roundOffset: baseRoundCount }),
          playerIds,
        })
  const repeatedMatchCount =
    mode === "single"
      ? 0
      : countSharedSignatures(
          firstLegMatches.map(getMatchSignature),
          secondLegMatches.map(getMatchSignature),
        )
  let repeatedRoundCount = 0

  if (mode !== "single") {
    for (let round = 1; round <= baseRoundCount; round += 1) {
      if (
        getRoundSignature(firstLegMatches, round) ===
        getRoundSignature(secondLegMatches, round + baseRoundCount)
      ) {
        repeatedRoundCount += 1
      }
    }
  }

  const modeStructureCorrect =
    mode === "single"
      ? true
      : mode === "double"
        ? repeatedMatchCount === firstLegMatches.length && repeatedRoundCount === baseRoundCount
        : repeatedMatchCount === 0 && repeatedRoundCount === 0

  const normalizedFullMatches = matches.map((match) => ({ ...match }))
  const appearancesByRoundPlayer = new Map<string, number>()
  normalizedFullMatches.forEach((match) =>
    [...match.teamA, ...match.teamB].forEach((playerId) => {
      const key = `${match.round}|${playerId}`
      appearancesByRoundPlayer.set(key, (appearancesByRoundPlayer.get(key) ?? 0) + 1)
    }),
  )
  const expectedByesPerRound = getSeasonByeCountPerRound(playerIds.length)
  const expectedByesPerPlayer = expectedByesPerRound * roundMultiplier
  const byeCountByPlayer = new Map(playerIds.map((playerId) => [playerId, 0]))
  const previousRoundWasBye = new Map(playerIds.map((playerId) => [playerId, false]))
  let invalidByeRoundCount = 0
  let consecutiveByeCount = 0

  for (let round = 1; round <= expectedRoundCount; round += 1) {
    let byeCount = 0
    playerIds.forEach((playerId) => {
      const isBye = (appearancesByRoundPlayer.get(`${round}|${playerId}`) ?? 0) === 0
      if (isBye) {
        byeCount += 1
        byeCountByPlayer.set(playerId, (byeCountByPlayer.get(playerId) ?? 0) + 1)
        if (previousRoundWasBye.get(playerId)) consecutiveByeCount += 1
      }
      previousRoundWasBye.set(playerId, isBye)
    })
    if (byeCount !== expectedByesPerRound) invalidByeRoundCount += 1
  }

  const invalidByePlayerCount = playerIds.filter(
    (playerId) => (byeCountByPlayer.get(playerId) ?? 0) !== expectedByesPerPlayer,
  ).length
  const roundCount = new Set(matches.map((match) => match.round)).size
  const isBalanced =
    roundCount === expectedRoundCount &&
    matches.length === expectedMatchCount &&
    firstLegAudit.isBalanced &&
    (secondLegAudit?.isBalanced ?? true) &&
    invalidByeRoundCount === 0 &&
    invalidByePlayerCount === 0 &&
    consecutiveByeCount === 0 &&
    modeStructureCorrect

  return {
    mode,
    playerCount: playerIds.length,
    baseRoundCount,
    roundCount,
    matchCount: matches.length,
    expectedRoundCount,
    expectedMatchCount,
    expectedMatchesPerRound,
    invalidMatchCount: firstLegAudit.invalidMatchCount + (secondLegAudit?.invalidMatchCount ?? 0),
    invalidRoundMatchCount:
      firstLegAudit.invalidRoundMatchCount + (secondLegAudit?.invalidRoundMatchCount ?? 0),
    invalidRoundAppearanceCount:
      firstLegAudit.invalidRoundAppearanceCount +
      (secondLegAudit?.invalidRoundAppearanceCount ?? 0),
    expectedTeammateCount: 1,
    expectedOpponentCount: getFlexibleCalendarMaxOpponentPairCount(playerIds.length),
    invalidTeammatePairCount:
      firstLegAudit.repeatedTeammatePairCount +
      (secondLegAudit?.repeatedTeammatePairCount ?? 0),
    invalidOpponentPairCount:
      firstLegAudit.invalidOpponentPairCount +
      (secondLegAudit?.invalidOpponentPairCount ?? 0),
    firstLegBalanced: firstLegAudit.isBalanced,
    secondLegBalanced: secondLegAudit?.isBalanced ?? null,
    repeatedMatchCount,
    repeatedRoundCount,
    modeStructureCorrect,
    hasByes: true,
    expectedByesPerRound,
    expectedByesPerPlayer,
    invalidByeRoundCount,
    invalidByePlayerCount,
    consecutiveByeCount,
    repeatedTeammatePairCount:
      firstLegAudit.repeatedTeammatePairCount +
      (secondLegAudit?.repeatedTeammatePairCount ?? 0),
    maxTeammatePairCount: Math.max(
      firstLegAudit.maxTeammatePairCount,
      secondLegAudit?.maxTeammatePairCount ?? 0,
    ),
    maxOpponentPairCount: Math.max(
      firstLegAudit.maxOpponentPairCount,
      secondLegAudit?.maxOpponentPairCount ?? 0,
    ),
    repeatedQuartetCount:
      firstLegAudit.repeatedQuartetCount + (secondLegAudit?.repeatedQuartetCount ?? 0),
    completeLegCount: roundMultiplier,
    partialRoundCount: 0,
    playerMatchCountMin: expectedRoundCount - expectedByesPerPlayer,
    playerMatchCountMax: expectedRoundCount - expectedByesPerPlayer,
    byeCountMin: expectedByesPerPlayer,
    byeCountMax: expectedByesPerPlayer,
    durationBalance: isBalanced,
    isBalanced,
    isPerfectlyBalanced: false,
  }
}


function countDuplicateMatchSignatures(
  matches: Pick<GeneratedMatch, "teamA" | "teamB">[],
) {
  const counts = new Map<string, number>()
  matches.forEach((match) => {
    const signature = getMatchSignature(match)
    counts.set(signature, (counts.get(signature) ?? 0) + 1)
  })
  return Array.from(counts.values()).reduce(
    (total, count) => total + Math.max(count - 1, 0),
    0,
  )
}

function countDuplicateRoundSignatures(
  matches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[],
  expectedRoundCount: number,
) {
  const counts = new Map<string, number>()
  for (let round = 1; round <= expectedRoundCount; round += 1) {
    const signature = getRoundSignature(matches, round)
    if (!signature) continue
    counts.set(signature, (counts.get(signature) ?? 0) + 1)
  }
  return Array.from(counts.values()).reduce(
    (total, count) => total + Math.max(count - 1, 0),
    0,
  )
}

function auditVariableExtendedSeasonCalendar({
  matches,
  playerIds,
  expectedRoundCount,
}: {
  matches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[]
  playerIds: string[]
  expectedRoundCount: number
}): SeasonCalendarAudit {
  const playerCount = playerIds.length
  const baseRoundCount = getSeasonBaseRoundCount(playerCount)
  const expectedMatchesPerRound = getSeasonMatchesPerRound(playerCount)
  const expectedMatchCount = expectedRoundCount * expectedMatchesPerRound
  const hasByes = seasonRequiresByes(playerCount)
  const expectedByesPerRound = getSeasonByeCountPerRound(playerCount)
  const completeLegCount = Math.floor(expectedRoundCount / baseRoundCount)
  const partialRoundCount = expectedRoundCount % baseRoundCount
  const segmentCount = Math.ceil(expectedRoundCount / baseRoundCount)
  const playerIdSet = new Set(playerIds)
  const appearancesByRoundPlayer = new Map<string, number>()
  const playerMatchCounts = new Map(playerIds.map((playerId) => [playerId, 0]))
  const byeCounts = new Map(playerIds.map((playerId) => [playerId, 0]))
  const previousRoundWasBye = new Map(playerIds.map((playerId) => [playerId, false]))
  let invalidMatchCount = 0
  let invalidRoundMatchCount = 0
  let invalidRoundAppearanceCount = 0
  let invalidByeRoundCount = 0
  let consecutiveByeCount = 0

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
      const key = `${match.round}|${playerId}`
      appearancesByRoundPlayer.set(key, (appearancesByRoundPlayer.get(key) ?? 0) + 1)
      playerMatchCounts.set(playerId, (playerMatchCounts.get(playerId) ?? 0) + 1)
    })
  })

  for (let round = 1; round <= expectedRoundCount; round += 1) {
    if (matches.filter((match) => match.round === round).length !== expectedMatchesPerRound) {
      invalidRoundMatchCount += 1
    }
    let byeCount = 0
    playerIds.forEach((playerId) => {
      const appearances = appearancesByRoundPlayer.get(`${round}|${playerId}`) ?? 0
      if (hasByes ? appearances > 1 : appearances !== 1) {
        invalidRoundAppearanceCount += 1
      }
      const isBye = appearances === 0
      if (isBye) {
        byeCount += 1
        byeCounts.set(playerId, (byeCounts.get(playerId) ?? 0) + 1)
        if (previousRoundWasBye.get(playerId)) consecutiveByeCount += 1
      }
      previousRoundWasBye.set(playerId, isBye)
    })
    if (byeCount !== expectedByesPerRound) invalidByeRoundCount += 1
  }

  const playerMatchValues = Array.from(playerMatchCounts.values())
  const byeValues = Array.from(byeCounts.values())
  const playerMatchCountMin = Math.min(...playerMatchValues)
  const playerMatchCountMax = Math.max(...playerMatchValues)
  const byeCountMin = Math.min(...byeValues)
  const byeCountMax = Math.max(...byeValues)
  const totalExpectedByes = expectedByesPerRound * expectedRoundCount
  const expectedByeMin = Math.floor(totalExpectedByes / Math.max(playerCount, 1))
  const expectedByeMax = Math.ceil(totalExpectedByes / Math.max(playerCount, 1))
  const invalidByePlayerCount = playerIds.filter((playerId) => {
    const value = byeCounts.get(playerId) ?? 0
    return value < expectedByeMin || value > expectedByeMax
  }).length

  const { teammateCounts, opponentCounts } = getCalendarPairCounts({ matches })
  const maxAllowedTeammatePairCount = Math.max(segmentCount, 1)
  const maxAllowedOpponentPairCount = hasByes
    ? Math.max(segmentCount, 1) * getFlexibleCalendarMaxOpponentPairCount(playerCount)
    : Math.max(segmentCount, 1) * 2
  let invalidTeammatePairCount = 0
  let invalidOpponentPairCount = 0
  let maxTeammatePairCount = 0
  let maxOpponentPairCount = 0

  for (let firstIndex = 0; firstIndex < playerIds.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < playerIds.length; secondIndex += 1) {
      const pairKey = getPairKey(playerIds[firstIndex], playerIds[secondIndex])
      const teammateCount = teammateCounts.get(pairKey) ?? 0
      const opponentCount = opponentCounts.get(pairKey) ?? 0
      maxTeammatePairCount = Math.max(maxTeammatePairCount, teammateCount)
      maxOpponentPairCount = Math.max(maxOpponentPairCount, opponentCount)
      if (teammateCount > maxAllowedTeammatePairCount) invalidTeammatePairCount += 1
      if (opponentCount > maxAllowedOpponentPairCount) invalidOpponentPairCount += 1
    }
  }

  let fullLegsBalanced = true
  let partialBalanced = true
  let repeatedQuartetCount = 0

  for (let legIndex = 0; legIndex < completeLegCount; legIndex += 1) {
    const roundStart = legIndex * baseRoundCount + 1
    const roundEnd = roundStart + baseRoundCount - 1
    const legMatches = matches
      .filter((match) => match.round >= roundStart && match.round <= roundEnd)
      .map((match) => ({ ...match, round: match.round - roundStart + 1 }))
    if (hasByes) {
      const legAudit = auditFlexibleCalendarLeg({ matches: legMatches, playerIds })
      fullLegsBalanced = fullLegsBalanced && legAudit.isBalanced
      repeatedQuartetCount += legAudit.repeatedQuartetCount
    } else {
      fullLegsBalanced =
        fullLegsBalanced &&
        auditBalancedCalendar({ matches: legMatches, playerIds }).isPerfectlyBalanced
    }
  }

  if (partialRoundCount > 0) {
    const partialStart = completeLegCount * baseRoundCount + 1
    const partialMatches = matches
      .filter((match) => match.round >= partialStart)
      .map((match) => ({ ...match, round: match.round - partialStart + 1 }))
    const partialPairCounts = getCalendarPairCounts({ matches: partialMatches })
    const partialQuartets = new Map<string, number>()
    partialMatches.forEach((match) => {
      const quartetKey = [...match.teamA, ...match.teamB].sort().join("+")
      partialQuartets.set(quartetKey, (partialQuartets.get(quartetKey) ?? 0) + 1)
    })
    const partialRepeatedTeammates = Array.from(partialPairCounts.teammateCounts.values()).some(
      (count) => count > 1,
    )
    const partialRepeatedQuartets = Array.from(partialQuartets.values()).filter(
      (count) => count > 1,
    ).length
    repeatedQuartetCount += partialRepeatedQuartets
    partialBalanced = !partialRepeatedTeammates && partialRepeatedQuartets === 0
  }

  const repeatedMatchCount = countDuplicateMatchSignatures(matches)
  const repeatedRoundCount = countDuplicateRoundSignatures(matches, expectedRoundCount)
  const modeStructureCorrect = repeatedMatchCount === 0 && repeatedRoundCount === 0
  const roundCount = new Set(matches.map((match) => match.round)).size
  const durationBalance =
    fullLegsBalanced &&
    partialBalanced &&
    playerMatchCountMax - playerMatchCountMin <= 1 &&
    byeCountMax - byeCountMin <= 1
  const isBalanced =
    roundCount === expectedRoundCount &&
    matches.length === expectedMatchCount &&
    invalidMatchCount === 0 &&
    invalidRoundMatchCount === 0 &&
    invalidRoundAppearanceCount === 0 &&
    invalidByeRoundCount === 0 &&
    invalidByePlayerCount === 0 &&
    consecutiveByeCount === 0 &&
    invalidTeammatePairCount === 0 &&
    invalidOpponentPairCount === 0 &&
    durationBalance &&
    modeStructureCorrect

  return {
    mode: "extended",
    playerCount,
    baseRoundCount,
    roundCount,
    matchCount: matches.length,
    expectedRoundCount,
    expectedMatchCount,
    expectedMatchesPerRound,
    invalidMatchCount,
    invalidRoundMatchCount,
    invalidRoundAppearanceCount,
    expectedTeammateCount: maxAllowedTeammatePairCount,
    expectedOpponentCount: maxAllowedOpponentPairCount,
    invalidTeammatePairCount,
    invalidOpponentPairCount,
    firstLegBalanced: expectedRoundCount < baseRoundCount ? partialBalanced : fullLegsBalanced,
    secondLegBalanced: expectedRoundCount > baseRoundCount ? durationBalance : null,
    repeatedMatchCount,
    repeatedRoundCount,
    modeStructureCorrect,
    hasByes,
    expectedByesPerRound,
    expectedByesPerPlayer: Math.round(totalExpectedByes / Math.max(playerCount, 1)),
    invalidByeRoundCount,
    invalidByePlayerCount,
    consecutiveByeCount,
    repeatedTeammatePairCount: invalidTeammatePairCount,
    maxTeammatePairCount,
    maxOpponentPairCount,
    repeatedQuartetCount,
    completeLegCount,
    partialRoundCount,
    playerMatchCountMin,
    playerMatchCountMax,
    byeCountMin,
    byeCountMax,
    durationBalance,
    isBalanced,
    isPerfectlyBalanced: isBalanced && partialRoundCount === 0,
  }
}

export function auditSeasonCalendar({
  matches,
  playerIds,
  mode,
  expectedRoundCount,
}: {
  matches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[]
  playerIds: string[]
  mode: SeasonScheduleMode
  expectedRoundCount?: number
}): SeasonCalendarAudit {
  const resolvedExpectedRoundCount =
    expectedRoundCount ??
    getSeasonScheduleRoundCount({ playerCount: playerIds.length, mode })

  if (mode === "extended") {
    return auditVariableExtendedSeasonCalendar({
      matches,
      playerIds,
      expectedRoundCount: resolvedExpectedRoundCount,
    })
  }

  if (seasonRequiresByes(playerIds.length)) {
    return auditFlexibleSeasonCalendar({ matches, playerIds, mode })
  }

  const baseRoundCount = getSeasonBaseRoundCount(playerIds.length)
  const roundMultiplier = getSeasonScheduleRoundMultiplier(mode)
  const resolvedRoundCount = resolvedExpectedRoundCount
  const expectedMatchesPerRound = getSeasonMatchesPerRound(playerIds.length)
  const expectedMatchCount = resolvedRoundCount * expectedMatchesPerRound
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

  for (let round = 1; round <= resolvedRoundCount; round += 1) {
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
    expectedRoundCount: resolvedRoundCount,
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
    hasByes: false,
    expectedByesPerRound: 0,
    expectedByesPerPlayer: 0,
    invalidByeRoundCount: 0,
    invalidByePlayerCount: 0,
    consecutiveByeCount: 0,
    repeatedTeammatePairCount: 0,
    maxTeammatePairCount: expectedTeammateCount,
    maxOpponentPairCount: expectedOpponentCount,
    repeatedQuartetCount: 0,
    completeLegCount: roundMultiplier,
    partialRoundCount: 0,
    playerMatchCountMin: resolvedRoundCount,
    playerMatchCountMax: resolvedRoundCount,
    byeCountMin: 0,
    byeCountMax: 0,
    durationBalance:
      firstLegAudit.isPerfectlyBalanced &&
      (secondLegAudit?.isPerfectlyBalanced ?? true),
    isBalanced:
      roundCount === resolvedRoundCount &&
      matches.length === expectedMatchCount &&
      invalidMatchCount === 0 &&
      invalidRoundMatchCount === 0 &&
      invalidRoundAppearanceCount === 0 &&
      invalidTeammatePairCount === 0 &&
      invalidOpponentPairCount === 0 &&
      firstLegAudit.isPerfectlyBalanced &&
      (secondLegAudit?.isPerfectlyBalanced ?? true) &&
      modeStructureCorrect,
    isPerfectlyBalanced:
      roundCount === resolvedRoundCount &&
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

function greatestCommonDivisor(first: number, second: number): number {
  return second === 0
    ? Math.abs(first)
    : greatestCommonDivisor(second, first % second)
}

function buildExtendedCandidate({
  baseMatches,
  playerIds,
  offset,
  step,
}: {
  baseMatches: GeneratedMatch[]
  playerIds: string[]
  offset: number
  step: number
}) {
  const permutedPlayerIds = Array.from(
    { length: playerIds.length },
    (_, index) => playerIds[(index * step + offset) % playerIds.length],
  )
  const sampleMatch = baseMatches[0]

  if (!sampleMatch) {
    return []
  }

  return seasonRequiresByes(playerIds.length)
    ? generateFlexibleByeCalendar({
        leagueId: sampleMatch.leagueId,
        seasonId: sampleMatch.seasonId,
        playerIds: permutedPlayerIds,
      })
    : generateCyclicWhistCalendar({
        leagueId: sampleMatch.leagueId,
        seasonId: sampleMatch.seasonId,
        playerIds: permutedPlayerIds,
      })
}

function countLegBoundaryConsecutiveByes({
  firstLegMatches,
  secondLegMatches,
  playerIds,
}: {
  firstLegMatches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[]
  secondLegMatches: Pick<GeneratedMatch, "round" | "teamA" | "teamB">[]
  playerIds: string[]
}) {
  const lastRound = Math.max(...firstLegMatches.map((match) => match.round), 0)
  const firstRound = Math.min(
    ...secondLegMatches.map((match) => match.round),
    Number.POSITIVE_INFINITY,
  )
  const lastPlayers = new Set(
    firstLegMatches
      .filter((match) => match.round === lastRound)
      .flatMap((match) => [...match.teamA, ...match.teamB]),
  )
  const firstPlayers = new Set(
    secondLegMatches
      .filter((match) => match.round === firstRound)
      .flatMap((match) => [...match.teamA, ...match.teamB]),
  )

  return playerIds.filter(
    (playerId) => !lastPlayers.has(playerId) && !firstPlayers.has(playerId),
  ).length
}

function getLegMatchSetSignature(
  matches: Pick<GeneratedMatch, "teamA" | "teamB">[],
) {
  return matches.map(getMatchSignature).sort().join(" || ")
}

function getLegMatchSignatureSet(
  matches: Pick<GeneratedMatch, "teamA" | "teamB">[],
) {
  return new Set(matches.map(getMatchSignature))
}

function countSignatureOverlap(first: Set<string>, second: Set<string>) {
  let overlap = 0
  second.forEach((signature) => {
    if (first.has(signature)) overlap += 1
  })
  return overlap
}

function getPairingScore({
  matches,
  playerIds,
}: {
  matches: Pick<GeneratedMatch, "teamA" | "teamB">[]
  playerIds: string[]
}) {
  const { teammateCounts, opponentCounts } = getCalendarPairCounts({ matches })
  let maxTeammateCount = 0
  let maxOpponentCount = 0
  let teammateSquareSum = 0
  let opponentSquareSum = 0

  for (let firstIndex = 0; firstIndex < playerIds.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < playerIds.length; secondIndex += 1) {
      const pairKey = getPairKey(playerIds[firstIndex], playerIds[secondIndex])
      const teammateCount = teammateCounts.get(pairKey) ?? 0
      const opponentCount = opponentCounts.get(pairKey) ?? 0
      maxTeammateCount = Math.max(maxTeammateCount, teammateCount)
      maxOpponentCount = Math.max(maxOpponentCount, opponentCount)
      teammateSquareSum += teammateCount * teammateCount
      opponentSquareSum += opponentCount * opponentCount
    }
  }

  return [
    maxTeammateCount,
    teammateSquareSum,
    maxOpponentCount,
    opponentSquareSum,
  ] as const
}

function compareNumberTuples(first: readonly number[], second: readonly number[]) {
  const count = Math.max(first.length, second.length)
  for (let index = 0; index < count; index += 1) {
    const difference = (first[index] ?? 0) - (second[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

function getDeterministicPermutation(playerIds: string[], seed: number) {
  const permuted = [...playerIds]
  let state = (seed ^ (playerIds.length * 0x9e3779b9)) >>> 0
  const nextRandom = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return state >>> 0
  }

  for (let index = permuted.length - 1; index > 0; index -= 1) {
    const swapIndex = nextRandom() % (index + 1)
    ;[permuted[index], permuted[swapIndex]] = [permuted[swapIndex], permuted[index]]
  }

  return permuted
}

function buildBalancedLegCandidates({
  baseMatches,
  playerIds,
}: {
  baseMatches: GeneratedMatch[]
  playerIds: string[]
}) {
  const candidates = new Map<string, GeneratedMatch[]>()
  const addCandidate = (candidate: GeneratedMatch[]) => {
    if (candidate.length === 0) return
    const candidateIsBalanced = seasonRequiresByes(playerIds.length)
      ? auditFlexibleCalendarLeg({ matches: candidate, playerIds }).isBalanced
      : auditBalancedCalendar({ matches: candidate, playerIds }).isPerfectlyBalanced
    if (!candidateIsBalanced) return
    candidates.set(getLegMatchSetSignature(candidate), candidate)
  }

  addCandidate(baseMatches)

  const candidateSteps = Array.from(
    { length: playerIds.length - 1 },
    (_, index) => index + 1,
  ).filter((step) => greatestCommonDivisor(step, playerIds.length) === 1)

  for (const step of candidateSteps) {
    const firstOffset = step === 1 ? 1 : 0
    for (let offset = firstOffset; offset < playerIds.length; offset += 1) {
      addCandidate(buildExtendedCandidate({ baseMatches, playerIds, offset, step }))
    }
  }

  const deterministicCandidateCount = Math.max(192, playerIds.length * 16)
  for (let seed = 1; seed <= deterministicCandidateCount; seed += 1) {
    const permutedPlayerIds = getDeterministicPermutation(playerIds, seed)
    const sampleMatch = baseMatches[0]
    if (!sampleMatch) break
    addCandidate(
      seasonRequiresByes(playerIds.length)
        ? generateFlexibleByeCalendar({
            leagueId: sampleMatch.leagueId,
            seasonId: sampleMatch.seasonId,
            playerIds: permutedPlayerIds,
          })
        : generateCyclicWhistCalendar({
            leagueId: sampleMatch.leagueId,
            seasonId: sampleMatch.seasonId,
            playerIds: permutedPlayerIds,
          }),
    )
  }

  return Array.from(candidates.values())
}

function buildBalancedLegSequence({
  baseMatches,
  playerIds,
  limit = Number.POSITIVE_INFINITY,
}: {
  baseMatches: GeneratedMatch[]
  playerIds: string[]
  limit?: number
}) {
  if (baseMatches.length === 0 || limit <= 0) return []
  if (limit === 1) return [baseMatches]

  const baseSignature = getLegMatchSetSignature(baseMatches)
  const remaining = buildBalancedLegCandidates({ baseMatches, playerIds }).filter(
    (candidate) => getLegMatchSetSignature(candidate) !== baseSignature,
  )
  const selected: GeneratedMatch[][] = [baseMatches]
  const usedMatchSignatures = getLegMatchSignatureSet(baseMatches)
  const accumulatedMatches = [...baseMatches]

  while (selected.length < limit) {
    let bestIndex = -1
    let bestScore: readonly number[] | null = null
    let bestSignature = ""

    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index]
      const candidateSignatures = getLegMatchSignatureSet(candidate)
      if (countSignatureOverlap(usedMatchSignatures, candidateSignatures) > 0) {
        continue
      }

      const boundaryByeCount = seasonRequiresByes(playerIds.length)
        ? countLegBoundaryConsecutiveByes({
            firstLegMatches: selected[selected.length - 1],
            secondLegMatches: candidate,
            playerIds,
          })
        : 0
      if (boundaryByeCount > 0) continue

      const score = getPairingScore({
        matches: [...accumulatedMatches, ...candidate],
        playerIds,
      })
      const signature = getLegMatchSetSignature(candidate)
      if (
        bestScore === null ||
        compareNumberTuples(score, bestScore) < 0 ||
        (compareNumberTuples(score, bestScore) === 0 && signature < bestSignature)
      ) {
        bestIndex = index
        bestScore = score
        bestSignature = signature
      }
    }

    if (bestIndex < 0) break

    const [selectedCandidate] = remaining.splice(bestIndex, 1)
    selected.push(selectedCandidate)
    selectedCandidate.forEach((match) =>
      usedMatchSignatures.add(getMatchSignature(match)),
    )
    accumulatedMatches.push(...selectedCandidate)
  }

  return selected
}

const precomputedMaxBalancedLegCount: Record<number, number> = {
  8: 5,
  9: 7,
  10: 7,
  11: 8,
  12: 7,
  13: 6,
  14: 7,
  15: 10,
  16: 8,
  17: 9,
  18: 11,
  19: 9,
  20: 9,
  21: 9,
  22: 11,
  23: 12,
  24: 9,
}

export function getSeasonMaxBalancedLegCount(playerCount: number) {
  if (!isSeasonPlayerCountInRange(playerCount)) return 1
  return precomputedMaxBalancedLegCount[playerCount] ?? 1
}

export function getSeasonMaxRoundCount(playerCount: number) {
  return getSeasonBaseRoundCount(playerCount) * getSeasonMaxBalancedLegCount(playerCount)
}

export function isValidSeasonTargetRoundCount({
  playerCount,
  targetRoundCount,
}: {
  playerCount: number
  targetRoundCount: number
}) {
  return (
    isSeasonPlayerCountInRange(playerCount) &&
    Number.isInteger(targetRoundCount) &&
    targetRoundCount >= 1 &&
    targetRoundCount <= getSeasonMaxRoundCount(playerCount)
  )
}

export function isValidSeasonScheduleTarget({
  playerCount,
  mode,
  targetRoundCount,
}: {
  playerCount: number
  mode: SeasonScheduleMode
  targetRoundCount: number
}) {
  if (!isValidSeasonTargetRoundCount({ playerCount, targetRoundCount })) return false
  const baseRoundCount = getSeasonBaseRoundCount(playerCount)
  if (mode === "single") return targetRoundCount === baseRoundCount
  if (mode === "double") return targetRoundCount === baseRoundCount * 2
  return true
}

function getRoundMatches(
  matches: GeneratedMatch[],
  round: number,
) {
  return matches.filter((match) => match.round === round)
}

function rotateLegRounds({
  leg,
  startRound,
  roundCount,
}: {
  leg: GeneratedMatch[]
  startRound: number
  roundCount: number
}) {
  const baseRoundCount = getBaseRoundCount(leg)
  const rotated: GeneratedMatch[] = []

  for (let offset = 0; offset < roundCount; offset += 1) {
    const sourceRound = ((startRound - 1 + offset) % baseRoundCount) + 1
    getRoundMatches(leg, sourceRound).forEach((match, matchIndex) => {
      rotated.push(
        cloneMatchForRound({
          match,
          round: offset + 1,
          matchIndex,
          idSuffix: `partial-${startRound}`,
        }),
      )
    })
  }

  return rotated
}

function getCustomPartialScore({
  previousMatches,
  candidate,
  playerIds,
}: {
  previousMatches: GeneratedMatch[]
  candidate: GeneratedMatch[]
  playerIds: string[]
}) {
  const combined = [...previousMatches, ...candidate]
  const appearances = new Map(playerIds.map((playerId) => [playerId, 0]))
  const byes = new Map(playerIds.map((playerId) => [playerId, 0]))
  let consecutiveByeCount = 0
  const previousRoundWasBye = new Map(playerIds.map((playerId) => [playerId, false]))
  const maxRound = Math.max(...combined.map((match) => match.round), 0)

  for (let round = 1; round <= maxRound; round += 1) {
    const roundPlayers = new Set(
      combined
        .filter((match) => match.round === round)
        .flatMap((match) => [...match.teamA, ...match.teamB]),
    )
    playerIds.forEach((playerId) => {
      if (roundPlayers.has(playerId)) {
        appearances.set(playerId, (appearances.get(playerId) ?? 0) + 1)
        previousRoundWasBye.set(playerId, false)
      } else {
        byes.set(playerId, (byes.get(playerId) ?? 0) + 1)
        if (previousRoundWasBye.get(playerId)) consecutiveByeCount += 1
        previousRoundWasBye.set(playerId, true)
      }
    })
  }

  const appearanceValues = Array.from(appearances.values())
  const byeValues = Array.from(byes.values())
  const appearanceSpread = Math.max(...appearanceValues) - Math.min(...appearanceValues)
  const byeSpread = Math.max(...byeValues) - Math.min(...byeValues)
  const pairingScore = getPairingScore({ matches: combined, playerIds })

  return [consecutiveByeCount, appearanceSpread, byeSpread, ...pairingScore] as const
}

function selectBestPartialLeg({
  leg,
  roundCount,
  previousMatches,
  playerIds,
}: {
  leg: GeneratedMatch[]
  roundCount: number
  previousMatches: GeneratedMatch[]
  playerIds: string[]
}) {
  const baseRoundCount = getBaseRoundCount(leg)
  const roundOffset = getBaseRoundCount(previousMatches)
  let bestMatches: GeneratedMatch[] = []
  let bestScore: readonly number[] | null = null
  let bestSignature = ""

  const considerCandidate = (candidate: GeneratedMatch[]) => {
    const score = getCustomPartialScore({
      previousMatches,
      candidate,
      playerIds,
    })
    const signature = candidate.map(getMatchSignature).join(" || ")

    if (
      bestScore === null ||
      compareNumberTuples(score, bestScore) < 0 ||
      (compareNumberTuples(score, bestScore) === 0 && signature < bestSignature)
    ) {
      bestMatches = candidate
      bestScore = score
      bestSignature = signature
    }
  }

  // Fast path: cyclic windows keep the natural round ordering and are enough
  // for most custom durations. Try both directions before using the beam search.
  for (const direction of [1, -1] as const) {
    for (let startRound = 1; startRound <= baseRoundCount; startRound += 1) {
      const candidate: GeneratedMatch[] = []

      for (let position = 0; position < roundCount; position += 1) {
        const zeroBasedSourceRound =
          ((startRound - 1 + direction * position) % baseRoundCount + baseRoundCount) %
          baseRoundCount
        const sourceRound = zeroBasedSourceRound + 1

        getRoundMatches(leg, sourceRound).forEach((match, matchIndex) => {
          candidate.push(
            cloneMatchForRound({
              match,
              round: roundOffset + position + 1,
              matchIndex,
              idSuffix: `custom-${startRound}-${direction}-${position + 1}`,
            }),
          )
        })
      }

      considerCandidate(candidate)
    }
  }

  const hasOptimalFairness = (score: readonly number[] | null) =>
    Boolean(score && score[0] === 0 && score[1] <= 1 && score[2] <= 1)

  if (hasOptimalFairness(bestScore)) return bestMatches

  // Some bye patterns need non-consecutive source rounds to reach the fairest
  // possible distribution. A bounded beam keeps this interactive even at 24
  // players while still improving substantially over the cyclic fast path.
  const beamWidth = 64
  type PartialState = {
    sourceRounds: number[]
    matches: GeneratedMatch[]
    score: readonly number[]
  }
  let states: PartialState[] = [{ sourceRounds: [], matches: [], score: [] }]

  for (let position = 0; position < roundCount; position += 1) {
    const expanded: PartialState[] = []

    for (const state of states) {
      const usedRounds = new Set(state.sourceRounds)
      for (let sourceRound = 1; sourceRound <= baseRoundCount; sourceRound += 1) {
        if (usedRounds.has(sourceRound)) continue
        const nextRoundMatches = getRoundMatches(leg, sourceRound).map((match, matchIndex) =>
          cloneMatchForRound({
            match,
            round: roundOffset + position + 1,
            matchIndex,
            idSuffix: `custom-beam-${sourceRound}-${position + 1}`,
          }),
        )
        const matches = [...state.matches, ...nextRoundMatches]
        const score = getCustomPartialScore({
          previousMatches,
          candidate: matches,
          playerIds,
        })
        expanded.push({
          sourceRounds: [...state.sourceRounds, sourceRound],
          matches,
          score,
        })
      }
    }

    expanded.sort((first, second) => {
      const scoreDifference = compareNumberTuples(first.score, second.score)
      if (scoreDifference !== 0) return scoreDifference
      return first.sourceRounds.join(",").localeCompare(second.sourceRounds.join(","))
    })
    states = expanded.slice(0, beamWidth)
  }

  if (states[0]) considerCandidate(states[0].matches)
  return bestMatches
}

function generateExtendedBalancedCalendar({
  baseMatches,
  playerIds,
  targetRoundCount,
}: {
  baseMatches: GeneratedMatch[]
  playerIds: string[]
  targetRoundCount: number
}) {
  const baseRoundCount = getBaseRoundCount(baseMatches)
  const requiredLegCount = Math.ceil(targetRoundCount / baseRoundCount)
  const legs = buildBalancedLegSequence({
    baseMatches,
    playerIds,
    limit: requiredLegCount,
  })

  if (legs.length < requiredLegCount) {
    throw new Error(
      `La duración solicitada supera el máximo equilibrado para ${playerIds.length} jugadores.`,
    )
  }

  const generated: GeneratedMatch[] = []
  let remainingRounds = targetRoundCount

  for (let legIndex = 0; legIndex < legs.length && remainingRounds > 0; legIndex += 1) {
    const leg = legs[legIndex]
    const roundsToTake = Math.min(baseRoundCount, remainingRounds)
    if (roundsToTake < baseRoundCount) {
      generated.push(
        ...selectBestPartialLeg({
          leg,
          roundCount: roundsToTake,
          previousMatches: generated,
          playerIds,
        }),
      )
      break
    }

    const roundOffset = legIndex * baseRoundCount
    leg.forEach((match, matchIndex) => {
      generated.push(
        cloneMatchForRound({
          match,
          round: match.round + roundOffset,
          matchIndex,
          idSuffix: legIndex === 0 ? "base" : `long-${legIndex + 1}`,
        }),
      )
    })
    remainingRounds -= roundsToTake
  }

  return generated
}

function extendCalendarMatches({
  baseMatches,
  mode,
  playerIds,
  targetRoundCount,
}: {
  baseMatches: GeneratedMatch[]
  mode: SeasonScheduleMode
  playerIds?: string[]
  targetRoundCount: number
}): GeneratedMatch[] {
  const baseRoundCount = getBaseRoundCount(baseMatches)

  if (baseRoundCount <= 0) return baseMatches

  if (mode === "single") {
    return baseMatches.filter((match) => match.round <= targetRoundCount)
  }

  if (mode === "double") {
    if (targetRoundCount !== baseRoundCount * 2) {
      throw new Error("La doble vuelta requiere exactamente dos vueltas completas.")
    }
    const secondLegMatches = baseMatches.map((match, index) =>
      cloneMatchForRound({
        match,
        round: match.round + baseRoundCount,
        matchIndex: index,
        idSuffix: "double",
      }),
    )
    return [...baseMatches, ...secondLegMatches]
  }

  return generateExtendedBalancedCalendar({
    baseMatches,
    playerIds: playerIds ?? getCalendarPlayerIds(baseMatches),
    targetRoundCount,
  })
}

export function getSeasonScheduleRoundMultiplier(mode: SeasonScheduleMode) {
  return mode === "single" ? 1 : 2
}

export function getSeasonScheduleRoundCount({
  playerCount,
  mode,
  targetRoundCount,
  longMultiplier = 2,
}: {
  playerCount: number
  mode: SeasonScheduleMode
  targetRoundCount?: number
  longMultiplier?: number
}) {
  if (typeof targetRoundCount === "number") return targetRoundCount
  const baseRoundCount = getSeasonBaseRoundCount(playerCount)
  if (mode === "single") return baseRoundCount
  if (mode === "double") return baseRoundCount * 2
  return baseRoundCount * Math.max(2, Math.trunc(longMultiplier))
}

export function isOptimizedCustomSeasonCalendar(audit: SeasonCalendarAudit) {
  return (
    audit.mode === "extended" &&
    audit.partialRoundCount > 0 &&
    audit.roundCount === audit.expectedRoundCount &&
    audit.matchCount === audit.expectedMatchCount &&
    audit.invalidMatchCount === 0 &&
    audit.invalidRoundMatchCount === 0 &&
    audit.invalidRoundAppearanceCount === 0 &&
    audit.invalidByeRoundCount === 0 &&
    audit.consecutiveByeCount === 0 &&
    audit.invalidTeammatePairCount === 0 &&
    audit.invalidOpponentPairCount === 0 &&
    audit.repeatedMatchCount === 0 &&
    audit.repeatedRoundCount === 0
  )
}

export function generateBalancedCalendar({
  leagueId,
  seasonId,
  playerIds,
  scheduleMode = "single",
  targetRoundCount,
}: {
  leagueId: string
  seasonId: string
  playerIds: string[]
  scheduleMode?: SeasonScheduleMode
  targetRoundCount?: number
}): GeneratedMatch[] {
  if (!isSeasonPlayerCountInRange(playerIds.length)) return []

  const baseMatches = seasonRequiresByes(playerIds.length)
    ? generateFlexibleByeCalendar({ leagueId, seasonId, playerIds })
    : generateCyclicWhistCalendar({ leagueId, seasonId, playerIds })

  if (baseMatches.length === 0) return []

  const baseIsBalanced = seasonRequiresByes(playerIds.length)
    ? auditFlexibleCalendarLeg({ matches: baseMatches, playerIds }).isBalanced
    : auditBalancedCalendar({ matches: baseMatches, playerIds }).isPerfectlyBalanced

  if (!baseIsBalanced) {
    throw new Error(
      `No se ha podido generar un calendario equilibrado para ${playerIds.length} jugadores.`,
    )
  }

  const requestedRoundCount = getSeasonScheduleRoundCount({
    playerCount: playerIds.length,
    mode: scheduleMode,
    targetRoundCount,
  })

  if (
    !isValidSeasonScheduleTarget({
      playerCount: playerIds.length,
      mode: scheduleMode,
      targetRoundCount: requestedRoundCount,
    })
  ) {
    throw new Error(
      `La duración solicitada no es válida para ${playerIds.length} jugadores.`,
    )
  }

  const fullCalendar = extendCalendarMatches({
    baseMatches,
    mode: scheduleMode,
    playerIds,
    targetRoundCount: requestedRoundCount,
  })
  const fullAudit = auditSeasonCalendar({
    matches: fullCalendar,
    playerIds,
    mode: scheduleMode,
    expectedRoundCount: requestedRoundCount,
  })

  if (!fullAudit.isBalanced && !isOptimizedCustomSeasonCalendar(fullAudit)) {
    throw new Error(
      `No se ha podido completar un calendario de ${requestedRoundCount} jornadas equilibrado para ${playerIds.length} jugadores.`,
    )
  }

  return fullCalendar
}

export function generateManualCalendar({
  leagueId,
  seasonId,
  matches,
  scheduleMode = "single",
  targetRoundCount,
}: {
  leagueId: string
  seasonId: string
  matches: ManualCalendarMatchDraft[]
  scheduleMode?: SeasonScheduleMode
  targetRoundCount?: number
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
  const uniquePlayerCount = getUniquePlayerCount(baseMatches)
  const requestedRoundCount = getSeasonScheduleRoundCount({
    playerCount: uniquePlayerCount,
    mode: scheduleMode,
    targetRoundCount,
  })

  if (getBaseRoundCount(baseMatches) >= requestedRoundCount) {
    return baseMatches.filter((match) => match.round <= requestedRoundCount)
  }

  return extendCalendarMatches({
    baseMatches,
    mode: scheduleMode,
    targetRoundCount: requestedRoundCount,
  })
}
