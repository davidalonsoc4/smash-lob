"use client"

import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import { matchIncidentTypeLabels } from "@/lib/matchIncidents"
import { MatchIncidentPanel } from "@/components/match/MatchIncidentPanel"
import { MatchSubstitutionPanel } from "@/components/match/MatchSubstitutionPanel"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { MatchChatActionLink } from "@/components/match/MatchChatFloatingAction"

export type MatchActionPanel = "incident" | "substitution" | null
type MatchActionBaseProps = { match: MatchData; players: PlayerProfile[]; isAdmin: boolean; canReportIncident: boolean; canManageSubstitutions: boolean }
type MatchActionsTriggerProps = MatchActionBaseProps & { chatHref?: string | null; menuOpen: boolean; onMenuOpenChange: (open: boolean) => void; onSelectPanel: (panel: Exclude<MatchActionPanel, null>) => void }
type MatchActionsContentProps = MatchActionBaseProps & { openPanel: MatchActionPanel; onOpenPanelChange: (panel: MatchActionPanel) => void }

const playerName = (id: string, players: PlayerProfile[]) => players.find((player) => player.id === id)?.displayName ?? "Jugador"
function availability({ match, isAdmin, canReportIncident, canManageSubstitutions }: Omit<MatchActionBaseProps, "players">) {
  const hasOpenIncident = match.incidentStatus === "open"
  const canOpenIncident = isAdmin || canReportIncident || Boolean(match.incidentStatus)
  const canOpenSubstitution = match.status !== "finished" && !hasOpenIncident && (isAdmin || canManageSubstitutions)
  return { hasOpenIncident, canOpenIncident, canOpenSubstitution, hasMenuActions: canOpenIncident || canOpenSubstitution }
}

export function MatchActionsTrigger({ match, isAdmin, canReportIncident, canManageSubstitutions, chatHref, menuOpen, onMenuOpenChange, onSelectPanel }: MatchActionsTriggerProps) {
  const { canOpenIncident, canOpenSubstitution, hasMenuActions } = availability({ match, isAdmin, canReportIncident, canManageSubstitutions })
  if (!hasMenuActions && !chatHref) return null
  const selectPanel = (panel: Exclude<MatchActionPanel, null>) => { onSelectPanel(panel); onMenuOpenChange(false) }
  return (
    <div className="fixed z-40 flex flex-col items-end gap-2" style={{ right: "max(14px, calc((100vw - 448px) / 2 + 14px))", bottom: "calc(84px + env(safe-area-inset-bottom, 0px))" }}>
      {chatHref ? <MatchChatActionLink href={chatHref} /> : null}
      {hasMenuActions ? <div className="relative">
        <button type="button" aria-expanded={menuOpen} aria-label="Más acciones del partido" title="Más acciones" onClick={() => onMenuOpenChange(!menuOpen)} className="app-floating-control grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white/95 text-neutral-600 shadow-lg backdrop-blur transition active:scale-95 active:bg-neutral-100">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><circle cx="5" cy="12" r="1.75" /><circle cx="12" cy="12" r="1.75" /><circle cx="19" cy="12" r="1.75" /></svg>
        </button>
        {menuOpen ? <div className="absolute bottom-12 right-0 z-30 w-max min-w-52 max-w-[calc(100vw-28px)] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 text-left shadow-xl">
          {canOpenIncident ? <button type="button" onClick={() => selectPanel("incident")} className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-black hover:bg-neutral-100"><span aria-hidden="true">⚠</span>{match.incidentStatus ? "Ver o gestionar incidencia" : "Comunicar incidencia"}</button> : null}
          {canOpenSubstitution ? <button type="button" onClick={() => selectPanel("substitution")} className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-black hover:bg-neutral-100"><span aria-hidden="true">↔</span>Gestionar suplente</button> : null}
        </div> : null}
      </div> : null}
    </div>
  )
}

export function MatchActionsContent({ match, players, isAdmin, canReportIncident, canManageSubstitutions, openPanel, onOpenPanelChange }: MatchActionsContentProps) {
  const substitutions = match.substitutions ?? []
  const { hasOpenIncident, canOpenSubstitution } = availability({ match, isAdmin, canReportIncident, canManageSubstitutions })
  const selectPanel = (panel: Exclude<MatchActionPanel, null>) => onOpenPanelChange(openPanel === panel ? null : panel)
  if (!match.incidentStatus && substitutions.length === 0 && !openPanel) return null
  return <div className="space-y-2">
    {match.incidentStatus || substitutions.length > 0 ? <div className="space-y-1.5">
      {match.incidentStatus ? <button type="button" onClick={() => selectPanel("incident")} className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left ${hasOpenIncident ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}><span className="min-w-0 truncate text-sm font-black">{hasOpenIncident ? "Incidencia pendiente" : "Incidencia resuelta"}{match.incidentType ? ` · ${matchIncidentTypeLabels[match.incidentType]}` : ""}</span><ClickableChevron className="shrink-0" /></button> : null}
      {substitutions.map((substitution) => <button key={substitution.id} type="button" onClick={() => { if (canOpenSubstitution) selectPanel("substitution") }} disabled={!canOpenSubstitution} className="flex w-full items-center justify-between gap-2 rounded-xl bg-red-50 px-3 py-2 text-left text-red-800 disabled:cursor-default"><span className="min-w-0 truncate text-sm font-black">{playerName(substitution.substitutePlayerId, players)} sustituye a {playerName(substitution.originalPlayerId, players)}</span>{canOpenSubstitution ? <ClickableChevron className="shrink-0" /> : null}</button>)}
    </div> : null}
    {openPanel === "incident" ? <MatchIncidentPanel match={match} players={players} canReport={isAdmin || canReportIncident} isAdmin={isAdmin} /> : null}
    {openPanel === "substitution" && canOpenSubstitution ? <MatchSubstitutionPanel match={match} players={players} /> : null}
  </div>
}
