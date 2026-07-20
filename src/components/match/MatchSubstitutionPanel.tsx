"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"

type PoolItem = {
  id: string
  player_id: string
  active: boolean
  players:
    | { id: string; display_name: string }
    | Array<{ id: string; display_name: string }>
    | null
}

type ExistingSubstitution = {
  id: string
  match_id: string
  original_player_id: string
  substitute_player_id: string
  substitution_type: "single" | "permanent"
}

type Payload = {
  substitutes: PoolItem[]
  matchSubstitutions: ExistingSubstitution[]
}

const NEW_SUBSTITUTE_VALUE = "__new_substitute__"

function getProfile(item: PoolItem) {
  return Array.isArray(item.players) ? item.players[0] ?? null : item.players
}

export function MatchSubstitutionPanel({
  match,
  players,
}: {
  match: MatchData
  players: PlayerProfile[]
}) {
  const [payload, setPayload] = useState<Payload | null>(null)
  const [originalPlayerId, setOriginalPlayerId] = useState("")
  const [substituteSelection, setSubstituteSelection] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/matches/${encodeURIComponent(match.id)}/substitution`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("load_failed")
        return (await response.json()) as Payload
      })
      .then((nextPayload) => {
        if (!cancelled) setPayload(nextPayload)
      })
      .catch(() => {
        if (!cancelled) setError("No se han podido cargar los suplentes.")
      })
    return () => {
      cancelled = true
    }
  }, [match.id])

  const matchSubstitutions = useMemo(
    () =>
      payload?.matchSubstitutions.filter(
        (item) => item.match_id === match.id,
      ) ?? [],
    [match.id, payload],
  )
  const substitutePlayerIds = new Set(
    matchSubstitutions.map((item) => item.substitute_player_id),
  )
  const currentParticipants = [...match.teamA, ...match.teamB]
  const selectableOriginalPlayers = currentParticipants.filter(
    (playerId) => !substitutePlayerIds.has(playerId),
  )
  const activePool =
    payload?.substitutes.filter(
      (item) => item.active && !currentParticipants.includes(item.player_id),
    ) ?? []
  const isAddingNewSubstitute = substituteSelection === NEW_SUBSTITUTE_VALUE
  const selectedSubstitutePlayerId = isAddingNewSubstitute
    ? ""
    : substituteSelection
  const canAssign = Boolean(
    originalPlayerId &&
      (selectedSubstitutePlayerId ||
        (isAddingNewSubstitute && displayName.trim().length >= 2)),
  )

  async function assign(event: FormEvent) {
    event.preventDefault()
    if (isSaving || !canAssign) return

    setIsSaving(true)
    setError(null)
    const response = await fetch(
      `/api/matches/${encodeURIComponent(match.id)}/substitution`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originalPlayerId,
          substitutePlayerId: selectedSubstitutePlayerId || undefined,
          displayName: isAddingNewSubstitute
            ? displayName.trim()
            : undefined,
        }),
      },
    )
    setIsSaving(false)
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      const messages: Record<string, string> = {
        forbidden: "No tienes permiso para gestionar este partido.",
        season_player_cannot_be_substitute:
          "Un titular de la temporada no puede actuar como suplente.",
        substitute_already_in_match:
          "Ese suplente ya participa en el partido.",
        substitute_not_available:
          "Ese jugador ya no está disponible en la bolsa de suplentes.",
        original_player_already_substituted:
          "Ese puesto del partido ya tiene una sustitución aplicada.",
        finished_match_locked:
          "No se puede cambiar una sustitución después de registrar el resultado.",
      }
      setError(
        messages[body?.error ?? ""] ??
          "No se ha podido guardar la sustitución.",
      )
      return
    }
    window.location.reload()
  }

  async function remove(substitutePlayerIdToRemove: string) {
    if (isSaving) return
    setIsSaving(true)
    setError(null)
    const response = await fetch(
      `/api/matches/${encodeURIComponent(match.id)}/substitution`,
      {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          substitutePlayerId: substitutePlayerIdToRemove,
        }),
      },
    )
    setIsSaving(false)
    if (!response.ok) {
      setError("No se ha podido deshacer la sustitución.")
      return
    }
    window.location.reload()
  }

  return (
    <details className="group rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-sm font-black">Sustituciones</p>
          {matchSubstitutions.length > 0 ? (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700">
              {matchSubstitutions.length}
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
              Opcional
            </span>
          )}
        </div>
        <span className="shrink-0 text-[11px] font-black text-neutral-500">
          Gestionar <span className="inline-block transition group-open:rotate-180">⌄</span>
        </span>
      </summary>

      <div className="border-t border-neutral-100 px-3 py-3">
        <p className="text-[11px] font-semibold leading-4 text-neutral-500">
          Sustituye a un titular solo en este partido. Los puntos, el MVP, las
          confirmaciones y los pagos corresponderán a quien juegue realmente.
        </p>

        {matchSubstitutions.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {matchSubstitutions.map((item) => {
              const original = players.find(
                (player) => player.id === item.original_player_id,
              )
              const substitute =
                players.find(
                  (player) => player.id === item.substitute_player_id,
                ) ??
                getProfile(
                  payload?.substitutes.find(
                    (poolItem) =>
                      poolItem.player_id === item.substitute_player_id,
                  ) as PoolItem,
                )
              const substituteName =
                "displayName" in (substitute ?? {})
                  ? (substitute as PlayerProfile).displayName
                  : (substitute as { display_name?: string } | null)
                      ?.display_name

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-red-50 px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black">
                      {substituteName ?? "Suplente"}
                    </p>
                    <p className="truncate text-[10px] font-semibold text-red-700">
                      Por {original?.displayName ?? "titular"} ·{" "}
                      {item.substitution_type === "permanent"
                        ? "permanente"
                        : "este partido"}
                    </p>
                  </div>
                  {item.substitution_type === "single" &&
                  match.status !== "finished" ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => remove(item.substitute_player_id)}
                      className="shrink-0 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-black text-red-700 disabled:opacity-50"
                    >
                      Deshacer
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}

        {match.status !== "finished" ? (
          <form onSubmit={assign} className="mt-2 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={originalPlayerId}
                onChange={(event) => setOriginalPlayerId(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold"
              >
                <option value="">Titular que no puede jugar</option>
                {selectableOriginalPlayers.map((playerId) => (
                  <option key={playerId} value={playerId}>
                    {players.find((player) => player.id === playerId)
                      ?.displayName ?? playerId}
                  </option>
                ))}
              </select>

              <select
                value={substituteSelection}
                onChange={(event) => {
                  setSubstituteSelection(event.target.value)
                  if (event.target.value !== NEW_SUBSTITUTE_VALUE) {
                    setDisplayName("")
                  }
                }}
                className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold"
              >
                <option value="">Selecciona suplente</option>
                {activePool.map((item) => (
                  <option key={item.id} value={item.player_id}>
                    {getProfile(item)?.display_name ?? "Suplente"}
                  </option>
                ))}
                <option value={NEW_SUBSTITUTE_VALUE}>
                  + Añadir un suplente nuevo
                </option>
              </select>
            </div>

            {isAddingNewSubstitute ? (
              <div>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={80}
                  placeholder="Nombre del nuevo suplente"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold"
                />
                <p className="mt-1 text-[10px] font-semibold text-neutral-500">
                  Quedará guardado también en la bolsa de suplentes.
                </p>
              </div>
            ) : null}

            <button
              disabled={isSaving || !canAssign}
              className="w-full rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
            >
              {isSaving ? "Guardando..." : "Asignar a este partido"}
            </button>
          </form>
        ) : null}

        {error ? (
          <p className="mt-2 text-[11px] font-bold text-red-700">{error}</p>
        ) : null}
      </div>
    </details>
  )
}
