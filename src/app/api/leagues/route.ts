import { NextResponse } from "next/server"
import { normalizeLeagueLocations } from "@/lib/leagueLocations"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import {
  normalizeBoundedText,
  parseJsonBody,
  validateInviteCode,
  validateUuid,
} from "@/lib/serverRequest"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
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
  leagueRecommendations?: unknown
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
    recommendations:
      typeof league.recommendations === "string" ? league.recommendations : "",
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
  recommendations,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>
  leagueSlug: string
  leagueName: string
  leagueDescription: string
  inviteCode: string
  creatorUserId: string
  locations: unknown
  recommendations: string
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
        recommendations,
        status_colors_enabled: true,
        show_ranking_avatars: true,
        show_historical_profile_stats: false,
      })
      .select(
        "id,slug,name,description,invite_code,join_mode,active_season_id,locations,logo_url,recommendations,status_colors_enabled,show_ranking_avatars,show_historical_profile_stats,created_by_user_id"
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
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "league_create",
    limit: 4,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

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
  const leagueName = normalizeBoundedText(body?.leagueName, 120)
  const leagueDescription = normalizeBoundedText(body?.leagueDescription, 1000)
  const leagueSlug = normalizeBoundedText(body?.leagueSlug, 80).toLowerCase()
  const inviteCode = validateInviteCode(body?.inviteCode)
  const leagueRecommendations = normalizeBoundedText(
    body?.leagueRecommendations,
    2000,
  )

  if (
    !leagueName ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(leagueSlug) ||
    !inviteCode
  ) {
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
      recommendations: leagueRecommendations,
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

    if (!validateUuid(league.id)) {
      throw new Error("invalid_created_league_id")
    }

    return NextResponse.json({ league, membership, seasonSnapshot })
  } catch {
    return NextResponse.json({ error: "league_create_failed" }, { status: 500 })
  }
}
