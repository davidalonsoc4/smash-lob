import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { buildUserAvatarLookup, resolvePlayerAvatarUrl } from "@/lib/avatarResolution"
import { normalizeLeagueLocations } from "@/lib/leagueLocations"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { validateUuid } from "@/lib/serverRequest"
import { normalizeSeasonRegistrationFee } from "@/lib/seasonRegistration"
import type { RoundWindowMode, SeasonRoundSettings } from "@/context/SeasonSettingsProvider"
import type { League, LeagueMemberRole, PlayerProfile, Season, SeasonPlayer, UserLeagueMembership } from "@/data/fakeData"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
  status_colors_enabled?: boolean | null
  show_ranking_avatars?: boolean | null
  show_historical_profile_stats?: boolean | null
  created_by_user_id?: string | null
}

type SupabaseInviteRow = {
  league_id: string
}

type SerializedError = {
  stage?: string
  code?: string
}

const leagueInviteSelect =
  "id,slug,name,description,invite_code,join_mode,active_season_id,locations,logo_url,status_colors_enabled,show_ranking_avatars,show_historical_profile_stats,created_by_user_id"
const seasonSettingsSelect =
  "league_id,season_id,round_window_mode,season_starts_at,round_window_days,requires_three_sets,mvp_system,result_confirmation_mode,manual_active_round,manual_completed_rounds,registration_fee,roster_mode,player_capacity,registration_open,roster_completed_at,schedule_mode,calendar_mode,allow_player_incidents,allow_player_substitutions"
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

function mapLeague(league: SupabaseLeagueRow): League {
  return {
    id: league.id,
    slug: league.slug,
    name: league.name,
    description: league.description ?? "",
    activeSeasonId: league.active_season_id ?? "",
    inviteCode: league.invite_code,
    joinMode: league.join_mode === "open" ? "open" : "closed",
    locations: normalizeLeagueLocations(league.locations),
    logoUrl: typeof league.logo_url === "string" ? league.logo_url : null,
    statusColorsEnabled: league.status_colors_enabled !== false,
    showRankingAvatars: league.show_ranking_avatars !== false,
    showHistoricalProfileStats: league.show_historical_profile_stats === true,
    createdByUserId:
      typeof league.created_by_user_id === "string"
        ? league.created_by_user_id
        : null,
  }
}

function getErrorField(error: unknown, field: string) {
  if (typeof error !== "object" || error === null) {
    return null
  }

  const value = (error as Record<string, unknown>)[field]

  return typeof value === "string" ? value : null
}

function serializeError(error: unknown): SerializedError {
  return {
    stage: getErrorField(error, "stage") ?? undefined,
    code: getErrorField(error, "code") ?? undefined,
  }
}

function throwSupabaseError(stage: string, error: unknown): never {
  const serialized = serializeError(error)
  const enhancedError = new Error(stage)

  Object.assign(enhancedError, {
    stage,
    code: serialized.code,
  })

  throw enhancedError
}

async function fetchLeagueById(supabase: SupabaseClient, leagueId: string) {
  const { data, error } = await supabase
    .from("leagues")
    .select(leagueInviteSelect)
    .eq("id", leagueId)
    .maybeSingle()

  if (error) {
    throwSupabaseError("fetch_league_by_id", error)
  }

  return data ? (data as SupabaseLeagueRow) : null
}

async function fetchLeagueByInviteCode(
  supabase: SupabaseClient,
  code: string,
  leagueIdHint?: string | null
) {
  const normalizedCode = normalizeInviteCode(code)
  const cleanLeagueIdHint = leagueIdHint?.trim() || null
  const hintedLeague = cleanLeagueIdHint
    ? await fetchLeagueById(supabase, cleanLeagueIdHint)
    : null

  if (
    hintedLeague &&
    normalizeInviteCode(hintedLeague.invite_code) === normalizedCode
  ) {
    return hintedLeague
  }

  if (hintedLeague) {
    const { data: hintedInvites, error: hintedInviteError } = await supabase
      .from("invites")
      .select("league_id")
      .eq("league_id", hintedLeague.id)
      .eq("code", normalizedCode)
      .limit(1)

    if (hintedInviteError) {
      throwSupabaseError("fetch_hinted_invite", hintedInviteError)
    }

    if ((hintedInvites ?? []).some((invite) => invite.league_id)) {
      return hintedLeague
    }
  }

  const { data: directLeague, error: directLeagueError } = await supabase
    .from("leagues")
    .select(leagueInviteSelect)
    .eq("invite_code", normalizedCode)
    .maybeSingle()

  if (directLeagueError) {
    throwSupabaseError("fetch_league_by_active_code", directLeagueError)
  }

  if (directLeague) {
    return directLeague as SupabaseLeagueRow
  }

  const { data: invites, error: inviteError } = await supabase
    .from("invites")
    .select("league_id")
    .eq("code", normalizedCode)
    .limit(1)

  if (inviteError) {
    throwSupabaseError("fetch_invite_history", inviteError)
  }

  const invite = (invites ?? [])[0] as SupabaseInviteRow | undefined

  if (invite?.league_id) {
    return fetchLeagueById(supabase, invite.league_id)
  }

  return hintedLeague
}

async function fetchSeasonSettings(supabase: SupabaseClient, leagueId: string) {
  const { data, error } = await supabase
    .from("season_settings")
    .select(seasonSettingsSelect)
    .eq("league_id", leagueId)

  if (error) {
    return []
  }

  return data ?? []
}

