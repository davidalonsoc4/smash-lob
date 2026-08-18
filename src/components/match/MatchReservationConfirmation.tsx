"use client"

import { useMemo, useState } from "react"
import type { PlayerProfile } from "@/data/fakeData"
import type { CourtBookingReservation } from "@/context/MatchDataProvider"
import {
  getLeagueLocationCourts,
  getLeagueLocationOptionLabel,
  type LeagueLocation,
} from "@/lib/leagueLocations"
import { formatMatchScheduleLongLabel } from "@/lib/matchScheduleTime"
import { formatMoney } from "@/lib/courtBooking"
import type { MatchChatCoordination } from "@/lib/matchChatCoordination"

type Props = {
  matchId: string
  coordination: MatchChatCoordination
  locations: LeagueLocation[]
  participantIds?: string[]
  players?: PlayerProfile[]
  currentPlayerId?: string
  requireReservationPayments?: boolean
  compact?: boolean
  onConfirmed?: () => void | Promise<void>
  onInvalidated?: () => void | Promise<void>
  preserveFocus?: (event: React.PointerEvent<HTMLElement>) => void
}

type ReservationInput = {
  playerId: string
  amount: string
}

const optionKey = (messageId: string, key: string) => `${messageId}:${key}`

function getPlayerName(playerId: string, players: PlayerProfile[]) {
  return players.find((player) => player.id === playerId)?.displayName ?? playerId
}

function parseAmount(value: string) {
  const parsed = Number(value.replace(",", ".").trim())
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.round((parsed + Number.EPSILON) * 100) / 100
}

