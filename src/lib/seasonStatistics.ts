import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile, SeasonPlayer } from "@/data/fakeData"
import { calculateSeasonRanking, type RankingPlayer } from "@/lib/ranking"

export type PlayerStreak = {
  playerId: string
  displayName: string
  wins: number
}

export type PlayerTeammatePerformance = {
  playerId: string
  displayName: string
  setsDiff: number
  gamesDiff: number
}

export type PlayerOpponentStatistics = {
  playerId: string
  displayName: string
  matchesPlayed: number
  wins: number
  losses: number
  winRate: number
  gamesDiff: number
}


export type SeasonComebackRecord = {
  match: MatchData
  winnerPlayerIds: string[]
  firstSetDeficit: number
}

export type SeasonRecords = {
  longestWinStreak: PlayerStreak | null
  closestMatch: MatchData | null
  biggestWin: MatchData | null
  biggestComeback: SeasonComebackRecord | null
}

export type SeasonDataQuality = {
  pendingMatches: number
  excludedFinishedMatches: number
  invalidFinishedMatches: number
  withdrawnPlayers: number
  replacementPlayers: number
  hasCountedResults: boolean
}

export type PlayerRoundProgress = {
  round: number
  position: number
  points: number
  gamesDiff: number
}

export type PlayerRecentMatch = {
  matchId: string
  round: number
  outcome: "win" | "loss"
  gamesDiff: number
}

export type PlayerRecentForm = {
  playerId: string
  matches: PlayerRecentMatch[]
  wins: number
  losses: number
  currentStreak: number
  currentStreakOutcome: "win" | "loss" | null
}

export type PlayerComparison = {
  playerA: RankingPlayer
  playerB: RankingPlayer
  playerAForm: PlayerRecentForm
  playerBForm: PlayerRecentForm
  rivalry: {
    matchesPlayed: number
    playerAWins: number
    playerBWins: number
    gamesDiffA: number
  }
}

export type PlayerSeasonDetail = {
  player: RankingPlayer
  winRate: number
  bestWinStreak: number
  strongestTeammate: PlayerTeammatePerformance | null
  mostFrequentOpponent: PlayerOpponentStatistics | null
  toughestOpponent: PlayerOpponentStatistics | null
  opponents: PlayerOpponentStatistics[]
  progress: PlayerRoundProgress[]
  bestPosition: number | null
  worstPosition: number | null
  biggestWin: MatchData | null
  closestMatch: MatchData | null
  biggestComeback: SeasonComebackRecord | null
  mostBeatenOpponent: PlayerOpponentStatistics | null
  mostLostOpponent: PlayerOpponentStatistics | null
}

export type SeasonStatistics = {
  ranking: RankingPlayer[]
  totalMatches: number
  completedMatches: number
  countedMatches: number
  completionRate: number
  totalSets: number
  totalGames: number
  averageGamesPerMatch: number
  leader: RankingPlayer | null
  leaders: RankingPlayer[]
  longestWinStreak: PlayerStreak | null
  closestMatch: MatchData | null
  biggestWin: MatchData | null
  records: SeasonRecords
  progressByPlayer: Record<string, PlayerRoundProgress[]>
  dataQuality: SeasonDataQuality
}

function getMatchGames(match: MatchData) {
  return match.sets.reduce(
    (total, set) => total + Math.max(0, set.a) + Math.max(0, set.b),
    0,
  )
}

function getMatchGamesDiff(match: MatchData) {
  const gamesA = match.sets.reduce((total, set) => total + set.a, 0)
  const gamesB = match.sets.reduce((total, set) => total + set.b, 0)
  return Math.abs(gamesA - gamesB)
}

function getMatchComeback(match: MatchData): SeasonComebackRecord | null {
  const winner = getWinningTeam(match)
  const firstSet = match.sets[0]

  if (!winner || !firstSet) return null

  const winnerLostFirstSet =
    winner === "A" ? firstSet.a < firstSet.b : firstSet.b < firstSet.a

  if (!winnerLostFirstSet) return null

  return {
    match,
    winnerPlayerIds: winner === "A" ? match.teamA : match.teamB,
    firstSetDeficit:
      winner === "A" ? firstSet.b - firstSet.a : firstSet.a - firstSet.b,
  }
}

