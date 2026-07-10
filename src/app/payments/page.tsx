"use client"

import { useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import {
  type CourtBookingTransfer,
  type MatchData,
  useMatchData,
} from "@/context/MatchDataProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import {
  fetchSupabaseActivityEvents,
  type ActivityEvent,
} from "@/lib/activity"
import { formatMoney } from "@/lib/courtBooking"

type PaymentTab = "status" | "movements" | "all"

type PaymentMovement = {
  match: MatchData
  transfer: CourtBookingTransfer
}

const paymentEventTypes = new Set<ActivityEvent["type"]>([
  "court_booking_updated",
  "court_booking_cleared",
  "court_booking_payment_paid",
  "court_booking_payment_reminder",
])

function getPendingAmount(movements: PaymentMovement[]) {
  return movements.reduce((sum, { transfer }) => sum + transfer.amount, 0)
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function toTransfers(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => toRecord(item))
    .map((transfer) => ({
      fromPlayerId: String(transfer.fromPlayerId ?? ""),
      toPlayerId: String(transfer.toPlayerId ?? ""),
      amount: Number(transfer.amount),
      isPaid: Boolean(transfer.isPaid),
    }))
}

function toPlayerPayments(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => toRecord(item))
    .map((payment) => ({
      playerId: String(payment.playerId ?? ""),
      amount: Number(payment.amount),
    }))
}

function formatEventDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getPaymentEventLabel(type: ActivityEvent["type"]) {
  if (type === "court_booking_updated") {
    return "Reserva actualizada"
  }

  if (type === "court_booking_cleared") {
    return "Reserva cancelada"
  }

  if (type === "court_booking_payment_paid") {
    return "Pago registrado"
  }

  if (type === "court_booking_payment_reminder") {
    return "Recordatorio enviado"
  }

  return "Movimiento"
}

function isPaymentActivityEvent(event: ActivityEvent) {
  return paymentEventTypes.has(event.type)
}

function isUserInPaymentEvent({
  event,
  currentUserId,
  currentUserMatchIds,
}: {
  event: ActivityEvent
  currentUserId: string
  currentUserMatchIds: Set<string>
}) {
  if (!isPaymentActivityEvent(event)) {
    return false
  }

  if (event.matchId && currentUserMatchIds.has(event.matchId)) {
    return true
  }

  const transfers = toTransfers(event.metadata.transfers)
  const paidTransfer = toRecord(event.metadata.paidTransfer)
  const paidTransferPlayerIds = [
    String(paidTransfer.fromPlayerId ?? ""),
    String(paidTransfer.toPlayerId ?? ""),
  ]
  const payments = [
    ...toPlayerPayments(event.metadata.reservations),
    ...toPlayerPayments(event.metadata.ballPurchases),
  ]

  return (
    transfers.some(
      (transfer) =>
        transfer.fromPlayerId === currentUserId ||
        transfer.toPlayerId === currentUserId
    ) ||
    paidTransferPlayerIds.includes(currentUserId) ||
    payments.some((payment) => payment.playerId === currentUserId)
  )
}

