import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { createLeagueLocation } from "@/lib/leagueLocations"
import { saveGlobalLocation } from "@/lib/serverGlobalLocations"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import {
  normalizeBoundedText,
  parseJsonBody,
  validateIsoDateTime,
  validateMatchSets,
  validateUuid,
} from "@/lib/serverRequest"
import {
  loadManageablePersonalMatch,
  loadPersonalMatch,
} from "@/lib/serverPersonalMatches"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdatePersonalMatchBody = {
  action?: unknown
  scheduledAt?: unknown
  locationName?: unknown
  sets?: unknown
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const matchId = validateUuid(id)
  if (!matchId) {
    return NextResponse.json({ error: "invalid_personal_match_id" }, { status: 400 })
  }

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const item = await loadPersonalMatch(authResult.actor, matchId)
    if (!item) {
      return NextResponse.json({ error: "personal_match_not_found" }, { status: 404 })
    }
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: "personal_match_lookup_failed" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "personal_match_update",
    limit: 40,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const { id } = await params
  const matchId = validateUuid(id)
  if (!matchId) {
    return NextResponse.json({ error: "invalid_personal_match_id" }, { status: 400 })
  }

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await parseJsonBody<UpdatePersonalMatchBody>(request)
  const action = body?.action
  if (action !== "schedule" && action !== "result") {
    return NextResponse.json({ error: "invalid_personal_match_update" }, { status: 400 })
  }

  try {
    const match = await loadManageablePersonalMatch(authResult.actor, matchId)
    if (!match) {
      return NextResponse.json({ error: "personal_match_not_found" }, { status: 404 })
    }
    if (match === "forbidden") {
      return NextResponse.json({ error: "personal_match_update_forbidden" }, { status: 403 })
    }

    const nowIso = new Date().toISOString()
    if (action === "schedule") {
      const scheduledAt = validateIsoDateTime(body?.scheduledAt)
      const timestamp = scheduledAt ? Date.parse(scheduledAt) : Number.NaN
      const earliest = Date.UTC(2000, 0, 1)
      const tooOldForScheduled = match.status === "scheduled" && timestamp < Date.now() - 15 * 60 * 1000
      const tooFarForFinished = match.status === "finished" && timestamp > Date.now() + 24 * 60 * 60 * 1000
      if (!scheduledAt || !Number.isFinite(timestamp) || timestamp < earliest || tooOldForScheduled || tooFarForFinished) {
        return NextResponse.json({ error: "invalid_personal_match_date" }, { status: 400 })
      }
      const locationName = normalizeBoundedText(body?.locationName, 120) || null

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
          await saveGlobalLocation(authResult.actor.supabase, globalLocation)
        }
      }

      const { error } = await authResult.actor.supabase
        .from("personal_matches")
        .update({
          played_at: scheduledAt,
          location_name: locationName,
          updated_at: nowIso,
        })
        .eq("id", matchId)

      if (error) {
        return NextResponse.json({ error: "personal_match_update_failed" }, { status: 500 })
      }
    } else {
      const sets = validateMatchSets(body?.sets)
      if (!sets) {
        return NextResponse.json({ error: "invalid_personal_match_result" }, { status: 400 })
      }
      const teamAWins = sets.filter((set) => set.a > set.b).length
      const teamBWins = sets.filter((set) => set.b > set.a).length
      if (teamAWins === teamBWins) {
        return NextResponse.json({ error: "personal_match_requires_winner" }, { status: 400 })
      }

      const { error } = await authResult.actor.supabase
        .from("personal_matches")
        .update({
          status: "finished",
          sets,
          result_recorded_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", matchId)

      if (error) {
        return NextResponse.json({ error: "personal_match_result_failed" }, { status: 500 })
      }
    }

    const item = await loadPersonalMatch(authResult.actor, matchId)
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: "personal_match_update_failed" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "personal_match_delete",
    limit: 20,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const { id } = await params
  const matchId = validateUuid(id)
  if (!matchId) {
    return NextResponse.json({ error: "invalid_personal_match_id" }, { status: 400 })
  }

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { data: match, error: matchError } = await authResult.actor.supabase
    .from("personal_matches")
    .select("id,created_by_user_id")
    .eq("id", matchId)
    .maybeSingle()

  if (matchError) {
    return NextResponse.json({ error: "personal_match_lookup_failed" }, { status: 500 })
  }
  if (!match) {
    return NextResponse.json({ error: "personal_match_not_found" }, { status: 404 })
  }
  if (match.created_by_user_id !== authResult.actor.user.id) {
    return NextResponse.json({ error: "personal_match_delete_forbidden" }, { status: 403 })
  }

  const { error } = await authResult.actor.supabase
    .from("personal_matches")
    .delete()
    .eq("id", matchId)

  if (error) {
    return NextResponse.json({ error: "personal_match_delete_failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
