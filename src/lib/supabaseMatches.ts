import { supabase } from "@/lib/supabase"
import type { MatchData, MatchStatus } from "@/context/MatchDataProvider"

const matchSelect =
  "id,league_id,season_id,round,status,team_a,team_b,points_a,points_b,sets,scheduled_at,date_label,location,result_recorded_at"

type MatchSet = {
  a: number
  b: number
}

type MatchResultInput = {
  sets: MatchSet[]
}

function toMatchStatus(status: unknown): MatchStatus {
  return status === "finished" ||
    status === "scheduled" ||
    status === "postponed" ||
    status === "scheduling"
    ? status
    : "scheduling"
}

function toMatchSets(value: unknown): MatchSet[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((set) => {
      if (typeof set !== "object" || set === null) {
        return null
      }

      const item = set as Record<string, unknown>
      const a = Number(item.a)
      const b = Number(item.b)

      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return null
      }

      return { a, b }
    })
    .filter((set): set is MatchSet => Boolean(set))
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

function mapSupabaseMatch(match: Record<string, unknown>): MatchData {
  return {
    id: String(match.id),
    leagueId: String(match.league_id),
    seasonId: String(match.season_id),
    round: Number(match.round),
    status: toMatchStatus(match.status),
    teamA: toStringArray(match.team_a),
    teamB: toStringArray(match.team_b),
    pointsA: typeof match.points_a === "number" ? match.points_a : null,
    pointsB: typeof match.points_b === "number" ? match.points_b : null,
    sets: toMatchSets(match.sets),
    scheduledAt:
      typeof match.scheduled_at === "string" ? match.scheduled_at : null,
    dateLabel: typeof match.date_label === "string" ? match.date_label : null,
    location: typeof match.location === "string" ? match.location : null,
    resultRecordedAt:
      typeof match.result_recorded_at === "string"
        ? match.result_recorded_at
        : null,
  }
}

function calculateResultPoints(sets: MatchSet[]) {
  const pointsA = sets.filter((set) => set.a > set.b).length
  const pointsB = sets.filter((set) => set.b > set.a).length

  return {
    pointsA,
    pointsB,
  }
}

export function formatScheduleDateLabel(scheduledAt: string) {
  const date = new Date(scheduledAt)

  if (Number.isNaN(date.getTime())) {
    return scheduledAt
  }

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export async function updateSupabaseMatchSchedule({
  matchId,
  scheduledAt,
  location,
}: {
  matchId: string
  scheduledAt: string
  location: string
}) {
  const { data, error } = await supabase
    .from("matches")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt,
      date_label: formatScheduleDateLabel(scheduledAt),
      location,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    throw error
  }

  return mapSupabaseMatch(data)
}

export async function postponeSupabaseMatch(matchId: string) {
  const { data, error } = await supabase
    .from("matches")
    .update({
      status: "postponed",
      scheduled_at: null,
      date_label: null,
      location: null,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    throw error
  }

  return mapSupabaseMatch(data)
}

export async function finishSupabaseMatch({
  matchId,
  result,
}: {
  matchId: string
  result: MatchResultInput
}) {
  const points = calculateResultPoints(result.sets)
  const resultRecordedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from("matches")
    .update({
      status: "finished",
      sets: result.sets,
      points_a: points.pointsA,
      points_b: points.pointsB,
      result_recorded_at: resultRecordedAt,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    throw error
  }

  return mapSupabaseMatch(data)
}