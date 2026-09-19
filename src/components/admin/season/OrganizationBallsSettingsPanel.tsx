"use client"

import { useState } from "react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"
import type { SeasonRoundSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { calculateBallCustodianAssignment, getOpeningRoundBallAllocation } from "@/lib/ballCustodianAssignment"
import { moveBallsAssignmentPriority } from "@/lib/organizationBallsAssignment"
import { updateSupabaseSeasonRoundSettings } from "@/lib/supabaseSeasons"
import { showActionFeedback } from "@/lib/actionFeedback"

const supabaseUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isSupabaseBackedId = (id: string) => supabaseUuidPattern.test(id)

export function BallCustodianChoice({
  name,
  avatarUrl,
  selected,
  disabled = false,
  onClick,
}: {
  name: string;
  avatarUrl?: string | null;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-14 min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-2 text-left text-sm font-black transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
          : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50"
      }`}
    >
      <PlayerAvatar
        player={{ displayName: name, avatarUrl }}
        size="sm"
        className={selected ? "ring-2 ring-white/80 ring-offset-1 ring-offset-neutral-950" : ""}
      />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs transition ${
          selected
            ? "bg-white text-neutral-950"
            : "border border-neutral-300 text-neutral-400"
        }`}
      >
        {selected ? "✓" : "+"}
      </span>
    </button>
  );
}

