"use client"

import { useMemo, useState } from "react"
import type { MatchData } from "@/context/MatchDataProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import {
  clearMatchIncident,
  matchIncidentTypeLabels,
  matchResolutionTypeLabels,
  reportMatchIncident,
  resolveMatchIncident,
  type MatchIncidentType,
  type MatchResolutionType,
} from "@/lib/matchIncidents"
import { AppCard } from "@/components/ui/AppCard"

function getTeamLabel(playerIds: string[], players: PlayerProfile[]) {
  return playerIds
    .map(
      (playerId) =>
        players.find((player) => player.id === playerId)?.displayName ??
        "Jugador",
    )
    .join(" / ")
}

function getResolutionSummary(match: MatchData) {
  if (!match.resolutionType) {
    return null
  }

  const resolution = matchResolutionTypeLabels[match.resolutionType]
  const ranking = match.rankingCounts ? "Cuenta para clasificación" : "No puntúa"

  return `${resolution} · ${ranking}`
}

function getDefaultRankingCounts(resolutionType: MatchResolutionType) {
  return (
    resolutionType === "played" ||
    resolutionType === "no_show" ||
    resolutionType === "administrative"
  )
}

function buildAdministrativeSets(winningTeam: "A" | "B") {
  return Array.from({ length: 3 }, () =>
    winningTeam === "A" ? { a: 6, b: 0 } : { a: 0, b: 6 },
  )
}

