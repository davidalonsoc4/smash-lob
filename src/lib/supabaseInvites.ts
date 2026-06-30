import { supabase } from "@/lib/supabase"
import { upsertAppUser } from "@/lib/supabaseUsers"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import type {
  RoundWindowMode,
  SeasonRoundSettings,
  SeasonSnapshot,
} from "@/context/SeasonSettingsProvider"
import type {
  League,
  LeagueMemberRole,
  PlayerProfile,
  Season,
  SeasonPlayer,
  UserLeagueMembership,
} from "@/data/fakeData"
import type { MatchData } from "@/context/MatchDataProvider"

type SupabaseLeagueRow = {
  id: string
  slug: string
  name: string
  description: string | null
  invite_code: string
  join_mode: string
  active_season_id: string | null
  locations: unknown
  logo_url?: string | null
}

type ClaimPlayerResult =
  | { ok: true; membership: UserLeagueMembership }
  | { ok: false; error: "already-in-league" | "player-already-claimed" }

export type SupabaseInviteSnapshot = {
  league: League
  claimedMemberships: UserLeagueMembership[]
  matches: MatchData[]
  seasonSnapshot: SeasonSnapshot
}

function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase()
}

function toRole(role: unknown): LeagueMemberRole {
  return role === "creator" || role === "admin" || role === "player"
    ? role
    : "player"
}

function toRoundWindowMode(mode: unknown): RoundWindowMode {
  return mode === "fixed-days" ? "fixed-days" : "none"
}

function toLocations(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((location): location is string => typeof location === "string")
}

function mapLeague(league: SupabaseLeagueRow): League {
  return {
    id: league.id,
    slug: league.slug,
    name: league.name,
    description: league.description ?? "",
    activeSeasonId: league.active_season_id ?? "",
    inviteCode: league.invite_code,
    joinMode: league.join_mode === "open" ? "open" : "closed",
    locations: toLocations(league.locations),
    logoUrl: typeof league.logo_url === "string" ? league.logo_url : null,
  }
}

async function fetchLeagueByInviteCode(code: string) {
  const normalizedCode = normalizeInviteCode(code)
  const { data: directLeague, error: directLeagueError } = await supabase
    .from("leagues")
    .select("id,slug,name,description,invite_code,join_mode,active_season_id,locations,logo_url")
    .eq("invite_code", normalizedCode)
    .maybeSingle()

  if (directLeagueError) {
    throw directLeagueError
  }

  if (directLeague) {
    return directLeague as SupabaseLeagueRow
  }

  return null
}