export function OrganizationBallsSettingsPanel({
  activeLeagueId,
  roundSettings,
  players,
  matches,
  creatorPlayerId,
  creatorPlayerName,
}: {
  activeLeagueId: string
  roundSettings: SeasonRoundSettings
  players: Array<{ id: string; displayName: string; avatarUrl?: string | null; avatarInitials?: string | null }>
  matches: ReturnType<typeof useCurrentLeagueData>["matches"]
  creatorPlayerId: string | null
  creatorPlayerName: string | null
}) {
  const { tx } = useI18n()
  const { updateSeasonRoundSettings } = useSeasonSettings()
  const [enabled, setEnabled] = useState(roundSettings.organizationBallsAssigned)
  const [priority, setPriority] = useState(roundSettings.ballsAssignmentPriority)
  const [mode, setMode] = useState<"priority" | "selected">(roundSettings.ballsAssignmentMode ?? "priority")
  const [selectedCustodians, setSelectedCustodians] = useState(roundSettings.ballsAssignmentCustodianIds ?? [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasRecordedResults = matches.some((match) => match.seasonId === roundSettings.seasonId && (
    match.pointsA !== null || match.pointsB !== null || match.sets.length > 0 ||
    Boolean(match.resultRecordedAt) || Boolean(match.resultReportedByPlayerId)
  ))
  const seasonPlayers = players.filter((player) => priority.includes(player.id) || selectedCustodians.includes(player.id) || matches.some((match) => match.seasonId === roundSettings.seasonId && [...match.teamA, ...match.teamB].includes(player.id)))
  const seasonMatches = matches.filter((match) => match.seasonId === roundSettings.seasonId)
  const normalizedPriority = [
    ...priority.filter((playerId) => seasonPlayers.some((player) => player.id === playerId)),
    ...seasonPlayers.map((player) => player.id).filter((playerId) => !priority.includes(playerId)),
  ]
  const normalizedCustodians = selectedCustodians.filter((playerId) => seasonPlayers.some((player) => player.id === playerId))
  const openingRoundBallAllocation = getOpeningRoundBallAllocation(
    seasonMatches,
    roundSettings.openingRoundEnabled && roundSettings.openingRoundAt ? creatorPlayerId : null,
  )
  const preview = calculateBallCustodianAssignment({
    matches: seasonMatches,
    seasonPlayerIds: [...seasonPlayers.map((player) => player.id), ...(creatorPlayerId ? [creatorPlayerId] : [])],
    priorityPlayerIds: mode === "selected" ? [] : normalizedPriority,
    eligiblePlayerIds: mode === "selected" ? normalizedCustodians : undefined,
    playerNames: Object.fromEntries(
      [
        ...seasonPlayers,
        ...(creatorPlayerId && creatorPlayerName ? [{ id: creatorPlayerId, displayName: creatorPlayerName }] : []),
      ].map((player) => [player.id, player.displayName]),
    ),
    ...openingRoundBallAllocation,
  })
  const hasChanges = enabled !== roundSettings.organizationBallsAssigned ||
    mode !== (roundSettings.ballsAssignmentMode ?? "priority") ||
    normalizedCustodians.some((playerId, index) => playerId !== (roundSettings.ballsAssignmentCustodianIds ?? [])[index]) ||
    normalizedCustodians.length !== (roundSettings.ballsAssignmentCustodianIds ?? []).length ||
    normalizedPriority.some((playerId, index) => playerId !== roundSettings.ballsAssignmentPriority[index]) ||
    normalizedPriority.length !== roundSettings.ballsAssignmentPriority.length

  async function save() {
    if (isSaving || !hasChanges || hasRecordedResults) return
    setIsSaving(true); setError(null)
    const nextSettings: SeasonRoundSettings = {
      ...roundSettings,
      leagueId: activeLeagueId,
      organizationBallsAssigned: enabled,
      ballsAssignmentPriority: normalizedPriority,
      ballsAssignmentMode: mode,
      ballsAssignmentCustodianIds: normalizedCustodians,
    }
    try {
      if (isSupabaseBackedId(roundSettings.seasonId)) await updateSupabaseSeasonRoundSettings(nextSettings)
      updateSeasonRoundSettings(nextSettings)
      showActionFeedback({ tone: "success", message: tx("Reparto de botes actualizado.") })
    } catch (caughtError) {
      setError(caughtError instanceof Error && caughtError.message.includes("locked_after_result")
        ? tx("No se puede modificar el reparto después de registrar un resultado.")
        : tx("No se ha podido guardar el reparto de botes."))
    } finally { setIsSaving(false) }
  }

  return <AppCard>
    <p className="font-bold">{tx("Bolas asignadas por la organización")}</p>
    <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{hasRecordedResults ? tx("Bloqueado porque ya hay un resultado registrado en esta temporada.") : tx("La app calcula el mínimo número de custodios y asigna un encargado a cada partido. Si hay Jornada de Apertura, el organizador se encarga de todos los partidos de la Jornada 1.")}</p>
    <label className="mt-3 flex items-start gap-3 rounded-2xl border border-neutral-200 p-3">
      <input type="checkbox" checked={enabled} disabled={hasRecordedResults} onChange={(event) => setEnabled(event.target.checked)} className="mt-1" />
      <span><span className="block text-sm font-black">{tx("Activar bolas asignadas por la organización")}</span><span className="mt-1 block text-xs text-neutral-500">{tx("Al activarlo desaparece la compra de bolas en pagos y reservas.")}</span></span>
    </label>
    {enabled ? <div className="mt-3 space-y-2">
      <p className="text-xs font-black uppercase tracking-wide text-neutral-500">{tx("Modo de reparto")}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm">
          <input type="radio" name={`balls-mode-${roundSettings.seasonId}`} checked={mode === "priority"} disabled={hasRecordedResults} onChange={() => setMode("priority")} className="mt-0.5" />
          <span><span className="block font-black">{tx("Seleccionar orden de prioridad")}</span><span className="mt-1 block text-xs text-neutral-500">{tx("Prioridad en empates")}</span></span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm">
          <input type="radio" name={`balls-mode-${roundSettings.seasonId}`} checked={mode === "selected"} disabled={hasRecordedResults} onChange={() => setMode("selected")} className="mt-0.5" />
          <span><span className="block font-black">{tx("Seleccionar custodios")}</span><span className="mt-1 block text-xs text-neutral-500">{tx("Solo las personas elegidas podrán llevar botes.")}</span></span>
        </label>
      </div>
      {mode === "priority" ? <div className="space-y-1.5">{normalizedPriority.map((playerId, index) => { const player = seasonPlayers.find((item) => item.id === playerId); if (!player) return null; return <div key={playerId} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-2.5 py-2 text-sm font-bold"><span className="w-5 text-xs text-neutral-400">{index + 1}</span><span className="min-w-0 flex-1 truncate">{player.displayName}</span><button type="button" disabled={hasRecordedResults || index === 0} onClick={() => setPriority(moveBallsAssignmentPriority(normalizedPriority, index, -1))} className="rounded-lg bg-white px-2 py-1 text-xs disabled:opacity-30">↑</button><button type="button" disabled={hasRecordedResults || index === normalizedPriority.length - 1} onClick={() => setPriority(moveBallsAssignmentPriority(normalizedPriority, index, 1))} className="rounded-lg bg-white px-2 py-1 text-xs disabled:opacity-30">↓</button></div> })}</div> : <div className="space-y-1.5">
        <p className="text-xs font-black uppercase tracking-wide text-neutral-500">{tx("Jugadores que pueden ser custodios")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {seasonPlayers.map((player) => (
            <BallCustodianChoice
              key={player.id}
              name={player.displayName}
              avatarUrl={player.avatarUrl}
              selected={normalizedCustodians.includes(player.id)}
              disabled={hasRecordedResults}
              onClick={() => setSelectedCustodians((current) => current.includes(player.id) ? current.filter((id) => id !== player.id) : [...current, player.id])}
            />
          ))}
        </div>
        {normalizedCustodians.length === 0 ? <p className="text-xs font-semibold text-red-600">{tx("Selecciona al menos un custodio.")}</p> : null}
        {seasonMatches.length > 0 && preview.unassignedMatchIds.length > 0 ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{tx("Los custodios elegidos no pueden cubrir todos los partidos. Selecciona más jugadores.")}</p> : null}
        {seasonMatches.length === 0 ? <p className="text-xs font-semibold text-neutral-500">{tx("La cobertura se comprobará cuando se genere el calendario.")}</p> : null}
      </div>}
    </div> : null}
    {enabled && (seasonMatches.length > 0 || Object.keys(openingRoundBallAllocation.additionalBotesByPlayerId).length > 0) ? (
      <>
        <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600">{tx(`${preview.custodianPlayerIds.length} custodios · ${preview.totalBotes} botes repartidos`)}</p>
        {seasonMatches.length === 0 ? <p className="text-xs font-semibold text-neutral-500">{tx("El resto del reparto se calculará cuando la plantilla esté completa y se genere el calendario.")}</p> : null}
        {preview.custodianPlayerIds.length > 0 ? (
          <div className="mt-2 space-y-1 rounded-xl bg-neutral-50 p-2.5">
            {preview.custodianPlayerIds.map((playerId) => {
              const player = seasonPlayers.find((item) => item.id === playerId) ??
                (playerId === creatorPlayerId && creatorPlayerName
                  ? { id: creatorPlayerId, displayName: creatorPlayerName }
                  : players.find((item) => item.id === playerId))
              const botes = preview.botesByPlayerId[playerId] ?? 0
              return (
                <div key={playerId} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm">
                  <span className="min-w-0 truncate font-bold">{player?.displayName ?? playerId}</span>
                  <span className="shrink-0 text-xs font-black text-neutral-600">{tx(botes === 1 ? "1 bote" : `${botes} botes`)}</span>
                </div>
              )
            })}
          </div>
        ) : null}
      </>
    ) : null}
    {enabled && seasonMatches.length === 0 && Object.keys(openingRoundBallAllocation.additionalBotesByPlayerId).length === 0 ? <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600">{tx("El reparto se calculará cuando la plantilla esté completa y se genere el calendario.")}</p> : null}
    <button type="button" onClick={save} disabled={isSaving || !hasChanges || hasRecordedResults || (enabled && mode === "selected" && (normalizedCustodians.length === 0 || (seasonMatches.length > 0 && preview.unassignedMatchIds.length > 0)))} className="mt-3 flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500">{isSaving ? tx("Guardando...") : tx("Guardar reparto")}</button>
    {error ? <p className="mt-2 text-center text-xs font-semibold text-red-600">{error}</p> : null}
  </AppCard>
}