export function MatchIncidentPanel({
  match,
  players,
  canReport,
  isAdmin,
}: {
  match: MatchData
  players: PlayerProfile[]
  canReport: boolean
  isAdmin: boolean
}) {
  const { hydrateMatches } = useMatchData()
  const [incidentType, setIncidentType] = useState<MatchIncidentType>("injury")
  const [reason, setReason] = useState("")
  const [resolutionType, setResolutionType] =
    useState<MatchResolutionType>(
      match.status === "finished" ? "played" : "postponed",
    )
  const [notes, setNotes] = useState("")
  const [rankingCounts, setRankingCounts] = useState(() =>
    getDefaultRankingCounts(
      match.status === "finished" ? "played" : "postponed",
    ),
  )
  const [winningTeam, setWinningTeam] = useState<"A" | "B">("A")
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const teamALabel = useMemo(
    () => getTeamLabel(match.teamA, players),
    [match.teamA, players],
  )
  const teamBLabel = useMemo(
    () => getTeamLabel(match.teamB, players),
    [match.teamB, players],
  )
  const isOpen = match.incidentStatus === "open"
  const isResolved = match.incidentStatus === "resolved"
  const requiresAdministrativeWinner =
    resolutionType === "no_show" || resolutionType === "administrative"
  const canCountForRanking =
    resolutionType === "played" ||
    resolutionType === "no_show" ||
    (resolutionType === "abandoned" && match.sets.length > 0) ||
    resolutionType === "administrative"
  const canResolveAsPlayed = match.status === "finished"

  async function handleReport() {
    if (isWorking || reason.trim().length < 3) return

    setIsWorking(true)
    setError(null)
    setMessage(null)

    try {
      const updatedMatch = await reportMatchIncident({
        matchId: match.id,
        incidentType,
        reason: reason.trim(),
      })
      hydrateMatches([updatedMatch])
      setReason("")
      setMessage("Incidencia comunicada. La administración ya puede resolverla.")
    } catch (caughtError) {
      const code = caughtError instanceof Error ? caughtError.message : ""
      setError(
        code.includes("incident_already_open")
          ? "Ya existe una incidencia abierta para este partido."
          : "No se ha podido comunicar la incidencia.",
      )
    } finally {
      setIsWorking(false)
    }
  }

  async function handleResolve() {
    if (isWorking) return

    setIsWorking(true)
    setError(null)
    setMessage(null)

    try {
      const sets = requiresAdministrativeWinner
        ? buildAdministrativeSets(winningTeam)
        : resolutionType === "played"
          ? match.sets
          : resolutionType === "abandoned" && match.sets.length > 0
            ? match.sets
            : []
      const updatedMatch = await resolveMatchIncident({
        matchId: match.id,
        resolution: {
          resolutionType,
          notes: notes.trim(),
          rankingCounts: canCountForRanking ? rankingCounts : false,
          sets,
        },
      })
      hydrateMatches([updatedMatch])
      setMessage("Incidencia resuelta.")
    } catch (caughtError) {
      const code = caughtError instanceof Error ? caughtError.message : ""
      setError(
        code.includes("administrative_result_requires_sets")
          ? "El resultado administrativo necesita un ganador."
          : "No se ha podido resolver la incidencia.",
      )
    } finally {
      setIsWorking(false)
    }
  }

  async function handleClear() {
    if (isWorking) return

    const confirmed = window.confirm(
      "¿Eliminar la incidencia y devolver el partido a su flujo normal?",
    )

    if (!confirmed) return

    setIsWorking(true)
    setError(null)
    setMessage(null)

    try {
      const updatedMatch = await clearMatchIncident(match.id)
      hydrateMatches([updatedMatch])
      setMessage("Incidencia eliminada.")
    } catch {
      setError("No se ha podido eliminar la incidencia.")
    } finally {
      setIsWorking(false)
    }
  }

  if (!isOpen && !isResolved && !canReport) {
    return null
  }

  return (
    <AppCard className={isOpen ? "border-amber-200 bg-amber-50" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">Incidencias del partido</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            Comunica una lesión, ausencia, cancelación o discrepancia para que la
            administración pueda aplicar una resolución oficial.
          </p>
        </div>

        {isOpen ? (
          <span className="shrink-0 rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black uppercase text-amber-950">
            Pendiente
          </span>
        ) : isResolved ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-800">
            Resuelta
          </span>
        ) : null}
      </div>

      {match.incidentType ? (
        <div className="mt-3 rounded-xl bg-white/80 px-3 py-2.5">
          <p className="text-xs font-black text-neutral-900">
            {matchIncidentTypeLabels[match.incidentType]}
          </p>
          {match.incidentReason ? (
            <p className="mt-1 text-sm font-semibold leading-5 text-neutral-600">
              {match.incidentReason}
            </p>
          ) : null}
          {match.incidentNotes ? (
            <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
              Resolución: {match.incidentNotes}
            </p>
          ) : null}
          {getResolutionSummary(match) ? (
            <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-neutral-500">
              {getResolutionSummary(match)}
            </p>
          ) : null}
        </div>
      ) : null}

      {!isOpen && !isResolved && canReport ? (
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-black text-neutral-700">
              Tipo de incidencia
            </span>
            <select
              value={incidentType}
              onChange={(event) =>
                setIncidentType(event.target.value as MatchIncidentType)
              }
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"
            >
              {Object.entries(matchIncidentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black text-neutral-700">Motivo</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 500))}
              rows={3}
              placeholder="Explica brevemente qué ha ocurrido"
              className="mt-1 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-neutral-500"
            />
          </label>

          <button
            type="button"
            onClick={handleReport}
            disabled={isWorking || reason.trim().length < 3}
            className="w-full rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
          >
            {isWorking ? "Enviando..." : "Comunicar incidencia"}
          </button>
        </div>
      ) : null}

      {isOpen && isAdmin ? (
        <div className="mt-3 space-y-3 border-t border-amber-200 pt-3">
          <p className="text-xs font-black uppercase tracking-wide text-amber-900">
            Resolución administrativa
          </p>

          <label className="block">
            <span className="text-xs font-black text-neutral-700">Decisión</span>
            <select
              value={resolutionType}
              onChange={(event) => {
                const next = event.target.value as MatchResolutionType
                setResolutionType(next)
                setRankingCounts(getDefaultRankingCounts(next))
              }}
              className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm font-bold"
            >
              {Object.entries(matchResolutionTypeLabels)
                .filter(([value]) => value !== "played" || canResolveAsPlayed)
                .map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </select>
          </label>

          {requiresAdministrativeWinner ? (
            <label className="block">
              <span className="text-xs font-black text-neutral-700">
                Pareja ganadora
              </span>
              <select
                value={winningTeam}
                onChange={(event) =>
                  setWinningTeam(event.target.value as "A" | "B")
                }
                className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm font-bold"
              >
                <option value="A">{teamALabel}</option>
                <option value="B">{teamBLabel}</option>
              </select>
              <span className="mt-1 block text-[11px] font-semibold text-neutral-500">
                Se registrará un 6-0, 6-0 y 6-0 administrativo.
              </span>
            </label>
          ) : null}

          {canCountForRanking ? (
            <label className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5">
              <input
                type="checkbox"
                checked={rankingCounts}
                onChange={(event) => setRankingCounts(event.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-bold">
                Contabilizar en clasificación y estadísticas
              </span>
            </label>
          ) : null}

          <label className="block">
            <span className="text-xs font-black text-neutral-700">
              Nota de resolución
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value.slice(0, 1000))}
              rows={3}
              placeholder="Decisión adoptada y contexto"
              className="mt-1 w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleResolve}
              disabled={isWorking}
              className="rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
            >
              {isWorking ? "Guardando..." : "Resolver incidencia"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isWorking}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-red-700 disabled:text-neutral-300"
            >
              Eliminar incidencia
            </button>
          </div>
        </div>
      ) : null}

      {isResolved && isAdmin ? (
        <button
          type="button"
          onClick={handleClear}
          disabled={isWorking}
          className="mt-3 w-full rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-black text-neutral-700 disabled:text-neutral-300"
        >
          {isWorking ? "Eliminando..." : "Eliminar resolución y reabrir flujo"}
        </button>
      ) : null}

      {message ? (
        <p className="mt-3 text-xs font-bold text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-xs font-bold text-red-600">{error}</p>
      ) : null}
    </AppCard>
  )
}
