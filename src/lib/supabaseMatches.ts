import {
  MATCH_SCHEDULE_TIME_ZONE,
  parseMatchScheduleDate,
} from "@/lib/matchScheduleTime"
import { normalizeCourtBooking } from "@/lib/courtBooking"
import type {
  CourtBooking,
  CourtBookingReservation,
  CourtBookingTransfer,
  MatchData,
  MatchStatus,
} from "@/context/MatchDataProvider"

export const matchSelect =
  "id,league_id,season_id,round,status,team_a,team_b,points_a,points_b,sets,scheduled_at,date_label,location,result_recorded_at,result_reported_by_player_id,result_locked,court_reserved,booking_reservations,booking_transfers,booking_updated_at,incident_type,incident_status,incident_reason,incident_notes,incident_created_at,incident_resolved_at,resolution_type,ranking_counts"

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

function getCourtBookingReservationItems(
  value: unknown,
  key?: "reservations" | "ballPurchases"
) {
  if (key && typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    return Array.isArray(record[key]) ? record[key] : []
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value
}

function toCourtBookingReservations(
  value: unknown,
  key?: "reservations" | "ballPurchases"
): CourtBookingReservation[] {
  return getCourtBookingReservationItems(value, key)
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null
      }

      const reservation = item as Record<string, unknown>
      const playerId = String(reservation.playerId ?? reservation.player_id ?? "")
      const amount = Number(reservation.amount)

      if (!playerId || !Number.isFinite(amount)) {
        return null
      }

      return { playerId, amount }
    })
    .filter((item): item is CourtBookingReservation => Boolean(item))
}

function toCourtBookingTransfers(value: unknown): CourtBookingTransfer[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null
      }

      const transfer = item as Record<string, unknown>
      const id = String(transfer.id ?? "")
      const fromPlayerId = String(
        transfer.fromPlayerId ?? transfer.from_player_id ?? ""
      )
      const toPlayerId = String(transfer.toPlayerId ?? transfer.to_player_id ?? "")
      const amount = Number(transfer.amount)

      if (!id || !fromPlayerId || !toPlayerId || !Number.isFinite(amount)) {
        return null
      }

      return {
        id,
        fromPlayerId,
        toPlayerId,
        amount,
        isPaid: Boolean(transfer.isPaid ?? transfer.is_paid),
        paidAt:
          typeof transfer.paidAt === "string"
            ? transfer.paidAt
            : typeof transfer.paid_at === "string"
              ? transfer.paid_at
              : null,
      }
    })
    .filter((item): item is CourtBookingTransfer => Boolean(item))
}

function mapCourtBooking(row: Record<string, unknown>): CourtBooking {
  return normalizeCourtBooking({
    isReserved: Boolean(row.court_reserved),
    reservations: toCourtBookingReservations(
      row.booking_reservations,
      Array.isArray(row.booking_reservations) ? undefined : "reservations"
    ),
    ballPurchases: toCourtBookingReservations(
      row.booking_reservations,
      "ballPurchases"
    ),
    transfers: toCourtBookingTransfers(row.booking_transfers),
    updatedAt:
      typeof row.booking_updated_at === "string" ? row.booking_updated_at : null,
  })
}

export function mapSupabaseMatch(match: Record<string, unknown>): MatchData {
  const scheduledAt =
    typeof match.scheduled_at === "string" ? match.scheduled_at : null;

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
    scheduledAt,
    dateLabel: scheduledAt
      ? formatScheduleDateLabel(scheduledAt)
      : typeof match.date_label === "string"
        ? match.date_label
        : null,
    location: typeof match.location === "string" ? match.location : null,
    resultRecordedAt:
      typeof match.result_recorded_at === "string"
        ? match.result_recorded_at
        : null,
    resultReportedByPlayerId:
      typeof match.result_reported_by_player_id === "string"
        ? match.result_reported_by_player_id
        : null,
    resultLocked: Boolean(match.result_locked),
    rankingCounts: match.ranking_counts !== false,
    incidentType:
      match.incident_type === "injury" ||
      match.incident_type === "no_show" ||
      match.incident_type === "cancelled" ||
      match.incident_type === "disputed" ||
      match.incident_type === "other"
        ? match.incident_type
        : null,
    incidentStatus:
      match.incident_status === "open" || match.incident_status === "resolved"
        ? match.incident_status
        : null,
    incidentReason:
      typeof match.incident_reason === "string" ? match.incident_reason : null,
    incidentNotes:
      typeof match.incident_notes === "string" ? match.incident_notes : null,
    incidentCreatedAt:
      typeof match.incident_created_at === "string"
        ? match.incident_created_at
        : null,
    incidentResolvedAt:
      typeof match.incident_resolved_at === "string"
        ? match.incident_resolved_at
        : null,
    resolutionType:
      match.resolution_type === "played" ||
      match.resolution_type === "postponed" ||
      match.resolution_type === "cancelled" ||
      match.resolution_type === "no_show" ||
      match.resolution_type === "abandoned" ||
      match.resolution_type === "administrative"
        ? match.resolution_type
        : null,
    courtBooking: mapCourtBooking(match),
  }
}

