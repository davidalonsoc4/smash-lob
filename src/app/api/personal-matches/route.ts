import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import {
  normalizeBoundedText,
  parseJsonBody,
  validateIsoDateTime,
  validateMatchSets,
} from "@/lib/serverRequest"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { saveGlobalLocation } from "@/lib/serverGlobalLocations"
import { createLeagueLocation } from "@/lib/leagueLocations"
import type { PersonalMatchStatus } from "@/lib/personalMatches"
import {
  loadPersonalMatchesDashboard,
  resolvePersonalMatchParticipantDrafts,
} from "@/lib/serverPersonalMatches"
import { normalizePersonalMatchParticipantDrafts } from "@/lib/serverPersonalMatchRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreatePersonalMatchBody = {
  scheduledAt?: unknown
  locationName?: unknown
  sets?: unknown
  status?: unknown
  participants?: unknown
}

function normalizeStatus(value: unknown): PersonalMatchStatus | null {
  return value === "scheduled" || value === "finished" ? value : null
}

function parseListNumber(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(0, parsed))
}

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const url = new URL(request.url)
  const offset = parseListNumber(url.searchParams.get("offset"), 0, 100_000)
  const limit = Math.max(1, parseListNumber(url.searchParams.get("limit"), 10, 50))
  const includeUpcoming = url.searchParams.get("includeUpcoming") !== "0"
  const includeAvatars = url.searchParams.get("includeAvatars") === "1"

  try {
    const payload = await loadPersonalMatchesDashboard(authResult.actor, {
      offset,
      limit,
      includeUpcoming,
      includeAvatars,
    })
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: "personal_matches_lookup_failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "personal_match_create",
    limit: 20,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await parseJsonBody<CreatePersonalMatchBody>(request)
  const scheduledAt = validateIsoDateTime(body?.scheduledAt)
  const locationName = normalizeBoundedText(body?.locationName, 120) || null
  const status = normalizeStatus(body?.status)
  const drafts = normalizePersonalMatchParticipantDrafts(body?.participants)
  const sets = status === "scheduled" ? [] : validateMatchSets(body?.sets)

  if (!scheduledAt || !status || !drafts || !sets) {
    return NextResponse.json({ error: "invalid_personal_match" }, { status: 400 })
  }

  const timestamp = Date.parse(scheduledAt)
  const earliest = Date.UTC(2000, 0, 1)
  const latestFinished = Date.now() + 24 * 60 * 60 * 1000
  const earliestScheduled = Date.now() - 15 * 60 * 1000
  if (
    timestamp < earliest ||
    (status === "finished" && timestamp > latestFinished) ||
    (status === "scheduled" && timestamp < earliestScheduled)
  ) {
    return NextResponse.json({ error: "invalid_personal_match_date" }, { status: 400 })
  }

  if (status === "finished") {
    const teamAWins = sets.filter((set) => set.a > set.b).length
    const teamBWins = sets.filter((set) => set.b > set.a).length
    if (teamAWins === teamBWins) {
      return NextResponse.json({ error: "personal_match_requires_winner" }, { status: 400 })
    }
  }

  try {
    const participants = await resolvePersonalMatchParticipantDrafts(
      authResult.actor,
      drafts,
    )

    const { data, error } = await authResult.actor.supabase.rpc(
      "server_create_personal_match",
      {
        p_created_by_user_id: authResult.actor.user.id,
        p_played_at: scheduledAt,
        p_location_name: locationName,
        p_sets: sets,
        p_participants: participants,
        p_status: status,
      },
    )

    if (error || typeof data !== "string") {
      return NextResponse.json({ error: "personal_match_create_failed" }, { status: 500 })
    }

    if (locationName) {
      const globalLocation = createLeagueLocation({
        name: locationName,
        town: null,
        address: null,
        courtCount: null,
        selectedCourt: null,
        googlePlaceId: null,
        googlePlaceName: null,
        googleMapsUrl: null,
        latitude: null,
        longitude: null,
      })

      if (globalLocation) {
        await saveGlobalLocation(authResult.actor.supabase, globalLocation).catch(() => null)
      }
    }

    return NextResponse.json({ id: data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "personal_match_create_failed"
    if (
      message === "duplicate_personal_match_person" ||
      message === "invalid_personal_match_person" ||
      message === "personal_match_requires_current_user"
    ) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    return NextResponse.json({ error: "personal_match_create_failed" }, { status: 500 })
  }
}
