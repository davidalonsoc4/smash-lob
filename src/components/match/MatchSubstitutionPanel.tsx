"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
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
  const [substitutePlayerId, setSubstitutePlayerId] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/seasons/${encodeURIComponent(match.seasonId)}/substitutes`, { cache: "no-store" })
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
    return () => { cancelled = true }
  }, [match.seasonId])

  const matchSubstitutions = useMemo(
    () => payload?.matchSubstitutions.filter((item) => item.match_id === match.id) ?? [],
    [match.id, payload],
  )
  const replacedPlayerIds = new Set(matchSubstitutions.map((item) => item.substitute_player_id))
  const currentParticipants = [...match.teamA, ...match.teamB]
  const selectableOriginalPlayers = currentParticipants.filter((playerId) => !replacedPlayerIds.has(playerId))
  const activePool = payload?.substitutes.filter((item) => item.active && !currentParticipants.includes(item.player_id)) ?? []

  async function assign(event: FormEvent) {
    event.preventDefault()
    if (isSaving || !originalPlayerId || (!substitutePlayerId && displayName.trim().length < 2)) return
    setIsSaving(true)
    setError(null)
    const response = await fetch(`/api/matches/${encodeURIComponent(match.id)}/substitution`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        originalPlayerId,
        substitutePlayerId: substitutePlayerId || undefined,
        displayName: substitutePlayerId ? undefined : displayName.trim(),
      }),
    })
    setIsSaving(false)
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      const messages: Record<string, string> = {
        season_player_cannot_be_substitute: "Un titular de la temporada no puede actuar como suplente.",
        substitute_already_in_match: "Ese suplente ya participa en el partido.",
        substitute_not_available: "Ese jugador ya no está disponible en la bolsa de suplentes.",
        original_player_already_substituted: "Ese puesto del partido ya tiene una sustitución aplicada.",
        finished_match_locked: "No se puede cambiar una sustitución después de registrar el resultado.",
      }
      setError(messages[body?.error ?? ""] ?? "No se ha podido guardar la sustitución.")
      return
    }
    window.location.reload()
  }

  async function remove(substitutePlayerIdToRemove: string) {
    if (isSaving) return
    setIsSaving(true)
    setError(null)
    const response = await fetch(`/api/matches/${encodeURIComponent(match.id)}/substitution`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ substitutePlayerId: substitutePlayerIdToRemove }),
    })
    setIsSaving(false)
    if (!response.ok) {
      setError("No se ha podido deshacer la sustitución.")
      return
    }
    window.location.reload()
  }

  return (
    <AppCard>
      <p className="font-black">Sustituciones</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">Solo jugadores ajenos a los titulares pueden cubrir este partido. El suplente será quien reciba puntos, vote MVP y confirme el resultado. Si hay una reserva de pista, los pagos y transferencias se recalcularán con los participantes reales.</p>

      {matchSubstitutions.length > 0 ? (
        <div className="mt-3 space-y-2">
          {matchSubstitutions.map((item) => {
            const original = players.find((player) => player.id === item.original_player_id)
            const substitute = players.find((player) => player.id === item.substitute_player_id) ?? getProfile(payload?.substitutes.find((poolItem) => poolItem.player_id === item.substitute_player_id) as PoolItem)
            const substituteName = "displayName" in (substitute ?? {}) ? (substitute as PlayerProfile).displayName : (substitute as { display_name?: string } | null)?.display_name
            return (
              <div key={item.id} className="rounded-2xl bg-red-50 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-black">{substituteName ?? "Suplente"}</p><p className="text-[11px] font-semibold text-red-700">Sustituye a {original?.displayName ?? "titular"} · {item.substitution_type === "permanent" ? "reemplazo permanente" : "solo este partido"}</p></div>
                  {item.substitution_type === "single" && match.status !== "finished" ? <button type="button" disabled={isSaving} onClick={() => remove(item.substitute_player_id)} className="text-xs font-black text-red-700">Deshacer</button> : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {match.status !== "finished" ? (
        <form onSubmit={assign} className="mt-3 space-y-2">
          <select value={originalPlayerId} onChange={(event) => setOriginalPlayerId(event.target.value)} className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"><option value="">Jugador que no puede jugar</option>{selectableOriginalPlayers.map((playerId) => <option key={playerId} value={playerId}>{players.find((player) => player.id === playerId)?.displayName ?? playerId}</option>)}</select>
          <select value={substitutePlayerId} onChange={(event) => setSubstitutePlayerId(event.target.value)} className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"><option value="">Añadir un suplente nuevo</option>{activePool.map((item) => <option key={item.id} value={item.player_id}>{getProfile(item)?.display_name ?? "Suplente"}</option>)}</select>
          {!substitutePlayerId ? <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} placeholder="Nombre del suplente" className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold" /> : null}
          <button disabled={isSaving || !originalPlayerId || (!substitutePlayerId && displayName.trim().length < 2)} className="w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300">{isSaving ? "Guardando..." : "Asignar solo a este partido"}</button>
        </form>
      ) : null}

      {error ? <p className="mt-2 text-xs font-bold text-red-700">{error}</p> : null}
    </AppCard>
  )
}
