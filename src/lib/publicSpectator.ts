import { calculateSeasonRanking } from "@/lib/ranking"
import { sortRankingRows } from "@/lib/rankingOrder"
import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile, SeasonPlayer } from "@/data/fakeData"
import { getLeagueLocationOptionLabel, normalizeLeagueLocation } from "@/lib/leagueLocations"

export type PublicSpectatorMatch = {
  round: number
  status: "finished" | "scheduled" | "scheduling" | "postponed" | "hidden"
  teams: [string[], string[]] | null
  score: { sets: { a: number; b: number }[]; pointsA: number | null; pointsB: number | null } | null
  scheduledAt: string | null
  location: string | null
}

export type PublicSpectatorRankingRow = {
  position: number
  name: string
  points: number
  gamesDiff: number
  matchesPlayed: number
  wins: number
  losses: number
}

function safeLocationLabel(value: string | null) {
  if (!value?.trim()) return null
  const location = normalizeLeagueLocation(value)
  return location ? getLeagueLocationOptionLabel(location).slice(0, 120) : value.trim().slice(0, 120)
}

export function sanitizePublicSpectatorMatch({
  match,
  playerNameById,
  revealParticipants,
  revealSchedule,
}: {
  match: Pick<MatchData, "round" | "status" | "teamA" | "teamB" | "pointsA" | "pointsB" | "sets" | "scheduledAt" | "location">
  playerNameById: ReadonlyMap<string, string>
  revealParticipants: boolean
  revealSchedule: boolean
}): PublicSpectatorMatch {
  const status = revealParticipants
    ? match.status
    : "hidden"

  return {
    round: match.round,
    status,
    teams: revealParticipants
      ? [
          match.teamA.map((id) => playerNameById.get(id) ?? "Jugador"),
          match.teamB.map((id) => playerNameById.get(id) ?? "Jugador"),
        ]
      : null,
    score:
      revealParticipants && match.status === "finished"
        ? {
            sets: match.sets.map(({ a, b }) => ({ a, b })),
            pointsA: match.pointsA,
            pointsB: match.pointsB,
          }
        : null,
    scheduledAt: revealSchedule ? match.scheduledAt : null,
    location: revealSchedule ? safeLocationLabel(match.location) : null,
  }
}

export function buildPublicSpectatorRanking({
  seasonId,
  players,
  seasonPlayers,
  matches,
}: {
  seasonId: string
  players: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  matches: MatchData[]
}): PublicSpectatorRankingRow[] {
  const ranking = sortRankingRows(
    calculateSeasonRanking({
      seasonId,
      playerProfiles: players,
      seasonPlayers,
      matches: matches.map((match) => ({ ...match, resultCounts: match.rankingCounts !== false })),
    }),
  )

  return ranking.map((player, index) => ({
    position: index + 1,
    name: player.displayName,
    points: player.points,
    gamesDiff: player.gamesDiff,
    matchesPlayed: player.matchesPlayed,
    wins: player.wins,
    losses: player.losses,
  }))
}
