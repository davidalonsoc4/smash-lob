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
import type {
  PersonalMatchParticipantDraft,
  PersonalMatchStatus,
} from "@/lib/personalMatches"
import {
  loadAccessiblePersonalMatchPeople,
  loadPersonalMatchesDashboard,
  resolvePersonalMatchPerson,
} from "@/lib/serverPersonalMatches"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreatePersonalMatchBody = {
  scheduledAt?: unknown
  locationName?: unknown
  sets?: unknown
  status?: unknown
  participants?: unknown
}

function normalizeParticipantDrafts(value: unknown): PersonalMatchParticipantDraft[] | null {
  if (!Array.isArray(value) || value.length !== 4) return null

  const participants = value.map((item) => {
    if (!item || typeof item !== "object") return null
    const candidate = item as Record<string, unknown>
    const team = Number(candidate.team)
    const slot = Number(candidate.slot)
    const personKey =
      typeof candidate.personKey === "string" && candidate.personKey.trim()
        ? candidate.personKey.trim().slice(0, 80)
        : null
    const displayName = normalizeBoundedText(candidate.displayName, 60)

    if ((team !== 1 && team !== 2) || (slot !== 1 && slot !== 2)) return null
    if (!personKey && displayName.length < 2) return null

    return {
      team: team as 1 | 2,
      slot: slot as 1 | 2,
      personKey,
      displayName,
    }
  })

  if (!participants.every((participant): participant is PersonalMatchParticipantDraft => Boolean(participant))) {
    return null
  }

  const slots = new Set(participants.map((participant) => `${participant.team}:${participant.slot}`))
  return slots.size === 4 ? participants : null
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

  try {
    const payload = await loadPersonalMatchesDashboard(authResult.actor, {
      offset,
      limit,
      includeUpcoming,
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
  const drafts = normalizeParticipantDrafts(body?.participants)
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
    const people = await loadAccessiblePersonalMatchPeople(authResult.actor)
    const usedPersonKeys = new Set<string>()
    let includesCurrentUser = false
    const participants = drafts.map((draft) => {
      if (!draft.personKey) {
        return {
          team: draft.team,
          slot: draft.slot,
          user_id: null,
          source_player_id: null,
          display_name: draft.displayName,
        }
      }

      if (usedPersonKeys.has(draft.personKey)) {
        throw new Error("duplicate_personal_match_person")
      }
      usedPersonKeys.add(draft.personKey)

      const person = resolvePersonalMatchPerson(people, draft.personKey)
      if (!person) throw new Error("invalid_personal_match_person")
      if (person.userId === authResult.actor.user.id) includesCurrentUser = true

      return {
        team: draft.team,
        slot: draft.slot,
        user_id: person.userId,
        source_player_id: person.sourcePlayerId,
        display_name: person.displayName,
      }
    })

    if (!includesCurrentUser) {
      return NextResponse.json({ error: "personal_match_requires_current_user" }, { status: 400 })
    }

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
    if (message === "duplicate_personal_match_person" || message === "invalid_personal_match_person") {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    return NextResponse.json({ error: "personal_match_create_failed" }, { status: 500 })
  }
}
