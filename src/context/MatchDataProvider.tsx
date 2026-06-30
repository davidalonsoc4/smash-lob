"use client"

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useSession } from "next-auth/react"
import { allMatches } from "@/data/fakeData"
import { generateBalancedCalendar } from "@/lib/calendar"
import {
  buildCourtBooking,
  getEmptyCourtBooking,
  markCourtBookingTransferPaid,
  normalizeCourtBooking,
} from "@/lib/courtBooking"
import { recordActivityEvent, type ActivityEventType } from "@/lib/activity"
import {
  clearSupabaseMatchResult,
  finishSupabaseMatch,
  formatScheduleDateLabel,
  postponeSupabaseMatch,
  updateSupabaseCourtBooking,
  updateSupabaseMatchSchedule,
} from "@/lib/supabaseMatches"

export type MatchStatus = "finished" | "scheduling" | "scheduled" | "postponed"

export type CourtBookingReservation = {
  playerId: string
  amount: number
}

export type CourtBookingTransfer = {
  id: string
  fromPlayerId: string
  toPlayerId: string
  amount: number
  isPaid: boolean
  paidAt: string | null
}

export type CourtBooking = {
  isReserved: boolean
  reservations: CourtBookingReservation[]
  transfers: CourtBookingTransfer[]
  updatedAt: string | null
}

export type MatchData = {
  id: string
  leagueId: string
  seasonId: string
  round: number
  status: MatchStatus
  teamA: string[]
  teamB: string[]
  pointsA: number | null
  pointsB: number | null
  sets: { a: number; b: number }[]
  scheduledAt: string | null
  dateLabel: string | null
  location: string | null
  resultRecordedAt: string | null
  courtBooking: CourtBooking
}

type MatchScheduleInput = {
  scheduledAt: string
  location: string
}

type MatchResultInput = {
  sets: { a: number; b: number }[]
}

type CourtBookingInput = {
  participantIds: string[]
  reservations: CourtBookingReservation[]
}

type MatchDataContextValue = {
  matches: MatchData[]
  hydrateMatches: (matches: MatchData[]) => void
  createSeasonMatches: (settings: {
    leagueId: string
    seasonId: string
    playerIds: string[]
  }) => MatchData[]
  updateMatchSchedule: (
    matchId: string,
    schedule: MatchScheduleInput
  ) => Promise<boolean>
  postponeMatch: (matchId: string) => Promise<boolean>
  finishMatch: (matchId: string, result: MatchResultInput) => Promise<boolean>
  clearMatchResult: (matchId: string) => Promise<boolean>
  updateCourtBooking: (
    matchId: string,
    bookingInput: CourtBookingInput
  ) => Promise<boolean>
  clearCourtBooking: (matchId: string) => Promise<boolean>
  markCourtBookingTransferAsPaid: (
    matchId: string,
    transferId: string
  ) => Promise<boolean>
}

type MatchDataProviderProps = {
  children: React.ReactNode
}

const MatchDataContext = createContext<MatchDataContextValue | null>(null)

const storageKey = "smash-lob-matches"
const lastSupabaseErrorStorageKey = "smash-lob-last-supabase-error"
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeMatch(match: (typeof allMatches)[number]): MatchData {
  return {
    id: match.id,
    leagueId: match.leagueId,
    seasonId: match.seasonId,
    round: match.round,
    status: match.status as MatchStatus,
    teamA: [...match.teamA],
    teamB: [...match.teamB],
    pointsA: match.pointsA,
    pointsB: match.pointsB,
    sets: match.sets.map((set) => ({ ...set })),
    scheduledAt: match.scheduledAt,
    dateLabel: match.dateLabel,
    location: match.location,
    resultRecordedAt: match.resultRecordedAt ?? null,
    courtBooking: getEmptyCourtBooking(),
  }
}

function getInitialMatches() {
  return allMatches.map(normalizeMatch)
}

function sanitizeMatch(match: MatchData): MatchData {
  const cleanMatch = {
    ...match,
    courtBooking: normalizeCourtBooking(match.courtBooking),
  }

  if (cleanMatch.status !== "postponed") {
    return cleanMatch
  }

  return {
    ...cleanMatch,
    scheduledAt: null,
    dateLabel: null,
    location: null,
  }
}