function getBiggestComeback(matches: MatchData[]) {
  return matches
    .map(getMatchComeback)
    .filter((record): record is SeasonComebackRecord => Boolean(record))
    .sort((a, b) => {
      if (b.firstSetDeficit !== a.firstSetDeficit) {
        return b.firstSetDeficit - a.firstSetDeficit
      }
      return getMatchGamesDiff(b.match) - getMatchGamesDiff(a.match)
    })[0] ?? null
}

function getWinningTeam(match: MatchData) {
  const pointsA =
    match.pointsA ?? match.sets.filter((set) => set.a > set.b).length
  const pointsB =
    match.pointsB ?? match.sets.filter((set) => set.b > set.a).length

  if (pointsA > pointsB) {
    return "A" as const
  }

  if (pointsB > pointsA) {
    return "B" as const
  }

  return null
}

function isValidCountedMatch(match: MatchData) {
  return (
    match.status === "finished" &&
    match.resultCounts !== false &&
    match.sets.length > 0 &&
    Boolean(getWinningTeam(match))
  )
}

function excludeInvalidStatisticsResults(matches: MatchData[]) {
  return matches.map((match) =>
    match.status === "finished" &&
    match.resultCounts !== false &&
    !isValidCountedMatch(match)
      ? { ...match, resultCounts: false }
      : match,
  )
}


function getMatchRecordedTime(match: MatchData) {
  if (!match.resultRecordedAt) {
    return 0
  }

  const value = new Date(match.resultRecordedAt).getTime()
  return Number.isFinite(value) ? value : 0
}

function sortFinishedMatchesLatestFirst(matches: MatchData[]) {
  return [...matches].sort((a, b) => {
    if (b.round !== a.round) return b.round - a.round
    return getMatchRecordedTime(b) - getMatchRecordedTime(a)
  })
}

function rankingRowsAreTied(first: RankingPlayer, second: RankingPlayer) {
  return (
    first.points === second.points &&
    first.gamesDiff === second.gamesDiff &&
    first.gamesFor === second.gamesFor
  )
}

export function getRankingPosition(ranking: RankingPlayer[], playerId: string) {
  const index = ranking.findIndex((player) => player.id === playerId)
  if (index < 0) return null

  const player = ranking[index]
  const firstTiedIndex = ranking.findIndex((candidate) =>
    rankingRowsAreTied(candidate, player),
  )
  return firstTiedIndex + 1
}

export function getLeadingPlayers(ranking: RankingPlayer[]) {
  const leader = ranking[0]
  return leader
    ? ranking.filter((player) => rankingRowsAreTied(player, leader))
    : []
}

function calculateProgressByPlayer({
  seasonId,
  playerProfiles,
  seasonPlayers,
  matches,
}: {
  seasonId: string
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  matches: MatchData[]
}) {
  const countedSeasonMatches = matches.filter(
    (match) =>
      match.seasonId === seasonId &&
      match.status === "finished" &&
      match.resultCounts !== false,
  )
  const rounds = Array.from(
    new Set(countedSeasonMatches.map((match) => match.round)),
  ).sort((a, b) => a - b)
  const progressByPlayer: Record<string, PlayerRoundProgress[]> = {}

  rounds.forEach((round) => {
    const roundRanking = calculateSeasonRanking({
      seasonId,
      playerProfiles,
      seasonPlayers,
      matches: matches.map((match) => ({
        ...match,
        resultCounts:
          match.seasonId === seasonId && match.round > round
            ? false
            : match.resultCounts,
      })),
    })

    roundRanking.forEach((row) => {
      const position = getRankingPosition(roundRanking, row.id)
      if (position === null) return
      progressByPlayer[row.id] = [
        ...(progressByPlayer[row.id] ?? []),
        {
          round,
          position,
          points: row.points,
          gamesDiff: row.gamesDiff,
        },
      ]
    })
  })

  return progressByPlayer
}

function getPlayerMatchResult(match: MatchData, playerId: string) {
  const inTeamA = match.teamA.includes(playerId)
  const inTeamB = match.teamB.includes(playerId)

  if (!inTeamA && !inTeamB) {
    return null
  }

  const winner = getWinningTeam(match)
  if (!winner) {
    return null
  }

  const ownGames = match.sets.reduce(
    (total, set) => total + (inTeamA ? set.a : set.b),
    0,
  )
  const opponentGames = match.sets.reduce(
    (total, set) => total + (inTeamA ? set.b : set.a),
    0,
  )
  const won = (inTeamA && winner === "A") || (inTeamB && winner === "B")

  return {
    outcome: won ? ("win" as const) : ("loss" as const),
    gamesDiff: ownGames - opponentGames,
  }
}

