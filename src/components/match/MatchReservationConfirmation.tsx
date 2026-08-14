"use client"

import { useMemo, useState } from "react"
import {
  getLeagueLocationCourts,
  type LeagueLocation,
} from "@/lib/leagueLocations"
import type { MatchChatCoordination } from "@/lib/matchChatCoordination"

type Props = {
  matchId: string
  coordination: MatchChatCoordination
  locations: LeagueLocation[]
  compact?: boolean
  onConfirmed?: () => void | Promise<void>
  preserveFocus?: (event: React.PointerEvent<HTMLElement>) => void
}

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

export function MatchReservationConfirmation({
  matchId,
  coordination,
  locations,
  compact = false,
  onConfirmed,
  preserveFocus,
}: Props) {
  const [open, setOpen] = useState(false)
  const [dateKey, setDateKey] = useState("")
  const [locationKey, setLocationKey] = useState("")
  const [selectedCourt, setSelectedCourt] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const dateOption = coordination.approvedDates.find(
    (item) => `${item.messageId}:${item.optionKey}` === dateKey,
  )
  const locationOption = coordination.approvedLocations.find(
    (item) => `${item.messageId}:${item.optionKey}` === locationKey,
  )
  const location = useMemo(
    () =>
      locationOption?.locationId
        ? locations.find((item) => item.id === locationOption.locationId) ?? null
        : null,
    [locationOption, locations],
  )
  const courts = location ? getLeagueLocationCourts(location) : []
  const canConfirm = Boolean(dateOption && locationOption && selectedCourt && !saving)

  async function confirmReservation() {
    if (!dateOption || !locationOption || !selectedCourt || saving) return
    setSaving(true)
    setError("")
    const response = await fetch(
      `/api/matches/${encodeURIComponent(matchId)}/reservation-confirmation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateMessageId: dateOption.messageId,
          dateOptionKey: dateOption.optionKey,
          locationMessageId: locationOption.messageId,
          locationOptionKey: locationOption.optionKey,
          selectedCourt,
        }),
      },
    )
    const data = await response.json().catch(() => null)
    setSaving(false)
    if (!response.ok) {
      const messageByError: Record<string, string> = {
        match_reservation_not_ready: "El acuerdo ya no está completo. Revisa las votaciones.",
        match_reservation_option_not_approved: "Una de las opciones elegidas ya no tiene 4/4 votos.",
        match_reservation_location_not_configured: "La ubicación elegida ya no está configurada en la liga.",
        match_reservation_courts_missing: "Esta ubicación no tiene pistas configuradas.",
        match_reservation_invalid_court: "La pista elegida ya no es válida.",
      }
      setError(messageByError[data?.error] ?? "No se ha podido confirmar la reserva.")
      return
    }
    setOpen(false)
    setDateKey("")
    setLocationKey("")
    setSelectedCourt("")
    await onConfirmed?.()
  }

  if (coordination.status !== "awaiting_booking") return null

  if (!open) {
    return (
      <button
        type="button"
        onPointerDown={preserveFocus}
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex h-7 items-center justify-center rounded-full bg-neutral-950 px-3 text-center type-caption font-black text-white transition active:scale-[0.98]"
            : "flex w-full items-center justify-center rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white transition active:scale-[0.99]"
        }
      >
        Confirmar reserva
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-black text-neutral-950">Confirmar reserva</p>
          <p className="type-caption font-semibold text-neutral-500">
            Elige una combinación aprobada 4/4.
          </p>
        </div>
        <button
          type="button"
          onPointerDown={preserveFocus}
          onClick={() => setOpen(false)}
          className="inline-flex h-7 items-center justify-center rounded-full bg-neutral-100 px-2.5 text-center type-caption font-black text-neutral-600"
        >
          Cerrar
        </button>
      </div>

      <div className="mt-2.5 space-y-2.5">
        <div>
          <p className="mb-1 type-caption font-black uppercase tracking-wide text-neutral-500">Fecha y hora</p>
          <div className="space-y-1.5">
            {coordination.approvedDates.map((option) => {
              const key = `${option.messageId}:${option.optionKey}`
              return (
                <button
                  key={key}
                  type="button"
                  onPointerDown={preserveFocus}
                  onClick={() => setDateKey(key)}
                  className={`flex w-full items-center justify-center rounded-lg border px-2.5 py-2 text-center text-xs font-black ${dateKey === key ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-stone-50 text-neutral-700"}`}
                >
                  {dateLabel(option.startsAt)}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-1 type-caption font-black uppercase tracking-wide text-neutral-500">Ubicación</p>
          <div className="space-y-1.5">
            {coordination.approvedLocations.map((option) => {
              const key = `${option.messageId}:${option.optionKey}`
              return (
                <button
                  key={key}
                  type="button"
                  onPointerDown={preserveFocus}
                  onClick={() => {
                    setLocationKey(key)
                    setSelectedCourt("")
                  }}
                  className={`flex w-full items-center justify-center whitespace-normal rounded-lg border px-2.5 py-2 text-center text-xs font-black leading-tight ${locationKey === key ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-stone-50 text-neutral-700"}`}
                >
                  {option.name}
                </button>
              )
            })}
          </div>
        </div>

        {locationOption ? (
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
                    className={`inline-flex items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-black ${selectedCourt === court ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-stone-50 text-neutral-700"}`}
                  >
                    {court}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-bold text-amber-800">
                Esta ubicación no tiene pistas configuradas. Añade el número de pistas antes de confirmar la reserva.
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
      </div>
    </div>
  )
}
