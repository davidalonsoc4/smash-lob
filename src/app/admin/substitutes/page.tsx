"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { calculateSubstituteStats } from "@/lib/substitutes"
import { useI18n } from "@/i18n/I18nProvider"

type PoolPlayer = {
  id: string
  league_id: string
  season_id: string
  player_id: string
  active: boolean
  inactive_reason: "retired" | "promoted" | null
  players:
    | { id: string; display_name: string; avatar_initials: string; avatar_url: string | null }
    | Array<{ id: string; display_name: string; avatar_initials: string; avatar_url: string | null }>
    | null
}

type MatchSubstitutionRow = {
  id: string
  match_id: string
  original_player_id: string
  substitute_player_id: string
  substitution_type: "single" | "permanent"
}

type ReplacementRow = {
  id: string
  outgoing_player_id: string
  incoming_player_id: string
  from_round: number
}

type Payload = {
  substitutes: PoolPlayer[]
  matchSubstitutions: MatchSubstitutionRow[]
  replacements: ReplacementRow[]
}

function getPoolProfile(item: PoolPlayer | undefined) {
  if (!item) return null
  return Array.isArray(item.players) ? item.players[0] ?? null : item.players
}

function getMatchStatusText(status: string) {
  const labels: Record<string, string> = {
    finished: "Partido finalizado",
    scheduled: "Partido programado",
    postponed: "Partido aplazado",
    scheduling: "Sin programar",
  }

  return labels[status] ?? "Partido"
}