export function calculatePlayerRecentForm({
  seasonId,
  playerId,
  matches,
  limit = 5,
}: {
  seasonId: string
  playerId: string
  matches: MatchData[]
  limit?: number
}): PlayerRecentForm {
  const recentMatches = sortFinishedMatchesLatestFirst(
    matches.filter(
      (match) =>
        match.seasonId === seasonId &&
        isValidCountedMatch(match) &&
        [...match.teamA, ...match.teamB].includes(playerId),
    ),
  )
    .map((match): PlayerRecentMatch | null => {
      const result = getPlayerMatchResult(match, playerId)
      return result
        ? {
            matchId: match.id,
            round: match.round,
            ...result,
          }
        : null
    })
    .filter((match): match is PlayerRecentMatch => Boolean(match))
    .slice(0, Math.max(1, limit))

  const currentStreakOutcome = recentMatches[0]?.outcome ?? null
  const currentStreak = currentStreakOutcome
    ? recentMatches.findIndex((match) => match.outcome !== currentStreakOutcome)
    : 0
  const normalizedCurrentStreak =
    currentStreak === -1 ? recentMatches.length : currentStreak

  return {
    playerId,
    matches: recentMatches,
    wins: recentMatches.filter((match) => match.outcome === "win").length,
    losses: recentMatches.filter((match) => match.outcome === "loss").length,
    currentStreak: normalizedCurrentStreak,
    currentStreakOutcome,
  }
}

export function calculatePlayerComparison({
  seasonId,
  playerAId,
  playerBId,
  playerProfiles,
  seasonPlayers,
  matches,
}: {
  seasonId: string
  playerAId: string
  playerBId: string
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  matches: MatchData[]
}): PlayerComparison | null {
  if (!playerAId || !playerBId || playerAId === playerBId) {
    return null
  }

  const normalizedMatches = excludeInvalidStatisticsResults(matches)
  const ranking = calculateSeasonRanking({
    seasonId,
    playerProfiles,
    seasonPlayers,
    matches: normalizedMatches,
  })
  const playerA = ranking.find((player) => player.id === playerAId)
  const playerB = ranking.find((player) => player.id === playerBId)

  if (!playerA || !playerB) {
    return null
  }

  const rivalry = {
    matchesPlayed: 0,
    playerAWins: 0,
    playerBWins: 0,
    gamesDiffA: 0,
  }
  matches
    .filter(
      (match) =>
        match.seasonId === seasonId &&
        isValidCountedMatch(match) &&
        [...match.teamA, ...match.teamB].includes(playerAId) &&
        [...match.teamA, ...match.teamB].includes(playerBId),
    )
    .forEach((match) => {
      const winner = getWinningTeam(match)
      if (!winner) return

      const aInTeamA = match.teamA.includes(playerAId)
      const bInTeamA = match.teamA.includes(playerBId)
      const gamesA = match.sets.reduce((total, set) => total + set.a, 0)
      const gamesB = match.sets.reduce((total, set) => total + set.b, 0)

      if (aInTeamA === bInTeamA) {
        return
      }

      const playerAWon = (aInTeamA && winner === "A") || (!aInTeamA && winner === "B")
      const ownGamesA = aInTeamA ? gamesA : gamesB
      const opponentGamesA = aInTeamA ? gamesB : gamesA

      rivalry.matchesPlayed += 1
      rivalry.gamesDiffA += ownGamesA - opponentGamesA
      if (playerAWon) rivalry.playerAWins += 1
      else rivalry.playerBWins += 1
    })

  return {
    playerA,
    playerB,
    playerAForm: calculatePlayerRecentForm({
      seasonId,
      playerId: playerAId,
      matches,
    }),
    playerBForm: calculatePlayerRecentForm({
      seasonId,
      playerId: playerBId,
      matches,
    }),
    rivalry,
  }
}

