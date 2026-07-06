"use client"

import { useState } from "react"
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
  onTogglePayment: (playerId: string, isPaid: boolean) => Promise<void> | void
}

export function SeasonRegistrationPanel({
  registrationFee,
  players,
  currentUserId,
  canManage,
  onTogglePayment,
}: SeasonRegistrationPanelProps) {
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null)

  if (!registrationFee.enabled || registrationFee.amount <= 0) {
    return null
  }

  const paymentByPlayerId = new Map(
    registrationFee.payments.map((payment) => [payment.playerId, payment]),
  )
  const paidCount = players.filter(
    (player) => paymentByPlayerId.get(player.id)?.isPaid,
  ).length
  const currentUserPayment = paymentByPlayerId.get(currentUserId)
  const visiblePlayers = canManage
    ? players
    : players.filter((player) => player.id === currentUserId)

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
