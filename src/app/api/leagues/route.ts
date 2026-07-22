import { NextResponse } from "next/server"
import { normalizeLeagueLocations } from "@/lib/leagueLocations"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody } from "@/lib/serverRequest"
import type { League, UserLeagueMembership } from "@/data/fakeData"
import type { SeasonSnapshot } from "@/context/SeasonSettingsProvider"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreateLeagueBody = {
  leagueName?: unknown
  leagueDescription?: unknown
  leagueSlug?: unknown
  inviteCode?: unknown
  locations?: unknown
}

type SupabaseErrorLike = {
  code?: string
  message?: string
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeInviteCode(value: unknown) {
  return cleanString(value).toUpperCase()
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as SupabaseErrorLike).code === "23505"
  )
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
    showHistoricalProfileStats: league.show_historical_profile_stats === true,
    createdByUserId:
      typeof league.created_by_user_id === "string"
        ? league.created_by_user_id
        : null,
  }
}

async function insertLeagueWithAvailableSlug({
  supabase,
  leagueSlug,
  leagueName,
  leagueDescription,
  inviteCode,
  creatorUserId,
  locations,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>
  leagueSlug: string
  leagueName: string
  leagueDescription: string
  inviteCode: string
  creatorUserId: string
  locations: unknown
}) {
  let lastError: unknown = null

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slugCandidate =
      attempt === 0 ? leagueSlug : `${leagueSlug}-${attempt + 1}`
    const { data, error } = await supabase
      .from("leagues")
      .insert({
        slug: slugCandidate,
        name: leagueName,
        description: leagueDescription,
        invite_code: inviteCode,
        join_mode: "closed",
        created_by_user_id: creatorUserId,
        locations: normalizeLeagueLocations(locations),
        status_colors_enabled: true,
        show_ranking_avatars: true,
        show_historical_profile_stats: false,
      })
      .select(
        "id,slug,name,description,invite_code,join_mode,active_season_id,locations,logo_url,status_colors_enabled,show_ranking_avatars,show_historical_profile_stats,created_by_user_id"
      )
      .single()

    if (!error && data) {
      return data as Record<string, unknown>
    }

    lastError = error

    if (!isUniqueViolation(error)) {
      throw error
    }
  }

  throw lastError ?? new Error("league_create_failed")
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  const {
    supabase,
    user: { id, email, isSuperuser, canCreateLeagues },
  } = authResult.actor
  const body = await parseJsonBody<CreateLeagueBody>(request)
  const leagueName = cleanString(body?.leagueName)
  const leagueDescription = cleanString(body?.leagueDescription)
  const leagueSlug = cleanString(body?.leagueSlug)
  const inviteCode = normalizeInviteCode(body?.inviteCode)

  if (!leagueName || !leagueSlug || !inviteCode) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const canCreate = isSuperuser || canCreateLeagues

  if (!canCreate) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  try {
    const leagueRow = await insertLeagueWithAvailableSlug({
      supabase,
      leagueSlug,
      leagueName,
      leagueDescription,
      inviteCode,
      creatorUserId: id,
      locations: body?.locations,
    })
    const creatorIsSuperuser = isSuperuser

    if (!creatorIsSuperuser) {
      const { error: membershipError } = await supabase
        .from("league_memberships")
        .insert({
          user_id: id,
          league_id: leagueRow.id,
          player_id: null,
          role: "creator",
        })

      if (membershipError) {
        throw membershipError
      }
    }

    const { error: inviteError } = await supabase.from("invites").insert({
      league_id: leagueRow.id,
      code: inviteCode,
      created_by_user_id: id,
    })

    if (inviteError) {
      throw inviteError
    }

    const league = mapLeague(leagueRow)
    const membership: UserLeagueMembership | null = creatorIsSuperuser
      ? null
      : {
          userId: email,
          leagueId: league.id,
          playerId: "",
          role: "creator",
        }
    const seasonSnapshot: SeasonSnapshot = {
      seasons: [],
      playerProfiles: [],
      seasonPlayers: [],
      seasonSettings: [],
      activeSeasonIds: {
        [league.id]: "",
      },
    }

    if (!uuidPattern.test(league.id)) {
      throw new Error("invalid_created_league_id")
    }

    return NextResponse.json({ league, membership, seasonSnapshot })
  } catch {
    return NextResponse.json({ error: "league_create_failed" }, { status: 500 })
  }
}
