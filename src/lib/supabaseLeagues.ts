import { supabase } from "@/lib/supabase"
import { upsertAppUser } from "@/lib/supabaseUsers"
import { isSuperuserEmail } from "@/lib/superuser"
import { generateBalancedCalendar } from "@/lib/calendar"
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

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "JG"
  )
}

function slug(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  )
}

type SupabaseErrorLike = {
  code?: string
  message?: string
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as SupabaseErrorLike).code === "23505"
  )
}

function toLocations(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((location): location is string => typeof location === "string")
}

async function insertLeagueWithAvailableSlug({
  leagueSlug,
  leagueName,
  leagueDescription,
  inviteCode,
  creatorUserId,
}: {
  leagueSlug: string
  leagueName: string
  leagueDescription: string
  inviteCode: string
  creatorUserId: string
}) {
  let lastError: unknown = null

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slugCandidate =
      attempt === 0 ? leagueSlug : `${leagueSlug}-${attempt + 1}`
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .insert({
        slug: slugCandidate,
        name: leagueName,
        description: leagueDescription,
        invite_code: inviteCode,
        join_mode: "closed",
        created_by_user_id: creatorUserId,
      })
      .select("id,slug,name,description,invite_code,join_mode,active_season_id,locations,logo_url")
      .single()

    if (!leagueError && league) {
      return league
    }

    lastError = leagueError

    if (!isUniqueViolation(leagueError)) {
      throw leagueError
    }
  }

  throw lastError ?? new Error("No se pudo crear la liga en Supabase")
}

export async function createSupabaseLeague({
  creatorEmail,
  creatorName,
  leagueName,
  leagueDescription,
  leagueSlug,
  inviteCode,
  seasonName,
  playerNames,
  roundWindowMode,
  seasonStartsAt,
  roundWindowDays,
  requiresThreeSets,
}: {
  creatorEmail: string
  creatorName?: string | null
  leagueName: string
  leagueDescription: string
  leagueSlug: string
  inviteCode: string
  seasonName: string
  playerNames: string[]
  roundWindowMode: RoundWindowMode
  seasonStartsAt: string | null
  roundWindowDays: number | null
  requiresThreeSets: boolean
}) {
  const normalizedCreatorEmail = creatorEmail.trim().toLowerCase()
  const cleanNames = playerNames.map((name) => name.trim()).filter(Boolean)
  const creator = await upsertAppUser({
    email: normalizedCreatorEmail,
    displayName: creatorName,
  })
  const league = await insertLeagueWithAvailableSlug({
    leagueSlug,
    leagueName,
    leagueDescription,
    inviteCode,
    creatorUserId: creator.id,
  })
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .insert({
      league_id: league.id,
      name: seasonName,
      status: "active",
      total_rounds: Math.max(cleanNames.length - 1, 1),
      completed_rounds: 0,
    })
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single()

  if (seasonError) throw seasonError

  const { data: players, error: playersError } = await supabase
    .from("players")
    .insert(
      cleanNames.map((name, index) => ({
        league_id: league.id,
        slug: `${slug(name)}-${index + 1}`,
        display_name: name,
        avatar_initials: initials(name),
      }))
    )
    .select("id,league_id,slug,display_name,avatar_initials,avatar_url")

  if (playersError) throw playersError

  if ((players ?? []).length > 0) {
    const { error: seasonPlayersError } = await supabase
      .from("season_players")
      .insert(
        (players ?? []).map((player) => ({
          season_id: season.id,
          player_id: player.id,
        }))
      )

    if (seasonPlayersError) throw seasonPlayersError
  }

  const seasonMatches = generateBalancedCalendar({
    leagueId: league.id,
    seasonId: season.id,
    playerIds: (players ?? []).map((player) => player.id),
  })

  const { data: matchesData, error: matchesError } =
    seasonMatches.length > 0
      ? await supabase
          .from("matches")
          .insert(
            seasonMatches.map((match) => ({
              league_id: match.leagueId,
              season_id: match.seasonId,
              round: match.round,
              status: match.status,
              team_a: match.teamA,
              team_b: match.teamB,
              points_a: match.pointsA,
              points_b: match.pointsB,
              sets: match.sets,
              scheduled_at: match.scheduledAt,
              date_label: match.dateLabel,
              location: match.location,
              result_recorded_at: match.resultRecordedAt,
            }))
          )
          .select(matchSelect)
      : { data: [], error: null }

  if (matchesError) throw matchesError

  const { error: settingsError } = await supabase
    .from("season_settings")
    .insert({
      season_id: season.id,
      league_id: league.id,
      round_window_mode: roundWindowMode,
      season_starts_at: seasonStartsAt,
      round_window_days: roundWindowDays,
      requires_three_sets: requiresThreeSets,
    })

  if (settingsError) throw settingsError

  const { error: membershipError } = await supabase
    .from("league_memberships")
    .insert({
      user_id: creator.id,
      league_id: league.id,
      player_id: players?.[0]?.id ?? null,
      role: "creator",
    })

  if (membershipError) throw membershipError

  const { error: inviteError } = await supabase.from("invites").insert({
    league_id: league.id,
    code: inviteCode,
    created_by_user_id: creator.id,
  })

  if (inviteError) throw inviteError

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: season.id })
    .eq("id", league.id)

  if (leagueUpdateError) throw leagueUpdateError

  const leagueResult: League = {
    id: league.id,
    slug: league.slug,
    name: league.name,
    description: league.description ?? "",
    activeSeasonId: season.id,
    inviteCode: league.invite_code,
    joinMode: league.join_mode === "open" ? "open" : "closed",
    locations: toLocations(league.locations),
    logoUrl: typeof league.logo_url === "string" ? league.logo_url : null,
  }
  const seasonResult: Season = {
    id: season.id,
    leagueId: season.league_id,
    name: season.name,
    status: season.status === "finished" ? "finished" : "active",
    totalRounds: season.total_rounds,
    completedRounds: season.completed_rounds,
  }
  const playerProfiles: PlayerProfile[] = (players ?? []).map((player) => ({
    id: player.id,
    leagueId: player.league_id,
    slug: player.slug,
    displayName: player.display_name,
    avatarInitials: player.avatar_initials,
    avatarUrl: typeof player.avatar_url === "string" ? player.avatar_url : null,
  }))
  const matches: MatchData[] = (matchesData ?? []).map((match) =>
    mapSupabaseMatch(match)
  )

  return {
    league: leagueResult,
    membership: {
      userId: normalizedCreatorEmail,
      leagueId: league.id,
      playerId: players?.[0]?.id ?? "",
      role: "creator" as const,
    },
    matches,
    seasonSnapshot: {
      seasons: [seasonResult],
      playerProfiles,
      seasonPlayers: (players ?? []).map((player) => ({
        seasonId: season.id,
        playerId: player.id,
      })),
      seasonSettings: [
        {
          leagueId: league.id,
          seasonId: season.id,
          roundWindowMode,
          seasonStartsAt,
          roundWindowDays,
          requiresThreeSets,
        },
      ],
      activeSeasonIds: {
        [league.id]: season.id,
      },
    },
  }
}

