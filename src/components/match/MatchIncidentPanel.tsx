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

type ResolutionOption = {
  value: MatchResolutionType
  label: string
  description: string
}

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
    resolutionType === "continue" ||
    resolutionType === "substitute" ||
    resolutionType === "played" ||
    resolutionType === "no_show" ||
    resolutionType === "abandoned" ||
    resolutionType === "administrative"
  )
}

function buildAdministrativeSets(winningTeam: "A" | "B") {
  return Array.from({ length: 3 }, () =>
    winningTeam === "A" ? { a: 6, b: 0 } : { a: 0, b: 6 },
  )
}

function getResolutionOptions(match: MatchData): ResolutionOption[] {
  const hasResult = match.status === "finished" && match.sets.length > 0
  const continueOption: ResolutionOption = {
    value: "continue",
    label: "El partido se jugará",
    description: "Cierra la incidencia y mantiene el partido en su flujo normal.",
  }
  const confirmResultOption: ResolutionOption = {
    value: "played",
    label: "Confirmar el resultado introducido",
    description: "Da por válido el marcador actual y cierra la incidencia.",
  }
  const resetResultOption: ResolutionOption = {
    value: "reset_result",
    label: "Eliminar el resultado y volver a introducirlo",
    description: "Borra marcador, confirmaciones y votos para corregirlo desde cero.",
  }
  const postponedOption: ResolutionOption = {
    value: "postponed",
    label: "Aplazar y reprogramar",
    description: "Quita la fecha actual y deja el partido pendiente de nueva programación.",
  }
  const cancelledOption: ResolutionOption = {
    value: "cancelled",
    label: "Cancelar definitivamente",
    description: "Cierra el partido sin resultado y sin contabilizarlo.",
  }
  const abandonedOption: ResolutionOption = {
    value: "abandoned",
    label: "Dar el partido por abandono",
    description: "Selecciona ganador y aplica un resultado administrativo.",
  }
  const administrativeOption: ResolutionOption = {
    value: "administrative",
    label: "Aplicar resultado administrativo",
    description: "Selecciona una pareja ganadora y aplica 6-0, 6-0, 6-0.",
  }

  switch (match.incidentType) {
    case "injury":
      return hasResult
        ? [confirmResultOption, abandonedOption, administrativeOption, cancelledOption]
        : [
            {
              ...continueOption,
              label: "Se jugará con los jugadores actuales",
            },
            {
              value: "substitute",
              label: "Resolver mediante suplente",
              description:
                "Cierra la incidencia y habilita la gestión de suplentes para el partido.",
            },
            postponedOption,
            abandonedOption,
            cancelledOption,
          ]
    case "no_show":
      return hasResult
        ? [confirmResultOption, resetResultOption, administrativeOption, cancelledOption]
        : [
            {
              ...continueOption,
              label: "El partido finalmente se jugará",
            },
            postponedOption,
            {
              value: "no_show",
              label: "Dar victoria por incomparecencia",
              description: "Selecciona ganador y aplica 6-0, 6-0, 6-0.",
            },
            cancelledOption,
          ]
    case "cancelled":
      return hasResult
        ? [confirmResultOption, resetResultOption, cancelledOption]
        : [
            {
              ...continueOption,
              label: "El partido se jugará según lo previsto",
            },
            postponedOption,
            cancelledOption,
          ]
    case "disputed":
      return [
        ...(hasResult ? [confirmResultOption, resetResultOption] : []),
        administrativeOption,
        cancelledOption,
      ]
    default:
      return hasResult
        ? [
            confirmResultOption,
            resetResultOption,
            abandonedOption,
            administrativeOption,
            cancelledOption,
          ]
        : [
            {
              ...continueOption,
              label: "Cerrar sin realizar cambios",
            },
            postponedOption,
            cancelledOption,
            abandonedOption,
            administrativeOption,
          ]
  }
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
  const resolutionOptions = useMemo(() => getResolutionOptions(match), [match])
  const [resolutionType, setResolutionType] = useState<MatchResolutionType>(
    resolutionOptions[0]?.value ?? "continue",
  )
  const [notes, setNotes] = useState("")
  const [rankingCounts, setRankingCounts] = useState(() =>
    getDefaultRankingCounts(resolutionOptions[0]?.value ?? "continue"),
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
  const effectiveResolutionType = resolutionOptions.some(
    (option) => option.value === resolutionType,
  )
    ? resolutionType
    : resolutionOptions[0]?.value ?? "continue"
  const requiresAdministrativeWinner =
    effectiveResolutionType === "no_show" ||
    effectiveResolutionType === "administrative" ||
    effectiveResolutionType === "abandoned"
  const canCountForRanking = getDefaultRankingCounts(effectiveResolutionType)
  const showRankingControl =
    effectiveResolutionType === "played" ||
    effectiveResolutionType === "no_show" ||
    effectiveResolutionType === "abandoned" ||
    effectiveResolutionType === "administrative"
  const selectedResolution =
    resolutionOptions.find((option) => option.value === effectiveResolutionType) ??
    resolutionOptions[0]

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
        code.includes("player_incidents_disabled")
          ? "La organización ha desactivado las incidencias para jugadores."
          : code.includes("incident_already_open")
            ? "Ya existe una incidencia abierta para este partido."
            : "No se ha podido comunicar la incidencia.",
      )
    } finally {
      setIsWorking(false)
    }
  }

  async function handleResolve() {
    if (isWorking || !selectedResolution) return

    setIsWorking(true)
    setError(null)
    setMessage(null)

    try {
      const sets = requiresAdministrativeWinner
        ? buildAdministrativeSets(winningTeam)
        : effectiveResolutionType === "played"
          ? match.sets
          : []
      const updatedMatch = await resolveMatchIncident({
        matchId: match.id,
        resolution: {
          resolutionType: effectiveResolutionType,
          notes: notes.trim() || selectedResolution.label,
          rankingCounts: canCountForRanking ? rankingCounts : false,
          sets,
        },
      })
      hydrateMatches([updatedMatch])
      setMessage(
        effectiveResolutionType === "substitute"
          ? "Incidencia resuelta. Ya puedes gestionar el suplente desde Más acciones."
          : "Incidencia resuelta.",
      )
    } catch (caughtError) {
      const code = caughtError instanceof Error ? caughtError.message : ""
      setError(
        code.includes("administrative_result_requires_sets")
          ? "Selecciona la pareja ganadora."
          : code.includes("played_resolution_requires_result")
            ? "No hay un resultado válido que confirmar."
            : code.includes("reset_result_requires_result")
              ? "No hay un resultado que eliminar."
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

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black">Incidencia</p>
        {isOpen ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">
            Pendiente
          </span>
        ) : isResolved ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700">
            Resuelta
          </span>
        ) : null}
      </div>

      {match.incidentType ? (
        <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2.5">
          <p className="text-xs font-black">
            {matchIncidentTypeLabels[match.incidentType]}
          </p>
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
        <div className="mt-2 space-y-2">
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
        <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            ¿Qué debe ocurrir con el partido?
          </p>
          <div className="space-y-1.5">
            {resolutionOptions.map((option) => (
              <label
                key={option.value}
                className={`block cursor-pointer rounded-xl border px-3 py-2 ${
                  effectiveResolutionType === option.value
                    ? "border-neutral-950 bg-neutral-100"
                    : "border-neutral-200"
                }`}
              >
                <span className="flex items-start gap-2">
                  <input
                    type="radio"
                    name={`incident-resolution-${match.id}`}
                    value={option.value}
                    checked={effectiveResolutionType === option.value}
                    onChange={() => {
                      setResolutionType(option.value)
                      setRankingCounts(getDefaultRankingCounts(option.value))
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-xs font-black">{option.label}</span>
                    <span className="mt-0.5 block text-[10px] font-semibold leading-4 text-neutral-500">
                      {option.description}
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </div>

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

          {showRankingControl ? (
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
            className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:border-neutral-500"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleResolve}
              disabled={isWorking}
              className="rounded-xl bg-neutral-950 px-2 py-2 text-xs font-black text-white disabled:bg-neutral-300"
            >
              {isWorking ? "Guardando..." : "Aplicar resolución"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isWorking}
              className="rounded-xl bg-red-50 px-2 py-2 text-xs font-black text-red-700 disabled:text-neutral-300"
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
          className="mt-2 w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700 disabled:text-neutral-300"
        >
          {isWorking ? "Eliminando..." : "Eliminar resolución"}
        </button>
      ) : null}

      {message ? (
        <p className="mt-2 text-[11px] font-bold text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-[11px] font-bold text-red-600">{error}</p>
      ) : null}
    </div>
  )
}
