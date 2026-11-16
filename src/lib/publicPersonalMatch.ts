import { getScheduleLocationDisplayText } from "@/lib/leagueLocations"
import type { PersonalMatchSet } from "@/lib/personalMatches"

/**
 * Read-only projection of a friendly match for anyone holding its share link.
 * It deliberately carries no ids, accounts, avatars, chat, payments or
 * bookings: only what is needed to follow the match.
 */
export type PublicPersonalMatch = {
  status: "scheduled" | "finished"
  scheduledAt: string | null
  location: string | null
  teams: [string[], string[]]
  sets: PersonalMatchSet[]
}

export type PublicPersonalMatchPayload = {
  match: PublicPersonalMatch
  /** `participant` viewers are sent to the full match; everyone else stays read-only. */
  viewer: "participant" | "spectator"
  /** Only present for participants, so the page can open the editable match. */
  matchId: string | null
}

type PublicPersonalMatchRow = {
  played_at: string | null
  location_name: string | null
  sets: unknown
  status: string | null
}

type PublicPersonalMatchParticipantRow = {
  team: number
  slot: number
  display_name: string | null
}

function normalizeSets(value: unknown): PersonalMatchSet[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((set) => {
    const candidate = set as { a?: unknown; b?: unknown } | null
    return Number.isInteger(candidate?.a) && Number.isInteger(candidate?.b)
      ? [{ a: candidate!.a as number, b: candidate!.b as number }]
      : []
  })
}

export function sanitizePublicPersonalMatch(
  row: PublicPersonalMatchRow,
  participants: PublicPersonalMatchParticipantRow[],
): PublicPersonalMatch {
  const teamNames = (team: number) =>
    participants
      .filter((participant) => participant.team === team)
      .sort((left, right) => left.slot - right.slot)
      .map((participant) => participant.display_name?.trim().slice(0, 60) || "Jugador")
  const finished = row.status === "finished"
  const location = getScheduleLocationDisplayText(row.location_name)

  return {
    status: finished ? "finished" : "scheduled",
    scheduledAt: row.played_at,
    location: location ? location.slice(0, 120) : null,
    teams: [teamNames(1), teamNames(2)],
    sets: finished ? normalizeSets(row.sets) : [],
  }
}