async function fetchMatches(supabase: SupabaseClient, leagueId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("league_id", leagueId)

  if (error) {
    return []
  }

  return ((data ?? []) as Record<string, unknown>[]).map((match) =>
    mapSupabaseMatch(match)
  )
}

async function fetchAvatarUsers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("app_users")
    .select("id,email,display_name,avatar_url")

  if (error) {
    return []
  }

  return data ?? []
}

async function buildInviteResponse(
  supabase: SupabaseClient,
  normalizedCode: string,
  leagueIdHint: string | null
) {
  const leagueRow = await fetchLeagueByInviteCode(
    supabase,
    normalizedCode,
    leagueIdHint
  )

  if (!leagueRow) {
    return NextResponse.json({ snapshot: null }, { status: 404 })
  }

  const league = mapLeague(leagueRow)
  const [seasonsResult, playersResult, settingsRows, matches] =
    await Promise.all([
      supabase
        .from("seasons")
        .select("id,league_id,name,status,total_rounds,completed_rounds")
        .eq("league_id", league.id),
      supabase
        .from("players")
        .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
        .eq("league_id", league.id),
      fetchSeasonSettings(supabase, league.id),
      fetchMatches(supabase, league.id),
    ])

  if (seasonsResult.error) {
    throwSupabaseError("fetch_invite_seasons", seasonsResult.error)
  }

  if (playersResult.error) {
    throwSupabaseError("fetch_invite_players", playersResult.error)
  }

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
  const seasonIds = seasons.map((season) => season.id)
  const { data: seasonPlayerRows, error: seasonPlayersError } =
    seasonIds.length > 0
      ? await supabase
          .from("season_players")
          .select("season_id,player_id,status,joined_from_round,replaces_player_id,replaced_from_round,replaced_by_player_id")
          .in("season_id", seasonIds)
      : { data: [], error: null }

  if (seasonPlayersError) {
    throwSupabaseError("fetch_invite_season_players", seasonPlayersError)
  }

  const joinableSeason =
    seasons.find((season) => season.id === league.activeSeasonId) ??
    [...seasons].at(-1) ??
    null
  const { data: substituteRows, error: substitutesError } = joinableSeason
    ? await supabase
        .from("season_substitutes")
        .select("player_id")
        .eq("season_id", joinableSeason.id)
        .eq("active", true)
    : { data: [], error: null }

  if (substitutesError) {
    throwSupabaseError("fetch_invite_substitutes", substitutesError)
  }

  const { data: membershipRows, error: membershipsError } = await supabase
    .from("league_memberships")
    .select("user_id,league_id,player_id,role")
    .eq("league_id", league.id)

  if (membershipsError) {
    throwSupabaseError("fetch_invite_memberships", membershipsError)
  }

  const avatarUsers = await fetchAvatarUsers(supabase)
  const userAvatarLookup = buildUserAvatarLookup(
    avatarUsers.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null,
    }))
  )
  const membershipByPlayerId = new Map(
    (membershipRows ?? [])
      .filter((membership) => typeof membership.player_id === "string")
      .map((membership) => [membership.player_id as string, membership])
  )
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
  const seasonPlayers: SeasonPlayer[] = (seasonPlayerRows ?? []).map(
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
  const joinableSeasonPlayerIds = new Set(
    joinableSeason
      ? seasonPlayers
          .filter(
            (seasonPlayer) =>
              seasonPlayer.seasonId === joinableSeason.id &&
              seasonPlayer.status !== "withdrawn",
          )
          .map((seasonPlayer) => seasonPlayer.playerId)
      : [],
  )
  const claimablePlayerIds = Array.from(
    new Set([
      ...joinableSeasonPlayerIds,
      ...(substituteRows ?? []).map((row) => row.player_id),
    ]),
  )
  const seasonSettings: SeasonRoundSettings[] = settingsRows.map((settings) => ({
    leagueId: settings.league_id,
    seasonId: settings.season_id,
    roundWindowMode: toRoundWindowMode(settings.round_window_mode),
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
          (round: unknown): round is number => typeof round === "number"
        )
      : [],
    registrationFee: normalizeSeasonRegistrationFee(
      "registration_fee" in settings ? settings.registration_fee : undefined,
    ),
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
  const claimedMemberships: UserLeagueMembership[] = (
    membershipRows ?? []
  ).map((membership) => ({
    userId: "__claimed__",
    leagueId: membership.league_id,
    playerId: membership.player_id ?? "",
    role: toRole(membership.role),
  }))

  return NextResponse.json({
    snapshot: {
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
      claimablePlayerIds,
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const normalizedCode = normalizeInviteCode(decodeURIComponent(code ?? ""))
  const leagueIdHint = new URL(request.url).searchParams.get("leagueId")

  if (!normalizedCode) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 })
  }

  if (leagueIdHint && !validateUuid(leagueIdHint)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return NextResponse.json({ error: "missing_service_role" }, { status: 501 })
  }

  try {
    return await buildInviteResponse(supabase, normalizedCode, leagueIdHint)
  } catch (error) {
    return NextResponse.json(
      {
        error: "invite_lookup_failed",
        code: normalizedCode,
        leagueId: leagueIdHint,
        failures: [serializeError(error)],
      },
      { status: 500 }
    )
  }
}