export async function fetchSupabaseInviteSnapshot(
  code: string
): Promise<SupabaseInviteSnapshot | null> {
  const leagueRow = await fetchLeagueByInviteCode(code)

  if (!leagueRow) {
    return null
  }

  const league = mapLeague(leagueRow)

  const [seasonsResult, playersResult, settingsResult, matchesResult] =
    await Promise.all([
      supabase
        .from("seasons")
        .select("id,league_id,name,status,total_rounds,completed_rounds")
        .eq("league_id", league.id),
      supabase
        .from("players")
        .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
        .eq("league_id", league.id),
      supabase
        .from("season_settings")
        .select(
          "league_id,season_id,round_window_mode,season_starts_at,round_window_days,requires_three_sets"
        )
        .eq("league_id", league.id),
      supabase.from("matches").select(matchSelect).eq("league_id", league.id),
    ])

  if (seasonsResult.error) throw seasonsResult.error
  if (playersResult.error) throw playersResult.error
  if (settingsResult.error) throw settingsResult.error
  if (matchesResult.error) throw matchesResult.error

  const seasons: Season[] = (seasonsResult.data ?? []).map((season) => ({
    id: season.id,
    leagueId: season.league_id,
    name: season.name,
    status: season.status === "finished" ? "finished" : "active",
    totalRounds: season.total_rounds,
    completedRounds: season.completed_rounds,
  }))
  const seasonIds = seasons.map((season) => season.id)
  const { data: seasonPlayerRows, error: seasonPlayersError } =
    seasonIds.length > 0
      ? await supabase
          .from("season_players")
          .select("season_id,player_id")
          .in("season_id", seasonIds)
      : { data: [], error: null }

  if (seasonPlayersError) throw seasonPlayersError

  const { data: membershipRows, error: membershipsError } = await supabase
    .from("league_memberships")
    .select("user_id,league_id,player_id,role")
    .eq("league_id", league.id)

  if (membershipsError) throw membershipsError

  const playerProfiles: PlayerProfile[] = (playersResult.data ?? []).map(
    (player) => ({
      id: player.id,
      leagueId: player.league_id,
      slug: player.slug,
      displayName: player.display_name,
      avatarInitials: player.avatar_initials,
      avatarUrl: typeof player.avatar_url === "string" ? player.avatar_url : null,
    })
  )
  const seasonPlayers: SeasonPlayer[] = (seasonPlayerRows ?? []).map(
    (seasonPlayer) => ({
      seasonId: seasonPlayer.season_id,
      playerId: seasonPlayer.player_id,
    })
  )
  const seasonSettings: SeasonRoundSettings[] = (
    settingsResult.data ?? []
  ).map((settings) => ({
    leagueId: settings.league_id,
    seasonId: settings.season_id,
    roundWindowMode: toRoundWindowMode(settings.round_window_mode),
    seasonStartsAt: settings.season_starts_at,
    roundWindowDays: settings.round_window_days,
    requiresThreeSets: settings.requires_three_sets,
  }))
  const claimedMemberships: UserLeagueMembership[] = (
    membershipRows ?? []
  ).map((membership) => ({
    userId: `__claimed__:${membership.user_id}`,
    leagueId: membership.league_id,
    playerId: membership.player_id ?? "",
    role: toRole(membership.role),
  }))
  const matches: MatchData[] = ((matchesResult.data ?? []) as Record<string, unknown>[])
    .map((match) => mapSupabaseMatch(match))

  return {
    league,
    claimedMemberships,
    matches,
    seasonSnapshot: {
      seasons,
      playerProfiles,
      seasonPlayers,
      seasonSettings,
      activeSeasonIds: {
        [league.id]: league.activeSeasonId,
      },
    },
  }
}

export async function claimSupabasePlayer({
  email,
  displayName,
  leagueId,
  playerId,
}: {
  email: string
  displayName?: string | null
  leagueId: string
  playerId: string
}): Promise<ClaimPlayerResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await upsertAppUser({
    email: normalizedEmail,
    displayName,
  })

  const { data: existingUserMembership, error: existingUserMembershipError } =
    await supabase
      .from("league_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("league_id", leagueId)
      .limit(1)
      .maybeSingle()

  if (existingUserMembershipError) {
    throw existingUserMembershipError
  }

  if (existingUserMembership) {
    return { ok: false, error: "already-in-league" }
  }

  const { data: existingPlayerMembership, error: existingPlayerMembershipError } =
    await supabase
      .from("league_memberships")
      .select("id")
      .eq("league_id", leagueId)
      .eq("player_id", playerId)
      .limit(1)
      .maybeSingle()

  if (existingPlayerMembershipError) {
    throw existingPlayerMembershipError
  }

  if (existingPlayerMembership) {
    return { ok: false, error: "player-already-claimed" }
  }

  const { data: membership, error: membershipError } = await supabase
    .from("league_memberships")
    .insert({
      user_id: user.id,
      league_id: leagueId,
      player_id: playerId,
      role: "player",
    })
    .select("league_id,player_id,role")
    .single()

  if (membershipError) {
    throw membershipError
  }

  return {
    ok: true,
    membership: {
      userId: normalizedEmail,
      leagueId: membership.league_id,
      playerId: membership.player_id ?? "",
      role: toRole(membership.role),
    },
  }
}
