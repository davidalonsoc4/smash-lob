"use client"

import { type FormEvent, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import {
  type CourtBooking,
  type CourtBookingReservation,
  useMatchData,
} from "@/context/MatchDataProvider"
import { formatMoney } from "@/lib/courtBooking"
import { useI18n } from "@/i18n/I18nProvider"
import type { PlayerProfile } from "@/data/fakeData"

type CourtBookingPanelProps = {
  matchId: string
  teamA: string[]
  teamB: string[]
  players: PlayerProfile[]
  currentUserId: string
  canManage: boolean
  booking: CourtBooking
}

type ReservationInput = {
  playerId: string
  amount: string
}

function getPlayerName(playerId: string, players: PlayerProfile[]) {
  return players.find((player) => player.id === playerId)?.displayName ?? playerId
}

function getInitialReservationInputs({
  participantIds,
  reservations,
}: {
  participantIds: string[]
  reservations: CourtBookingReservation[]
}) {
  return participantIds.map((playerId) => {
    const reservation = reservations.find((item) => item.playerId === playerId)

    return {
      playerId,
      amount: reservation ? String(reservation.amount).replace(".", ",") : "",
    }
  })
}

function parseAmount(value: string) {
  const normalizedValue = value.replace(",", ".").trim()
  const parsedValue = Number(normalizedValue)

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null
  }

  return Math.round((parsedValue + Number.EPSILON) * 100) / 100
}

function parseReservations(inputs: ReservationInput[]) {
  return inputs
    .map((input) => {
      const amount = parseAmount(input.amount)

      if (!amount || amount <= 0) {
        return null
      }

      return {
        playerId: input.playerId,
        amount,
      }
    })
    .filter((item): item is CourtBookingReservation => Boolean(item))
}