function calculateResultPoints(sets: { a: number; b: number }[]) {
  const pointsA = sets.filter((set) => set.a > set.b).length
  const pointsB = sets.filter((set) => set.b > set.a).length

  return {
    pointsA,
    pointsB,
  }
}

function parseStoredMatches(value: string | null): MatchData[] | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return null
    }

    const initialMatches = getInitialMatches()

    const mergedInitialMatches = initialMatches.map((initialMatch) => {
      const storedMatch = parsed.find(
        (item: Partial<MatchData>) => item.id === initialMatch.id
      ) as Partial<MatchData> | undefined

      if (!storedMatch) {
        return initialMatch
      }

      const mergedMatch = {
        ...initialMatch,
        ...storedMatch,
        scheduledAt: storedMatch.scheduledAt ?? initialMatch.scheduledAt,
        dateLabel: storedMatch.dateLabel ?? initialMatch.dateLabel,
        location: storedMatch.location ?? initialMatch.location,
        resultRecordedAt:
          storedMatch.resultRecordedAt ?? initialMatch.resultRecordedAt,
        courtBooking: normalizeCourtBooking(storedMatch.courtBooking),
      }

      return sanitizeMatch(mergedMatch)
    })
    const extraMatches = parsed.filter((storedMatch: Partial<MatchData>) => {
      return (
        typeof storedMatch.id === "string" &&
        !initialMatches.some((initialMatch) => initialMatch.id === storedMatch.id)
      )
    }) as MatchData[]

    return [...mergedInitialMatches, ...extraMatches.map(sanitizeMatch)]
  } catch {
    return null
  }
}

function mergeMatches(current: MatchData[], incoming: MatchData[]) {
  const items = new Map(current.map((match) => [match.id, match]))

  incoming.forEach((match) => {
    items.set(match.id, sanitizeMatch(match))
  })

  return Array.from(items.values())
}

function replaceMatch(currentMatches: MatchData[], updatedMatch: MatchData) {
  const exists = currentMatches.some((match) => match.id === updatedMatch.id)

  if (!exists) {
    return [...currentMatches, sanitizeMatch(updatedMatch)]
  }

  return currentMatches.map((match) =>
    match.id === updatedMatch.id ? sanitizeMatch(updatedMatch) : match
  )
}

function isSupabaseBackedMatch(matchId: string) {
  return supabaseUuidPattern.test(matchId)
}

function recordSupabaseError(action: string, error: unknown) {
  const details =
    typeof error === "object" && error !== null
      ? error
      : { message: String(error) }

  window.localStorage.setItem(
    lastSupabaseErrorStorageKey,
    JSON.stringify({
      action,
      ...details,
      createdAt: new Date().toISOString(),
    })
  )
}

function getLocalScheduledMatch(
  match: MatchData,
  schedule: MatchScheduleInput
): MatchData {
  return {
    ...match,
    status: match.status === "finished" ? "finished" : "scheduled",
    scheduledAt: schedule.scheduledAt,
    dateLabel: formatScheduleDateLabel(schedule.scheduledAt),
    location: schedule.location,
  }
}

function getLocalPostponedMatch(match: MatchData): MatchData {
  if (match.status === "finished") {
    return match
  }

  return {
    ...match,
    status: "postponed",
    scheduledAt: null,
    dateLabel: null,
    location: null,
  }
}

function getLocalFinishedMatch(
  match: MatchData,
  result: MatchResultInput
): MatchData {
  const points = calculateResultPoints(result.sets)

  return {
    ...match,
    status: "finished",
    sets: result.sets,
    pointsA: points.pointsA,
    pointsB: points.pointsB,
    resultRecordedAt: new Date().toISOString(),
  }
}

function getLocalClearedResultMatch(match: MatchData): MatchData {
  return {
    ...match,
    status: match.scheduledAt ? "scheduled" : "scheduling",
    sets: [],
    pointsA: null,
    pointsB: null,
    resultRecordedAt: null,
  }
}

function getSetsSummary(sets: { a: number; b: number }[]) {
  if (sets.length === 0) {
    return "sin juegos registrados"
  }

  return sets.map((set) => `${set.a}-${set.b}`).join(", ")
}

