"use client"

import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import { matchIncidentTypeLabels } from "@/lib/matchIncidents"
import { MatchIncidentPanel } from "@/components/match/MatchIncidentPanel"
import { MatchSubstitutionPanel } from "@/components/match/MatchSubstitutionPanel"

export type MatchActionPanel = "incident" | "substitution" | null

type MatchActionBaseProps = {
  match: MatchData
  players: PlayerProfile[]
  isAdmin: boolean
  canReportIncident: boolean
  canManageSubstitutions: boolean
}

type MatchActionsTriggerProps = MatchActionBaseProps & {
  menuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
  onSelectPanel: (panel: Exclude<MatchActionPanel, null>) => void
}

type MatchActionsContentProps = MatchActionBaseProps & {
  openPanel: MatchActionPanel
  onOpenPanelChange: (panel: MatchActionPanel) => void
}

function getPlayerName(playerId: string, players: PlayerProfile[]) {
  return players.find((player) => player.id === playerId)?.displayName ?? "Jugador"
}

function getMatchActionAvailability({
  match,
  isAdmin,
  canReportIncident,
  canManageSubstitutions,
}: Omit<MatchActionBaseProps, "players">) {
  const hasOpenIncident = match.incidentStatus === "open"
  const canOpenIncident =
    isAdmin || canReportIncident || Boolean(match.incidentStatus)
  const canOpenSubstitution =
    match.status !== "finished" &&
    !hasOpenIncident &&
    (isAdmin || canManageSubstitutions)

  return {
    hasOpenIncident,
    canOpenIncident,
    canOpenSubstitution,
    hasMenuActions: canOpenIncident || canOpenSubstitution,
  }
}

export function MatchActionsTrigger({
  match,
  isAdmin,
  canReportIncident,
  canManageSubstitutions,
  menuOpen,
  onMenuOpenChange,
  onSelectPanel,
}: MatchActionsTriggerProps) {
  const { canOpenIncident, canOpenSubstitution, hasMenuActions } =
    getMatchActionAvailability({
      match,
      isAdmin,
      canReportIncident,
      canManageSubstitutions,
    })

  if (!hasMenuActions) {
    return null
  }

  function selectPanel(panel: Exclude<MatchActionPanel, null>) {
    onSelectPanel(panel)
    onMenuOpenChange(false)
  }

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-label="Más acciones del partido"
        title="Más acciones"
        onClick={() => onMenuOpenChange(!menuOpen)}
        className="flex h-5 w-7 items-center justify-center rounded-full text-sm font-black leading-none text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 active:scale-95"
      >
        <span aria-hidden="true" className="-mt-1 tracking-[0.08em]">•••</span>
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-6 z-30 min-w-52 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 text-left shadow-xl">
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
  )
}

export function MatchActionsContent({
  match,
  players,
  isAdmin,
  canReportIncident,
  canManageSubstitutions,
  openPanel,
  onOpenPanelChange,
}: MatchActionsContentProps) {
  const substitutions = match.substitutions ?? []
  const { hasOpenIncident, canOpenSubstitution } = getMatchActionAvailability({
    match,
    isAdmin,
    canReportIncident,
    canManageSubstitutions,
  })

  function selectPanel(panel: Exclude<MatchActionPanel, null>) {
    onOpenPanelChange(openPanel === panel ? null : panel)
  }

  if (!match.incidentStatus && substitutions.length === 0 && !openPanel) {
    return null
  }

  return (
    <div className="space-y-2">
      {match.incidentStatus || substitutions.length > 0 ? (
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
