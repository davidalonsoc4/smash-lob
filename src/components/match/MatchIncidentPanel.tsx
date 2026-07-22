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
  if (!match.resolutionType) return null

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
  const [resolutionType, setResolutionType] = useState<MatchResolutionType>(
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
      setMessage("Incidencia comunicada. La organización ha sido avisada.")
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

  if (!isOpen && !isResolved && !canReport) return null

  const summaryTone = isOpen
    ? "border-amber-300 bg-amber-50 text-amber-900"
    : isResolved
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-neutral-200 bg-white text-neutral-700"

  return (
    <details
      className={`group w-10 flex-none overflow-hidden rounded-xl border shadow-[0_1px_8px_rgba(15,23,42,0.04)] open:w-full open:basis-full ${summaryTone}`}
    >
      <summary title="Gestionar incidencia" aria-label="Gestionar incidencia" className="relative flex h-9 cursor-pointer list-none items-center justify-center px-2 [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
          <path d="M10 2.5 18 17H2L10 2.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M10 7v4.5M10 14.2v.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <span className="sr-only">Incidencia</span>
        {isOpen ? (
          <span className="absolute right-0 top-0 h-2 w-2 shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-50" aria-label="Pendiente" />
        ) : isResolved ? (
          <span className="absolute right-0 top-0 grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-600 text-[8px] font-black text-white ring-2 ring-emerald-50">✓</span>
        ) : null}
      </summary>

      <div className="border-t border-current/10 bg-white px-3 py-3 text-neutral-950">
        {match.incidentType ? (
          <div className="rounded-xl bg-amber-50 px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-black">
                {matchIncidentTypeLabels[match.incidentType]}
              </p>
              <span className="shrink-0 text-[9px] font-black uppercase text-amber-800">
                {isOpen ? "Pendiente" : "Resuelta"}
              </span>
            </div>
            {match.incidentReason ? (
              <p className="mt-1 text-xs font-semibold leading-4 text-neutral-600">
                {match.incidentReason}
              </p>
            ) : null}
            {match.incidentNotes ? (
              <p className="mt-1.5 text-[11px] font-semibold leading-4 text-neutral-500">
                Resolución: {match.incidentNotes}
              </p>
            ) : null}
            {getResolutionSummary(match) ? (
              <p className="mt-1.5 text-[9px] font-black uppercase tracking-wide text-neutral-500">
                {getResolutionSummary(match)}
              </p>
            ) : null}
          </div>
        ) : null}

        {!isOpen && !isResolved && canReport ? (
          <div className="space-y-2">
            <select
              aria-label="Tipo de incidencia"
              value={incidentType}
              onChange={(event) =>
                setIncidentType(event.target.value as MatchIncidentType)
              }
              className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold"
            >
              {Object.entries(matchIncidentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <textarea
              aria-label="Motivo de la incidencia"
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 500))}
              rows={2}
              placeholder="Explica brevemente qué ha ocurrido"
              className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:border-neutral-500"
            />
            <button
              type="button"
              onClick={handleReport}
              disabled={isWorking || reason.trim().length < 3}
              className="w-full rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
            >
              {isWorking ? "Enviando..." : "Comunicar incidencia"}
            </button>
          </div>
        ) : null}

        {isOpen && isAdmin ? (
          <div className="mt-2 space-y-2 border-t border-amber-100 pt-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-amber-900">
              Resolución administrativa
            </p>
            <select
              aria-label="Decisión administrativa"
              value={resolutionType}
              onChange={(event) => {
                const next = event.target.value as MatchResolutionType
                setResolutionType(next)
                setRankingCounts(getDefaultRankingCounts(next))
              }}
              className="w-full rounded-xl border border-amber-200 bg-white px-2.5 py-2 text-xs font-bold"
            >
              {Object.entries(matchResolutionTypeLabels)
                .filter(([value]) => value !== "played" || canResolveAsPlayed)
                .map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </select>

            {requiresAdministrativeWinner ? (
              <select
                aria-label="Pareja ganadora"
                value={winningTeam}
                onChange={(event) =>
                  setWinningTeam(event.target.value as "A" | "B")
                }
                className="w-full rounded-xl border border-amber-200 bg-white px-2.5 py-2 text-xs font-bold"
              >
                <option value="A">Ganadores: {teamALabel}</option>
                <option value="B">Ganadores: {teamBLabel}</option>
              </select>
            ) : null}

            {canCountForRanking ? (
              <label className="flex items-center gap-2 rounded-xl bg-neutral-50 px-2.5 py-2">
                <input
                  type="checkbox"
                  checked={rankingCounts}
                  onChange={(event) => setRankingCounts(event.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-xs font-bold">Contabilizar en clasificación</span>
              </label>
            ) : null}

            <textarea
              aria-label="Nota de resolución"
              value={notes}
              onChange={(event) => setNotes(event.target.value.slice(0, 1000))}
              rows={2}
              placeholder="Nota de resolución (opcional)"
              className="w-full resize-none rounded-xl border border-amber-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:border-amber-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleResolve}
                disabled={isWorking}
                className="rounded-xl bg-neutral-950 px-2 py-2 text-xs font-black text-white disabled:bg-neutral-300"
              >
                {isWorking ? "Guardando..." : "Resolver"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isWorking}
                className="rounded-xl bg-red-50 px-2 py-2 text-xs font-black text-red-700 disabled:text-neutral-300"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : null}

        {isResolved && isAdmin ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={isWorking}
            className="mt-2 w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700 disabled:text-neutral-300"
          >
            {isWorking ? "Eliminando..." : "Eliminar resolución"}
          </button>
        ) : null}

        {message ? <p className="mt-2 text-[11px] font-bold text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-2 text-[11px] font-bold text-red-600">{error}</p> : null}
      </div>
    </details>
  )
}
