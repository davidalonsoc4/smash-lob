import { supabase } from "@/lib/supabase"
import { upsertAppUser } from "@/lib/supabaseUsers"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import { normalizeSeasonRegistrationFee } from "@/lib/seasonRegistration"
import {
  buildUserAvatarLookup,
  resolvePlayerAvatarUrl,
} from "@/lib/avatarResolution"
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
import { normalizeLeagueLocations } from "@/lib/leagueLocations"

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
  created_by_user_id?: string | null
}

type SupabaseInviteRow = {
  league_id: string
}

const leagueInviteSelect =
  "id,slug,name,description,invite_code,join_mode,active_season_id,locations,logo_url,status_colors_enabled,created_by_user_id"

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
    createdByUserId:
      typeof league.created_by_user_id === "string"
        ? league.created_by_user_id
        : null,
  }
}

async function fetchLeagueById(leagueId: string) {
  const { data, error } = await supabase
    .from("leagues")
    .select(leagueInviteSelect)
    .eq("id", leagueId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? (data as SupabaseLeagueRow) : null
}

async function fetchLeagueByInviteCode(
  code: string,
  leagueIdHint?: string | null
) {
  const normalizedCode = normalizeInviteCode(code)
  const cleanLeagueIdHint = leagueIdHint?.trim() || null
  const hintedLeague = cleanLeagueIdHint
    ? await fetchLeagueById(cleanLeagueIdHint)
    : null

  if (
    hintedLeague &&
    normalizeInviteCode(hintedLeague.invite_code) === normalizedCode
  ) {
    return hintedLeague
  }

  if (hintedLeague) {
    const { data: hintedInvite, error: hintedInviteError } = await supabase
      .from("invites")
      .select("league_id")
      .eq("league_id", hintedLeague.id)
      .eq("code", normalizedCode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (hintedInviteError) {
      throw hintedInviteError
    }

    if (hintedInvite?.league_id) {
      return hintedLeague
    }
  }

  const { data: directLeague, error: directLeagueError } = await supabase
    .from("leagues")
    .select(leagueInviteSelect)
    .eq("invite_code", normalizedCode)
    .maybeSingle()

  if (directLeagueError) {
    throw directLeagueError
  }

  if (directLeague) {
    return directLeague as SupabaseLeagueRow
  }

  const { data: invite, error: inviteError } = await supabase
    .from("invites")
    .select("league_id")
    .eq("code", normalizedCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (inviteError) {
    throw inviteError
  }

  if (invite?.league_id) {
    return fetchLeagueById((invite as SupabaseInviteRow).league_id)
  }

  // Fallback defensivo para enlaces generados durante la transición:
  // si la URL incluye leagueId, ese enlace ya es una invitación privada.
  // Evita que un código antiguo quede inutilizable si falló el histórico.
  return hintedLeague
}

async function fetchSupabaseInviteSnapshotFromApi(
  code: string,
  leagueIdHint?: string | null
): Promise<SupabaseInviteSnapshot | null> {
  const normalizedCode = normalizeInviteCode(code)

  if (!normalizedCode || typeof window === "undefined") {
    return null
  }

  const inviteUrl = new URL(
    `/api/invites/${encodeURIComponent(normalizedCode)}`,
    window.location.origin
  )
  const cleanLeagueIdHint = leagueIdHint?.trim()

  if (cleanLeagueIdHint) {
    inviteUrl.searchParams.set("leagueId", cleanLeagueIdHint)
  }

  const response = await fetch(inviteUrl.toString(), { cache: "no-store" })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`invite-api-${response.status}`)
  }

  const payload = (await response.json()) as {
    snapshot?: SupabaseInviteSnapshot | null
  }

  return payload.snapshot ?? null
}

async function fetchSupabaseInviteSnapshotDirect(
  code: string,
  leagueIdHint?: string | null
): Promise<SupabaseInviteSnapshot | null> {
  const leagueRow = await fetchLeagueByInviteCode(code, leagueIdHint)

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
          "league_id,season_id,round_window_mode,season_starts_at,round_window_days,requires_three_sets,manual_active_round,manual_completed_rounds,registration_fee,mvp_system"
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
          .select("season_id,player_id")
          .in("season_id", seasonIds)
      : { data: [], error: null }

  if (seasonPlayersError) throw seasonPlayersError

  const { data: membershipRows, error: membershipsError } = await supabase
    .from("league_memberships")
    .select("user_id,league_id,player_id,role")
    .eq("league_id", league.id)

  if (membershipsError) throw membershipsError

  const { data: avatarUsers, error: avatarUsersError } = await supabase
    .from("app_users")
    .select("id,email,display_name,avatar_url")

  if (avatarUsersError) throw avatarUsersError

  const userAvatarLookup = buildUserAvatarLookup(
    (avatarUsers ?? []).map((user) => ({
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
    manualActiveRound:
      typeof settings.manual_active_round === "number"
        ? settings.manual_active_round
        : null,
    manualCompletedRounds: Array.isArray(settings.manual_completed_rounds)
      ? settings.manual_completed_rounds.filter(
          (round: unknown): round is number => typeof round === "number"
        )
      : [],
    registrationFee: normalizeSeasonRegistrationFee(settings.registration_fee),
    mvpMode:
      settings.mvp_system === "none" ||
      settings.mvp_system === "automatic" ||
      settings.mvp_system === "voting"
        ? settings.mvp_system
        : "automatic",
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

export async function fetchSupabaseInviteSnapshot(
  code: string,
  leagueIdHint?: string | null
): Promise<SupabaseInviteSnapshot | null> {
  try {
    return await fetchSupabaseInviteSnapshotFromApi(code, leagueIdHint)
  } catch {
    return fetchSupabaseInviteSnapshotDirect(code, leagueIdHint)
  }
}

export async function claimSupabasePlayer({
  email,
  displayName,
  avatarUrl,
  leagueId,
  playerId,
}: {
  email: string
  displayName?: string | null
  avatarUrl?: string | null
  leagueId: string
  playerId: string
}): Promise<ClaimPlayerResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await upsertAppUser({
    email: normalizedEmail,
    displayName,
    avatarUrl,
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