function getResultSummary(match: MatchData) {
  if (match.pointsA === null || match.pointsB === null) {
    return "Resultado sin puntos registrados"
  }

  return `Sets ${match.pointsA}-${match.pointsB} · Juegos: ${getSetsSummary(match.sets)}`
}

function getBookingTotal(match: MatchData) {
  return match.courtBooking.reservations.reduce(
    (total, reservation) => total + reservation.amount,
    0
  )
}

function formatActivityMoney(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

function getActivityMatchDescription(match: MatchData, extra?: string | null) {
  const parts = [`Jornada ${match.round}`]

  if (extra) {
    parts.push(extra)
  }

  return parts.join(" · ")
}

export function MatchDataProvider({ children }: MatchDataProviderProps) {
  const { data: session } = useSession()
  const actorEmail =
    session?.user?.email?.trim().toLowerCase() || "usuario@smash-lob.local"
  const actorDisplayName = session?.user?.name ?? null
  const [matches, setMatches] = useState<MatchData[]>(getInitialMatches)

  useEffect(() => {
    const storedMatches = parseStoredMatches(
      window.localStorage.getItem(storageKey)
    )

    if (storedMatches) {
      window.setTimeout(() => {
        setMatches(storedMatches)
        window.localStorage.setItem(storageKey, JSON.stringify(storedMatches))
      }, 0)
    }
  }, [])

  const persistNextMatches = useCallback((nextMatches: MatchData[]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(nextMatches))
    return nextMatches
  }, [])

  const recordMatchActivity = useCallback(
    async ({
      match,
      type,
      title,
      description,
      metadata,
    }: {
      match: MatchData
      type: ActivityEventType
      title: string
      description?: string | null
      metadata?: Record<string, unknown>
    }) => {
      if (!isSupabaseBackedMatch(match.id)) {
        return
      }

      try {
        await recordActivityEvent({
          leagueId: match.leagueId,
          seasonId: match.seasonId,
          matchId: match.id,
          actorEmail,
          actorDisplayName,
          type,
          title,
          description,
          metadata: {
            participantIds: [...match.teamA, ...match.teamB],
            round: match.round,
            ...(metadata ?? {}),
            actorEmailFallbackUsed: actorEmail === "usuario@smash-lob.local",
          },
        })
      } catch (error) {
        recordSupabaseError("record-activity", error)
      }
    },
    [actorDisplayName, actorEmail]
  )

  const hydrateMatches = useCallback(
    (incomingMatches: MatchData[]) => {
      setMatches((currentMatches) => {
        const nextMatches = mergeMatches(currentMatches, incomingMatches)

        return persistNextMatches(nextMatches)
      })
    },
    [persistNextMatches]
  )

  const createSeasonMatches = useCallback(
    ({
      leagueId,
      seasonId,
      playerIds,
    }: {
      leagueId: string
      seasonId: string
      playerIds: string[]
    }) => {
      const seasonMatches = generateBalancedCalendar({
        leagueId,
        seasonId,
        playerIds,
      }).map((match) => ({
        ...match,
        courtBooking: getEmptyCourtBooking(),
      }))

      setMatches((currentMatches) => {
        const existingIds = new Set(currentMatches.map((match) => match.id))
        const nextMatches = [
          ...currentMatches,
          ...seasonMatches.filter((match) => !existingIds.has(match.id)),
        ]

        return persistNextMatches(nextMatches)
      })

      return seasonMatches
    },
    [persistNextMatches]
  )

  const updateMatchSchedule = useCallback(
    async (matchId: string, schedule: MatchScheduleInput) => {
      const currentMatch = matches.find((match) => match.id === matchId)

      if (!currentMatch) {
        return false
      }

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId ? getLocalScheduledMatch(match, schedule) : match
            )
          )
        )
        return true
      }

      try {
        const updatedMatch = await updateSupabaseMatchSchedule({
          matchId,
          scheduledAt: schedule.scheduledAt,
          location: schedule.location,
        })

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch))
        )

        const wasAlreadyScheduled = Boolean(
          currentMatch.scheduledAt || currentMatch.status === "scheduled"
        )

        await recordMatchActivity({
          match: updatedMatch,
          type: wasAlreadyScheduled
            ? "match_schedule_updated"
            : "match_scheduled",
          title: wasAlreadyScheduled
            ? "Programación modificada"
            : "Partido programado",
          description: getActivityMatchDescription(
            updatedMatch,
            [updatedMatch.dateLabel, updatedMatch.location]
              .filter(Boolean)
              .join(" · ")
          ),
          metadata: {
            previousScheduledAt: currentMatch.scheduledAt,
            previousLocation: currentMatch.location,
            scheduledAt: updatedMatch.scheduledAt,
            location: updatedMatch.location,
          },
        })

        return true
      } catch (error) {
        recordSupabaseError("update-match-schedule", error)
        return false
      }
    },
    [matches, persistNextMatches, recordMatchActivity]
  )

  const postponeMatch = useCallback(
    async (matchId: string) => {
      const currentMatch = matches.find((match) => match.id === matchId)

      if (!currentMatch) {
        return false
      }

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId ? getLocalPostponedMatch(match) : match
            )
          )
        )
        return true
      }

      try {
        const updatedMatch = await postponeSupabaseMatch(matchId)

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch))
        )

        await recordMatchActivity({
          match: updatedMatch,
          type: "match_postponed",
          title: "Partido aplazado",
          description: getActivityMatchDescription(updatedMatch),
        })

        return true
      } catch (error) {
        recordSupabaseError("postpone-match", error)
        return false
      }
    },
    [matches, persistNextMatches, recordMatchActivity]
  )

  const finishMatch = useCallback(
    async (matchId: string, result: MatchResultInput) => {
      const currentMatch = matches.find((match) => match.id === matchId)

      if (!currentMatch) {
        return false
      }

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId ? getLocalFinishedMatch(match, result) : match
            )
          )
        )
        return true
      }

      try {
        const updatedMatch = await finishSupabaseMatch({
          matchId,
          result,
        })

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch))
        )

        const wasAlreadyFinished = Boolean(
          currentMatch.status === "finished" ||
            currentMatch.resultRecordedAt ||
            currentMatch.pointsA !== null ||
            currentMatch.pointsB !== null ||
            currentMatch.sets.length > 0
        )
        const previousResultSummary = getResultSummary(currentMatch)
        const currentResultSummary = getResultSummary(updatedMatch)

        await recordMatchActivity({
          match: updatedMatch,
          type: wasAlreadyFinished
            ? "match_result_updated"
            : "match_result_saved",
          title: wasAlreadyFinished
            ? "Resultado modificado"
            : "Resultado registrado",
          description: getActivityMatchDescription(
            updatedMatch,
            wasAlreadyFinished
              ? `${previousResultSummary} → ${currentResultSummary}`
              : currentResultSummary
          ),
          metadata: {
            previousPointsA: currentMatch.pointsA,
            previousPointsB: currentMatch.pointsB,
            previousSets: currentMatch.sets,
            pointsA: updatedMatch.pointsA,
            pointsB: updatedMatch.pointsB,
            sets: updatedMatch.sets,
          },
        })

        return true
      } catch (error) {
        recordSupabaseError("finish-match", error)
        return false
      }
    },
    [matches, persistNextMatches, recordMatchActivity]
  )

  const clearMatchResult = useCallback(
    async (matchId: string) => {
      const currentMatch = matches.find((match) => match.id === matchId)

      if (!currentMatch) {
        return false
      }

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId ? getLocalClearedResultMatch(match) : match
            )
          )
        )
        return true
      }

      try {
        const updatedMatch = await clearSupabaseMatchResult(matchId)

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch))
        )

        await recordMatchActivity({
          match: updatedMatch,
          type: "match_result_cleared",
          title: "Resultado limpiado",
          description: getActivityMatchDescription(updatedMatch),
        })

        return true
      } catch (error) {
        recordSupabaseError("clear-match-result", error)
        return false
      }
    },
    [matches, persistNextMatches, recordMatchActivity]
  )

  const updateCourtBooking = useCallback(
    async (matchId: string, bookingInput: CourtBookingInput) => {
      const currentMatch = matches.find((match) => match.id === matchId)

      if (!currentMatch) {
        return false
      }

      const booking = buildCourtBooking({
        participantIds: bookingInput.participantIds,
        reservations: bookingInput.reservations,
        previousTransfers: currentMatch.courtBooking.transfers,
      })

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId ? { ...match, courtBooking: booking } : match
            )
          )
        )
        return true
      }

      try {
        const updatedMatch = await updateSupabaseCourtBooking({
          matchId,
          booking,
        })

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch))
        )

        await recordMatchActivity({
          match: updatedMatch,
          type: "court_booking_updated",
          title: "Reserva de pista actualizada",
          description: getActivityMatchDescription(
            updatedMatch,
            `Total pista: ${formatActivityMoney(getBookingTotal(updatedMatch))}`
          ),
          metadata: {
            reservations: updatedMatch.courtBooking.reservations,
            transfers: updatedMatch.courtBooking.transfers,
          },
        })

        return true
      } catch (error) {
        recordSupabaseError("update-court-booking", error)
        return false
      }
    },
    [matches, persistNextMatches, recordMatchActivity]
  )

  const clearCourtBooking = useCallback(
    async (matchId: string) => {
      const currentMatch = matches.find((match) => match.id === matchId)

      if (!currentMatch) {
        return false
      }

      const booking = getEmptyCourtBooking()

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId ? { ...match, courtBooking: booking } : match
            )
          )
        )
        return true
      }

      try {
        const updatedMatch = await updateSupabaseCourtBooking({
          matchId,
          booking,
        })

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch))
        )

        await recordMatchActivity({
          match: updatedMatch,
          type: "court_booking_cleared",
          title: "Reserva de pista eliminada",
          description: getActivityMatchDescription(updatedMatch),
        })

        return true
      } catch (error) {
        recordSupabaseError("clear-court-booking", error)
        return false
      }
    },
    [matches, persistNextMatches, recordMatchActivity]
  )

  const markCourtBookingTransferAsPaid = useCallback(
    async (matchId: string, transferId: string) => {
      const currentMatch = matches.find((match) => match.id === matchId)

      if (!currentMatch) {
        return false
      }

      const booking = markCourtBookingTransferPaid({
        booking: currentMatch.courtBooking,
        transferId,
      })

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId ? { ...match, courtBooking: booking } : match
            )
          )
        )
        return true
      }

      try {
        const updatedMatch = await updateSupabaseCourtBooking({
          matchId,
          booking,
        })

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch))
        )

        const paidTransfer = updatedMatch.courtBooking.transfers.find(
          (transfer) => transfer.id === transferId
        )

        await recordMatchActivity({
          match: updatedMatch,
          type: "court_booking_payment_paid",
          title: "Pago de pista marcado como pagado",
          description: getActivityMatchDescription(
            updatedMatch,
            paidTransfer
              ? `${formatActivityMoney(paidTransfer.amount)} marcado como pagado`
              : null
          ),
          metadata: {
            transferId,
          },
        })

        return true
      } catch (error) {
        recordSupabaseError("mark-court-booking-transfer-paid", error)
        return false
      }
    },
    [matches, persistNextMatches, recordMatchActivity]
  )

  const value = useMemo(
    () => ({
      matches,
      hydrateMatches,
      createSeasonMatches,
      updateMatchSchedule,
      postponeMatch,
      finishMatch,
      clearMatchResult,
      updateCourtBooking,
      clearCourtBooking,
      markCourtBookingTransferAsPaid,
    }),
    [
      clearCourtBooking,
      clearMatchResult,
      createSeasonMatches,
      finishMatch,
      hydrateMatches,
      markCourtBookingTransferAsPaid,
      matches,
      postponeMatch,
      updateCourtBooking,
      updateMatchSchedule,
    ]
  )

  return (
    <MatchDataContext.Provider value={value}>
      {children}
    </MatchDataContext.Provider>
  )
}

export function useMatchData() {
  const context = useContext(MatchDataContext)

  if (!context) {
    throw new Error("useMatchData must be used inside MatchDataProvider")
  }

  return context
}
