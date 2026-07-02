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
  const participantIds = useMemo(() => {
    const ids = Array.from(new Set([...teamA, ...teamB]))

    return ids.sort((playerA, playerB) => {
      if (playerA === currentUserId) return -1
      if (playerB === currentUserId) return 1
      return 0
    })
  }, [currentUserId, teamA, teamB])
  const [isExpanded, setIsExpanded] = useState(!booking.isReserved && canManage)
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
  const paidByCount = booking.reservations.length
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
    setIsExpanded(true)
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
    setIsExpanded(true)
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
    <AppCard className="p-2.5">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-black text-neutral-950">Reserva de pista</p>
            {booking.isReserved ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                Reservada
              </span>
            ) : (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-neutral-600">
                Sin reserva
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            Indica quién pagó la pista. Puede ser una persona o varias.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
          className="shrink-0 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-black text-neutral-700 transition active:bg-neutral-100"
        >
          {isExpanded ? t.courtBooking.collapse : t.courtBooking.expand}
        </button>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-xl bg-neutral-100 px-2 py-1.5">
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Total
          </p>
          <p className="text-sm font-black text-neutral-950">
            {formatMoney(booking.isReserved ? totalReservedAmount : totalAmount)}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-100 px-2 py-1.5">
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Pagan
          </p>
          <p className="text-sm font-black text-neutral-950">
            {booking.isReserved ? paidByCount : parsedReservations.length}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-100 px-2 py-1.5">
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Pend.
          </p>
          <p className="text-sm font-black text-neutral-950">
            {pendingTransfersCount}
          </p>
        </div>
      </div>

      {isExpanded && !isEditing && booking.isReserved ? (
        <div className="mt-2 space-y-2">
          <div className="rounded-xl bg-neutral-50 px-2.5 py-2">
            <p className="text-xs font-black uppercase tracking-wide text-neutral-500">
              Pagado inicialmente
            </p>
            <div className="mt-1.5 grid gap-1.5">
              {booking.reservations.map((reservation) => (
                <div
                  key={reservation.playerId}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-sm"
                >
                  <p className="truncate font-bold text-neutral-800">
                    {getPlayerName(reservation.playerId, players)}
                  </p>
                  <p className="shrink-0 font-black text-neutral-950">
                    {formatMoney(reservation.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {booking.transfers.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-black uppercase tracking-wide text-neutral-500">
                Transferencias
              </p>
              {booking.transfers.map((transfer) => {
                const isCurrentUserTransfer = transfer.fromPlayerId === currentUserId
                const canMarkPaid = isCurrentUserTransfer && !transfer.isPaid

                return (
                  <div
                    key={transfer.id}
                    className="rounded-xl border border-neutral-200 px-2.5 py-2 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold leading-snug text-neutral-900">
                          {getPlayerName(transfer.fromPlayerId, players)} → {getPlayerName(transfer.toPlayerId, players)}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                          {formatMoney(transfer.amount)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
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
                        className="mt-2 w-full rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
                      >
                        {isSaving ? "Guardando..." : "Marcar como pagado"}
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-50 px-2.5 py-2 text-sm text-emerald-900">
              <p className="font-black">No hay pagos pendientes.</p>
              <p className="mt-0.5 text-xs font-semibold">
                El importe ya queda compensado entre quienes reservaron.
              </p>
            </div>
          )}

          {pendingCurrentUserTransfers.length > 0 ? (
            <div className="rounded-xl bg-orange-100 px-2.5 py-2 text-sm text-orange-900">
              <p className="font-black">Tienes pagos pendientes</p>
              <div className="mt-1.5 space-y-1">
                {pendingCurrentUserTransfers.map((transfer) => (
                  <p key={transfer.id} className="text-xs font-semibold">
                    Paga {formatMoney(transfer.amount)} a {getPlayerName(transfer.toPlayerId, players)}.
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {canManage ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-800"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={handleClearBooking}
                disabled={isSaving}
                className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:text-red-300"
              >
                Quitar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {isExpanded && isEditing && canManage ? (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <div className="rounded-xl bg-neutral-100 px-2.5 py-2 text-xs font-semibold text-neutral-600">
            Rellena el importe pagado por quien haya reservado. Si pagaron varias personas, indica cada parte.
          </div>

          <div className="grid grid-cols-2 gap-2">
            {reservationInputs.map((input) => (
              <label
                key={input.playerId}
                className="rounded-xl border border-neutral-200 bg-white px-2.5 py-2 shadow-sm"
              >
                <span className="block truncate text-xs font-black text-neutral-700">
                  {getPlayerName(input.playerId, players)}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    inputMode="decimal"
                    value={input.amount}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateReservationAmount(input.playerId, event.target.value)
                    }
                    placeholder="0,00"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-neutral-900 outline-none disabled:text-neutral-400"
                  />
                  <span className="text-xs font-black text-neutral-500">€</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl bg-neutral-100 px-2.5 py-2 text-sm">
            <p className="font-bold text-neutral-700">Total informado</p>
            <p className="font-black text-neutral-950">{formatMoney(totalAmount)}</p>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            {booking.isReserved ? (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-800 disabled:text-neutral-400"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                disabled={isSaving}
                className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-800 disabled:text-neutral-400"
              >
                Cerrar
              </button>
            )}

            <button
              type="submit"
              disabled={!canSave}
              className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      ) : null}
    </AppCard>
  )
}
