"use client"

import { useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import type { MatchResultConfirmation, MatchResultConfirmationStatus } from "@/lib/supabaseMatchConfirmations"
import type { MvpPlayer } from "@/lib/mvp"

type MatchResultConfirmationCardProps = {
  matchId: string
  participantIds: string[]
  currentUserId: string
  players: MvpPlayer[]
  confirmations: MatchResultConfirmation[]
  onSetStatus: (input: {
    matchId: string
    playerId: string
    status: MatchResultConfirmationStatus
  }) => Promise<boolean>
}

export function MatchResultConfirmationCard({
  matchId,
  participantIds,
  currentUserId,
  players,
  confirmations,
  onSetStatus,
}: MatchResultConfirmationCardProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const participantSet = new Set(participantIds)
  const matchConfirmations = confirmations.filter(
    (item) => item.matchId === matchId && participantSet.has(item.playerId),
  )
  const currentConfirmation = matchConfirmations.find(
    (item) => item.playerId === currentUserId,
  )
  const disputed = matchConfirmations.filter((item) => item.status === "disputed")
  const confirmedCount = matchConfirmations.filter(
    (item) => item.status === "confirmed",
  ).length
  const isComplete = confirmedCount === participantIds.length
  const isParticipant = participantSet.has(currentUserId)
  const disputedNames = disputed
    .map(
      (item) =>
        players.find((player) => player.id === item.playerId)?.displayName ??
        "Un jugador",
    )
    .join(", ")

  async function saveStatus(status: MatchResultConfirmationStatus) {
    if (!isParticipant || isSaving) {
      return
    }

    setIsSaving(true)
    setError(null)
    const saved = await onSetStatus({
      matchId,
      playerId: currentUserId,
      status,
    })
    setIsSaving(false)

    if (!saved) {
      setError("No se ha podido guardar tu respuesta. Inténtalo de nuevo.")
    }
  }

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">Confirmación del resultado</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            Los cuatro jugadores deben revisar los sets registrados.
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
            disputed.length > 0
              ? "bg-red-100 text-red-700"
              : isComplete
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {disputed.length > 0
            ? "En revisión"
            : isComplete
              ? "Validado"
              : `${confirmedCount}/${participantIds.length}`}
        </span>
      </div>

      {disputed.length > 0 ? (
        <div className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold leading-5 text-red-800">
          {disputedNames} ha indicado que el resultado no es correcto. Debe
          revisarse y editarse; al hacerlo se reiniciarán las confirmaciones y
          los votos MVP.
        </div>
      ) : isComplete ? (
        <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold leading-5 text-emerald-800">
          Resultado confirmado por los cuatro jugadores.
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-5 text-amber-900">
          El resultado es provisional hasta que todos lo confirmen.
        </div>
      )}

      {isParticipant ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => saveStatus("confirmed")}
            disabled={isSaving}
            className={`rounded-xl px-3 py-2.5 text-sm font-black disabled:opacity-50 ${
              currentConfirmation?.status === "confirmed"
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-800"
            }`}
          >
            {isSaving && currentConfirmation?.status !== "confirmed"
              ? "Guardando..."
              : "El resultado es correcto"}
          </button>

          <button
            type="button"
            onClick={() => saveStatus("disputed")}
            disabled={isSaving}
            className={`rounded-xl px-3 py-2.5 text-sm font-black disabled:opacity-50 ${
              currentConfirmation?.status === "disputed"
                ? "bg-red-700 text-white"
                : "bg-red-50 text-red-700"
            }`}
          >
            El resultado es incorrecto
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </AppCard>
  )
}
