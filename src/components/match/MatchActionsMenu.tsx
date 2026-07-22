"use client"

import { useState } from "react"
import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import { matchIncidentTypeLabels } from "@/lib/matchIncidents"
import { MatchIncidentPanel } from "@/components/match/MatchIncidentPanel"
import { MatchSubstitutionPanel } from "@/components/match/MatchSubstitutionPanel"

type OpenPanel = "incident" | "substitution" | null

function getPlayerName(playerId: string, players: PlayerProfile[]) {
  return players.find((player) => player.id === playerId)?.displayName ?? "Jugador"
}

export function MatchActionsMenu({
  match,
  players,
  isAdmin,
  canReportIncident,
  canManageSubstitutions,
}: {
  match: MatchData
  players: PlayerProfile[]
  isAdmin: boolean
  canReportIncident: boolean
  canManageSubstitutions: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)

  const substitutions = match.substitutions ?? []
  const hasOpenIncident = match.incidentStatus === "open"
  const canOpenIncident =
    isAdmin || canReportIncident || Boolean(match.incidentStatus)
  const canOpenSubstitution =
    match.status !== "finished" &&
    !hasOpenIncident &&
    (isAdmin || canManageSubstitutions)
  const hasMenuActions = canOpenIncident || canOpenSubstitution

  function selectPanel(panel: Exclude<OpenPanel, null>) {
    setOpenPanel((current) => (current === panel ? null : panel))
    setMenuOpen(false)
  }

  if (!hasMenuActions && !match.incidentStatus && substitutions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {(match.incidentStatus || substitutions.length > 0) ? (
        <div className="space-y-1.5">
          {match.incidentStatus ? (
            <button
              type="button"
              onClick={() => selectPanel("incident")}
              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left ${
                hasOpenIncident
                  ? "bg-amber-50 text-amber-900"
                  : "bg-emerald-50 text-emerald-800"
              }`}
            >
              <span className="min-w-0 truncate text-xs font-black">
                {hasOpenIncident ? "Incidencia pendiente" : "Incidencia resuelta"}
                {match.incidentType
                  ? ` · ${matchIncidentTypeLabels[match.incidentType]}`
                  : ""}
              </span>
              <span className="shrink-0 text-sm font-black">›</span>
            </button>
          ) : null}

          {substitutions.map((substitution) => (
            <button
              key={substitution.id}
              type="button"
              onClick={() => {
                if (canOpenSubstitution) selectPanel("substitution")
              }}
              disabled={!canOpenSubstitution}
              className="flex w-full items-center justify-between gap-2 rounded-xl bg-red-50 px-3 py-2 text-left text-red-800 disabled:cursor-default"
            >
              <span className="min-w-0 truncate text-xs font-black">
                {getPlayerName(substitution.substitutePlayerId, players)} sustituye a{" "}
                {getPlayerName(substitution.originalPlayerId, players)}
              </span>
              {canOpenSubstitution ? (
                <span className="shrink-0 text-sm font-black">›</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {hasMenuActions ? (
        <div className="relative flex justify-end">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="Más acciones del partido"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-8 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 text-[11px] font-black text-neutral-600 shadow-sm"
          >
            <span aria-hidden="true" className="text-base leading-none">•••</span>
            Más acciones
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-10 z-20 min-w-52 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl">
              {canOpenIncident ? (
                <button
                  type="button"
                  onClick={() => selectPanel("incident")}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-neutral-100"
                >
                  <span aria-hidden="true">⚠</span>
                  {match.incidentStatus
                    ? "Ver o gestionar incidencia"
                    : "Comunicar incidencia"}
                </button>
              ) : null}
              {canOpenSubstitution ? (
                <button
                  type="button"
                  onClick={() => selectPanel("substitution")}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-neutral-100"
                >
                  <span aria-hidden="true">↔</span>
                  Gestionar suplente
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {openPanel === "incident" ? (
        <MatchIncidentPanel
          match={match}
          players={players}
          canReport={isAdmin || canReportIncident}
          isAdmin={isAdmin}
        />
      ) : null}

      {openPanel === "substitution" && canOpenSubstitution ? (
        <MatchSubstitutionPanel match={match} players={players} />
      ) : null}
    </div>
  )
}