export default function AdminSubstitutesPage() {
  const { tx } = useI18n()
  const { hasLeagueAdminRole } = useLeagueAccess()
  const {
    activeLeague,
    activeSeason,
    players,
    rankingPlayers,
    matches,
  } = useCurrentLeagueData()
  const [payload, setPayload] = useState<Payload>({ substitutes: [], matchSubstitutions: [], replacements: [] })
  const [displayName, setDisplayName] = useState("")
  const [outgoingPlayerId, setOutgoingPlayerId] = useState("")
  const [incomingPlayerId, setIncomingPlayerId] = useState("")
  const [replacementName, setReplacementName] = useState("")
  const [fromRound, setFromRound] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canManage = hasLeagueAdminRole(activeLeague.id)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const response = await fetch(`/api/seasons/${encodeURIComponent(activeSeason.id)}/substitutes`, { cache: "no-store" })
    setIsLoading(false)
    if (!response.ok) {
      setError("No se ha podido cargar la gestión de suplentes.")
      return
    }
    setPayload((await response.json()) as Payload)
  }, [activeSeason.id])

  useEffect(() => {
    if (!canManage) return
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [canManage, load])

  const activePool = useMemo(
    () => payload.substitutes.filter((item) => item.active),
    [payload.substitutes],
  )
  const historicalSubstitutePlayerIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...payload.substitutes.map((item) => item.player_id),
          ...payload.matchSubstitutions
            .filter((item) => item.substitution_type === "single")
            .map((item) => item.substitute_player_id),
        ]),
      ),
    [payload.matchSubstitutions, payload.substitutes],
  )
  const stats = useMemo(
    () =>
      calculateSubstituteStats({
        seasonId: activeSeason.id,
        substitutePlayerIds: historicalSubstitutePlayerIds,
        matchSubstitutions: payload.matchSubstitutions,
        matches,
      }),
    [
      activeSeason.id,
      historicalSubstitutePlayerIds,
      matches,
      payload.matchSubstitutions,
    ],
  )
  const substitutionHistory = useMemo(
    () =>
      payload.matchSubstitutions
        .filter((item) => item.substitution_type === "single")
        .map((item) => ({
          ...item,
          match: matches.find((match) => match.id === item.match_id) ?? null,
        }))
        .filter((item) => item.match?.seasonId === activeSeason.id)
        .sort((left, right) =>
          (right.match?.round ?? 0) - (left.match?.round ?? 0),
        ),
    [activeSeason.id, matches, payload.matchSubstitutions],
  )

  async function addSubstitute(event: FormEvent) {
    event.preventDefault()
    if (isSaving || displayName.trim().length < 2) return
    setIsSaving(true)
    setError(null)
    const response = await fetch(`/api/seasons/${encodeURIComponent(activeSeason.id)}/substitutes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: displayName.trim() }),
    })
    setIsSaving(false)
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      setError(body?.error === "season_player_cannot_be_substitute" ? "Un titular de la temporada no puede añadirse como suplente." : "No se ha podido añadir el suplente.")
      return
    }
    setDisplayName("")
    await load()
  }

  async function removeSubstitute(id: string) {
    if (isSaving) return
    setIsSaving(true)
    setError(null)
    const response = await fetch(`/api/seasons/${encodeURIComponent(activeSeason.id)}/substitutes/${encodeURIComponent(id)}`, { method: "DELETE" })
    setIsSaving(false)
    if (!response.ok) {
      setError("No se ha podido retirar el suplente.")
      return
    }
    await load()
  }

  async function createReplacement(event: FormEvent) {
    event.preventDefault()
    if (isSaving || !outgoingPlayerId || (!incomingPlayerId && replacementName.trim().length < 2)) return
    const confirmed = window.confirm(tx(`El reemplazo será permanente desde la jornada ${fromRound}. Los partidos terminados no se modificarán. ¿Continuar?`))
    if (!confirmed) return
    setIsSaving(true)
    setError(null)
    const response = await fetch(`/api/seasons/${encodeURIComponent(activeSeason.id)}/replacements`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        outgoingPlayerId,
        incomingPlayerId: incomingPlayerId || undefined,
        displayName: incomingPlayerId ? undefined : replacementName.trim(),
        fromRound,
      }),
    })
    setIsSaving(false)
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      const messages: Record<string, string> = {
        replacement_round_has_finished_matches: "Hay partidos terminados desde esa jornada. Elige una jornada posterior.",
        incoming_player_already_in_season: "El jugador entrante ya es titular de esta temporada.",
        incoming_player_not_available: "El jugador entrante ya no está disponible en la bolsa de suplentes.",
        outgoing_has_future_substitutions: "Ese titular tiene sustituciones puntuales pendientes desde la jornada elegida. Deshazlas antes de aplicar la baja permanente.",
        incoming_has_future_substitutions: "El suplente entrante ya está asignado a otro partido pendiente. Deshaz esa sustitución antes de convertirlo en titular.",
        replacement_has_no_future_matches: "El titular no tiene partidos pendientes desde esa jornada.",
      }
      setError(messages[body?.error ?? ""] ?? "No se ha podido aplicar el reemplazo permanente.")
      return
    }
    window.location.reload()
  }

  if (!canManage) {
    return <div className="space-y-3"><BackButton fallbackHref="/admin" label={tx("Volver")} /><AppCard><p className="font-black">{tx("Acceso restringido")}</p></AppCard></div>
  }

  return (
    <div className="space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/admin" label={tx("Volver")} />
        <h1 className="type-page-title font-black">{tx("Suplentes y reemplazos")}</h1>
        <p className="mt-0.5 text-xs font-bold text-neutral-500">{activeSeason.name}</p>
      </header>

      {error ? <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{tx(error)}</p> : null}

      <AppCard>
        <p className="font-black">{tx("Bolsa de suplentes")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx("Los suplentes son jugadores ajenos a los titulares. Nunca se puede utilizar a un titular de esta temporada como suplente. Puedes dejarlos preparados o añadir uno nuevo desde el propio partido.")}</p>
        <form onSubmit={addSubstitute} className="mt-3 flex gap-2">
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={tx("Nombre del suplente")} maxLength={80} className="min-w-0 flex-1 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold" />
          <button disabled={isSaving || displayName.trim().length < 2} className="inline-flex rounded-2xl bg-neutral-950 px-4 py-2.5 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center">{tx("Añadir")}</button>
        </form>
        <div className="mt-3 space-y-2">
          {isLoading ? <p className="text-xs font-semibold text-neutral-500">{tx("Cargando...")}</p> : null}
          {!isLoading && activePool.length === 0 ? (
            <EmptyState
              compact
              title={tx("Todavía no hay suplentes")}
              description={tx("Añade jugadores externos para tenerlos disponibles cuando falte un titular.")}
            />
          ) : null}
          {activePool.map((item) => {
            const profile = getPoolProfile(item)
            return <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-3 py-2.5"><div><p className="text-sm font-black">{profile?.display_name ?? tx("Suplente")}</p><p className="type-caption font-semibold text-neutral-500">{tx("Disponible para sustituciones puntuales")}</p></div><button type="button" onClick={() => removeSubstitute(item.id)} disabled={isSaving} className="text-xs font-black text-red-600">{tx("Retirar")}</button></div>
          })}
        </div>
      </AppCard>

      <AppCard>
        <p className="font-black">{tx("Reemplazo permanente")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx("El saliente conserva sus puntos y queda como baja. El entrante pasa a ser titular desde cero y ocupa únicamente los partidos futuros.")}</p>
        <form onSubmit={createReplacement} className="mt-3 space-y-3">
          <label className="block text-xs font-black text-neutral-600">{tx("Titular que causa baja")}<select value={outgoingPlayerId} onChange={(event) => setOutgoingPlayerId(event.target.value)} className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"><option value="">{tx("Selecciona titular")}</option>{rankingPlayers.filter((player) => player.seasonPlayerStatus !== "withdrawn" && !payload.replacements.some((replacement) => replacement.outgoing_player_id === player.id)).map((player) => <option key={player.id} value={player.id}>{player.displayName}</option>)}</select></label>
          <label className="block text-xs font-black text-neutral-600">{tx("Jugador entrante")}<select value={incomingPlayerId} onChange={(event) => setIncomingPlayerId(event.target.value)} className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"><option value="">{tx("Añadir un jugador nuevo")}</option>{activePool.map((item) => { const profile = getPoolProfile(item); return <option key={item.id} value={item.player_id}>{profile?.display_name ?? tx("Suplente")}</option> })}</select></label>
          {!incomingPlayerId ? <input value={replacementName} onChange={(event) => setReplacementName(event.target.value)} placeholder={tx("Nombre del nuevo titular")} maxLength={80} className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold" /> : null}
          <label className="block text-xs font-black text-neutral-600">{tx("Desde la jornada")}<input type="number" min={1} max={activeSeason.totalRounds} value={fromRound} onChange={(event) => setFromRound(Number(event.target.value))} className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold" /></label>
          <button disabled={isSaving || !outgoingPlayerId || (!incomingPlayerId && replacementName.trim().length < 2)} className="flex w-full rounded-2xl bg-red-600 px-3 py-2.5 text-sm font-black text-white disabled:bg-red-200 items-center justify-center text-center">{tx("Aplicar reemplazo permanente")}</button>
        </form>

        {payload.replacements.length > 0 ? (
          <div className="mt-4 border-t border-neutral-100 pt-3">
            <p className="text-xs font-black uppercase tracking-wide text-neutral-500">{tx("Bajas y reemplazos")}</p>
            <div className="mt-2 space-y-2">
              {payload.replacements.map((replacement) => {
                const outgoing = players.find((player) => player.id === replacement.outgoing_player_id)
                const incoming = players.find((player) => player.id === replacement.incoming_player_id)
                return (
                  <div key={replacement.id} className="rounded-2xl bg-red-50 px-3 py-2.5">
                    <p className="truncate whitespace-nowrap text-sm font-black text-neutral-950">{outgoing?.displayName ?? tx("Titular")} → {incoming?.displayName ?? tx("Nuevo titular")}</p>
                    <p className="mt-0.5 type-caption font-semibold text-red-700">{tx("Baja y reemplazo desde la jornada")}{" "}{replacement.from_round}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </AppCard>

      <AppCard>
        <p className="font-black">{tx("Historial de sustituciones")}</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">{tx("Participaciones puntuales registradas durante la temporada.")}</p>
        <div className="mt-3 space-y-2">
          {substitutionHistory.length === 0 ? (
            <EmptyState
              compact
              title={tx("Sin sustituciones puntuales")}
              description={tx("Las sustituciones de un solo partido aparecerán aquí cuando se utilice un suplente.")}
            />
          ) : (
            substitutionHistory.map((item) => {
              const original = players.find((player) => player.id === item.original_player_id)
              const substitute = players.find((player) => player.id === item.substitute_player_id)
              const poolProfile = getPoolProfile(
                payload.substitutes.find(
                  (poolItem) => poolItem.player_id === item.substitute_player_id,
                ),
              )

              return (
                <div key={item.id} className="rounded-2xl bg-neutral-50 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">
                        {tx("J")}{item.match?.round ?? "-"} · {original?.displayName ?? tx("Titular")} → {substitute?.displayName ?? poolProfile?.display_name ?? tx("Suplente")}
                      </p>
                      <p className="mt-0.5 type-caption font-semibold text-neutral-500">
                        {tx("Sustitución para un único partido")}{" "}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 type-caption font-black text-neutral-600">
                      {getMatchStatusText(item.match?.status ?? "")}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </AppCard>

      <AppCard>
        <p className="font-black">{tx("Rendimiento de suplentes")}</p>
        <div className="mt-3 space-y-2">
          {stats.every((item) => item.matchesPlayed === 0) ? (
            <EmptyState
              compact
              title={tx("Sin participaciones todavía")}
              description={tx("El rendimiento se calculará cuando un suplente complete su primer partido.")}
            />
          ) : stats.filter((item) => item.matchesPlayed > 0).map((item) => {
            const profile = getPoolProfile(payload.substitutes.find((poolItem) => poolItem.player_id === item.playerId) as PoolPlayer)
            return <div key={item.playerId} className="rounded-2xl bg-neutral-50 px-3 py-2.5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black">{profile?.display_name ?? tx("Suplente")}</p><p className="text-sm font-black">{item.points} {tx("pts")}</p></div><p className="mt-1 type-caption font-semibold text-neutral-500">{item.matchesPlayed} {tx("partidos ·")}{" "}{item.wins} {tx("victorias · diferencia")}{" "}{item.gamesDiff > 0 ? "+" : ""}{item.gamesDiff}</p></div>
          })}
        </div>
      </AppCard>
    </div>
  )
}
