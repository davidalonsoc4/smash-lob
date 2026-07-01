import { supabase } from "@/lib/supabase"
import { upsertAppUser } from "@/lib/supabaseUsers"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import type {
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
}: {
  creatorEmail: string
  creatorName?: string | null
  leagueName: string
  leagueDescription: string
  leagueSlug: string
  inviteCode: string
}) {
  const normalizedCreatorEmail = creatorEmail.trim().toLowerCase()
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
  const creatorIsSuperuser = Boolean(creator.is_superuser)

  if (!creatorIsSuperuser) {
    const { error: membershipError } = await supabase
      .from("league_memberships")
      .insert({
        user_id: creator.id,
        league_id: league.id,
        player_id: null,
        role: "creator",
      })

    if (membershipError) throw membershipError
  }

  const { error: inviteError } = await supabase.from("invites").insert({
    league_id: league.id,
    code: inviteCode,
    created_by_user_id: creator.id,
  })

  if (inviteError) throw inviteError

  const leagueResult: League = {
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

  return {
    league: leagueResult,
    membership: creatorIsSuperuser
      ? null
      : {
          userId: normalizedCreatorEmail,
          leagueId: league.id,
          playerId: "",
          role: "creator" as const,
        },
    seasonSnapshot: {
      seasons: [],
      playerProfiles: [],
      seasonPlayers: [],
      seasonSettings: [],
      activeSeasonIds: {
        [league.id]: "",
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

  const isSuperuser = Boolean(user.is_superuser)
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
      memberships: isSuperuser ? [] : ownMemberships,
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
      memberships: isSuperuser ? [] : ownMemberships,
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
        "league_id,season_id,round_window_mode,season_starts_at,round_window_days,requires_three_sets,manual_active_round,manual_completed_rounds"
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

  const linkedUserIds = Array.from(
    new Set(
      (leagueMembershipsResult.data ?? [])
        .map((membership) => membership.user_id)
        .filter((userId): userId is string => typeof userId === "string")
    )
  )
  const { data: linkedUsers, error: linkedUsersError } =
    linkedUserIds.length > 0
      ? await supabase
          .from("app_users")
          .select("id,email,display_name,avatar_url")
          .in("id", linkedUserIds)
      : { data: [], error: null }

  if (linkedUsersError) throw linkedUsersError

  const linkedUsersById = new Map(
    (linkedUsers ?? []).map((user) => [
      user.id,
      {
        email: user.email,
        displayName: user.display_name,
        avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null,
      },
    ])
  )
  const membershipByPlayerId = new Map(
    (leagueMembershipsResult.data ?? [])
      .filter((membership) => typeof membership.player_id === "string")
      .map((membership) => [membership.player_id as string, membership])
  )

  const seasons: Season[] = (seasonsResult.data ?? []).map((season) => ({
    id: season.id,
    leagueId: season.league_id,
    name: season.name,
    status: season.status === "finished" ? "finished" : season.status === "upcoming" ? "upcoming" : "active",
    totalRounds: season.total_rounds,
    completedRounds: season.completed_rounds,
  }))
  const playerProfiles: PlayerProfile[] = (playersResult.data ?? []).map(
    (player) => {
      const membership = membershipByPlayerId.get(player.id)
      const linkedUser = membership?.user_id
        ? linkedUsersById.get(membership.user_id)
        : null

      return {
        id: player.id,
        leagueId: player.league_id,
        slug: player.slug,
        displayName: player.display_name,
        avatarInitials: player.avatar_initials,
        userId: membership?.user_id ?? null,
        avatarUrl: linkedUser?.avatarUrl ?? (typeof player.avatar_url === "string" ? player.avatar_url : null),
      }
    }
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
    manualActiveRound:
      typeof settings.manual_active_round === "number"
        ? settings.manual_active_round
        : null,
    manualCompletedRounds: Array.isArray(settings.manual_completed_rounds)
      ? settings.manual_completed_rounds.filter(
          (round): round is number => typeof round === "number"
        )
      : [],
  }))
  const matches: MatchData[] = (matchesResult.data ?? []).map((match) =>
    mapSupabaseMatch(match)
  )
  const memberships: UserLeagueMembership[] = (
    leagueMembershipsResult.data ?? []
  )
    .map((membership) => ({
      userId:
        membership.user_id === user.id
          ? normalizedEmail
          : `__claimed__:${membership.user_id}`,
      leagueId: membership.league_id,
      playerId: membership.player_id ?? "",
      role: toRole(membership.role),
    }))
    .filter(
      (membership) => !(isSuperuser && membership.userId === normalizedEmail)
    )

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
