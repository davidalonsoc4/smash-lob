"use client"

import { useMemo, useState } from "react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { formatMoney } from "@/lib/courtBooking"
import { getPaymentStatusBadgeClassName } from "@/lib/statusStyles"
import type { PlayerProfile } from "@/data/fakeData"
import type { SeasonRegistrationFee } from "@/lib/seasonRegistration"

type SeasonRegistrationPanelProps = {
  registrationFee: SeasonRegistrationFee
  players: PlayerProfile[]
  currentUserId: string
  canManage: boolean
  organizerName?: string | null
  isSeasonUpcoming?: boolean
  onTogglePayment: (playerId: string, isPaid: boolean) => Promise<void> | void
}

export function SeasonRegistrationPanel({
  registrationFee,
  players,
  currentUserId,
  canManage,
  organizerName,
  isSeasonUpcoming = false,
  onTogglePayment,
}: SeasonRegistrationPanelProps) {
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null)

  const paymentByPlayerId = useMemo(
    () =>
      new Map(
        registrationFee.payments.map((payment) => [payment.playerId, payment]),
      ),
    [registrationFee.payments],
  )

  if (!registrationFee.enabled || registrationFee.amount <= 0) {
    return null
  }

  const paidPlayers = players.filter(
    (player) => paymentByPlayerId.get(player.id)?.isPaid,
  )
  const pendingPlayers = players.filter(
    (player) => !paymentByPlayerId.get(player.id)?.isPaid,
  )
  const paidCount = paidPlayers.length
  const pendingAmount = pendingPlayers.length * registrationFee.amount
  const currentUserPayment = paymentByPlayerId.get(currentUserId)
  const currentUserPlayer = players.find((player) => player.id === currentUserId)
  const visiblePlayers = canManage ? players : currentUserPlayer ? [currentUserPlayer] : []

  if (!canManage && !currentUserPayment) {
    return null
  }

  async function handleTogglePayment(playerId: string, isPaid: boolean) {
    if (savingPlayerId) {
      return
    }

    setSavingPlayerId(playerId)

    try {
      await onTogglePayment(playerId, isPaid)
    } finally {
      setSavingPlayerId(null)
    }
  }

  return (
    <AppCard className="border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-emerald-950">Inscripciones</p>
          <p className="mt-0.5 text-xs font-semibold text-emerald-800">
            {formatMoney(registrationFee.amount)} por jugador
          </p>
        </div>
        <span className={getPaymentStatusBadgeClassName(paidCount === players.length)}>
          {paidCount}/{players.length} pagadas
        </span>
      </div>

      {registrationFee.purpose ? (
        <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-emerald-900">
            Destino de la inscripción
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
            {registrationFee.purpose}
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-emerald-900">
            Destino de la inscripción
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
            La inscripción puede destinarse a premios, bolas, bote final, reservas
            comunes u otros gastos de organización que defina el administrador.
          </p>
        </div>
      )}

      {canManage ? (
        <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-2xl bg-white/90 text-center">
          <div className="border-r border-emerald-100 px-2 py-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              Pendientes
            </p>
            <p className="text-sm font-black text-neutral-950">
              {pendingPlayers.length}
            </p>
          </div>
          <div className="border-r border-emerald-100 px-2 py-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              Te deben
            </p>
            <p className="text-sm font-black text-neutral-950">
              {formatMoney(pendingAmount)}
            </p>
          </div>
          <div className="px-2 py-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              Total
            </p>
            <p className="text-sm font-black text-neutral-950">
              {formatMoney(players.length * registrationFee.amount)}
            </p>
          </div>
        </div>
      ) : currentUserPayment && !currentUserPayment.isPaid ? (
        <div className="mt-3 rounded-2xl bg-white/90 px-3 py-2.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-amber-800">
            Pago pendiente
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
            Debes {formatMoney(registrationFee.amount)} a {organizerName?.trim() || "el organizador de la liga"}.
          </p>
        </div>
      ) : null}

      {isSeasonUpcoming && pendingPlayers.length > 0 ? (
        <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">
          La temporada no podrá comenzar hasta que todas las inscripciones estén
          saldadas.
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        {visiblePlayers.map((player) => {
          const payment = paymentByPlayerId.get(player.id)
          const isPaid = Boolean(payment?.isPaid)
          const canEdit = canManage || player.id === currentUserId
          const isSaving = savingPlayerId === player.id

          return (
            <div
              key={player.id}
              className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2"
            >
              <PlayerAvatar
                player={player}
                size="sm"
                className="bg-neutral-950 text-white"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-neutral-950">
                  {player.displayName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={getPaymentStatusBadgeClassName(isPaid)}>
                    {isPaid ? "Pagada" : "Pendiente"}
                  </span>
                  {!isPaid ? (
                    <span className="text-xs font-semibold text-neutral-500">
                      {formatMoney(registrationFee.amount)}
                    </span>
                  ) : null}
                </div>
              </div>

              {canEdit ? (
                <button
                  type="button"
                  onClick={() => handleTogglePayment(player.id, !isPaid)}
                  disabled={Boolean(savingPlayerId)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black disabled:opacity-40 ${
                    isPaid
                      ? "bg-neutral-100 text-neutral-700"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {isSaving
                    ? "..."
                    : isPaid
                      ? "↩ Pendiente"
                      : "✓ Marcar pagada"}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </AppCard>
  )
}
