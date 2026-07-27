"use client"

import { useMemo } from "react"
import { SeasonSummaryCard } from "@/components/statistics/SeasonSummaryCard"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import { getSeasonMvpSelection } from "@/lib/mvp"
import {
  calculateSeasonStatistics,
  getRankingPosition,
} from "@/lib/seasonStatistics"
import type { SeasonSummaryHighlight } from "@/lib/seasonSummaryImage"
import {
  formatFriendlyMatchLine,
  formatGamesDifference,
  getFriendlyMatchSummary,
} from "@/lib/statisticsPresentation"

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

  const summaryIsComplete =
    selectedSeason.status === "finished" &&
    statistics.dataQuality.pendingMatches === 0 &&
    statistics.dataQuality.excludedFinishedMatches === 0 &&
    statistics.dataQuality.invalidFinishedMatches === 0 &&
    statistics.dataQuality.hasCountedResults
  const blockingIssueCount =
    statistics.dataQuality.pendingMatches +
    statistics.dataQuality.excludedFinishedMatches +
    statistics.dataQuality.invalidFinishedMatches
  const exportBlockedReason =
    blockingIssueCount > 0
      ? `Revisa ${blockingIssueCount} ${blockingIssueCount === 1 ? "partido pendiente, excluido o no válido" : "partidos pendientes, excluidos o no válidos"} antes de generar la imagen.`
      : "La temporada necesita al menos un resultado válido para generar la imagen."

  const summaryHighlights = useMemo((): SeasonSummaryHighlight[] => {
    const comebackRecord = statistics.records.biggestComeback
    const comeback = comebackRecord
      ? getFriendlyMatchSummary(comebackRecord.match, playersById)
      : null
    const closest = statistics.records.closestMatch
      ? getFriendlyMatchSummary(statistics.records.closestMatch, playersById)
      : null
    const biggestWin = statistics.records.biggestWin
      ? getFriendlyMatchSummary(statistics.records.biggestWin, playersById)
      : null

    return [
      {
        label: "Mejor racha",
        headline: statistics.records.longestWinStreak
          ? `${statistics.records.longestWinStreak.displayName}: ${statistics.records.longestWinStreak.wins} victorias seguidas`
          : "Sin racha de victorias",
        detail: "La mejor serie individual de la temporada.",
      },
      {
        label: "Mayor remontada",
        headline:
          comeback && comebackRecord
            ? `${comeback.winnerNames} remontaron desde -${comebackRecord.firstSetDeficit} juegos`
            : "No hubo remontadas",
        detail: comeback
          ? formatFriendlyMatchLine(comeback)
          : "Ningún ganador perdió el primer set.",
      },
      {
        label: "Partido más igualado",
        headline: closest
          ? formatGamesDifference(closest.gamesMargin)
          : "Sin partido destacado",
        detail: closest
          ? formatFriendlyMatchLine(closest)
          : "No hay resultados suficientes.",
      },
      {
        label: "Victoria más contundente",
        headline: biggestWin
          ? `${biggestWin.winnerNames} ganaron por ${biggestWin.gamesMargin} ${biggestWin.gamesMargin === 1 ? "juego" : "juegos"}`
          : "Sin victoria destacada",
        detail: biggestWin
          ? formatFriendlyMatchLine(biggestWin)
          : "No hay resultados suficientes.",
      },
    ]
  }, [playersById, statistics.records])

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        leagueName={activeLeague.name}
        title="Resumen de temporada"
        description="Resumen final compartible e historial competitivo de la liga."
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
        statusBadge={
          selectedSeason.status === "finished" && !summaryIsComplete
            ? { label: "Datos incompletos", tone: "warning" }
            : undefined
        }
      />

      {selectedSeason.status === "finished" &&
      statistics.leader &&
      statistics.dataQuality.hasCountedResults ? (
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            Resumen final
          </p>
          <SeasonSummaryCard
            canExport={summaryIsComplete}
            exportBlockedReason={exportBlockedReason}
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
              highlights: summaryHighlights,
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