function calculateLongestWinStreak({
  matches,
  playersById,
}: {
  matches: MatchData[]
  playersById: Map<string, PlayerProfile>
}) {
  const currentStreaks = new Map<string, number>()
  const bestStreaks = new Map<string, number>()

  ;[...matches]
    .filter(
      (match) => match.status === "finished" && match.resultCounts !== false,
    )
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round
      const dateA = a.resultRecordedAt
        ? new Date(a.resultRecordedAt).getTime()
        : 0
      const dateB = b.resultRecordedAt
        ? new Date(b.resultRecordedAt).getTime()
        : 0
      return dateA - dateB
    })
    .forEach((match) => {
      const winner = getWinningTeam(match)
      const winners = winner === "A" ? match.teamA : winner === "B" ? match.teamB : []
      const losers = winner === "A" ? match.teamB : winner === "B" ? match.teamA : []

      winners.forEach((playerId) => {
        const next = (currentStreaks.get(playerId) ?? 0) + 1
        currentStreaks.set(playerId, next)
        bestStreaks.set(playerId, Math.max(bestStreaks.get(playerId) ?? 0, next))
      })
      losers.forEach((playerId) => currentStreaks.set(playerId, 0))
    })

  const best = Array.from(bestStreaks.entries()).sort((a, b) => b[1] - a[1])[0]

  if (!best || best[1] <= 0) {
    return null
  }

  return {
    playerId: best[0],
    displayName: playersById.get(best[0])?.displayName ?? "Jugador",
    wins: best[1],
  }
}

function getPlayerBestWinStreak({
  playerId,
  matches,
}: {
  playerId: string
  matches: MatchData[]
}) {
  let current = 0
  let best = 0

  ;[...matches]
    .filter(
      (match) =>
        isValidCountedMatch(match) &&
        [...match.teamA, ...match.teamB].includes(playerId),
    )
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round
      const dateA = a.resultRecordedAt
        ? new Date(a.resultRecordedAt).getTime()
        : 0
      const dateB = b.resultRecordedAt
        ? new Date(b.resultRecordedAt).getTime()
        : 0
      return dateA - dateB
    })
    .forEach((match) => {
      const winner = getWinningTeam(match)
      const playerWon =
        (winner === "A" && match.teamA.includes(playerId)) ||
        (winner === "B" && match.teamB.includes(playerId))

      current = playerWon ? current + 1 : 0
      best = Math.max(best, current)
    })

  return best
}