export function formatScheduleDateLabel(scheduledAt: string) {
  const date = parseMatchScheduleDate(scheduledAt)

  if (!date) {
    return scheduledAt
  }

  const label = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MATCH_SCHEDULE_TIME_ZONE,
  }).format(date)

  return label.charAt(0).toLocaleUpperCase("es-ES") + label.slice(1)
}

async function readMatchResponse(response: Response, errorPrefix: string) {
  if (!response.ok) {
    throw new Error(`${errorPrefix}-${response.status}`)
  }

  const payload = (await response.json()) as { match?: MatchData }

  if (!payload.match) {
    throw new Error(`${errorPrefix}-empty`)
  }

  return payload.match
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
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/schedule`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt, location }),
      cache: "no-store",
    }
  )

  return readMatchResponse(response, "match-schedule-api")
}

export async function postponeSupabaseMatch(matchId: string) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/postpone`,
    {
      method: "POST",
      cache: "no-store",
    }
  )

  return readMatchResponse(response, "match-postpone-api")
}

export async function clearSupabaseMatchSchedule(matchId: string) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/schedule`,
    {
      method: "DELETE",
      cache: "no-store",
    }
  )

  return readMatchResponse(response, "match-schedule-clear-api")
}

export async function finishSupabaseMatch({
  matchId,
  result,
  reportedByPlayerId,
}: {
  matchId: string
  result: MatchResultInput
  reportedByPlayerId: string | null
}) {
  void reportedByPlayerId

  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/result`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sets: result.sets }),
      cache: "no-store",
    }
  )

  return readMatchResponse(response, "match-result-api")
}


export async function clearSupabaseMatchResult(matchId: string) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/result`,
    {
      method: "DELETE",
      cache: "no-store",
    }
  )

  return readMatchResponse(response, "match-result-clear-api")
}

export async function updateSupabaseMatchResultLock({
  matchId,
  locked,
}: {
  matchId: string
  locked: boolean
}) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/result-lock`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked }),
      cache: "no-store",
    }
  )

  return readMatchResponse(response, "match-result-lock-api")
}

export async function updateSupabaseCourtBooking({
  matchId,
  booking,
}: {
  matchId: string
  booking: CourtBooking
}) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/court-booking`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservations: booking.reservations,
        ballPurchases: booking.ballPurchases,
      }),
      cache: "no-store",
    }
  )

  return readMatchResponse(response, "match-court-booking-api")
}

export async function clearSupabaseCourtBooking(matchId: string) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/court-booking`,
    {
      method: "DELETE",
      cache: "no-store",
    }
  )

  return readMatchResponse(response, "match-court-booking-clear-api")
}

export async function updateSupabaseCourtBookingTransferPaymentStatus({
  matchId,
  transferId,
  isPaid,
}: {
  matchId: string
  transferId: string
  isPaid: boolean
}) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/court-booking/transfers/${encodeURIComponent(transferId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid }),
      cache: "no-store",
    }
  )

  return readMatchResponse(response, "match-court-booking-transfer-api")
}

export async function sendSupabaseCourtBookingPaymentReminder({
  matchId,
  transferIds,
}: {
  matchId: string
  transferIds?: string[]
}) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/court-booking/payment-reminder`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transferIds }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`match-court-booking-reminder-api-${response.status}`)
  }
}