export function CourtBookingPanel({
  matchId,
  teamA,
  teamB,
  players,
  currentUserId,
  canManage,
  booking,
}: CourtBookingPanelProps) {
  const { t } = useI18n()
  const { updateCourtBooking, clearCourtBooking, markCourtBookingTransferAsPaid } =
    useMatchData()
  const participantIds = useMemo(
    () => Array.from(new Set([...teamA, ...teamB])),
    [teamA, teamB]
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(!booking.isReserved && canManage)
  const [reservationInputs, setReservationInputs] = useState(() =>
    getInitialReservationInputs({
      participantIds,
      reservations: booking.reservations,
    })
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedReservations = parseReservations(reservationInputs)
  const totalAmount = parsedReservations.reduce(
    (sum, reservation) => sum + reservation.amount,
    0
  )
  const canSave = canManage && !isSaving && parsedReservations.length > 0
  const currentUserTransfers = booking.transfers.filter(
    (transfer) => transfer.fromPlayerId === currentUserId
  )
  const pendingCurrentUserTransfers = currentUserTransfers.filter(
    (transfer) => !transfer.isPaid
  )
  const totalReservedAmount = booking.reservations.reduce(
    (sum, reservation) => sum + reservation.amount,
    0
  )
  const pendingTransfersCount = booking.transfers.filter(
    (transfer) => !transfer.isPaid
  ).length

  function updateReservationAmount(playerId: string, amount: string) {
    setReservationInputs((currentInputs) =>
      currentInputs.map((input) =>
        input.playerId === playerId
          ? {
              ...input,
              amount,
            }
          : input
      )
    )
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    setIsSaving(true)
    setError(null)

    const saved = await updateCourtBooking(matchId, {
      participantIds,
      reservations: parsedReservations,
    })

    setIsSaving(false)

    if (!saved) {
      setError(
        "No se ha podido guardar la reserva en la base de datos. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    setIsEditing(false)
  }

  async function handleClearBooking() {
    if (!canManage || isSaving) {
      return
    }

    setIsSaving(true)
    setError(null)

    const saved = await clearCourtBooking(matchId)

    setIsSaving(false)

    if (!saved) {
      setError(
        "No se ha podido quitar la reserva en la base de datos. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    setReservationInputs(
      getInitialReservationInputs({
        participantIds,
        reservations: [],
      })
    )
    setIsEditing(true)
  }

  async function handleMarkPaid(transferId: string) {
    if (isSaving) {
      return
    }

    setIsSaving(true)
    setError(null)

    const saved = await markCourtBookingTransferAsPaid(matchId, transferId)

    setIsSaving(false)

    if (!saved) {
      setError(
        "No se ha podido marcar el pago como realizado. Revisa Supabase o smash-lob-last-supabase-error."
      )
    }
  }

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">Reserva de pista</p>
          <p className="mt-1 text-sm text-neutral-500">
            Controla quién ha reservado/pagado la pista y qué transferencias quedan pendientes.
          </p>
          {booking.isReserved ? (
            <p className="mt-2 text-xs font-bold text-neutral-500">
              {formatMoney(totalReservedAmount)} · {pendingTransfersCount} {pendingTransfersCount === 1 ? t.courtBooking.pendingPaymentSingular : t.courtBooking.pendingPaymentPlural}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {booking.isReserved ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
              Pista reservada
            </span>
          ) : (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
              Sin reserva
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((currentValue) => !currentValue)}
            className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700 transition active:bg-neutral-200"
          >
            {isExpanded ? t.courtBooking.collapse : t.courtBooking.expand}
          </button>
        </div>
      </div>

      {isExpanded && !isEditing && booking.isReserved ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-neutral-100 p-4 text-sm">
            <p className="font-black">
              Total pista: {formatMoney(
                booking.reservations.reduce(
                  (sum, reservation) => sum + reservation.amount,
                  0
                )
              )}
            </p>
            <div className="mt-3 space-y-2">
              {booking.reservations.map((reservation) => (
                <p key={reservation.playerId} className="text-neutral-700">
                  <span className="font-bold">
                    {getPlayerName(reservation.playerId, players)}
                  </span>{" "}
                  reservó/pagó {formatMoney(reservation.amount)}.
                </p>
              ))}
            </div>
          </div>

          {booking.transfers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-black">Pagos pendientes</p>
              {booking.transfers.map((transfer) => {
                const isCurrentUserTransfer = transfer.fromPlayerId === currentUserId
                const canMarkPaid = isCurrentUserTransfer && !transfer.isPaid

                return (
                  <div
                    key={transfer.id}
                    className="rounded-2xl border border-neutral-200 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {getPlayerName(transfer.fromPlayerId, players)} debe pagar {formatMoney(transfer.amount)} a {getPlayerName(transfer.toPlayerId, players)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {transfer.isPaid
                            ? "Marcado como pagado."
                            : isCurrentUserTransfer
                              ? "Tienes este pago pendiente."
                              : "Pendiente de que lo marque el jugador que paga."}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                          transfer.isPaid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-orange-100 text-orange-900"
                        }`}
                      >
                        {transfer.isPaid ? "Pagado" : "Pendiente"}
                      </span>
                    </div>

                    {canMarkPaid ? (
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(transfer.id)}
                        disabled={isSaving}
                        className="mt-3 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
                      >
                        {isSaving ? "Guardando..." : "Marcar como pagado"}
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-black">No hay pagos pendientes.</p>
              <p className="mt-1 text-xs font-semibold">
                El importe queda compensado entre las personas que reservaron.
              </p>
            </div>
          )}

          {pendingCurrentUserTransfers.length > 0 ? (
            <div className="rounded-2xl bg-orange-100 p-4 text-sm text-orange-900">
              <p className="font-black">Tienes pagos pendientes</p>
              <div className="mt-2 space-y-1">
                {pendingCurrentUserTransfers.map((transfer) => (
                  <p key={transfer.id} className="text-xs font-semibold">
                    Paga {formatMoney(transfer.amount)} a {getPlayerName(transfer.toPlayerId, players)}.
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {canManage ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800"
              >
                Editar reserva
              </button>
              <button
                type="button"
                onClick={handleClearBooking}
                disabled={isSaving}
                className="flex-1 rounded-2xl bg-red-100 px-4 py-3 text-sm font-black text-red-700 disabled:text-red-300"
              >
                Quitar reserva
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {isExpanded && isEditing && canManage ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="rounded-2xl bg-neutral-100 p-4 text-sm">
            <p className="font-black">Importe pagado por cada jugador</p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              Deja a 0 o vacío quien no haya reservado. La app calcula las transferencias mínimas.
            </p>
          </div>

          <div className="space-y-3">
            {reservationInputs.map((input) => (
              <label key={input.playerId} className="block">
                <span className="text-sm font-semibold text-neutral-700">
                  {getPlayerName(input.playerId, players)}
                </span>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                  <input
                    inputMode="decimal"
                    value={input.amount}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateReservationAmount(input.playerId, event.target.value)
                    }
                    placeholder="0,00"
                    className="w-full bg-transparent text-sm font-semibold text-neutral-900 outline-none disabled:text-neutral-400"
                  />
                  <span className="text-sm font-black text-neutral-500">€</span>
                </div>
              </label>
            ))}
          </div>

          <div className="rounded-2xl bg-neutral-100 p-4 text-sm">
            <p className="font-bold">Total informado: {formatMoney(totalAmount)}</p>
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex gap-3">
            {booking.isReserved ? (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="flex-1 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800 disabled:text-neutral-400"
              >
                Cancelar
              </button>
            ) : null}

            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
            >
              {isSaving ? "Guardando..." : "Guardar reserva"}
            </button>
          </div>
        </form>
      ) : null}
    </AppCard>
  )
}
