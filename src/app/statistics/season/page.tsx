"use client"

import { useMemo } from "react"
import { SeasonShareExportsCard } from "@/components/statistics/SeasonShareExportsCard"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import { getSeasonMvpSelection } from "@/lib/mvp"
import type { RankingPlayer } from "@/lib/ranking"
import {
  calculateSeasonStatistics,
  getRankingPosition,
} from "@/lib/seasonStatistics"
import type {
  SeasonSummaryHeroPanel,
  SeasonSummaryHighlight,
  SeasonSummaryStat,
} from "@/lib/seasonSummaryImage"
import {
  formatFriendlyMatchLine,
  formatGamesDifference,
  getFriendlyMatchSummary,
} from "@/lib/statisticsPresentation"

function formatSignedGamesDiff(value: number) {
  if (value > 0) return `+${value}`
  return `${value}`
}

function haveSamePlayerIds(first: string[], second: string[]) {
  if (first.length === 0 || first.length !== second.length) return false
  return [...first].sort().join("|") === [...second].sort().join("|")
}

function isGenericPlayerName(value: string) {
  return /^jugador(?:\s+\d+)?$/i.test(value.trim())
}

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
    isLeagueWide,
  } = useStatisticsWorkspace()

  const selectedSeasonMatches = useMemo(
    () =>
      countedMatches
        .filter((match) => match.seasonId === selectedSeason.id)
        .sort((left, right) => left.round - right.round),
    [countedMatches, selectedSeason.id],
  )
  const exportRanking = useMemo(() => {
    const profilesById = new Map(
      leaguePlayers.map((player) => [player.id, player]),
    )

    return statistics.ranking.map((player) => {
      const profile =
        profilesById.get(player.playerId) ?? profilesById.get(player.id)

      if (!profile) {
        return player
      }

      const profileHasRealName = !isGenericPlayerName(profile.displayName)
      const shouldUseProfileName =
        isGenericPlayerName(player.displayName) && profileHasRealName

      return {
        ...player,
        displayName: shouldUseProfileName
          ? profile.displayName
          : player.displayName,
        slug: player.slug || profile.slug,
        avatarInitials: player.avatarInitials || profile.avatarInitials,
        avatarUrl: player.avatarUrl ?? profile.avatarUrl,
        userId: player.userId ?? profile.userId,
      }
    })
  }, [leaguePlayers, statistics.ranking])
  const exportRankingById = useMemo(
    () => new Map(exportRanking.map((player) => [player.id, player])),
    [exportRanking],
  )
  const selectedSeasonMvpSystem = getSeasonRoundSettings(selectedSeason.id).mvpSystem
  const seasonMvp = useMemo(
    () =>
      !isLeagueWide &&
      selectedSeason.status === "finished" &&
      selectedSeasonMvpSystem !== "none"
        ? getSeasonMvpSelection({
            votes,
            leagueId: activeLeague.id,
            seasonId: selectedSeason.id,
            matches: countedMatches,
            mvpSystem: selectedSeasonMvpSystem,
          })
        : null,
    [
      activeLeague.id,
      countedMatches,
      isLeagueWide,
      selectedSeason.id,
      selectedSeason.status,
      selectedSeasonMvpSystem,
      votes,
    ],
  )
  const seasonMvpNames = seasonMvp
    ? seasonMvp.playerIds
        .map((playerId) => playersById.get(playerId) ?? "Jugador")
        .join(" / ")
    : "Sin MVP calculado"
  const summaryHeroes = useMemo((): SeasonSummaryHeroPanel[] => {
    const championPlayers = statistics.leaders.map(
      (player) => exportRankingById.get(player.id) ?? player,
    )
    const championPlayerIds = championPlayers.map((player) => player.id)
    const championNames = championPlayers.map((player) => player.displayName).join(" / ")
    const mvpPlayerIds = seasonMvp?.playerIds ?? []
    const mvpPlayers = mvpPlayerIds
      .map((playerId) => exportRankingById.get(playerId))
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
    const mvpNames = seasonMvpNames

    function buildStats(player: RankingPlayer | undefined): SeasonSummaryStat[] {
      if (!player) {
        return [
          { label: "Puntos", value: "—" },
          { label: "Victorias", value: "—" },
          { label: "Dif. juegos", value: "—" },
        ]
      }

      return [
        { label: "Puntos", value: `${player.points}` },
        { label: "Victorias", value: `${player.wins}` },
        { label: "Dif. juegos", value: formatSignedGamesDiff(player.gamesDiff) },
      ]
    }

    const championPanel: SeasonSummaryHeroPanel = {
      kind: "champion",
      label: championPlayers.length > 1 ? "Campeones" : "Campeón",
      value: championNames,
      stats: buildStats(championPlayers[0]),
      imageUrl: championPlayers[0]?.avatarUrl ?? null,
    }

    if (selectedSeasonMvpSystem === "none") {
      return [championPanel]
    }

    if (haveSamePlayerIds(championPlayerIds, mvpPlayerIds)) {
      return [
        {
          kind: "combined",
          label: championPlayers.length > 1 ? "Campeones y MVP" : "Campeón y MVP",
          value: championNames,
          stats: buildStats(championPlayers[0]),
          imageUrl: championPlayers[0]?.avatarUrl ?? null,
        },
      ]
    }

    return [
      championPanel,
      {
        kind: "mvp",
        label: "MVP",
        value: mvpNames,
        stats: buildStats(mvpPlayers[0]),
        imageUrl: mvpPlayers[0]?.avatarUrl ?? null,
      },
    ]
  }, [
    seasonMvp,
    seasonMvpNames,
    selectedSeasonMvpSystem,
    exportRankingById,
    statistics.leaders,
  ])
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
    !isLeagueWide &&
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
        title={isLeagueWide ? "Resumen de la liga" : "Compartir resumen de temporada"}
        description={
          isLeagueWide
            ? "Vista histórica de todas las temporadas y campeones de la liga."
            : "Comparte el calendario y la clasificación durante toda la temporada. La descarga del resumen final aparecerá cuando termine."
        }
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
        statusBadge={
          !isLeagueWide && selectedSeason.status === "finished" && !summaryIsComplete
            ? { label: "Datos incompletos", tone: "warning" }
            : undefined
        }
      />

      {!isLeagueWide ? (
        <section id="compartir-resumen-temporada" className="scroll-mt-24">
          <SeasonShareExportsCard
            leagueName={activeLeague.name}
            seasonName={selectedSeason.name}
            leagueLogoUrl={activeLeague.logoUrl ?? null}
            matches={selectedSeasonMatches}
            players={leaguePlayers}
            ranking={exportRanking}
            seasonFinished={selectedSeason.status === "finished"}
            summaryExport={{
              visible: selectedSeason.status === "finished",
              canExport: summaryIsComplete,
              blockedReason: summaryIsComplete ? undefined : exportBlockedReason,
              data: {
                leagueName: activeLeague.name,
                seasonName: selectedSeason.name,
                leagueLogoUrl: activeLeague.logoUrl ?? null,
                heroes: summaryHeroes,
                podium: exportRanking.slice(0, 3).map((player) => ({
                  position: getRankingPosition(exportRanking, player.id) ?? 1,
                  name: player.displayName,
                  points: player.points,
                  gamesDiff: player.gamesDiff,
                })),
                highlights: summaryHighlights,
              },
            }}
          />
        </section>
      ) : null}

      {isLeagueWide ? (
        <AppCard>
          <p className="type-caption font-black uppercase tracking-[0.18em] text-neutral-400">
            Histórico completo
          </p>
          <p className="mt-1 text-xl font-black">
            {leagueSeasons.length} temporadas · {statistics.countedMatches} partidos válidos
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            {statistics.leader
              ? `${statistics.leader.displayName} lidera el histórico con ${statistics.leader.points} puntos y ${statistics.leader.wins} victorias.`
              : "Todavía no hay resultados suficientes para calcular el histórico."}
          </p>
          <p className="mt-2 type-caption font-semibold leading-5 text-neutral-500">
            Las imágenes compartibles se generan por temporada para no mezclar campeones, MVP y podios de competiciones diferentes.
          </p>
        </AppCard>
      ) : null}

      <div>
        <p className="mb-2 type-caption font-black uppercase tracking-[0.2em] text-neutral-600">
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