export function MatchReservationConfirmation({
  matchId,
  coordination,
  locations,
  participantIds = [],
  players = [],
  currentPlayerId = "",
  requireReservationPayments = false,
  compact = false,
  onConfirmed,
  onInvalidated,
  preserveFocus,
}: Props) {
  const approvedLocations = useMemo(
    () => coordination.approvedLocations ?? [],
    [coordination.approvedLocations],
  )
  const rejectedLocations = useMemo(
    () => coordination.rejectedLocations ?? [],
    [coordination.rejectedLocations],
  )
  const bookingParticipantIds = useMemo(
    () => Array.from(new Set(participantIds.filter(Boolean))),
    [participantIds],
  )
  const [open, setOpen] = useState(false)
  const [dateKey, setDateKey] = useState("")
  const [locationId, setLocationId] = useState("")
  const [selectedCourt, setSelectedCourt] = useState("")
  const [selectedPayerIds, setSelectedPayerIds] = useState<string[]>([])
  const [reservationInputs, setReservationInputs] = useState<ReservationInput[]>(() =>
    bookingParticipantIds.map((playerId) => ({ playerId, amount: "" })),
  )
  const [saving, setSaving] = useState(false)
  const [invalidating, setInvalidating] = useState(false)
  const [error, setError] = useState("")

  const approvedConfiguredLocationIds = useMemo(
    () =>
      new Set(
        approvedLocations
          .map((item) => item.locationId)
          .filter((value): value is string => Boolean(value)),
      ),
    [approvedLocations],
  )
  const rejectedLocationIds = useMemo(
    () =>
      new Set(
        rejectedLocations
          .map((item) => item.locationId)
          .filter((value): value is string => Boolean(value)),
      ),
    [rejectedLocations],
  )
  const selectableLocations = useMemo(() => {
    const allowed = locations.filter((item) => !rejectedLocationIds.has(item.id))
    if (!approvedConfiguredLocationIds.size) return allowed
    return allowed.filter((item) => approvedConfiguredLocationIds.has(item.id))
  }, [approvedConfiguredLocationIds, locations, rejectedLocationIds])
  const selectedLocation = locations.find((item) => item.id === locationId) ?? null
  const courts = selectedLocation ? getLeagueLocationCourts(selectedLocation) : []
  const dateOption = coordination.approvedDates.find(
    (item) => optionKey(item.messageId, item.optionKey) === dateKey,
  )
  const selectedReservationInputs = reservationInputs.filter((input) =>
    selectedPayerIds.includes(input.playerId),
  )
  const parsedReservations = selectedReservationInputs
    .map((input) => {
      const amount = parseAmount(input.amount)
      return amount ? { playerId: input.playerId, amount } : null
    })
    .filter((item): item is CourtBookingReservation => Boolean(item))
  const paymentAmountsAreValid =
    !requireReservationPayments ||
    (selectedReservationInputs.length > 0 &&
      selectedReservationInputs.every((input) => parseAmount(input.amount) !== null))
  const reservationTotal = parsedReservations.reduce(
    (total, reservation) => total + reservation.amount,
    0,
  )
  const canConfirm = Boolean(
    dateOption &&
      selectedLocation &&
      selectedCourt &&
      paymentAmountsAreValid &&
      !saving,
  )

  function resetPaymentInputs() {
    setSelectedPayerIds([])
    setReservationInputs(
      bookingParticipantIds.map((playerId) => ({ playerId, amount: "" })),
    )
  }

  function openConfirmation() {
    setError("")
    if (coordination.approvedDates.length === 1) {
      const onlyDate = coordination.approvedDates[0]
      setDateKey(optionKey(onlyDate.messageId, onlyDate.optionKey))
    }
    if (selectableLocations.length === 1) {
      setLocationId(selectableLocations[0].id)
      setSelectedCourt("")
    }
    if (
      requireReservationPayments &&
      selectedPayerIds.length === 0 &&
      currentPlayerId &&
      bookingParticipantIds.includes(currentPlayerId)
    ) {
      setSelectedPayerIds([currentPlayerId])
    }
    setOpen(true)
  }

  function togglePayer(playerId: string) {
    setSelectedPayerIds((currentIds) =>
      currentIds.includes(playerId)
        ? currentIds.filter((currentId) => currentId !== playerId)
        : [...currentIds, playerId],
    )
    setError("")
  }

  function updateReservationAmount(playerId: string, amount: string) {
    setReservationInputs((currentInputs) =>
      currentInputs.map((input) =>
        input.playerId === playerId ? { ...input, amount } : input,
      ),
    )
    setError("")
  }

  async function confirmReservation() {
    if (
      !dateOption ||
      !selectedLocation ||
      !selectedCourt ||
      !paymentAmountsAreValid ||
      saving
    ) {
      return
    }

    setSaving(true)
    setError("")
    const response = await fetch(
      `/api/matches/${encodeURIComponent(matchId)}/reservation-confirmation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          dateMessageId: dateOption.messageId,
          dateOptionKey: dateOption.optionKey,
          locationId: selectedLocation.id,
          selectedCourt,
          ...(requireReservationPayments
            ? { reservations: parsedReservations }
            : {}),
        }),
      },
    )
    const data = await response.json().catch(() => null)
    setSaving(false)
    if (!response.ok) {
      const messageByError: Record<string, string> = {
        match_reservation_not_ready: "El acuerdo de fecha ya no está vigente. Revisa las votaciones.",
        match_reservation_option_not_approved: "La fecha elegida ya no tiene 4/4 votos.",
        match_reservation_location_not_approved: "Hay una ubicación acordada distinta. Selecciona una de las ubicaciones aprobadas.",
        match_reservation_location_rejected: "Esa ubicación fue descartada expresamente por los cuatro jugadores.",
        match_reservation_location_not_configured: "La ubicación elegida ya no está configurada en la liga.",
        match_reservation_courts_missing: "Esta ubicación no tiene pistas configuradas.",
        match_reservation_invalid_court: "La pista elegida ya no es válida.",
        match_reservation_payments_invalid: "Indica quién pagó la pista y un importe válido para cada pagador.",
      }
      setError(messageByError[data?.error] ?? "No se ha podido confirmar la reserva.")
      return
    }
    setOpen(false)
    setDateKey("")
    setLocationId("")
    setSelectedCourt("")
    resetPaymentInputs()
    await onConfirmed?.()
  }

  async function invalidateAgreedDates() {
    if (invalidating || saving) return
    setInvalidating(true)
    setError("")
    const response = await fetch(
      `/api/matches/${encodeURIComponent(matchId)}/reservation-confirmation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invalidate_dates" }),
      },
    )
    const data = await response.json().catch(() => null)
    setInvalidating(false)
    if (!response.ok) {
      setError(
        data?.error === "match_reservation_not_ready"
          ? "El acuerdo ya ha cambiado. Actualiza el chat."
          : "No se ha podido descartar la fecha acordada.",
      )
      return
    }
    setOpen(false)
    setDateKey("")
    setLocationId("")
    setSelectedCourt("")
    resetPaymentInputs()
    await onInvalidated?.()
  }

  if (coordination.status !== "awaiting_booking") return null

  if (compact && !open) {
    return (
      <button
        type="button"
        onPointerDown={preserveFocus}
        onClick={openConfirmation}
        className="inline-flex h-7 items-center justify-center rounded-full bg-neutral-950 px-3 text-center type-caption font-black text-white transition active:scale-[0.98]"
      >
        Confirmar reserva
      </button>
    )
  }

  return (
    <div
      data-tour="chat-reservation-pending"
      className={`${compact ? "rounded-xl border border-neutral-200 bg-white p-2.5 shadow-sm" : "border-b border-indigo-200 bg-indigo-50 px-3 py-2.5"}`}
    >
      <div className="flex items-start gap-2">
        {!compact ? (
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 17v5" /><path d="m5 3 14 0" /><path d="m7 3 1.5 8-3 3h13l-3-3L17 3" /></svg>
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-neutral-950">Pendiente de reserva</p>
          <p className="type-caption font-semibold text-neutral-600">
            Acuerdo 4/4 en fecha y hora. Falta confirmar la reserva definitiva.
          </p>
        </div>
        {open ? (
          <button
            type="button"
            onPointerDown={preserveFocus}
            onClick={() => setOpen(false)}
            className="inline-flex h-7 items-center justify-center rounded-full bg-white/80 px-2.5 text-center type-caption font-black text-neutral-600"
          >
            Cerrar
          </button>
        ) : null}
      </div>

      <div className="mt-2 space-y-1 type-caption font-semibold text-neutral-700">
        {coordination.approvedDates.map((option) => (
          <p key={optionKey(option.messageId, option.optionKey)} className="truncate">
            <span className="font-black text-indigo-700">Fecha</span> · {formatMatchScheduleLongLabel(option.startsAt)}
          </p>
        ))}
        {approvedLocations.length ? (
          <p className="truncate">
            <span className="font-black text-indigo-700">Ubicación acordada</span> · {approvedLocations.map((item) => item.name).join(" · ")}
          </p>
        ) : (
          <p><span className="font-black text-indigo-700">Ubicación</span> · Sin acuerdo previo; se elegirá al confirmar.</p>
        )}
        {rejectedLocations.length ? (
          <p className="text-red-700"><span className="font-black">No utilizar</span> · {rejectedLocations.map((item) => item.name).join(" · ")}</p>
        ) : null}
      </div>

      {!open ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onPointerDown={preserveFocus}
            onClick={openConfirmation}
            className="flex min-h-9 items-center justify-center rounded-xl bg-neutral-950 px-2.5 py-2 text-center type-caption font-black text-white transition active:scale-[0.99]"
          >
            Confirmar reserva
          </button>
          <button
            type="button"
            disabled={invalidating}
            onPointerDown={preserveFocus}
            onClick={() => void invalidateAgreedDates()}
            className="flex min-h-9 items-center justify-center rounded-xl border border-neutral-300 bg-white px-2.5 py-2 text-center type-caption font-black text-neutral-700 transition active:scale-[0.99] disabled:opacity-50"
          >
            {invalidating ? "Actualizando…" : "Fecha/hora no disponible"}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          <div>
            <p className="mb-1 type-caption font-black uppercase tracking-wide text-neutral-500">Fecha y hora reservada</p>
            <div className="space-y-1.5">
              {coordination.approvedDates.map((option) => {
                const key = optionKey(option.messageId, option.optionKey)
                return (
                  <button
                    key={key}
                    type="button"
                    onPointerDown={preserveFocus}
                    onClick={() => setDateKey(key)}
                    className={`flex w-full items-center justify-center rounded-lg border px-2.5 py-2 text-center text-xs font-black ${dateKey === key ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700"}`}
                  >
                    {formatMatchScheduleLongLabel(option.startsAt)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-1 type-caption font-black uppercase tracking-wide text-neutral-500">Ubicación reservada</p>
            {selectableLocations.length ? (
              <div className="space-y-1.5">
                {selectableLocations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onPointerDown={preserveFocus}
                    onClick={() => {
                      setLocationId(location.id)
                      setSelectedCourt("")
                    }}
                    className={`flex w-full items-center justify-center whitespace-normal rounded-lg border px-2.5 py-2 text-center text-xs font-black leading-tight ${locationId === location.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700"}`}
                  >
                    {getLeagueLocationOptionLabel(location)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-bold text-amber-800">No queda ninguna ubicación válida configurada para confirmar la reserva.</p>
            )}
            {rejectedLocations.length ? (
              <p className="mt-1.5 type-caption font-bold text-red-700">Descartadas 4/4: {rejectedLocations.map((item) => item.name).join(" · ")}</p>
            ) : null}
          </div>

          {selectedLocation ? (
            <div>
              <p className="mb-1 type-caption font-black uppercase tracking-wide text-neutral-500">Pista reservada</p>
              {courts.length ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {courts.map((court) => (
                    <button
                      key={court}
                      type="button"
                      onPointerDown={preserveFocus}
                      onClick={() => setSelectedCourt(court)}
                      className={`inline-flex items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-black ${selectedCourt === court ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700"}`}
                    >
                      {court}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-bold text-amber-800">Esta ubicación no tiene pistas configuradas. Añade el número de pistas antes de confirmar la reserva.</p>
              )}
            </div>
          ) : null}

          {requireReservationPayments ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-2.5">
              <div>
                <p className="type-caption font-black uppercase tracking-wide text-neutral-500">
                  Pagos de la reserva
                </p>
                <p className="mt-0.5 text-xs font-semibold text-neutral-600">
                  Indica quién pagó la pista y cuánto abonó cada persona.
                </p>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {bookingParticipantIds.map((playerId) => {
                  const isSelected = selectedPayerIds.includes(playerId)
                  return (
                    <button
                      key={playerId}
                      type="button"
                      onPointerDown={preserveFocus}
                      onClick={() => togglePayer(playerId)}
                      disabled={saving}
                      className={`rounded-lg border px-2 py-1.5 text-left text-xs font-black transition ${
                        isSelected
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-200 bg-neutral-50 text-neutral-700"
                      } disabled:opacity-50`}
                    >
                      <span className="block truncate">{getPlayerName(playerId, players)}</span>
                    </button>
                  )
                })}
              </div>

              {selectedReservationInputs.length ? (
                <div className="mt-2 space-y-1.5">
                  {selectedReservationInputs.map((input) => (
                    <label
                      key={input.playerId}
                      className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-1.5"
                    >
                      <span className="min-w-0 truncate text-xs font-black text-neutral-800">
                        {getPlayerName(input.playerId, players)}
                      </span>
                      <span className="flex w-28 shrink-0 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1">
                        <input
                          inputMode="decimal"
                          value={input.amount}
                          disabled={saving}
                          onChange={(event) =>
                            updateReservationAmount(input.playerId, event.target.value)
                          }
                          placeholder="0,00"
                          className="min-w-0 flex-1 bg-transparent text-right text-sm font-black text-neutral-900 outline-none"
                        />
                        <span className="text-xs font-black text-neutral-500">€</span>
                      </span>
                    </label>
                  ))}
                  <div className="flex items-center justify-between gap-2 px-0.5 pt-0.5 text-xs">
                    <span className="font-bold text-neutral-600">Total reserva</span>
                    <span className="font-black text-neutral-950">
                      {formatMoney(reservationTotal)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 rounded-lg bg-neutral-50 px-2.5 py-2 text-xs font-semibold text-neutral-500">
                  Selecciona al menos un pagador.
                </p>
              )}
            </div>
            ) : null}

          {error ? <p className="rounded-lg bg-red-50 px-2.5 py-2 text-xs font-bold text-red-700">{error}</p> : null}

          <button
            type="button"
            disabled={!canConfirm}
            onPointerDown={preserveFocus}
            onClick={() => void confirmReservation()}
            className="flex w-full items-center justify-center rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white disabled:opacity-40"
          >
            {saving ? "Confirmando…" : "Confirmar reserva y programar"}
          </button>
          <button
            type="button"
            disabled={invalidating}
            onPointerDown={preserveFocus}
            onClick={() => void invalidateAgreedDates()}
            className="flex w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 py-2 text-center type-caption font-black text-neutral-700 disabled:opacity-50"
          >
            {invalidating ? "Actualizando…" : "La fecha/hora acordada no está disponible"}
          </button>
        </div>
      )}

      {error && !open ? <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  )
}
