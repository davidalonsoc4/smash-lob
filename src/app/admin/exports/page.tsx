"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { exportRankingCsv, exportResultsCsv } from "@/lib/csvExport"
import { getMatchResultConfirmationState } from "@/lib/resultConfirmations"
import { calculateSeasonStatistics } from "@/lib/seasonStatistics"

function SpreadsheetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <rect x="3.5" y="2.75" width="17" height="18.5" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 8.25h17M9 8.25v13M15 8.25v13M3.5 14.75h17" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function CsvIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M7 2.75h7l4 4v14.5H7a2 2 0 0 1-2-2V4.75a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 2.75v4h4M8.25 12h6.5M8.25 15.5h6.5M8.25 19h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M12 3.5v11M7.75 10.5 12 14.75l4.25-4.25M4 19.5h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DataSummaryItem({
  value,
  label,
}: {
  value: number
  label: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-center shadow-sm">
      <p className="text-xl font-black leading-none text-neutral-950">{value}</p>
      <p className="mt-1 type-caption font-black uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </p>
    </div>
  )
}

function CsvExportCard({
  title,
  description,
  detail,
  buttonLabel,
  disabled,
  onDownload,
}: {
  title: string
  description: string
  detail: string
  buttonLabel: string
  disabled: boolean
  onDownload: () => void
}) {
  return (
    <AppCard className="flex h-full flex-col border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-800">
          <CsvIcon />
        </span>
        <div className="min-w-0">
          <h3 className="type-panel-title font-black text-neutral-950">{title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
            {description}
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-neutral-50 px-3 py-2 type-caption font-bold leading-5 text-neutral-500">
        {detail}
      </p>

      <button
        type="button"
        onClick={onDownload}
        disabled={disabled}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-900 transition active:scale-[0.99] disabled:bg-neutral-100 disabled:text-neutral-400"
      >
        <DownloadIcon />
        {buttonLabel}
      </button>
    </AppCard>
  )
}

export default function AdminExportsPage() {
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { hasLeagueAdminRole } = useLeagueAccess()
  const { matches, resultConfirmations } = useMatchData()
  const {
    seasons,
    playerProfiles,
    seasonPlayers,
    getSeasonRoundSettings,
  } = useSeasonSettings()
  const countedMatches = useMemo(
    () =>
      matches.map((match) => ({
        ...match,
        resultCounts:
          match.rankingCounts !== false &&
          getMatchResultConfirmationState({
            matchId: match.id,
            participantIds: [...match.teamA, ...match.teamB],
            reporterPlayerId: match.resultReportedByPlayerId,
            resultRecordedAt: match.resultRecordedAt,
            resultLocked: match.resultLocked,
            confirmations: resultConfirmations,
            mode: getSeasonRoundSettings(match.seasonId).resultConfirmationMode,
          }).countsForRanking,
      })),
    [getSeasonRoundSettings, matches, resultConfirmations],
  )
  const leagueSeasons = useMemo(
    () => seasons.filter((season) => season.leagueId === activeLeague.id),
    [activeLeague.id, seasons],
  )
  const leaguePlayers = useMemo(
    () => playerProfiles.filter((player) => player.leagueId === activeLeague.id),
    [activeLeague.id, playerProfiles],
  )
  const [seasonId, setSeasonId] = useState(activeSeason.id)
  const selectedSeason =
    leagueSeasons.find((season) => season.id === seasonId) ?? activeSeason
  const selectedMatches = useMemo(
    () =>
      countedMatches
        .filter((match) => match.seasonId === selectedSeason.id)
        .sort((left, right) => left.round - right.round),
    [countedMatches, selectedSeason.id],
  )
  const ranking = useMemo(
    () =>
      calculateSeasonStatistics({
        seasonId: selectedSeason.id,
        playerProfiles: leaguePlayers,
        seasonPlayers,
        matches: countedMatches,
      }).ranking,
    [countedMatches, leaguePlayers, seasonPlayers, selectedSeason.id],
  )
  const finishedMatches = useMemo(
    () => selectedMatches.filter((match) => match.status === "finished").length,
    [selectedMatches],
  )
  const canManage = hasLeagueAdminRole(activeLeague.id)
  const hasAnyData = ranking.length > 0 || selectedMatches.length > 0

  if (!canManage) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/admin" label="Volver" />
        <AppCard>
          <p className="font-black">Acceso restringido</p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="compact-page space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label="Volver" />
        <div className="mt-2 overflow-hidden rounded-[28px] border border-neutral-200 bg-[linear-gradient(135deg,#ffffff_0%,#f1f4ef_100%)] px-4 py-4 shadow-sm">
          <p className="type-caption font-black uppercase tracking-[0.2em] text-neutral-500">
            {activeLeague.name}
          </p>
          <h1 className="type-page-title mt-1 text-xl font-black tracking-tight text-neutral-950">
            Exportar datos
          </h1>
        </div>
      </header>

      <AppCard className="space-y-4 border-neutral-200 bg-white shadow-sm">
        <label className="block">
          <span className="text-xs font-black text-neutral-700">
            Temporada que quieres exportar
          </span>
          <select
            value={selectedSeason.id}
            onChange={(event) => setSeasonId(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold"
          >
            {leagueSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-3 gap-2">
          <DataSummaryItem value={ranking.length} label="Jugadores" />
          <DataSummaryItem value={selectedMatches.length} label="Partidos" />
          <DataSummaryItem value={finishedMatches} label="Finalizados" />
        </div>
      </AppCard>

      <section aria-labelledby="excel-export-title">
        <AppCard className="overflow-hidden border-neutral-200 bg-white p-0 shadow-sm">
          <div className="bg-[linear-gradient(135deg,#19211b_0%,#334239_100%)] px-4 py-5 text-white">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/12">
                <SpreadsheetIcon />
              </span>
              <div className="min-w-0">
                <p className="type-caption font-black uppercase tracking-[0.18em] text-white/65">
                  Opción recomendada
                </p>
                <h2 id="excel-export-title" className="mt-1 text-lg font-black">
                  Libro Excel completo
                </h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-white/75">
                  Un único archivo .xlsx preparado para Excel con toda la información de la temporada separada en hojas.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-neutral-50 px-3 py-3">
                <p className="text-sm font-black text-neutral-950">Hoja Clasificación</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                  Posición, puntos, partidos, victorias, derrotas y balance de juegos.
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-50 px-3 py-3">
                <p className="text-sm font-black text-neutral-950">Hoja Resultados</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                  Jornadas, parejas, marcadores, sets, fechas, lugares e incidencias.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                const { exportSeasonExcelWorkbook } = await import(
                  "@/lib/excelExport"
                )
                exportSeasonExcelWorkbook({
                  leagueName: activeLeague.name,
                  seasonName: selectedSeason.name,
                  ranking,
                  matches: selectedMatches,
                  players: leaguePlayers,
                })
              }}
              disabled={!hasAnyData}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3.5 text-sm font-black text-white transition active:scale-[0.99] disabled:bg-neutral-300"
            >
              <DownloadIcon />
              Descargar libro Excel (.xlsx)
            </button>
          </div>
        </AppCard>
      </section>

      <section className="space-y-2" aria-labelledby="csv-export-title">
        <div className="px-1">
          <h2 id="csv-export-title" className="text-sm font-black text-neutral-950">
            Archivos CSV por separado
          </h2>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            Útiles para importar solo una tabla en Excel, Google Sheets, LibreOffice u otras herramientas.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <CsvExportCard
            title="Clasificación"
            description="Una fila por jugador con todas las estadísticas de la temporada."
            detail={`${ranking.length} jugadores · 10 columnas`}
            buttonLabel="Descargar clasificación CSV"
            disabled={ranking.length === 0}
            onDownload={() =>
              exportRankingCsv({
                leagueName: activeLeague.name,
                seasonName: selectedSeason.name,
                ranking,
              })
            }
          />

          <CsvExportCard
            title="Resultados"
            description="Una fila por partido con programación, resultado e incidencias."
            detail={`${selectedMatches.length} partidos · 12 columnas`}
            buttonLabel="Descargar resultados CSV"
            disabled={selectedMatches.length === 0}
            onDownload={() =>
              exportResultsCsv({
                leagueName: activeLeague.name,
                seasonName: selectedSeason.name,
                matches: selectedMatches,
                players: leaguePlayers,
              })
            }
          />
        </div>
      </section>

      <AppCard className="border-neutral-200 bg-neutral-50 shadow-sm">
        <p className="text-xs font-bold leading-5 text-neutral-600">
          Los archivos se generan directamente en tu dispositivo. No se envían datos de la liga a ningún servicio externo.
        </p>
      </AppCard>
    </div>
  )
}
