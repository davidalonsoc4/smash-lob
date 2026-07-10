"use client"

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import {
  type CourtBooking,
  type CourtBookingReservation,
  useMatchData,
} from "@/context/MatchDataProvider"
import { formatMoney } from "@/lib/courtBooking"
import {
  getBookingStatusBadgeClassName,
  getPaymentStatusBadgeClassName,
} from "@/lib/statusStyles"
import { useI18n } from "@/i18n/I18nProvider"
import type { PlayerProfile } from "@/data/fakeData"

type CourtBookingPanelProps = {
  matchId: string
  teamA: string[]
  teamB: string[]
  players: PlayerProfile[]
  currentUserId: string
  canManage: boolean
  canManageAllPayments?: boolean
  booking: CourtBooking
  shouldFocusBooking?: boolean
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

function getInitialSelectedPayerIds({
  participantIds,
  reservations,
}: {
  participantIds: string[]
  reservations: CourtBookingReservation[]
}) {
  return reservations
    .map((reservation) => reservation.playerId)
    .filter((playerId) => participantIds.includes(playerId))
}

function getInitialSelectedSinglePayerId({
  participantIds,
  reservations,
}: {
  participantIds: string[]
  reservations: CourtBookingReservation[]
}) {
  return reservations.find((reservation) =>
    participantIds.includes(reservation.playerId)
  )?.playerId ?? ""
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

function getPayerSummary(playerIds: string[], players: PlayerProfile[]) {
  if (playerIds.length === 0) {
    return "Seleccionar"
  }

  if (playerIds.length === 1) {
    return getPlayerName(playerIds[0], players)
  }

  return `${getPlayerName(playerIds[0], players)} + ${playerIds.length - 1}`
}

export function CourtBookingPanel({
  matchId,
  teamA,
  teamB,
  players,
  currentUserId,
  canManage,
  canManageAllPayments = false,
  booking,
  shouldFocusBooking = false,
}: CourtBookingPanelProps) {
  const { t } = useI18n()
  const {
    updateCourtBooking,
    clearCourtBooking,
    updateCourtBookingTransferPaymentStatus,
    sendCourtBookingPaymentReminder,
  } = useMatchData()
  const participantIds = useMemo(() => {
    const ids = Array.from(new Set([...teamA, ...teamB]))

    return ids.sort((playerA, playerB) => {
      if (playerA === currentUserId) return -1
      if (playerB === currentUserId) return 1
      return 0
    })
  }, [currentUserId, teamA, teamB])
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [isExpanded, setIsExpanded] = useState(
    shouldFocusBooking || (!booking.isReserved && canManage)
  )
  const [isEditing, setIsEditing] = useState(!booking.isReserved && canManage)
  const [reservationInputs, setReservationInputs] = useState(() =>
    getInitialReservationInputs({
      participantIds,
      reservations: booking.reservations,
    })
  )
  const [ballPurchaseInputs, setBallPurchaseInputs] = useState(() =>
    getInitialReservationInputs({
      participantIds,
      reservations: booking.ballPurchases,
    })
  )
  const [selectedPayerIds, setSelectedPayerIds] = useState(() =>
    getInitialSelectedPayerIds({
      participantIds,
      reservations: booking.reservations,
    })
  )
  const [selectedBallBuyerId, setSelectedBallBuyerId] = useState(() =>
    getInitialSelectedSinglePayerId({
      participantIds,
      reservations: booking.ballPurchases,
    })
  )
  const [isPayerSelectorOpen, setIsPayerSelectorOpen] = useState(false)
  const [isBallBuyerSelectorOpen, setIsBallBuyerSelectorOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shouldFocusBooking) {
      return
    }

    const scrollTimeout = window.setTimeout(() => {
      setIsExpanded(true)
      panelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 80)

    return () => window.clearTimeout(scrollTimeout)
  }, [shouldFocusBooking])

  const selectedReservationInputs = reservationInputs.filter((input) =>
    selectedPayerIds.includes(input.playerId)
  )
  const selectedBallPurchaseInputs = ballPurchaseInputs.filter(
    (input) => input.playerId === selectedBallBuyerId
  )
  const parsedReservations = parseReservations(selectedReservationInputs)
  const parsedBallPurchases = parseReservations(selectedBallPurchaseInputs)
  const courtAmountsAreValid =
    selectedReservationInputs.length > 0 &&
    selectedReservationInputs.every((input) => {
      const amount = parseAmount(input.amount)
      return amount !== null && amount > 0
    })
  const ballAmountIsValid =
    selectedBallBuyerId.length === 0 ||
    selectedBallPurchaseInputs.every((input) => {
      const amount = parseAmount(input.amount)
      return amount !== null && amount > 0
    })
  const selectedAmountsAreValid =
    (courtAmountsAreValid || parsedBallPurchases.length > 0) && ballAmountIsValid
  const totalAmount = parsedReservations.reduce(
    (sum, reservation) => sum + reservation.amount,
    0
  ) + parsedBallPurchases.reduce((sum, purchase) => sum + purchase.amount, 0)
  const isCurrentUserBookingPayer = [
    ...booking.reservations,
    ...booking.ballPurchases,
  ].some((payment) => payment.playerId === currentUserId)
  const isCurrentUserReservationPayer = booking.reservations.some(
    (reservation) => reservation.playerId === currentUserId
  )
  const canCreateBooking = canManage && !booking.isReserved
  const canManageExistingBooking =
    canManage &&
    booking.isReserved &&
    (isCurrentUserBookingPayer || canManageAllPayments)
  const canManageBooking = canCreateBooking || canManageExistingBooking
  const canCancelBooking =
    canManageExistingBooking &&
    (isCurrentUserReservationPayer || canManageAllPayments)
  const canSave = canManageBooking && !isSaving && selectedAmountsAreValid
  const currentUserTransfers = booking.transfers.filter(
    (transfer) => transfer.fromPlayerId === currentUserId
  )
  const pendingCurrentUserTransfers = currentUserTransfers.filter(
    (transfer) => !transfer.isPaid
  )
  const totalReservedAmount = booking.reservations.reduce(
    (sum, reservation) => sum + reservation.amount,
    0
  ) + booking.ballPurchases.reduce(
    (sum, purchase) => sum + purchase.amount,
    0
  )
  const paidByCount = new Set(
    [...booking.reservations, ...booking.ballPurchases].map(
      (payment) => payment.playerId
    )
  ).size
  const pendingTransfersCount = booking.transfers.filter(
    (transfer) => !transfer.isPaid
  ).length
  const savedPayerNames = booking.reservations
    .map((reservation) => getPlayerName(reservation.playerId, players))
    .join(", ")
  const savedBallBuyerName = booking.ballPurchases[0]
    ? getPlayerName(booking.ballPurchases[0].playerId, players)
    : ""
  const payerSummary = getPayerSummary(selectedPayerIds, players)
  const ballBuyerSummary = getPayerSummary(
    selectedBallBuyerId ? [selectedBallBuyerId] : [],
    players
  )
  const hasMultipleSelectedPayers = selectedReservationInputs.length > 1
  const singleReservationInput =
    selectedReservationInputs.length === 1 ? selectedReservationInputs[0] : null
  const selectedBallPurchaseInput =
    selectedBallPurchaseInputs.length === 1 ? selectedBallPurchaseInputs[0] : null

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

  function updateBallPurchaseAmount(playerId: string, amount: string) {
    setBallPurchaseInputs((currentInputs) =>
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

  function selectBallBuyer(playerId: string) {
    const currentAmount = selectedBallPurchaseInput?.amount ?? ""

    setSelectedBallBuyerId(playerId)
    setBallPurchaseInputs((currentInputs) =>
      currentInputs.map((input) =>
        input.playerId === playerId && currentAmount
          ? {
              ...input,
              amount: currentAmount,
            }
          : input
      )
    )
    setIsBallBuyerSelectorOpen(false)
    setError(null)
  }

  function togglePayer(playerId: string) {
    setSelectedPayerIds((currentIds) => {
      if (currentIds.includes(playerId)) {
        return currentIds.filter((currentId) => currentId !== playerId)
      }

      if (currentIds.length === 1) {
        const currentAmount =
          reservationInputs.find((input) => input.playerId === currentIds[0])
            ?.amount ?? ""

        if (currentAmount) {
          setReservationInputs((currentInputs) =>
            currentInputs.map((input) =>
              input.playerId === playerId
                ? {
                    ...input,
                    amount: currentAmount,
                  }
                : input
            )
          )
        }
      }

      return [...currentIds, playerId]
    })
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
      ballPurchases: parsedBallPurchases,
    })

    setIsSaving(false)

    if (!saved) {
      setError(
        "No se ha podido guardar la reserva en la base de datos. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    setIsPayerSelectorOpen(false)
    setIsBallBuyerSelectorOpen(false)
    setIsEditing(false)
    setIsExpanded(true)
  }

  async function handleClearBooking() {
    if (!canManageExistingBooking || isSaving) {
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
    setBallPurchaseInputs(
      getInitialReservationInputs({
        participantIds,
        reservations: [],
      })
    )
    setSelectedPayerIds(
      getInitialSelectedPayerIds({
        participantIds,
        reservations: [],
      })
    )
    setSelectedBallBuyerId("")
    setIsPayerSelectorOpen(false)
    setIsBallBuyerSelectorOpen(false)
    setIsExpanded(true)
    setIsEditing(true)
  }

  async function handleSendReminder() {
    if (
      !canManageExistingBooking ||
      isSendingReminder ||
      pendingTransfersCount === 0
    ) {
      return
    }

    setIsSendingReminder(true)
    setError(null)

    const sent = await sendCourtBookingPaymentReminder(matchId)

    setIsSendingReminder(false)

    if (!sent) {
      setError(
        "No se ha podido mandar el recordatorio. Revisa Supabase o smash-lob-last-supabase-error."
      )
    }
  }

  async function handleUpdatePaymentStatus(transferId: string, isPaid: boolean) {
    if (isSaving) {
      return
    }

    setIsSaving(true)
    setError(null)

    const saved = await updateCourtBookingTransferPaymentStatus(
      matchId,
      transferId,
      isPaid
    )

    setIsSaving(false)

    if (!saved) {
      setError(
        "No se ha podido actualizar el estado del pago. Revisa Supabase o smash-lob-last-supabase-error."
      )
    }
  }

  return (
    <div ref={panelRef} className="scroll-mt-4">
      <AppCard className="p-2">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black text-neutral-950">Pagos y reservas</p>
            {booking.isReserved ? (
              <span className={getBookingStatusBadgeClassName(true)}>
                Guardado
              </span>
            ) : (
              <span className={getBookingStatusBadgeClassName(false)}>
                Pendiente
              </span>
            )}
          </div>

          <p className="mt-0.5 text-[11px] font-semibold leading-4 text-neutral-500">
            Indica quién pagó pista y bolas. La app calcula las transferencias.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
          className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 text-[10px] font-black text-neutral-700 shadow-sm transition active:bg-neutral-100"
        >
          <span>{isExpanded ? t.courtBooking.collapse : t.courtBooking.expand}</span>
          <span aria-hidden="true" className="text-xs leading-none text-neutral-400">
            {isExpanded ? "⌃" : "⌄"}
          </span>
        </button>
      </div>

      <div className="mt-1.5 grid grid-cols-3 divide-x divide-neutral-200 overflow-hidden rounded-lg bg-neutral-100 text-center">
        <div className="px-2 py-1">
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Total
          </p>
          <p className="text-xs font-black text-neutral-950">
            {formatMoney(booking.isReserved ? totalReservedAmount : totalAmount)}
          </p>
        </div>
        <div className="px-2 py-1">
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Pagan
          </p>
          <p className="text-xs font-black text-neutral-950">
            {booking.isReserved ? paidByCount : new Set([...parsedReservations, ...parsedBallPurchases].map((payment) => payment.playerId)).size}
          </p>
        </div>
        <div className="px-2 py-1">
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Pend.
          </p>
          <p className="text-xs font-black text-neutral-950">
            {pendingTransfersCount}
          </p>
        </div>
      </div>

      {isExpanded && !isEditing && booking.isReserved ? (
        <div className="mt-1.5 space-y-1.5">
          <div className="rounded-lg bg-neutral-50 px-2.5 py-1.5">
            <p className="text-xs font-semibold leading-5 text-neutral-700">
              <span className="font-black text-neutral-950">Pista pagada por:</span>{" "}
              <span className="font-bold">
                {savedPayerNames || "Sin pagador informado"}
              </span>
            </p>
            <p className="text-xs font-semibold leading-5 text-neutral-700">
              <span className="font-black text-neutral-950">Bolas compradas por:</span>{" "}
              <span className="font-bold">
                {savedBallBuyerName || "Sin comprador informado"}
              </span>
            </p>
          </div>

          {booking.transfers.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-black uppercase tracking-wide text-neutral-500">
                Transferencias
              </p>
              {booking.transfers.map((transfer) => {
                const isCurrentUserTransfer = transfer.fromPlayerId === currentUserId
                const isCurrentUserPayer = transfer.toPlayerId === currentUserId
                const canCurrentUserMarkOwnDebtPaid =
                  isCurrentUserTransfer && !transfer.isPaid && !isCurrentUserPayer
                const canPayerManageTransfer = isCurrentUserPayer

                return (
                  <div
                    key={transfer.id}
                    className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold leading-snug text-neutral-900">
                          {getPlayerName(transfer.fromPlayerId, players)} → {getPlayerName(transfer.toPlayerId, players)}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                          {formatMoney(transfer.amount)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className={getPaymentStatusBadgeClassName(transfer.isPaid)}>
                          {transfer.isPaid ? "Pagado" : "Pendiente"}
                        </span>

                        {canPayerManageTransfer ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdatePaymentStatus(
                                transfer.id,
                                !transfer.isPaid
                              )
                            }
                            disabled={isSaving}
                            className={`whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-black transition disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-300 ${
                              transfer.isPaid
                                ? "border-neutral-200 bg-neutral-50 text-neutral-700 active:bg-neutral-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 active:bg-emerald-100"
                            }`}
                            aria-label={
                              transfer.isPaid
                                ? "Marcar transferencia como pendiente"
                                : "Marcar transferencia como pagada"
                            }
                          >
                            {isSaving
                              ? "..."
                              : transfer.isPaid
                                ? "↩ Marcar pendiente"
                                : "✓ Marcar pagado"}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {canCurrentUserMarkOwnDebtPaid ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdatePaymentStatus(transfer.id, true)
                        }
                        disabled={isSaving}
                        className="mt-1.5 w-full rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[11px] font-black text-white disabled:bg-neutral-300"
                      >
                        {isSaving ? "Guardando..." : "✓ Marcar como pagado"}
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-900">
              <p className="font-black">No hay pagos pendientes.</p>
              <p className="mt-0.5 text-xs font-semibold">
                El importe ya queda compensado entre los jugadores.
              </p>
            </div>
          )}

          {pendingCurrentUserTransfers.length > 0 ? (
            <div className="rounded-lg bg-orange-100 px-2.5 py-1.5 text-xs text-orange-900">
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

          {canManageExistingBooking ? (
            <div className="space-y-2">
              {pendingTransfersCount > 0 ? (
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={isSendingReminder}
                  className="w-full rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[11px] font-black text-orange-900 shadow-sm disabled:text-orange-300"
                >
                  {isSendingReminder ? "Enviando..." : "Mandar recordatorio"}
                </button>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] font-black text-neutral-800 shadow-sm active:bg-neutral-100"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={handleClearBooking}
                  disabled={isSaving || !canCancelBooking}
                  className="rounded-md border border-red-100 bg-red-50 px-2.5 py-1.5 text-[11px] font-black text-red-700 disabled:text-red-300"
                >
                  Cancelar reserva
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {isExpanded && isEditing && canManageBooking ? (
        <form onSubmit={handleSubmit} className="mt-1.5 space-y-1.5">
          <div className="space-y-1.5">
            <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
              <button
                type="button"
                onClick={() =>
                  setIsBallBuyerSelectorOpen((currentValue) => !currentValue)
                }
                className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-left shadow-sm"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-wide text-neutral-500">
                    Compró las bolas
                  </span>
                  <span className="block truncate text-sm font-black text-neutral-950">
                    {ballBuyerSummary}
                  </span>
                </span>
                <span aria-hidden="true" className="shrink-0 text-sm font-black text-neutral-400">
                  {isBallBuyerSelectorOpen ? "⌃" : "⌄"}
                </span>
              </button>

              <label className="flex min-w-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 shadow-sm">
                <input
                  inputMode="decimal"
                  value={selectedBallPurchaseInput?.amount ?? ""}
                  disabled={isSaving || !selectedBallPurchaseInput}
                  onChange={(event) => {
                    if (!selectedBallPurchaseInput) {
                      return
                    }

                    updateBallPurchaseAmount(
                      selectedBallPurchaseInput.playerId,
                      event.target.value
                    )
                  }}
                  placeholder="0,00"
                  className="min-w-0 flex-1 bg-transparent text-right text-sm font-black text-neutral-900 outline-none disabled:text-neutral-300"
                />
                <span className="text-xs font-black text-neutral-500">€</span>
              </label>
            </div>

            {isBallBuyerSelectorOpen ? (
              <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-sm">
                {participantIds.map((playerId) => {
                  const isSelected = selectedBallBuyerId === playerId

                  return (
                    <button
                      key={playerId}
                      type="button"
                      onClick={() => selectBallBuyer(playerId)}
                      disabled={isSaving}
                      className={`rounded-lg border px-2 py-1.5 text-left text-xs font-black transition ${
                        isSelected
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-200 bg-neutral-50 text-neutral-700 active:bg-neutral-100"
                      } disabled:opacity-60`}
                    >
                      <span className="block truncate">{getPlayerName(playerId, players)}</span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          {!hasMultipleSelectedPayers ? (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayerSelectorOpen((currentValue) => !currentValue)}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-left shadow-sm"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-wide text-neutral-500">
                      Pagó la pista
                    </span>
                    <span className="block truncate text-sm font-black text-neutral-950">
                      {payerSummary}
                    </span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-sm font-black text-neutral-400">
                    {isPayerSelectorOpen ? "⌃" : "⌄"}
                  </span>
                </button>

                <label className="flex min-w-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 shadow-sm">
                  <input
                    inputMode="decimal"
                    value={singleReservationInput?.amount ?? ""}
                    disabled={isSaving || !singleReservationInput}
                    onChange={(event) => {
                      if (!singleReservationInput) {
                        return
                      }

                      updateReservationAmount(
                        singleReservationInput.playerId,
                        event.target.value
                      )
                    }}
                    placeholder="0,00"
                    className="min-w-0 flex-1 bg-transparent text-right text-sm font-black text-neutral-900 outline-none disabled:text-neutral-300"
                  />
                  <span className="text-xs font-black text-neutral-500">€</span>
                </label>
              </div>

              {isPayerSelectorOpen ? (
                <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-sm">
                  {participantIds.map((playerId) => {
                    const isSelected = selectedPayerIds.includes(playerId)

                    return (
                      <button
                        key={playerId}
                        type="button"
                        onClick={() => togglePayer(playerId)}
                        disabled={isSaving}
                        className={`rounded-lg border px-2 py-1.5 text-left text-xs font-black transition ${
                          isSelected
                            ? "border-neutral-950 bg-neutral-950 text-white"
                            : "border-neutral-200 bg-neutral-50 text-neutral-700 active:bg-neutral-100"
                        } disabled:opacity-60`}
                      >
                        <span className="block truncate">{getPlayerName(playerId, players)}</span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-neutral-200 bg-white p-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsPayerSelectorOpen((currentValue) => !currentValue)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-wide text-neutral-500">
                      Pagaron la pista
                    </span>
                    <span className="block truncate text-sm font-black text-neutral-950">
                      {payerSummary}
                    </span>
                  </span>
                  <span className="inline-flex h-6 shrink-0 items-center rounded-md bg-neutral-100 px-2 text-[10px] font-black text-neutral-700">
                    Cambiar
                  </span>
                </button>

                {isPayerSelectorOpen ? (
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {participantIds.map((playerId) => {
                      const isSelected = selectedPayerIds.includes(playerId)

                      return (
                        <button
                          key={playerId}
                          type="button"
                          onClick={() => togglePayer(playerId)}
                          disabled={isSaving}
                          className={`rounded-lg border px-2 py-1.5 text-left text-xs font-black transition ${
                            isSelected
                              ? "border-neutral-950 bg-neutral-950 text-white"
                              : "border-neutral-200 bg-neutral-50 text-neutral-700 active:bg-neutral-100"
                          } disabled:opacity-60`}
                        >
                          <span className="block truncate">{getPlayerName(playerId, players)}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>

              <div className="space-y-1.5">
                {selectedReservationInputs.map((input) => (
                  <label
                    key={input.playerId}
                    className="flex items-center justify-between gap-2.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 shadow-sm"
                  >
                    <span className="min-w-0 truncate text-sm font-black text-neutral-800">
                      {getPlayerName(input.playerId, players)}
                    </span>
                    <div className="flex w-28 shrink-0 items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-1">
                      <input
                        inputMode="decimal"
                        value={input.amount}
                        disabled={isSaving}
                        onChange={(event) =>
                          updateReservationAmount(input.playerId, event.target.value)
                        }
                        placeholder="0,00"
                        className="min-w-0 flex-1 bg-transparent text-right text-sm font-black text-neutral-900 outline-none disabled:text-neutral-400"
                      />
                      <span className="text-xs font-black text-neutral-500">€</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs">
                <p className="font-bold text-neutral-700">Total informado</p>
                <p className="font-black text-neutral-950">{formatMoney(totalAmount)}</p>
              </div>
            </>
          )}

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
                className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] font-black text-neutral-800 shadow-sm disabled:text-neutral-400"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                disabled={isSaving}
                className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] font-black text-neutral-800 shadow-sm disabled:text-neutral-400"
              >
                Cerrar
              </button>
            )}

            <button
              type="submit"
              disabled={!canSave}
              className="rounded-md bg-neutral-950 px-2.5 py-1.5 text-[11px] font-black text-white disabled:bg-neutral-300"
            >
              {isSaving ? "Guardando..." : "Guardar pagos"}
            </button>
          </div>
        </form>
      ) : null}
      </AppCard>
    </div>
  )
}
