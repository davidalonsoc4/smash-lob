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
      countedMatches.filter((match) => match.seasonId === selectedSeason.id),
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
  const canManage = hasLeagueAdminRole(activeLeague.id)

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
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label="Volver" />
        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name}
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Exportar datos
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Descarga la clasificación y los resultados en CSV compatible con Excel,
          Google Sheets y LibreOffice.
        </p>
      </header>

      <AppCard>
        <label className="block">
          <span className="text-xs font-black text-neutral-700">Temporada</span>
          <select
            value={selectedSeason.id}
            onChange={(event) => setSeasonId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"
          >
            {leagueSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </label>
      </AppCard>

      <AppCard>
        <p className="font-black">Clasificación</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Incluye posición, puntos, partidos, victorias, derrotas y balance de
          juegos de todos los jugadores de la temporada.
        </p>
        <button
          type="button"
          onClick={() =>
            exportRankingCsv({
              leagueName: activeLeague.name,
              seasonName: selectedSeason.name,
              ranking,
            })
          }
          disabled={ranking.length === 0}
          className="mt-3 w-full rounded-xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
        >
          Descargar clasificación CSV
        </button>
      </AppCard>

      <AppCard>
        <p className="font-black">Resultados</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Incluye jornada, parejas, marcador, sets, lugar, incidencias y si el
          partido contabiliza para la clasificación.
        </p>
        <button
          type="button"
          onClick={() =>
            exportResultsCsv({
              leagueName: activeLeague.name,
              seasonName: selectedSeason.name,
              matches: selectedMatches,
              players: leaguePlayers,
            })
          }
          disabled={selectedMatches.length === 0}
          className="mt-3 w-full rounded-xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
        >
          Descargar resultados CSV
        </button>
      </AppCard>

      <AppCard className="bg-neutral-50">
        <p className="text-xs font-bold leading-5 text-neutral-600">
          Los archivos se generan en tu dispositivo. No se envían datos a ningún
          servicio externo.
        </p>
      </AppCard>
    </div>
  )
}
