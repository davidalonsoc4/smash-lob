"use client"

import { useMemo, useState } from "react"
import { FloatingStatisticsSelector } from "@/components/statistics/FloatingStatisticsSelector"
import { PlayerProgressChart } from "@/components/statistics/PlayerProgressChart"
import { PlayerSeasonRecordsPanel } from "@/components/statistics/SeasonRecordsPanel"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import { getPlayerMvpSummary } from "@/lib/mvp"
import { calculatePlayerSeasonDetail } from "@/lib/seasonStatistics"

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

export default function StatisticsPlayerPage() {
  const {
    activeLeague,
    selectedSeason,
    buildStatisticsHref,
    statistics,
    countedMatches,
    statisticsMatches,
    leaguePlayers,
    statisticsSeasonPlayers,
    leagueSeasons,
    votes,
    getSeasonRoundSettings,
    playersById,
    isBalancedCalendar,
    isLeagueWide,
  } = useStatisticsWorkspace()
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const selectedPlayer =
    statistics.ranking.find((player) => player.id === selectedPlayerId) ??
    statistics.ranking[0] ??
    null
  const playerDetail = useMemo(
    () =>
      selectedPlayer
        ? calculatePlayerSeasonDetail({
            seasonId: selectedSeason.id,
            playerId: selectedPlayer.id,
            playerProfiles: leaguePlayers,
            seasonPlayers: statisticsSeasonPlayers,
            matches: statisticsMatches,
            precomputedProgress: statistics.progressByPlayer[selectedPlayer.id],
          })
        : null,
    [
      statisticsMatches,
      leaguePlayers,
      statisticsSeasonPlayers,
      selectedPlayer,
      selectedSeason.id,
      statistics.progressByPlayer,
    ],
  )
  const playerMvpSummary = useMemo(() => {
    if (!selectedPlayer) return null

    const seasonIds = isLeagueWide
      ? leagueSeasons.map((season) => season.id)
      : [selectedSeason.id]
    const summaries = seasonIds.map((seasonId) =>
      getPlayerMvpSummary({
        votes,
        leagueId: activeLeague.id,
        seasonId,
        matches: countedMatches,
        playerId: selectedPlayer.id,
        mvpSystem: getSeasonRoundSettings(seasonId).mvpSystem,
      }),
    )

    return summaries.reduce(
      (total, summary) => ({
        roundMvpCount: total.roundMvpCount + summary.roundMvpCount,
        roundMvpRounds: [...total.roundMvpRounds, ...summary.roundMvpRounds],
        seasonMvpCount: total.seasonMvpCount + summary.seasonMvpCount,
        votesReceived: total.votesReceived + summary.votesReceived,
      }),
      {
        roundMvpCount: 0,
        roundMvpRounds: [] as number[],
        seasonMvpCount: 0,
        votesReceived: 0,
      },
    )
  }, [
    activeLeague.id,
    countedMatches,
    getSeasonRoundSettings,
    isLeagueWide,
    leagueSeasons,
    selectedPlayer,
    selectedSeason.id,
    votes,
  ])

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        title="Análisis individual"
        description={
          isLeagueWide
            ? "Rendimiento histórico, rachas, compañero más fuerte, rivales y récords de un jugador en toda la liga."
            : "Rendimiento, rachas, compañero más fuerte, rivales y récords de un jugador."
        }
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      {statistics.ranking.length === 0 ? (
        <EmptyState
          compact
          title="Sin jugadores para analizar"
          description="El análisis individual se activará cuando exista una plantilla con estadísticas."
        />
      ) : (
        <>
          <FloatingStatisticsSelector>
            <label className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-black text-neutral-700">
                Jugador
              </span>
              <select
                value={selectedPlayer?.id ?? ""}
                onChange={(event) => setSelectedPlayerId(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-bold"
              >
                {statistics.ranking.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.displayName}
                  </option>
                ))}
              </select>
            </label>
          </FloatingStatisticsSelector>

          {playerDetail && selectedPlayer ? (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <AppCard>
                  <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
                    Victorias
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {formatPercent(playerDetail.winRate)}
                  </p>
                  <p className="mt-0.5 type-caption font-semibold text-neutral-500">
                    {playerDetail.player.wins}V · {playerDetail.player.losses}D
                  </p>
                </AppCard>
                <AppCard>
                  <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
                    Mejor racha
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {playerDetail.bestWinStreak}
                  </p>
                  <p className="mt-0.5 type-caption font-semibold text-neutral-500">
                    victorias seguidas
                  </p>
                </AppCard>
                <AppCard>
                  <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
                    MVP jornada
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {playerMvpSummary?.roundMvpCount ?? 0}
                  </p>
                  <p className="mt-0.5 type-caption font-semibold text-neutral-500">
                    {playerMvpSummary?.votesReceived ?? 0} votos recibidos
                  </p>
                </AppCard>
                <AppCard>
                  <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
                    Dif. juegos
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {formatSigned(playerDetail.player.gamesDiff)}
                  </p>
                  <p className="mt-0.5 type-caption font-semibold text-neutral-500">
                    {playerDetail.player.points} puntos
                  </p>
                </AppCard>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <AppCard>
                  <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
                    Compañero más fuerte
                  </p>
                  <p className="mt-1 truncate font-black">
                    {playerDetail.strongestTeammate?.displayName ?? "—"}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                    {playerDetail.strongestTeammate
                      ? `Dif. sets ${formatSigned(playerDetail.strongestTeammate.setsDiff)} · Dif. juegos ${formatSigned(playerDetail.strongestTeammate.gamesDiff)}`
                      : "Sin datos suficientes"}
                  </p>
                </AppCard>
                <AppCard>
                  <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
                    {isBalancedCalendar ? "Rival más difícil" : "Rival más habitual"}
                  </p>
                  <p className="mt-1 truncate font-black">
                    {(isBalancedCalendar
                      ? playerDetail.toughestOpponent
                      : playerDetail.mostFrequentOpponent
                    )?.displayName ?? "—"}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                    {isBalancedCalendar
                      ? playerDetail.toughestOpponent
                        ? `${formatPercent(playerDetail.toughestOpponent.winRate)} de victorias · Dif. ${formatSigned(playerDetail.toughestOpponent.gamesDiff)}`
                        : "Sin datos suficientes"
                      : playerDetail.mostFrequentOpponent
                        ? `${playerDetail.mostFrequentOpponent.matchesPlayed} duelos · ${playerDetail.mostFrequentOpponent.wins}V/${playerDetail.mostFrequentOpponent.losses}D`
                        : "Sin datos suficientes"}
                  </p>
                </AppCard>
              </div>

              <div>
                <p className="mb-2 type-caption font-black uppercase tracking-[0.18em] text-neutral-400">
                  Récords del jugador
                </p>
                <PlayerSeasonRecordsPanel
                  detail={playerDetail}
                  playersById={playersById}
                  isLeagueWide={isLeagueWide}
                />
              </div>

              {playerDetail.progress.length > 0 ? (
                <PlayerProgressChart
                  displayName={selectedPlayer.displayName}
                  progress={playerDetail.progress}
                />
              ) : null}

              {playerDetail.opponents.length > 0 ? (
                <AppCard>
                  <p className="font-black">Cara a cara por rival</p>
                  <div className="mt-2 space-y-2">
                    {playerDetail.opponents.map((opponent) => (
                      <div
                        key={opponent.playerId}
                        className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="type-player-name truncate">
                            {opponent.displayName}
                          </p>
                          <p className="type-caption font-semibold text-neutral-500">
                            {opponent.matchesPlayed} duelos · {opponent.wins}V · {opponent.losses}D
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-black">
                          {formatPercent(opponent.winRate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </AppCard>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
