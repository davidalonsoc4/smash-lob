import { NextResponse } from "next/server"
import { buildUserAvatarLookup, resolvePlayerAvatarUrl } from "@/lib/avatarResolution"
import { normalizeLeagueLocations } from "@/lib/leagueLocations"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { normalizeSeasonRegistrationFee } from "@/lib/seasonRegistration"
import type { MatchData } from "@/context/MatchDataProvider"
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

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function toRole(role: unknown): LeagueMemberRole {
  return role === "creator" || role === "admin" || role === "player"
    ? role
    : "player"
}

function mapLeague(league: Record<string, unknown>): League {
  return {
    id: String(league.id),
    slug: String(league.slug),
    name: String(league.name),
    description: typeof league.description === "string" ? league.description : "",
    activeSeasonId:
      typeof league.active_season_id === "string" ? league.active_season_id : "",
    inviteCode: String(league.invite_code),
    joinMode: league.join_mode === "open" ? "open" : "closed",
    locations: normalizeLeagueLocations(league.locations),
    logoUrl: typeof league.logo_url === "string" ? league.logo_url : null,
    statusColorsEnabled: league.status_colors_enabled !== false,
    showRankingAvatars: league.show_ranking_avatars !== false,
    createdByUserId:
      typeof league.created_by_user_id === "string"
        ? league.created_by_user_id
        : null,
  }
}

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  const {
    supabase,
    user: { id: userId, email, isSuperuser, canCreateLeagues },
  } = authResult.actor

  const [ownMembershipResult, spectatorResult] = await Promise.all([
    supabase
      .from("league_memberships")
      .select("user_id,league_id,player_id,role")
      .eq("user_id", userId),
    supabase
      .from("league_spectators")
      .select("league_id")
      .eq("user_id", userId),
  ])

  if (ownMembershipResult.error || spectatorResult.error) {
    return NextResponse.json({ error: "access_lookup_failed" }, { status: 500 })
  }

  const ownMemberships: UserLeagueMembership[] = (ownMembershipResult.data ?? []).map(
    (membership) => ({
      userId: email,
      leagueId: membership.league_id,
      playerId: membership.player_id ?? "",
      role: toRole(membership.role),
    })
  )
  const memberLeagueIds = new Set(
    ownMemberships.map((membership) => membership.leagueId)
  )
  const spectatorLeagueIds = Array.from(
    new Set(
      (spectatorResult.data ?? [])
        .map((row) => row.league_id)
        .filter((leagueId): leagueId is string => typeof leagueId === "string")
    )
  )
  const effectiveSpectatorLeagueIds = spectatorLeagueIds.filter(
    (leagueId) => !memberLeagueIds.has(leagueId)
  )
  const accessibleLeagueIds = new Set([
    ...memberLeagueIds,
    ...effectiveSpectatorLeagueIds,
  ])

  if (!isSuperuser && accessibleLeagueIds.size === 0) {
    const emptySeasonSnapshot: SeasonSnapshot = {
      seasons: [],
      playerProfiles: [],
      seasonPlayers: [],
      seasonSettings: [],
      activeSeasonIds: {},
    }

    return NextResponse.json({
      isSuperuser,
      canCreateLeagues,
      leagues: [],
      memberships: ownMemberships,
      spectatorLeagueIds: effectiveSpectatorLeagueIds,
      matches: [],
      seasonSnapshot: emptySeasonSnapshot,
    })
  }

  const leaguesQuery = supabase
    .from("leagues")
    .select(
      "id,slug,name,description,invite_code,join_mode,active_season_id,locations,logo_url,status_colors_enabled,show_ranking_avatars,created_by_user_id"
    )

  if (!isSuperuser) {
    leaguesQuery.in("id", Array.from(accessibleLeagueIds))
  }

  const { data: leagueRows, error: leaguesError } = await leaguesQuery

  if (leaguesError) {
    return NextResponse.json({ error: "league_snapshot_failed" }, { status: 500 })
  }

  const leagues = (leagueRows ?? []).map((league) => mapLeague(league))
  const leagueIds = leagues.map((league) => league.id)

  if (leagueIds.length === 0) {
    const emptySeasonSnapshot: SeasonSnapshot = {
      seasons: [],
      playerProfiles: [],
      seasonPlayers: [],
      seasonSettings: [],
      activeSeasonIds: {},
    }

    return NextResponse.json({
      isSuperuser,
      canCreateLeagues,
      leagues,
      memberships: isSuperuser ? [] : ownMemberships,
      spectatorLeagueIds: effectiveSpectatorLeagueIds,
      matches: [],
      seasonSnapshot: emptySeasonSnapshot,
    })
  }

  const [
    seasonsResult,
    playersResult,
    seasonPlayersResult,
    settingsResult,
    matchesResult,
    matchSubstitutionsResult,
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
      .select("season_id,player_id,status,joined_from_round,replaces_player_id,replaced_from_round,replaced_by_player_id,seasons!inner(league_id)")
      .in("seasons.league_id", leagueIds),
    supabase
      .from("season_settings")
      .select(
        "league_id,season_id,round_window_mode,season_starts_at,round_window_days,requires_three_sets,mvp_system,result_confirmation_mode,manual_active_round,manual_completed_rounds,registration_fee,roster_mode,player_capacity,registration_open,roster_completed_at,schedule_mode,calendar_mode,allow_player_incidents,allow_player_substitutions"
      )
      .in("league_id", leagueIds),
    supabase.from("matches").select(matchSelect).in("league_id", leagueIds),
    supabase
      .from("match_substitutions")
      .select(
        "id,league_id,season_id,match_id,original_player_id,substitute_player_id,substitution_type"
      )
      .in("league_id", leagueIds),
    supabase
      .from("league_memberships")
      .select("user_id,league_id,player_id,role")
      .in("league_id", leagueIds),
  ])

  if (
    seasonsResult.error ||
    playersResult.error ||
    seasonPlayersResult.error ||
    settingsResult.error ||
    matchesResult.error ||
    matchSubstitutionsResult.error ||
    leagueMembershipsResult.error
  ) {
    return NextResponse.json({ error: "league_snapshot_failed" }, { status: 500 })
  }

  const linkedUserIds = Array.from(
    new Set(
      (leagueMembershipsResult.data ?? [])
        .map((membership) => membership.user_id)
        .filter((candidate): candidate is string => typeof candidate === "string")
    )
  )
  const { data: avatarUsers, error: avatarUsersError } =
    linkedUserIds.length > 0
      ? await supabase
          .from("app_users")
          .select("id,display_name,avatar_url")
          .in("id", linkedUserIds)
      : { data: [], error: null }

  if (avatarUsersError) {
    return NextResponse.json({ error: "avatar_lookup_failed" }, { status: 500 })
  }

  const userAvatarLookup = buildUserAvatarLookup(
    (avatarUsers ?? []).map((user) => ({
      id: user.id,
      displayName: user.display_name,
      avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null,
    }))
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
    status:
      season.status === "finished"
        ? "finished"
        : season.status === "upcoming"
          ? "upcoming"
          : "active",
    totalRounds: season.total_rounds,
    completedRounds: season.completed_rounds,
  }))
  const playerProfiles: PlayerProfile[] = (playersResult.data ?? []).map(
    (player) => {
      const membership = membershipByPlayerId.get(player.id)

      return {
        id: player.id,
        leagueId: player.league_id,
        slug: player.slug,
        displayName: player.display_name,
        avatarInitials: player.avatar_initials,
        userId: membership?.user_id ?? null,
        avatarUrl: resolvePlayerAvatarUrl({
          linkedUserId: membership?.user_id ?? null,
          playerDisplayName: player.display_name,
          playerAvatarUrl:
            typeof player.avatar_url === "string" ? player.avatar_url : null,
          users: userAvatarLookup,
        }),
      }
    }
  )
  const seasonPlayers: SeasonPlayer[] = (seasonPlayersResult.data ?? []).map(
    (seasonPlayer) => ({
      seasonId: seasonPlayer.season_id,
      playerId: seasonPlayer.player_id,
      status: seasonPlayer.status === "withdrawn" ? "withdrawn" : "active",
      joinedFromRound:
        typeof seasonPlayer.joined_from_round === "number"
          ? seasonPlayer.joined_from_round
          : null,
      replacesPlayerId:
        typeof seasonPlayer.replaces_player_id === "string"
          ? seasonPlayer.replaces_player_id
          : null,
      replacedFromRound:
        typeof seasonPlayer.replaced_from_round === "number"
          ? seasonPlayer.replaced_from_round
          : null,
      replacedByPlayerId:
        typeof seasonPlayer.replaced_by_player_id === "string"
          ? seasonPlayer.replaced_by_player_id
          : null,
    })
  )
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
    mvpSystem:
      settings.mvp_system === "none" || settings.mvp_system === "voting"
        ? settings.mvp_system
        : "automatic",
    resultConfirmationMode:
      settings.result_confirmation_mode === "required" ||
      settings.result_confirmation_mode === "none"
        ? settings.result_confirmation_mode
        : "optional",
    manualActiveRound:
      typeof settings.manual_active_round === "number"
        ? settings.manual_active_round
        : null,
    manualCompletedRounds: Array.isArray(settings.manual_completed_rounds)
      ? settings.manual_completed_rounds.filter(
          (round): round is number => typeof round === "number"
        )
      : [],
    registrationFee: normalizeSeasonRegistrationFee(settings.registration_fee),
    rosterMode:
      settings.roster_mode === "self_registration"
        ? "self_registration"
        : "fixed",
    playerCapacity:
      typeof settings.player_capacity === "number"
        ? settings.player_capacity
        : null,
    registrationOpen: Boolean(settings.registration_open),
    rosterCompletedAt:
      typeof settings.roster_completed_at === "string"
        ? settings.roster_completed_at
        : null,
    scheduleMode:
      settings.schedule_mode === "double" || settings.schedule_mode === "extended"
        ? settings.schedule_mode
        : "single",
    calendarMode: settings.calendar_mode === "manual" ? "manual" : "balanced",
    allowPlayerIncidents: settings.allow_player_incidents !== false,
    allowPlayerSubstitutions: settings.allow_player_substitutions !== false,
  }))
  const substitutionsByMatchId = new Map<
    string,
    NonNullable<MatchData["substitutions"]>
  >()

  for (const substitution of matchSubstitutionsResult.data ?? []) {
    const item = {
      id: substitution.id,
      leagueId: substitution.league_id,
      seasonId: substitution.season_id,
      matchId: substitution.match_id,
      originalPlayerId: substitution.original_player_id,
      substitutePlayerId: substitution.substitute_player_id,
      type:
        substitution.substitution_type === "permanent"
          ? ("permanent" as const)
          : ("single" as const),
    }
    const currentItems = substitutionsByMatchId.get(item.matchId) ?? []
    currentItems.push(item)
    substitutionsByMatchId.set(item.matchId, currentItems)
  }

  const matches: MatchData[] = (matchesResult.data ?? []).map((match) => {
    const mappedMatch = mapSupabaseMatch(match)

    return {
      ...mappedMatch,
      substitutions: substitutionsByMatchId.get(mappedMatch.id) ?? [],
    }
  })
  const memberships: UserLeagueMembership[] = (
    leagueMembershipsResult.data ?? []
  )
    .map((membership) => ({
      userId:
        membership.user_id === userId
          ? email
          : "__claimed__",
      leagueId: membership.league_id,
      playerId: membership.player_id ?? "",
      role: toRole(membership.role),
    }))
    .filter((membership) => !(isSuperuser && membership.userId === email))

  return NextResponse.json({
    isSuperuser,
    canCreateLeagues,
    leagues,
    memberships,
    spectatorLeagueIds: effectiveSpectatorLeagueIds,
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
  })
}
