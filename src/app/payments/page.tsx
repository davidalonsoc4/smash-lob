"use client"

import { useMemo, useState } from "react"
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
import { formatMoney } from "@/lib/courtBooking"

type PaymentMovement = {
  match: MatchData
  transfer: CourtBookingTransfer
}

function getPendingAmount(movements: PaymentMovement[]) {
  return movements.reduce((sum, { transfer }) => sum + transfer.amount, 0)
}

export default function PaymentsPage() {
  const { currentUser } = useCurrentUser()
  const { activeLeague, activeSeason, matches, players } = useCurrentLeagueData()
  const { hasLeagueAdminRole } = useLeagueAccess()
  const { sendCourtBookingPaymentReminder } = useMatchData()
  const canViewAllMovements = hasLeagueAdminRole(activeLeague.id)
  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine")
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [reminderMessage, setReminderMessage] = useState<string | null>(null)
  const [reminderError, setReminderError] = useState<string | null>(null)

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
  const pendingOwedByMe = myMovements.filter(
    ({ transfer }) => transfer.fromPlayerId === currentUser.id && !transfer.isPaid
  )
  const pendingOwedToMe = myMovements.filter(
    ({ transfer }) => transfer.toPlayerId === currentUser.id && !transfer.isPaid
  )
  const owedByMeAmount = getPendingAmount(pendingOwedByMe)
  const owedToMeAmount = getPendingAmount(pendingOwedToMe)
  const visibleMovements =
    canViewAllMovements && activeTab === "all" ? allMovements : myMovements
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

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label="Volver" />

        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Pagos y reservas
        </h1>

        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Consulta lo pendiente, lo que te deben y el historial de movimientos.
        </p>
      </header>

      <AppCard
        className={pendingPaymentCount > 0 ? "border-amber-200 bg-amber-50" : ""}
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
          <p className="mt-2 text-xs font-bold text-red-700">{reminderError}</p>
        ) : null}
      </AppCard>

      <AppCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-neutral-950">
              Historial de movimientos
            </p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              Reservas y bolas pendientes o ya pagadas.
            </p>
          </div>

          {canViewAllMovements ? (
            <div className="grid grid-cols-2 rounded-2xl bg-neutral-100 p-1 text-xs font-black">
              <button
                type="button"
                onClick={() => setActiveTab("mine")}
                className={`rounded-xl px-3 py-1.5 ${
                  activeTab === "mine" ? "bg-white shadow-sm" : "text-neutral-500"
                }`}
              >
                Mios
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-xl px-3 py-1.5 ${
                  activeTab === "all" ? "bg-white shadow-sm" : "text-neutral-500"
                }`}
              >
                Todos
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-3 space-y-2">
          {visibleMovements.length > 0 ? (
            visibleMovements.map(({ match, transfer }) => {
              const isMine =
                transfer.fromPlayerId === currentUser.id ||
                transfer.toPlayerId === currentUser.id
              const fromName = getPlayerName(transfer.fromPlayerId)
              const toName = getPlayerName(transfer.toPlayerId)
              const description =
                canViewAllMovements && activeTab === "all" && !isMine
                  ? `${fromName} debe pagar a ${toName}`
                  : transfer.fromPlayerId === currentUser.id
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
                          transfer.isPaid ? "text-emerald-600" : "text-amber-600"
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
              No hay movimientos de pagos y reservas.
            </p>
          )}
        </div>
      </AppCard>
    </div>
  )
}