function toRole(role: unknown): LeagueMemberRole {
  return role === "creator" || role === "admin" || role === "player"
    ? role
    : "player"
}

export async function fetchSupabaseLeagueSnapshot(email: string): Promise<{
  isSuperuser: boolean
  leagues: League[]
  memberships: UserLeagueMembership[]
  matches: MatchData[]
  seasonSnapshot: SeasonSnapshot
}> {
  const normalizedEmail = email.trim().toLowerCase()
  const { data: user } = await supabase
    .from("app_users")
    .select("id,email,is_superuser")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (!user) {
    return {
      isSuperuser: false,
      leagues: [],
      memberships: [],
      matches: [],
      seasonSnapshot: {
        seasons: [],
        playerProfiles: [],
        seasonPlayers: [],
        seasonSettings: [],
        activeSeasonIds: {},
      },
    }
  }

  const isSuperuser =
    Boolean(user.is_superuser) || isSuperuserEmail(normalizedEmail)
  const { data: ownMembershipRows, error: ownMembershipError } = await supabase
    .from("league_memberships")
    .select("league_id,player_id,role,user_id")
    .eq("user_id", user.id)

  if (ownMembershipError) throw ownMembershipError

  const ownMemberships = (ownMembershipRows ?? []).map((membership) => ({
    userId: normalizedEmail,
    leagueId: membership.league_id,
    playerId: membership.player_id ?? "",
    role: toRole(membership.role),
  }))
  const accessibleLeagueIds = new Set(
    ownMemberships.map((membership) => membership.leagueId)
  )

  if (!isSuperuser && accessibleLeagueIds.size === 0) {
    return {
      isSuperuser,
      leagues: [],
      memberships: ownMemberships,
      matches: [],
      seasonSnapshot: {
        seasons: [],
        playerProfiles: [],
        seasonPlayers: [],
        seasonSettings: [],
        activeSeasonIds: {},
      },
    }
  }

  const leaguesQuery = supabase
    .from("leagues")
    .select(
      "id,slug,name,description,invite_code,join_mode,active_season_id,locations,logo_url"
    )

  if (!isSuperuser) {
    leaguesQuery.in("id", Array.from(accessibleLeagueIds))
  }

  const { data: leagueRows, error: leaguesError } = await leaguesQuery

  if (leaguesError) throw leaguesError

  const leagues = (leagueRows ?? []).map((league) => ({
    id: league.id,
    slug: league.slug,
    name: league.name,
    description: league.description ?? "",
    activeSeasonId: league.active_season_id ?? "",
    inviteCode: league.invite_code,
    joinMode: league.join_mode === "open" ? ("open" as const) : ("closed" as const),
    locations: toLocations(league.locations),
    logoUrl: typeof league.logo_url === "string" ? league.logo_url : null,
  }))
  const leagueIds = leagues.map((league) => league.id)

  if (leagueIds.length === 0) {
    return {
      isSuperuser,
      leagues,
      memberships: ownMemberships,
      matches: [],
      seasonSnapshot: {
        seasons: [],
        playerProfiles: [],
        seasonPlayers: [],
        seasonSettings: [],
        activeSeasonIds: {},
      },
    }
  }

  const [
    seasonsResult,
    playersResult,
    seasonPlayersResult,
    settingsResult,
    matchesResult,
    leagueMembershipsResult,
  ] = await Promise.all([
    supabase
      .from("seasons")
      .select("id,league_id,name,status,total_rounds,completed_rounds")
      .in("league_id", leagueIds),
    supabase
      .from("players")
      .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
      .in("league_id", leagueIds),
    supabase
      .from("season_players")
      .select("season_id,player_id,seasons!inner(league_id)")
      .in("seasons.league_id", leagueIds),
    supabase
      .from("season_settings")
      .select(
        "league_id,season_id,round_window_mode,season_starts_at,round_window_days,requires_three_sets"
      )
      .in("league_id", leagueIds),
    supabase
      .from("matches")
      .select(matchSelect)
      .in("league_id", leagueIds),
    supabase
      .from("league_memberships")
      .select("user_id,league_id,player_id,role")
      .in("league_id", leagueIds),
  ])

  if (seasonsResult.error) throw seasonsResult.error
  if (playersResult.error) throw playersResult.error
  if (seasonPlayersResult.error) throw seasonPlayersResult.error
  if (settingsResult.error) throw settingsResult.error
  if (matchesResult.error) throw matchesResult.error
  if (leagueMembershipsResult.error) throw leagueMembershipsResult.error

  const seasons: Season[] = (seasonsResult.data ?? []).map((season) => ({
    id: season.id,
    leagueId: season.league_id,
    name: season.name,
    status: season.status === "finished" ? "finished" : "active",
    totalRounds: season.total_rounds,
    completedRounds: season.completed_rounds,
  }))
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
  const seasonPlayers: SeasonPlayer[] = (
    seasonPlayersResult.data ?? []
  ).map((seasonPlayer) => ({
    seasonId: seasonPlayer.season_id,
    playerId: seasonPlayer.player_id,
  }))
  const seasonSettings: SeasonRoundSettings[] = (
    settingsResult.data ?? []
  ).map((settings) => ({
    leagueId: settings.league_id,
    seasonId: settings.season_id,
    roundWindowMode:
      settings.round_window_mode === "fixed-days" ? "fixed-days" : "none",
    seasonStartsAt: settings.season_starts_at,
    roundWindowDays: settings.round_window_days,
    requiresThreeSets: settings.requires_three_sets,
  }))
  const matches: MatchData[] = (matchesResult.data ?? []).map((match) =>
    mapSupabaseMatch(match)
  )
  const memberships: UserLeagueMembership[] = (
    leagueMembershipsResult.data ?? []
  ).map((membership) => ({
    userId:
      membership.user_id === user.id
        ? normalizedEmail
        : `__claimed__:${membership.user_id}`,
    leagueId: membership.league_id,
    playerId: membership.player_id ?? "",
    role: toRole(membership.role),
  }))

  return {
    isSuperuser,
    leagues,
    memberships,
    matches,
    seasonSnapshot: {
      seasons,
      playerProfiles,
      seasonPlayers,
      seasonSettings,
      activeSeasonIds: Object.fromEntries(
        leagues.map((league) => [league.id, league.activeSeasonId])
      ),
    },
  }
}
