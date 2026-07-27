"use client"

import { useMemo } from "react"
import { SeasonSummaryCard } from "@/components/statistics/SeasonSummaryCard"
import { StatisticsDataQualityPanel } from "@/components/statistics/StatisticsDataQualityPanel"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import { getSeasonMvpSelection } from "@/lib/mvp"
import {
  calculateSeasonStatistics,
  getRankingPosition,
} from "@/lib/seasonStatistics"

export default function StatisticsSeasonPage() {
  const {
    activeLeague,
    selectedSeason,
    leagueSeasons,
    buildStatisticsHref,
    statistics,
    countedMatches,
    leaguePlayers,
    seasonPlayers,
    playersById,
    votes,
    getSeasonRoundSettings,
    getMatchLabel,
  } = useStatisticsWorkspace()

  const seasonMvp = useMemo(
    () =>
      selectedSeason.status === "finished"
        ? getSeasonMvpSelection({
            votes,
            leagueId: activeLeague.id,
            seasonId: selectedSeason.id,
            matches: countedMatches,
            mvpSystem: getSeasonRoundSettings(selectedSeason.id).mvpSystem,
          })
        : null,
    [
      activeLeague.id,
      countedMatches,
      getSeasonRoundSettings,
      selectedSeason.id,
      selectedSeason.status,
      votes,
    ],
  )
  const seasonMvpNames = seasonMvp
    ? seasonMvp.playerIds
        .map((playerId) => playersById.get(playerId) ?? "Jugador")
        .join(" / ")
    : "Sin MVP calculado"
  const seasonHistory = useMemo(
    () =>
      leagueSeasons
        .filter((season) => season.status === "finished")
        .map((season) => ({
          season,
          statistics: calculateSeasonStatistics({
            seasonId: season.id,
            playerProfiles: leaguePlayers,
            seasonPlayers,
            matches: countedMatches,
            includeProgress: false,
          }),
        }))
        .reverse(),
    [countedMatches, leaguePlayers, leagueSeasons, seasonPlayers],
  )

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        leagueName={activeLeague.name}
        title="Resumen de temporada"
        description="Estado de los datos, cierre compartible e historial competitivo de la liga."
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      <StatisticsDataQualityPanel
        quality={statistics.dataQuality}
        seasonStatus={selectedSeason.status}
      />

      {selectedSeason.status === "finished" &&
      statistics.leader &&
      statistics.dataQuality.hasCountedResults ? (
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            Resumen final compartible
          </p>
          <SeasonSummaryCard
            data={{
              leagueName: activeLeague.name,
              seasonName: selectedSeason.name,
              champion: statistics.leaders
                .map((player) => player.displayName)
                .join(" / "),
              mvp: seasonMvpNames,
              podium: statistics.ranking.slice(0, 3).map((player) => ({
                position: getRankingPosition(statistics.ranking, player.id) ?? 1,
                name: player.displayName,
                points: player.points,
              })),
              bestStreak: statistics.records.longestWinStreak
                ? `${statistics.records.longestWinStreak.displayName} · ${statistics.records.longestWinStreak.wins} victorias`
                : "Sin datos",
              biggestComeback: statistics.records.biggestComeback
                ? `Déficit de ${statistics.records.biggestComeback.firstSetDeficit} juegos · ${getMatchLabel(statistics.records.biggestComeback.match)}`
                : "Sin remontadas registradas",
              closestMatch: getMatchLabel(statistics.records.closestMatch),
              biggestWin: getMatchLabel(statistics.records.biggestWin),
            }}
          />
        </div>
      ) : selectedSeason.status === "finished" ? (
        <EmptyState
          compact
          title="Sin resumen final disponible"
          description="La temporada está cerrada, pero todavía no tiene resultados válidos suficientes para generar el resumen."
        />
      ) : (
        <AppCard>
          <p className="font-black">Temporada en curso</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            El resumen final y la imagen compartible aparecerán automáticamente cuando la temporada termine con resultados válidos.
          </p>
        </AppCard>
      )}

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Historial de campeones
        </p>
        {seasonHistory.length === 0 ? (
          <EmptyState
            compact
            title="Todavía no hay campeones históricos"
            description="El historial se completará cuando termine la primera temporada de la liga."
          />
        ) : (
          <AppCard className="overflow-hidden p-0">
            {seasonHistory.map(({ season, statistics: seasonStats }) => (
              <div
                key={season.id}
                className="statistics-history-row flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-black">{season.name}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-neutral-600">
                    {seasonStats.leaders.length > 0
                      ? seasonStats.leaders
                          .map((player) => player.displayName)
                          .join(" / ")
                      : "Sin campeón calculado"}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-black">
                  {seasonStats.leader?.points ?? 0} pts
                </span>
              </div>
            ))}
          </AppCard>
        )}
      </div>
    </div>
  )
}