function PaymentActivityList({
  events,
  isLoading,
  error,
}: {
  events: ActivityEvent[]
  isLoading: boolean
  error: string | null
}) {
  if (isLoading) {
    return (
      <p className="rounded-2xl bg-neutral-50 px-3 py-4 text-center text-xs font-semibold text-neutral-500">
        Cargando movimientos...
      </p>
    )
  }

  if (error) {
    return (
      <p className="rounded-2xl bg-red-50 px-3 py-3 text-xs font-bold text-red-700">
        {error}
      </p>
    )
  }

  if (events.length === 0) {
    return (
      <p className="rounded-2xl bg-neutral-50 px-3 py-4 text-center text-xs font-semibold text-neutral-500">
        No hay movimientos registrados.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-neutral-950">
                {event.title}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                {getPaymentEventLabel(event.type)}
                {event.actorDisplayName ? ` · ${event.actorDisplayName}` : ""}
              </p>
            </div>

            <p className="shrink-0 text-[11px] font-semibold text-neutral-400">
              {formatEventDate(event.createdAt)}
            </p>
          </div>

          {event.description ? (
            <p className="mt-2 text-xs leading-snug text-neutral-600">
              {event.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export default function PaymentsPage() {
  const { currentUser } = useCurrentUser()
  const { activeLeague, activeSeason, matches, players } = useCurrentLeagueData()
  const { hasLeagueAdminRole } = useLeagueAccess()
  const { sendCourtBookingPaymentReminder } = useMatchData()
  const canViewAllMovements = hasLeagueAdminRole(activeLeague.id)
  const [activeTab, setActiveTab] = useState<PaymentTab>("status")
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [isEventsLoading, setIsEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [reminderMessage, setReminderMessage] = useState<string | null>(null)
  const [reminderError, setReminderError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadEvents() {
      setIsEventsLoading(true)
      setEventsError(null)

      try {
        const activityEvents = await fetchSupabaseActivityEvents({
          leagueId: activeLeague.id,
          limit: 200,
        })

        if (isMounted) {
          setEvents(activityEvents)
        }
      } catch {
        if (isMounted) {
          setEventsError("No se ha podido cargar el historial de movimientos.")
        }
      } finally {
        if (isMounted) {
          setIsEventsLoading(false)
        }
      }
    }

    loadEvents()

    return () => {
      isMounted = false
    }
  }, [activeLeague.id])

  const allMovements = useMemo(
    () =>
      matches
        .flatMap((match) =>
          match.courtBooking.transfers.map((transfer) => ({ match, transfer }))
        )
        .sort((left, right) => right.match.round - left.match.round),
    [matches]
  )
  const myMovements = useMemo(
    () =>
      allMovements.filter(
        ({ transfer }) =>
          transfer.fromPlayerId === currentUser.id ||
          transfer.toPlayerId === currentUser.id
      ),
    [allMovements, currentUser.id]
  )
  const currentUserMatchIds = useMemo(
    () =>
      new Set(
        matches
          .filter(
            (match) =>
              match.teamA.includes(currentUser.id) ||
              match.teamB.includes(currentUser.id)
          )
          .map((match) => match.id)
      ),
    [currentUser.id, matches]
  )
  const paymentEvents = useMemo(
    () => events.filter(isPaymentActivityEvent),
    [events]
  )
  const myPaymentEvents = useMemo(
    () =>
      paymentEvents.filter((event) =>
        isUserInPaymentEvent({
          event,
          currentUserId: currentUser.id,
          currentUserMatchIds,
        })
      ),
    [currentUser.id, currentUserMatchIds, paymentEvents]
  )
  const pendingOwedByMe = myMovements.filter(
    ({ transfer }) => transfer.fromPlayerId === currentUser.id && !transfer.isPaid
  )
  const pendingOwedToMe = myMovements.filter(
    ({ transfer }) => transfer.toPlayerId === currentUser.id && !transfer.isPaid
  )
  const owedByMeAmount = getPendingAmount(pendingOwedByMe)
  const owedToMeAmount = getPendingAmount(pendingOwedToMe)
  const pendingPaymentCount = pendingOwedByMe.length + pendingOwedToMe.length

  const getPlayerName = (playerId: string) =>
    players.find((player) => player.id === playerId)?.displayName ?? playerId

  async function handleSendReminder() {
    if (isSendingReminder || pendingOwedToMe.length === 0) {
      return
    }

    const transfersByMatch = new Map<string, string[]>()

    pendingOwedToMe.forEach(({ match, transfer }) => {
      const transferIds = transfersByMatch.get(match.id) ?? []
      transferIds.push(transfer.id)
      transfersByMatch.set(match.id, transferIds)
    })

    setIsSendingReminder(true)
    setReminderMessage(null)
    setReminderError(null)

    const results = await Promise.all(
      Array.from(transfersByMatch.entries()).map(([matchId, transferIds]) =>
        sendCourtBookingPaymentReminder(matchId, transferIds)
      )
    )
    const sentCount = results.filter(Boolean).length

    setIsSendingReminder(false)

    if (sentCount === 0) {
      setReminderError(
        "No se ha podido mandar el recordatorio. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    setReminderMessage(
      sentCount === 1
        ? "Recordatorio enviado."
        : `Recordatorios enviados para ${sentCount} partidos.`
    )
  }

  const tabs: { id: PaymentTab; label: string }[] = [
    { id: "status", label: "Estado" },
    { id: "movements", label: "Movimientos" },
    ...(canViewAllMovements ? [{ id: "all" as const, label: "Todos" }] : []),
  ]
  const visibleActivityEvents = activeTab === "all" ? paymentEvents : myPaymentEvents

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label="Volver" />

        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">Mis pagos</h1>

        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Consulta lo pendiente, lo que te deben y el historial registrado.
        </p>
      </header>

      <div
        className="grid rounded-2xl bg-neutral-100 p-1 text-xs font-black"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-3 py-2 ${
              activeTab === tab.id ? "bg-white shadow-sm" : "text-neutral-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "status" ? (
        <>
          <AppCard
            className={
              pendingPaymentCount > 0 ? "border-amber-200 bg-amber-50" : ""
            }
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
                  Debes
                </p>
                <p className="mt-1 text-lg font-black text-neutral-950">
                  {formatMoney(owedByMeAmount)}
                </p>
                <p className="text-xs font-semibold text-neutral-500">
                  {pendingOwedByMe.length} movimiento
                  {pendingOwedByMe.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
                  Te deben
                </p>
                <p className="mt-1 text-lg font-black text-neutral-950">
                  {formatMoney(owedToMeAmount)}
                </p>
                <p className="text-xs font-semibold text-neutral-500">
                  {pendingOwedToMe.length} movimiento
                  {pendingOwedToMe.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {pendingOwedToMe.length > 0 ? (
              <button
                type="button"
                onClick={handleSendReminder}
                disabled={isSendingReminder}
                className="mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
              >
                {isSendingReminder ? "Enviando..." : "Mandar recordatorio"}
              </button>
            ) : null}

            {reminderMessage ? (
              <p className="mt-2 text-xs font-bold text-emerald-700">
                {reminderMessage}
              </p>
            ) : null}

            {reminderError ? (
              <p className="mt-2 text-xs font-bold text-red-700">
                {reminderError}
              </p>
            ) : null}
          </AppCard>

          <AppCard>
            <p className="text-sm font-black text-neutral-950">
              Estado de pagos y reservas
            </p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              Deudas pendientes o ya saldadas calculadas desde las reservas.
            </p>

            <div className="mt-3 space-y-2">
              {myMovements.length > 0 ? (
                myMovements.map(({ match, transfer }) => {
                  const fromName = getPlayerName(transfer.fromPlayerId)
                  const toName = getPlayerName(transfer.toPlayerId)
                  const description =
                    transfer.fromPlayerId === currentUser.id
                      ? `Debes pagar a ${toName}`
                      : `${fromName} debe pagarte`

                  return (
                    <div
                      key={`${match.id}-${transfer.id}`}
                      className="rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-neutral-950">
                            {description}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                            Jornada {match.round}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black text-neutral-950">
                            {formatMoney(transfer.amount)}
                          </p>
                          <p
                            className={`text-[10px] font-black uppercase tracking-[0.14em] ${
                              transfer.isPaid
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {transfer.isPaid ? "Pagado" : "Pendiente"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="rounded-2xl bg-neutral-50 px-3 py-4 text-center text-xs font-semibold text-neutral-500">
                  No hay pagos de reservas para ti.
                </p>
              )}
            </div>
          </AppCard>
        </>
      ) : (
        <AppCard>
          <p className="text-sm font-black text-neutral-950">
            {activeTab === "all" ? "Todos los movimientos" : "Mis movimientos"}
          </p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            Historial de acciones registradas sobre pagos y reservas.
          </p>

          <div className="mt-3">
            <PaymentActivityList
              events={visibleActivityEvents}
              isLoading={isEventsLoading}
              error={eventsError}
            />
          </div>
        </AppCard>
      )}
    </div>
  )
}