export function calculatePlayerSeasonDetail({
  seasonId,
  playerId,
  playerProfiles,
  seasonPlayers,
  matches,
  precomputedProgress,
}: {
  seasonId: string
  playerId: string
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  matches: MatchData[]
  precomputedProgress?: PlayerRoundProgress[]
}): PlayerSeasonDetail | null {
  const normalizedMatches = excludeInvalidStatisticsResults(matches)
  const seasonMatches = normalizedMatches.filter(
    (match) => match.seasonId === seasonId && isValidCountedMatch(match),
  )
  const ranking = calculateSeasonRanking({
    seasonId,
    playerProfiles,
    seasonPlayers,
    matches: normalizedMatches,
  })
  const player = ranking.find((item) => item.id === playerId)

  if (!player) return null

  const playersById = new Map(
    playerProfiles.map((profile) => [profile.id, profile]),
  )
  const opponentRows = new Map<
    string,
    { matchesPlayed: number; wins: number; losses: number; gamesDiff: number }
  >()

  const teammateRows = new Map<
    string,
    { setsDiff: number; gamesDiff: number }
  >()

  seasonMatches.forEach((match) => {
    const inTeamA = match.teamA.includes(playerId)
    const inTeamB = match.teamB.includes(playerId)

    if (!inTeamA && !inTeamB) return

    const winner = getWinningTeam(match)
    const playerWon = (inTeamA && winner === "A") || (inTeamB && winner === "B")
    const ownGames = match.sets.reduce(
      (total, set) => total + (inTeamA ? set.a : set.b),
      0,
    )
    const opponentGames = match.sets.reduce(
      (total, set) => total + (inTeamA ? set.b : set.a),
      0,
    )
    const opponents = inTeamA ? match.teamB : match.teamA
    const teammates = (inTeamA ? match.teamA : match.teamB).filter(
      (teammateId) => teammateId !== playerId,
    )
    const ownSets = match.sets.filter((set) =>
      inTeamA ? set.a > set.b : set.b > set.a,
    ).length
    const opponentSets = match.sets.filter((set) =>
      inTeamA ? set.b > set.a : set.a > set.b,
    ).length

    teammates.forEach((teammateId) => {
      const current = teammateRows.get(teammateId) ?? {
        setsDiff: 0,
        gamesDiff: 0,
      }
      current.setsDiff += ownSets - opponentSets
      current.gamesDiff += ownGames - opponentGames
      teammateRows.set(teammateId, current)
    })

    opponents.forEach((opponentId) => {
      const current = opponentRows.get(opponentId) ?? {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        gamesDiff: 0,
      }
      current.matchesPlayed += 1
      current.gamesDiff += ownGames - opponentGames
      if (playerWon) current.wins += 1
      else current.losses += 1
      opponentRows.set(opponentId, current)
    })
  })

  const opponents = Array.from(opponentRows.entries())
    .map(([opponentId, row]): PlayerOpponentStatistics => ({
      playerId: opponentId,
      displayName: playersById.get(opponentId)?.displayName ?? "Jugador",
      ...row,
      winRate:
        row.matchesPlayed > 0 ? (row.wins / row.matchesPlayed) * 100 : 0,
    }))
    .sort((a, b) => {
      if (b.matchesPlayed !== a.matchesPlayed) {
        return b.matchesPlayed - a.matchesPlayed
      }
      if (b.winRate !== a.winRate) return b.winRate - a.winRate
      return b.gamesDiff - a.gamesDiff
    })

  const strongestTeammate = Array.from(teammateRows.entries())
    .map(([teammateId, row]): PlayerTeammatePerformance => ({
      playerId: teammateId,
      displayName: playersById.get(teammateId)?.displayName ?? "Jugador",
      ...row,
    }))
    .sort((a, b) => {
      if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff
      if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
      return a.displayName.localeCompare(b.displayName, "es")
    })[0] ?? null
  const toughestOpponent = [...opponents].sort((a, b) => {
    if (a.winRate !== b.winRate) return a.winRate - b.winRate
    if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed
    return a.gamesDiff - b.gamesDiff
  })[0] ?? null
  const progress =
    precomputedProgress ??
    calculateProgressByPlayer({
      seasonId,
      playerProfiles,
      seasonPlayers,
      matches: normalizedMatches,
    })[playerId] ??
    []
  const playerMatches = seasonMatches.filter((match) =>
    [...match.teamA, ...match.teamB].includes(playerId),
  )
  const sortablePlayerMatches = playerMatches.filter((match) => match.sets.length > 0)
  const biggestWin = [...sortablePlayerMatches]
    .filter((match) => getPlayerMatchResult(match, playerId)?.outcome === "win")
    .sort((a, b) => {
      const resultA = getPlayerMatchResult(a, playerId)
      const resultB = getPlayerMatchResult(b, playerId)
      return (resultB?.gamesDiff ?? 0) - (resultA?.gamesDiff ?? 0)
    })[0] ?? null
  const closestMatch = [...sortablePlayerMatches].sort((a, b) => {
    const resultA = getPlayerMatchResult(a, playerId)
    const resultB = getPlayerMatchResult(b, playerId)
    return Math.abs(resultA?.gamesDiff ?? 0) - Math.abs(resultB?.gamesDiff ?? 0)
  })[0] ?? null
  const biggestComeback = getBiggestComeback(
    playerMatches.filter((match) => {
      const comeback = getMatchComeback(match)
      return comeback?.winnerPlayerIds.includes(playerId)
    }),
  )
  const mostBeatenOpponent = [...opponents]
    .filter((opponent) => opponent.wins > 0)
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.matchesPlayed !== a.matchesPlayed) {
        return b.matchesPlayed - a.matchesPlayed
      }
      return b.gamesDiff - a.gamesDiff
    })[0] ?? null
  const mostLostOpponent = [...opponents]
    .filter((opponent) => opponent.losses > 0)
    .sort((a, b) => {
      if (b.losses !== a.losses) return b.losses - a.losses
      if (b.matchesPlayed !== a.matchesPlayed) {
        return b.matchesPlayed - a.matchesPlayed
      }
      return a.gamesDiff - b.gamesDiff
    })[0] ?? null

  return {
    player,
    winRate:
      player.matchesPlayed > 0 ? (player.wins / player.matchesPlayed) * 100 : 0,
    bestWinStreak: getPlayerBestWinStreak({ playerId, matches: seasonMatches }),
    strongestTeammate,
    mostFrequentOpponent: opponents[0] ?? null,
    toughestOpponent,
    opponents,
    progress,
    bestPosition: progress.length > 0 ? Math.min(...progress.map((row) => row.position)) : null,
    worstPosition: progress.length > 0 ? Math.max(...progress.map((row) => row.position)) : null,
    biggestWin,
    closestMatch,
    biggestComeback,
    mostBeatenOpponent,
    mostLostOpponent,
  }
}

