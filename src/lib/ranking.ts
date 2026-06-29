import type { PlayerProfile, SeasonPlayer } from "@/data/fakeData"

type MatchSet = {
  a: number
  b: number
}

type Match = {
  id: string
  seasonId: string
  status: string
  teamA: string[]
  teamB: string[]
  pointsA: number | null
  pointsB: number | null
  sets: MatchSet[]
}

export type RankingPlayer = PlayerProfile & {
  seasonId: string
  playerId: string
  points: number
  gamesDiff: number
  gamesFor: number
  gamesAgainst: number
  matchesPlayed: number
  wins: number
  losses: number
}

function createEmptyStats(
  seasonId: string,
  player: PlayerProfile
): RankingPlayer {
  return {
    ...player,
    seasonId,
    playerId: player.id,
    points: 0,
    gamesDiff: 0,
    gamesFor: 0,
    gamesAgainst: 0,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
  }
}

function getTeamGames(sets: MatchSet[], team: "A" | "B") {
  return sets.reduce((total, set) => {
    return total + (team === "A" ? set.a : set.b)
  }, 0)
}

function getTeamSetPoints(match: Match, team: "A" | "B") {
  if (team === "A" && match.pointsA !== null) {
    return match.pointsA
  }

  if (team === "B" && match.pointsB !== null) {
    return match.pointsB
  }

  return match.sets.filter((set) => {
    return team === "A" ? set.a > set.b : set.b > set.a
  }).length
}

function applyTeamResult(
  statsByPlayerId: Map<string, RankingPlayer>,
  playerIds: string[],
  result: {
    points: number
    gamesFor: number
    gamesAgainst: number
    won: boolean
  }
) {
  playerIds.forEach((playerId) => {
    const playerStats = statsByPlayerId.get(playerId)

    if (!playerStats) {
      return
    }

    playerStats.points += result.points
    playerStats.gamesFor += result.gamesFor
    playerStats.gamesAgainst += result.gamesAgainst
    playerStats.gamesDiff = playerStats.gamesFor - playerStats.gamesAgainst
    playerStats.matchesPlayed += 1

    if (result.won) {
      playerStats.wins += 1
    } else {
      playerStats.losses += 1
    }
  })
}

export function calculateSeasonRanking({
  seasonId,
  playerProfiles,
  seasonPlayers,
  matches,
}: {
  seasonId: string
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  matches: Match[]
}) {
  const playerIdsInSeason = seasonPlayers
    .filter((seasonPlayer) => seasonPlayer.seasonId === seasonId)
    .map((seasonPlayer) => seasonPlayer.playerId)

  const playersInSeason = playerIdsInSeason
    .map((playerId) => {
      return playerProfiles.find((player) => player.id === playerId)
    })
    .filter((player): player is PlayerProfile => Boolean(player))

  const statsByPlayerId = new Map<string, RankingPlayer>()

  playersInSeason.forEach((player) => {
    statsByPlayerId.set(player.id, createEmptyStats(seasonId, player))
  })

  matches
    .filter((match) => match.seasonId === seasonId)
    .filter((match) => match.status === "finished")
    .forEach((match) => {
      const pointsA = getTeamSetPoints(match, "A")
      const pointsB = getTeamSetPoints(match, "B")
      const gamesA = getTeamGames(match.sets, "A")
      const gamesB = getTeamGames(match.sets, "B")

      applyTeamResult(statsByPlayerId, match.teamA, {
        points: pointsA,
        gamesFor: gamesA,
        gamesAgainst: gamesB,
        won: pointsA > pointsB,
      })

      applyTeamResult(statsByPlayerId, match.teamB, {
        points: pointsB,
        gamesFor: gamesB,
        gamesAgainst: gamesA,
        won: pointsB > pointsA,
      })
    })

  return Array.from(statsByPlayerId.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
    return b.gamesFor - a.gamesFor
  })
}