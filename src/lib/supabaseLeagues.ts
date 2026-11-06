import type { MatchData } from "@/context/MatchDataProvider"
import type { SeasonSnapshot } from "@/context/SeasonSettingsProvider"
import type { League, UserLeagueMembership } from "@/data/fakeData"
import type { LeagueLocation } from "@/lib/leagueLocations"
import { LEAGUE_ACCESS_SCOPE_HEADER, type LeagueOverview } from "@/lib/competitionOverview"

export async function createSupabaseLeague({
  leagueName,
  leagueDescription,
  leagueSlug,
  inviteCode,
  locations,
  leagueRecommendations,
  accentColor,
  modality,
}: {
  leagueName: string
  leagueDescription: string
  leagueSlug: string
  inviteCode: string
  locations: LeagueLocation[]
  leagueRecommendations: string
  modality?: "individual" | "fixed_pairs"
  accentColor?: string
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
      leagueRecommendations,
      accentColor,
      modality,
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

type LeagueSnapshotAccess = {
  isSuperuser: boolean
  leagues: League[]
  canCreateLeagues: boolean
  memberships: UserLeagueMembership[]
  spectatorLeagueIds: string[]
}

export type LeagueSnapshot = LeagueSnapshotAccess & (
  { matches: MatchData[]; seasonSnapshot: SeasonSnapshot; overview?: never }
  | { overview: LeagueOverview }
)

export async function fetchSupabaseLeagueSnapshot(options: { adminContext?: boolean; overview?: boolean; signal?: AbortSignal; priority?: RequestPriority } = {}): Promise<LeagueSnapshot> {
  const response = await fetch(options.adminContext ? "/api/access?context=admin" : "/api/access", {
    cache: "no-store", signal: options.signal, priority: options.priority,
    headers: options.overview ? { [LEAGUE_ACCESS_SCOPE_HEADER]: "overview" } : undefined,
  })

  if (!response.ok) {
    throw new Error(`access-api-${response.status}`)
  }

  return response.json() as Promise<LeagueSnapshot>
}


export async function updateSupabaseLeagueExperienceMode({
  leagueId,
  mode,
}: {
  leagueId: string
  mode: "admin" | "player" | "player_experience"
}) {
  const response = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}/experience-mode`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`experience-mode-api-${response.status}`)
  return (await response.json()) as { mode: "admin" | "player" | "player_experience" }
}