export function calculateSeasonStatistics({
  seasonId,
  playerProfiles,
  seasonPlayers,
  matches,
  includeProgress = true,
}: {
  seasonId: string
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  matches: MatchData[]
  includeProgress?: boolean
}): SeasonStatistics {
  const seasonMatches = matches.filter((match) => match.seasonId === seasonId)
  const completedMatches = seasonMatches.filter(
    (match) => match.status === "finished",
  )
  const eligibleFinishedMatches = completedMatches.filter(
    (match) => match.resultCounts !== false,
  )
  const invalidFinishedMatches = eligibleFinishedMatches.filter(
    (match) => !isValidCountedMatch(match),
  )
  const countedMatches = eligibleFinishedMatches.filter(isValidCountedMatch)
  const normalizedMatches = excludeInvalidStatisticsResults(matches)
  const ranking = calculateSeasonRanking({
    seasonId,
    playerProfiles,
    seasonPlayers,
    matches: normalizedMatches,
  })
  const playersById = new Map(
    playerProfiles.map((player) => [player.id, player]),
  )
  const totalGames = countedMatches.reduce(
    (total, match) => total + getMatchGames(match),
    0,
  )
  const sortableMatches = countedMatches.filter((match) => match.sets.length > 0)
  const closestMatch = [...sortableMatches].sort(
    (a, b) => getMatchGamesDiff(a) - getMatchGamesDiff(b),
  )[0] ?? null
  const biggestWin = [...sortableMatches].sort(
    (a, b) => getMatchGamesDiff(b) - getMatchGamesDiff(a),
  )[0] ?? null
  const longestWinStreak = calculateLongestWinStreak({
    matches: countedMatches,
    playersById,
  })
  const records: SeasonRecords = {
    longestWinStreak,
    closestMatch,
    biggestWin,
    biggestComeback: getBiggestComeback(sortableMatches),
  }
  const progressByPlayer = includeProgress
    ? calculateProgressByPlayer({
        seasonId,
        playerProfiles,
        seasonPlayers,
        matches: normalizedMatches,
      })
    : {}
  const seasonRoster = seasonPlayers.filter((player) => player.seasonId === seasonId)
  const dataQuality: SeasonDataQuality = {
    pendingMatches: seasonMatches.filter((match) => match.status !== "finished").length,
    excludedFinishedMatches: completedMatches.filter(
      (match) => match.resultCounts === false,
    ).length,
    invalidFinishedMatches: invalidFinishedMatches.length,
    withdrawnPlayers: seasonRoster.filter((player) => player.status === "withdrawn").length,
    replacementPlayers: (() => {
      const incomingReplacements = seasonRoster.filter(
        (player) => Boolean(player.replacesPlayerId),
      ).length
      return incomingReplacements > 0
        ? incomingReplacements
        : seasonRoster.filter((player) => Boolean(player.replacedByPlayerId)).length
    })(),
    hasCountedResults: countedMatches.length > 0,
  }
  const leaders = getLeadingPlayers(ranking)

  return {
    ranking,
    totalMatches: seasonMatches.length,
    completedMatches: completedMatches.length,
    countedMatches: countedMatches.length,
    completionRate:
      seasonMatches.length > 0
        ? (completedMatches.length / seasonMatches.length) * 100
        : 0,
    totalSets: countedMatches.reduce(
      (total, match) => total + match.sets.length,
      0,
    ),
    totalGames,
    averageGamesPerMatch:
      countedMatches.length > 0 ? totalGames / countedMatches.length : 0,
    leader: leaders[0] ?? null,
    leaders,
    longestWinStreak,
    closestMatch,
    biggestWin,
    records,
    progressByPlayer,
    dataQuality,
  }
}
