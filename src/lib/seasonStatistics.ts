import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile, SeasonPlayer } from "@/data/fakeData"
import { calculateSeasonRanking, type RankingPlayer } from "@/lib/ranking"

type PlayerStreak = {
  playerId: string
  displayName: string
  wins: number
}

export type PairStatistics = {
  playerIds: [string, string]
  playerNames: [string, string]
  matchesPlayed: number
  wins: number
  losses: number
  winRate: number
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

export type PlayerRoundProgress = {
  round: number
  position: number
  points: number
  gamesDiff: number
}

export type PlayerSeasonDetail = {
  player: RankingPlayer
  winRate: number
  bestWinStreak: number
  bestPartner: PairStatistics | null
  mostFrequentPartner: PairStatistics | null
  toughestOpponent: PlayerOpponentStatistics | null
  opponents: PlayerOpponentStatistics[]
  progress: PlayerRoundProgress[]
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
  longestWinStreak: PlayerStreak | null
  bestPair: PairStatistics | null
  pairStatistics: PairStatistics[]
  closestMatch: MatchData | null
  biggestWin: MatchData | null
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

function getWinningTeam(match: MatchData) {
  if (match.pointsA === null || match.pointsB === null) {
    return null
  }

  if (match.pointsA > match.pointsB) {
    return "A" as const
  }

  if (match.pointsB > match.pointsA) {
    return "B" as const
  }

  return null
}

function pairKey(playerIds: string[]) {
  return [...playerIds].sort().join("|")
}

function calculatePairs({
  matches,
  playersById,
}: {
  matches: MatchData[]
  playersById: Map<string, PlayerProfile>
}) {
  const pairs = new Map<
    string,
    {
      playerIds: [string, string]
      matchesPlayed: number
      wins: number
      losses: number
      gamesDiff: number
    }
  >()

  matches.forEach((match) => {
    if (
      match.status !== "finished" ||
      match.resultCounts === false ||
      match.teamA.length !== 2 ||
      match.teamB.length !== 2
    ) {
      return
    }

    const winner = getWinningTeam(match)
    const gamesA = match.sets.reduce((total, set) => total + set.a, 0)
    const gamesB = match.sets.reduce((total, set) => total + set.b, 0)

    ;([
      { team: match.teamA, won: winner === "A", gamesDiff: gamesA - gamesB },
      { team: match.teamB, won: winner === "B", gamesDiff: gamesB - gamesA },
    ] as const).forEach(({ team, won, gamesDiff }) => {
      const sortedTeam = [...team].sort() as [string, string]
      const key = pairKey(sortedTeam)
      const current = pairs.get(key) ?? {
        playerIds: sortedTeam,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        gamesDiff: 0,
      }

      current.matchesPlayed += 1
      current.gamesDiff += gamesDiff

      if (won) {
        current.wins += 1
      } else {
        current.losses += 1
      }

      pairs.set(key, current)
    })
  })

  return Array.from(pairs.values())
    .map((pair): PairStatistics => ({
      ...pair,
      playerNames: pair.playerIds.map(
        (playerId) => playersById.get(playerId)?.displayName ?? "Jugador",
      ) as [string, string],
      winRate:
        pair.matchesPlayed > 0 ? (pair.wins / pair.matchesPlayed) * 100 : 0,
    }))
    .sort((a, b) => {
      if (b.matchesPlayed >= 2 && a.matchesPlayed < 2) return 1
      if (a.matchesPlayed >= 2 && b.matchesPlayed < 2) return -1
      if (b.winRate !== a.winRate) return b.winRate - a.winRate
      if (b.wins !== a.wins) return b.wins - a.wins
      return b.gamesDiff - a.gamesDiff
    })
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
        match.status === "finished" &&
        match.resultCounts !== false &&
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
  pairStatistics,
}: {
  seasonId: string
  playerId: string
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  matches: MatchData[]
  pairStatistics?: PairStatistics[]
}): PlayerSeasonDetail | null {
  const seasonMatches = matches.filter(
    (match) =>
      match.seasonId === seasonId &&
      match.status === "finished" &&
      match.resultCounts !== false,
  )
  const ranking = calculateSeasonRanking({
    seasonId,
    playerProfiles,
    seasonPlayers,
    matches,
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

  const playerPairs = (
    pairStatistics ?? calculatePairs({ matches: seasonMatches, playersById })
  ).filter((pair) => pair.playerIds.includes(playerId))
  const bestPartner = [...playerPairs].sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate
    if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed
    return b.gamesDiff - a.gamesDiff
  })[0] ?? null
  const mostFrequentPartner = [...playerPairs].sort((a, b) => {
    if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed
    if (b.winRate !== a.winRate) return b.winRate - a.winRate
    return b.gamesDiff - a.gamesDiff
  })[0] ?? null
  const toughestOpponent = [...opponents].sort((a, b) => {
    if (a.winRate !== b.winRate) return a.winRate - b.winRate
    if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed
    return a.gamesDiff - b.gamesDiff
  })[0] ?? null
  const rounds = Array.from(
    new Set(seasonMatches.map((match) => match.round)),
  ).sort((a, b) => a - b)
  const progress = rounds
    .map((round): PlayerRoundProgress | null => {
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
      const row = roundRanking.find((item) => item.id === playerId)

      return row
        ? {
            round,
            position: roundRanking.findIndex((item) => item.id === playerId) + 1,
            points: row.points,
            gamesDiff: row.gamesDiff,
          }
        : null
    })
    .filter((row): row is PlayerRoundProgress => Boolean(row))

  return {
    player,
    winRate:
      player.matchesPlayed > 0 ? (player.wins / player.matchesPlayed) * 100 : 0,
    bestWinStreak: getPlayerBestWinStreak({ playerId, matches: seasonMatches }),
    bestPartner,
    mostFrequentPartner,
    toughestOpponent,
    opponents,
    progress,
  }
}

export function calculateSeasonStatistics({
  seasonId,
  playerProfiles,
  seasonPlayers,
  matches,
}: {
  seasonId: string
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  matches: MatchData[]
}): SeasonStatistics {
  const seasonMatches = matches.filter((match) => match.seasonId === seasonId)
  const completedMatches = seasonMatches.filter(
    (match) => match.status === "finished",
  )
  const countedMatches = completedMatches.filter(
    (match) => match.resultCounts !== false,
  )
  const ranking = calculateSeasonRanking({
    seasonId,
    playerProfiles,
    seasonPlayers,
    matches,
  })
  const playersById = new Map(
    playerProfiles.map((player) => [player.id, player]),
  )
  const totalGames = countedMatches.reduce(
    (total, match) => total + getMatchGames(match),
    0,
  )
  const pairStatistics = calculatePairs({
    matches: countedMatches,
    playersById,
  })
  const sortableMatches = countedMatches.filter((match) => match.sets.length > 0)
  const closestMatch = [...sortableMatches].sort(
    (a, b) => getMatchGamesDiff(a) - getMatchGamesDiff(b),
  )[0] ?? null
  const biggestWin = [...sortableMatches].sort(
    (a, b) => getMatchGamesDiff(b) - getMatchGamesDiff(a),
  )[0] ?? null

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
    leader: ranking[0] ?? null,
    longestWinStreak: calculateLongestWinStreak({
      matches: countedMatches,
      playersById,
    }),
    bestPair: pairStatistics[0] ?? null,
    pairStatistics,
    closestMatch,
    biggestWin,
  }
}
