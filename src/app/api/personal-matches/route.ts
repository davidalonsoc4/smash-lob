import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody, normalizeBoundedText, validateIsoDateTime, validateMatchSets } from "@/lib/serverRequest"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import type { PersonalMatchParticipantDraft } from "@/lib/personalMatches"
import {
  loadAccessiblePersonalMatchPeople,
  loadPersonalMatches,
  resolvePersonalMatchPerson,
} from "@/lib/serverPersonalMatches"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreatePersonalMatchBody = {
  playedAt?: unknown
  locationName?: unknown
  sets?: unknown
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

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const items = await loadPersonalMatches(authResult.actor)
    return NextResponse.json({ items })
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
  const playedAt = validateIsoDateTime(body?.playedAt)
  const locationName = normalizeBoundedText(body?.locationName, 120) || null
  const sets = validateMatchSets(body?.sets)
  const drafts = normalizeParticipantDrafts(body?.participants)

  if (!playedAt || !sets || !drafts) {
    return NextResponse.json({ error: "invalid_personal_match" }, { status: 400 })
  }

  const timestamp = Date.parse(playedAt)
  const earliest = Date.UTC(2000, 0, 1)
  const latest = Date.now() + 24 * 60 * 60 * 1000
  if (timestamp < earliest || timestamp > latest) {
    return NextResponse.json({ error: "invalid_personal_match_date" }, { status: 400 })
  }

  const teamAWins = sets.filter((set) => set.a > set.b).length
  const teamBWins = sets.filter((set) => set.b > set.a).length
  if (teamAWins === teamBWins) {
    return NextResponse.json({ error: "personal_match_requires_winner" }, { status: 400 })
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
        p_played_at: playedAt,
        p_location_name: locationName,
        p_sets: sets,
        p_participants: participants,
      },
    )

    if (error || typeof data !== "string") {
      return NextResponse.json({ error: "personal_match_create_failed" }, { status: 500 })
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
