import type { MatchData } from "@/context/MatchDataProvider"
import type { SeasonSnapshot } from "@/context/SeasonSettingsProvider"
import type { League, UserLeagueMembership } from "@/data/fakeData"
import type { LeagueLocation } from "@/lib/leagueLocations"

export async function createSupabaseLeague({
  leagueName,
  leagueDescription,
  leagueSlug,
  inviteCode,
  locations,
}: {
  leagueName: string
  leagueDescription: string
  leagueSlug: string
  inviteCode: string
  locations: LeagueLocation[]
}) {
  const response = await fetch("/api/leagues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leagueName,
      leagueDescription,
      leagueSlug,
      inviteCode,
      locations,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`create-league-api-${response.status}`)
  }

  return (await response.json()) as {
    league: League
    membership: UserLeagueMembership | null
    seasonSnapshot: SeasonSnapshot
  }
}

export async function fetchSupabaseLeagueSnapshot(): Promise<{
  isSuperuser: boolean
  leagues: League[]
  canCreateLeagues: boolean
  memberships: UserLeagueMembership[]
  spectatorLeagueIds: string[]
  matches: MatchData[]
  seasonSnapshot: SeasonSnapshot
}> {
  const response = await fetch("/api/access", { cache: "no-store" })

  if (!response.ok) {
    throw new Error(`access-api-${response.status}`)
  }

  return (await response.json()) as {
    isSuperuser: boolean
    leagues: League[]
    canCreateLeagues: boolean
    memberships: UserLeagueMembership[]
    spectatorLeagueIds: string[]
    matches: MatchData[]
    seasonSnapshot: SeasonSnapshot
  }
}
