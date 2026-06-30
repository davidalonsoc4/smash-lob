import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile, Season, SeasonPlayer } from "@/data/fakeData"

export const TOTAL_HISTORY_SCOPE_ID = "total-history"

type PlayerSeasonScopeInput = {
  leagueId: string
  playerId: string
  activeSeasonId: string
  seasons: Season[]
  seasonPlayers: SeasonPlayer[]
  matches: MatchData[]
}

export type PlayerSeasonScope = {
  id: string
  label: string
  seasonIds: string[]
  isTotal: boolean
}

export type PlayerScopeStats = {
  points: number
  gamesDiff: number
  gamesFor: number
  gamesAgainst: number
  matchesPlayed: number
  wins: number
  losses: number
}

function getTeamGames(match: MatchData, team: "A" | "B") {
  return match.sets.reduce(
    (total, set) => total + (team === "A" ? set.a : set.b),
    0
  )
}

function getTeamSetPoints(match: MatchData, team: "A" | "B") {
  if (team === "A" && match.pointsA !== null) {
    return match.pointsA
  }

  if (team === "B" && match.pointsB !== null) {
    return match.pointsB
  }

  return match.sets.filter((set) => (team === "A" ? set.a > set.b : set.b > set.a)).length
}

function seasonHasPlayer({
  seasonId,
  playerId,
  seasonPlayers,
  matches,
}: {
  seasonId: string
  playerId: string
  seasonPlayers: SeasonPlayer[]
  matches: MatchData[]
}) {
  return (
    seasonPlayers.some(
      (seasonPlayer) =>
        seasonPlayer.seasonId === seasonId && seasonPlayer.playerId === playerId
    ) ||
    matches.some(
      (match) =>
        match.seasonId === seasonId &&
        (match.teamA.includes(playerId) || match.teamB.includes(playerId))
    )
  )
}

export function getPlayerSeasonScopes({
  leagueId,
  playerId,
  activeSeasonId,
  seasons,
  seasonPlayers,
  matches,
}: PlayerSeasonScopeInput): PlayerSeasonScope[] {
  const playerSeasons = seasons
    .filter((season) => season.leagueId === leagueId)
    .filter((season) =>
      seasonHasPlayer({
        seasonId: season.id,
        playerId,
        seasonPlayers,
        matches,
      })
    )
    .sort((firstSeason, secondSeason) => {
      if (firstSeason.id === activeSeasonId) return -1
      if (secondSeason.id === activeSeasonId) return 1
      return secondSeason.name.localeCompare(firstSeason.name, "es", {
        numeric: true,
      })
    })

  if (playerSeasons.length <= 1) {
    return playerSeasons.map((season) => ({
      id: season.id,
      label: season.name,
      seasonIds: [season.id],
      isTotal: false,
    }))
  }

  return [
    {
      id: TOTAL_HISTORY_SCOPE_ID,
      label: "Total histórico",
      seasonIds: playerSeasons.map((season) => season.id),
      isTotal: true,
    },
    ...playerSeasons.map((season) => ({
      id: season.id,
      label: season.name,
      seasonIds: [season.id],
      isTotal: false,
    })),
  ]
}

export function getPlayersForSeasonScope({
  leagueId,
  seasonIds,
  playerProfiles,
  seasonPlayers,
  matches,
}: {
  leagueId: string
  seasonIds: string[]
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  matches: MatchData[]
}) {
  const playerIds = new Set<string>()

  seasonPlayers
    .filter((seasonPlayer) => seasonIds.includes(seasonPlayer.seasonId))
    .forEach((seasonPlayer) => playerIds.add(seasonPlayer.playerId))

  matches
    .filter((match) => match.leagueId === leagueId && seasonIds.includes(match.seasonId))
    .forEach((match) => {
      match.teamA.forEach((playerId) => playerIds.add(playerId))
      match.teamB.forEach((playerId) => playerIds.add(playerId))
    })

  return playerProfiles.filter(
    (player) => player.leagueId === leagueId && playerIds.has(player.id)
  )
}

export function getPlayerScopeStats({
  playerId,
  seasonIds,
  matches,
}: {
  playerId: string
  seasonIds: string[]
  matches: MatchData[]
}): PlayerScopeStats {
  return matches
    .filter(
      (match) =>
        seasonIds.includes(match.seasonId) &&
        match.status === "finished" &&
        (match.teamA.includes(playerId) || match.teamB.includes(playerId))
    )
    .reduce<PlayerScopeStats>(
      (stats, match) => {
        const isTeamA = match.teamA.includes(playerId)
        const ownTeam = isTeamA ? "A" : "B"
        const rivalTeam = isTeamA ? "B" : "A"
        const ownSets = getTeamSetPoints(match, ownTeam)
        const rivalSets = getTeamSetPoints(match, rivalTeam)
        const ownGames = getTeamGames(match, ownTeam)
        const rivalGames = getTeamGames(match, rivalTeam)

        stats.points += ownSets
        stats.gamesFor += ownGames
        stats.gamesAgainst += rivalGames
        stats.gamesDiff = stats.gamesFor - stats.gamesAgainst
        stats.matchesPlayed += 1

        if (ownSets > rivalSets) {
          stats.wins += 1
        } else {
          stats.losses += 1
        }

        return stats
      },
      {
        points: 0,
        gamesDiff: 0,
        gamesFor: 0,
        gamesAgainst: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      }
    )
}
