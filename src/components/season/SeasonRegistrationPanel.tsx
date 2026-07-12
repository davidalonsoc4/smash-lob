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
  canSendReminder?: boolean
  onTogglePayment: (playerId: string, isPaid: boolean) => Promise<void> | void
  onSendReminder?: () => Promise<boolean> | boolean
}

export function SeasonRegistrationPanel({
  registrationFee,
  players,
  currentUserId,
  canManage,
  organizerName,
  isSeasonUpcoming = false,
  canSendReminder = false,
  onTogglePayment,
  onSendReminder,
}: SeasonRegistrationPanelProps) {
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [reminderMessage, setReminderMessage] = useState<string | null>(null)
  const [arePaymentsExpanded, setArePaymentsExpanded] = useState(false)

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
  const totalAmount = players.length * registrationFee.amount
  const currentUserPayment = paymentByPlayerId.get(currentUserId)
  const currentUserPlayer = players.find((player) => player.id === currentUserId)
  const visiblePlayers = canManage
    ? arePaymentsExpanded
      ? players
      : []
    : currentUserPlayer
      ? [currentUserPlayer]
      : []
  const purpose =
    registrationFee.purpose?.trim() ||
    "Premios, bolas, bote final, reservas comunes u otros gastos de organización."

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

  async function handleSendReminder() {
    if (!canSendReminder || !onSendReminder || isSendingReminder) {
      return
    }

    setIsSendingReminder(true)
    setReminderMessage(null)

    try {
      const sent = await onSendReminder()
      setReminderMessage(
        sent
          ? "Recordatorio enviado a los jugadores pendientes."
          : "No se ha podido mandar el recordatorio.",
      )
    } finally {
      setIsSendingReminder(false)
    }
  }

  return (
    <AppCard className="border-emerald-200 bg-emerald-50 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-emerald-950">
            Inscripciones
            <span className="ml-1.5 text-xs font-bold text-emerald-700">
              · {formatMoney(registrationFee.amount)}/jugador
            </span>
          </p>
        </div>
        <span className={getPaymentStatusBadgeClassName(paidCount === players.length)}>
          {paidCount}/{players.length} pagadas
        </span>
      </div>

      {canManage ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 rounded-xl bg-white/75 px-2.5 py-1.5">
          <p className="text-[11px] font-semibold text-neutral-600">
            <strong className="font-black text-neutral-950">
              {pendingPlayers.length}
            </strong>{" "}
            pendientes ·{" "}
            <strong className="font-black text-neutral-950">
              {formatMoney(pendingAmount)}
            </strong>{" "}
            por cobrar · {formatMoney(totalAmount)} total
          </p>

          {canSendReminder && pendingPlayers.length > 0 ? (
            <button
              type="button"
              onClick={handleSendReminder}
              disabled={isSendingReminder}
              className="shrink-0 rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-black text-white transition active:scale-[0.98] disabled:opacity-40"
            >
              {isSendingReminder ? "Enviando..." : "Recordar"}
            </button>
          ) : null}
        </div>
      ) : currentUserPayment && !currentUserPayment.isPaid ? (
        <p className="mt-2 rounded-xl bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900">
          Debes {formatMoney(registrationFee.amount)} a{" "}
          {organizerName?.trim() || "la organización"}.
        </p>
      ) : null}

      {isSeasonUpcoming && pendingPlayers.length > 0 ? (
        <p className="mt-1.5 text-[11px] font-semibold leading-4 text-amber-900">
          La temporada no puede comenzar hasta saldar todas las inscripciones.
        </p>
      ) : null}

      {reminderMessage ? (
        <p className="mt-1.5 text-center text-[11px] font-semibold text-emerald-900">
          {reminderMessage}
        </p>
      ) : null}

      <details className="mt-1.5 rounded-xl bg-white/65 px-2.5 py-1.5">
        <summary className="cursor-pointer text-[11px] font-black text-emerald-900">
          Destino de la inscripción
        </summary>
        <p className="mt-1 text-[11px] font-semibold leading-4 text-neutral-600">
          {purpose}
        </p>
      </details>

      {canManage ? (
        <button
          type="button"
          onClick={() => setArePaymentsExpanded((current) => !current)}
          className="mt-1.5 flex w-full items-center justify-between rounded-xl bg-white/80 px-2.5 py-1.5 text-left text-[11px] font-black text-neutral-800 transition active:scale-[0.99]"
          aria-expanded={arePaymentsExpanded}
        >
          <span>{arePaymentsExpanded ? "Ocultar pagos" : "Gestionar pagos"}</span>
          <span aria-hidden="true" className="text-sm leading-none">
            {arePaymentsExpanded ? "⌃" : "⌄"}
          </span>
        </button>
      ) : null}

      {visiblePlayers.length > 0 ? (
        <div className="mt-1.5 space-y-1">
          {visiblePlayers.map((player) => {
            const payment = paymentByPlayerId.get(player.id)
            const isPaid = Boolean(payment?.isPaid)
            const canEdit = canManage || player.id === currentUserId
            const isSaving = savingPlayerId === player.id

            return (
              <div
                key={player.id}
                className="flex min-h-10 items-center gap-2 rounded-xl bg-white/80 px-2 py-1.5"
              >
                <PlayerAvatar
                  player={player}
                  size="sm"
                  className="bg-neutral-950 text-white"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-neutral-950">
                    {player.displayName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={getPaymentStatusBadgeClassName(isPaid)}>
                      {isPaid ? "Pagada" : "Pendiente"}
                    </span>
                    {!isPaid ? (
                      <span className="text-[10px] font-semibold text-neutral-500">
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
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black disabled:opacity-40 ${
                      isPaid
                        ? "bg-neutral-100 text-neutral-700"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isSaving ? "..." : isPaid ? "Pendiente" : "Marcar pagada"}
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </AppCard>
  )
}
