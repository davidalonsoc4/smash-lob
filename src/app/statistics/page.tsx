"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { RankingTable } from "@/components/ranking/RankingTable"
import { useMatchData } from "@/context/MatchDataProvider"
import { useMvp } from "@/context/MvpProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { getPlayerMvpSummary } from "@/lib/mvp"
import { getMatchResultConfirmationState } from "@/lib/resultConfirmations"
import {
  calculatePlayerSeasonDetail,
  calculateSeasonStatistics,
  type PairStatistics,
} from "@/lib/seasonStatistics"

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 1,
  }).format(value)
}

function getPartnerName(pair: PairStatistics | null, playerId: string) {
  if (!pair) return "—"

  const partnerIndex = pair.playerIds.findIndex((id) => id !== playerId)
  return partnerIndex >= 0 ? pair.playerNames[partnerIndex] : "—"
}

export default function StatisticsPage() {
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { matches, resultConfirmations } = useMatchData()
  const { votes } = useMvp()
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
  const [selectedSeasonId, setSelectedSeasonId] = useState(activeSeason.id)
  const selectedSeason =
    leagueSeasons.find((season) => season.id === selectedSeasonId) ??
    activeSeason
  const statistics = useMemo(
    () =>
      calculateSeasonStatistics({
        seasonId: selectedSeason.id,
        playerProfiles: playerProfiles.filter(
          (player) => player.leagueId === activeLeague.id,
        ),
        seasonPlayers,
        matches: countedMatches,
      }),
    [
      activeLeague.id,
      countedMatches,
      playerProfiles,
      seasonPlayers,
      selectedSeason.id,
    ],
  )
  const leaguePlayers = useMemo(
    () => playerProfiles.filter((player) => player.leagueId === activeLeague.id),
    [activeLeague.id, playerProfiles],
  )
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
            seasonPlayers,
            matches: countedMatches,
            pairStatistics: statistics.pairStatistics,
          })
        : null,
    [
      countedMatches,
      leaguePlayers,
      seasonPlayers,
      selectedPlayer,
      selectedSeason.id,
      statistics.pairStatistics,
    ],
  )
  const playerMvpSummary = useMemo(
    () =>
      selectedPlayer
        ? getPlayerMvpSummary({
            votes,
            leagueId: activeLeague.id,
            seasonId: selectedSeason.id,
            matches: countedMatches,
            playerId: selectedPlayer.id,
            mvpSystem: getSeasonRoundSettings(selectedSeason.id).mvpSystem,
          })
        : null,
    [
      activeLeague.id,
      countedMatches,
      getSeasonRoundSettings,
      selectedPlayer,
      selectedSeason.id,
      votes,
    ],
  )
  const playersById = useMemo(
    () => new Map(leaguePlayers.map((player) => [player.id, player.displayName])),
    [leaguePlayers],
  )
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
          }),
        }))
        .reverse(),
    [countedMatches, leaguePlayers, leagueSeasons, seasonPlayers],
  )

  function getMatchLabel(match: typeof statistics.closestMatch) {
    if (!match) return "—"
    const teamA = match.teamA
      .map((playerId) => playersById.get(playerId) ?? "Jugador")
      .join(" / ")
    const teamB = match.teamB
      .map((playerId) => playersById.get(playerId) ?? "Jugador")
      .join(" / ")
    const result = match.sets.map((set) => `${set.a}-${set.b}`).join(", ")
    return `J${match.round} · ${teamA} vs ${teamB}${result ? ` · ${result}` : ""}`
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/ranking" label="Volver" />
        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name}
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Historial y estadísticas
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Evolución de temporadas, rendimiento individual y parejas destacadas.
        </p>
      </header>

      <AppCard>
        <label className="block">
          <span className="text-xs font-black text-neutral-700">Temporada</span>
          <select
            value={selectedSeason.id}
            onChange={(event) => setSelectedSeasonId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"
          >
            {leagueSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} · {season.status === "finished" ? "Terminada" : season.status === "active" ? "Activa" : "Próxima"}
              </option>
            ))}
          </select>
        </label>
      </AppCard>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Partidos
          </p>
          <p className="mt-1 text-2xl font-black">
            {statistics.completedMatches}/{statistics.totalMatches}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {formatPercent(statistics.completionRate)} completado
          </p>
        </AppCard>
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Juegos
          </p>
          <p className="mt-1 text-2xl font-black">{statistics.totalGames}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {formatNumber(statistics.averageGamesPerMatch)} por partido
          </p>
        </AppCard>
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Líder
          </p>
          <p className="mt-1 truncate text-base font-black">
            {statistics.leader?.displayName ?? "—"}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {statistics.leader ? `${statistics.leader.points} puntos` : "Sin datos"}
          </p>
        </AppCard>
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Mejor racha
          </p>
          <p className="mt-1 truncate text-base font-black">
            {statistics.longestWinStreak?.displayName ?? "—"}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {statistics.longestWinStreak
              ? `${statistics.longestWinStreak.wins} victorias`
              : "Sin datos"}
          </p>
        </AppCard>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Clasificación de la temporada
        </p>
        {statistics.ranking.length > 0 ? (
          <RankingTable
            players={statistics.ranking}
            showAvatars={activeLeague.showRankingAvatars !== false}
          />
        ) : (
          <AppCard>
            <p className="text-sm font-bold text-neutral-500">
              Todavía no hay jugadores ni resultados para esta temporada.
            </p>
          </AppCard>
        )}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Análisis individual
        </p>
        {statistics.ranking.length === 0 ? (
          <AppCard>
            <p className="text-sm font-bold text-neutral-500">
              Todavía no hay jugadores para analizar.
            </p>
          </AppCard>
        ) : (
          <div className="space-y-2">
            <AppCard>
              <label className="block">
                <span className="text-xs font-black text-neutral-700">
                  Jugador
                </span>
                <select
                  value={selectedPlayer?.id ?? ""}
                  onChange={(event) => setSelectedPlayerId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"
                >
                  {statistics.ranking.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.displayName}
                    </option>
                  ))}
                </select>
              </label>
            </AppCard>

            {playerDetail && selectedPlayer ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <AppCard>
                    <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                      Victorias
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {formatPercent(playerDetail.winRate)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                      {playerDetail.player.wins}V · {playerDetail.player.losses}D
                    </p>
                  </AppCard>
                  <AppCard>
                    <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                      Mejor racha
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {playerDetail.bestWinStreak}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                      victorias seguidas
                    </p>
                  </AppCard>
                  <AppCard>
                    <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                      MVP jornada
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {playerMvpSummary?.roundMvpCount ?? 0}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                      {playerMvpSummary?.votesReceived ?? 0} votos recibidos
                    </p>
                  </AppCard>
                  <AppCard>
                    <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                      Posición
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {statistics.ranking.findIndex(
                        (player) => player.id === selectedPlayer.id,
                      ) + 1}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                      {selectedPlayer.points} puntos
                    </p>
                  </AppCard>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <AppCard>
                    <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                      Mejor pareja
                    </p>
                    <p className="mt-1 truncate font-black">
                      {getPartnerName(
                        playerDetail.bestPartner,
                        selectedPlayer.id,
                      )}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                      {playerDetail.bestPartner
                        ? `${formatPercent(playerDetail.bestPartner.winRate)} · ${playerDetail.bestPartner.matchesPlayed} partidos`
                        : "Sin partidos suficientes"}
                    </p>
                  </AppCard>
                  <AppCard>
                    <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                      Pareja más habitual
                    </p>
                    <p className="mt-1 truncate font-black">
                      {getPartnerName(
                        playerDetail.mostFrequentPartner,
                        selectedPlayer.id,
                      )}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                      {playerDetail.mostFrequentPartner
                        ? `${playerDetail.mostFrequentPartner.matchesPlayed} partidos juntos`
                        : "Sin datos"}
                    </p>
                  </AppCard>
                  <AppCard>
                    <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                      Rival más difícil
                    </p>
                    <p className="mt-1 truncate font-black">
                      {playerDetail.toughestOpponent?.displayName ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                      {playerDetail.toughestOpponent
                        ? `${formatPercent(playerDetail.toughestOpponent.winRate)} de victorias · ${playerDetail.toughestOpponent.matchesPlayed} duelos`
                        : "Sin datos"}
                    </p>
                  </AppCard>
                </div>

                {playerDetail.progress.length > 0 ? (
                  <AppCard>
                    <p className="font-black">Evolución por jornada</p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[420px] text-left text-xs">
                        <thead>
                          <tr className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                            <th className="pb-2">Jornada</th>
                            <th className="pb-2">Posición</th>
                            <th className="pb-2">Puntos</th>
                            <th className="pb-2">Dif. juegos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playerDetail.progress.map((row) => (
                            <tr key={row.round} className="border-t border-neutral-100">
                              <td className="py-2 font-black">J{row.round}</td>
                              <td className="py-2 font-bold">{row.position}º</td>
                              <td className="py-2 font-bold">{row.points}</td>
                              <td className="py-2 font-bold">
                                {row.gamesDiff > 0 ? "+" : ""}{row.gamesDiff}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AppCard>
                ) : null}

                {playerDetail.opponents.length > 0 ? (
                  <AppCard>
                    <p className="font-black">Cara a cara por rival</p>
                    <div className="mt-2 space-y-2">
                      {playerDetail.opponents.slice(0, 8).map((opponent) => (
                        <div
                          key={opponent.playerId}
                          className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">
                              {opponent.displayName}
                            </p>
                            <p className="text-[11px] font-semibold text-neutral-500">
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
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Parejas
        </p>
        {statistics.pairStatistics.length === 0 ? (
          <AppCard>
            <p className="text-sm font-bold text-neutral-500">
              Se necesitan partidos contabilizados para comparar parejas.
            </p>
          </AppCard>
        ) : (
          <div className="space-y-2">
            {statistics.pairStatistics.slice(0, 8).map((pair, index) => (
              <AppCard key={pair.playerIds.join("|")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black">
                      {index + 1}. {pair.playerNames.join(" / ")}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                      {pair.matchesPlayed} partidos · {pair.wins}V · {pair.losses}D · Dif. {pair.gamesDiff > 0 ? "+" : ""}{pair.gamesDiff}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-black text-neutral-800">
                    {formatPercent(pair.winRate)}
                  </span>
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Partidos destacados
        </p>
        <div className="space-y-2">
          <AppCard>
            <p className="text-xs font-black uppercase tracking-wide text-neutral-400">
              Partido más igualado
            </p>
            <p className="mt-1 text-sm font-bold leading-5">
              {getMatchLabel(statistics.closestMatch)}
            </p>
          </AppCard>
          <AppCard>
            <p className="text-xs font-black uppercase tracking-wide text-neutral-400">
              Victoria más amplia
            </p>
            <p className="mt-1 text-sm font-bold leading-5">
              {getMatchLabel(statistics.biggestWin)}
            </p>
          </AppCard>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Historial de campeones
        </p>
        {seasonHistory.length === 0 ? (
          <AppCard>
            <p className="text-sm font-bold text-neutral-500">
              El historial aparecerá cuando termine la primera temporada.
            </p>
          </AppCard>
        ) : (
          <div className="space-y-2">
            {seasonHistory.map(({ season, statistics: seasonStats }) => (
              <AppCard key={season.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black">{season.name}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-neutral-600">
                      {seasonStats.leader?.displayName ?? "Sin campeón calculado"}
                    </p>
                  </div>
                  <span className="shrink-0 text-lg font-black">
                    {seasonStats.leader?.points ?? 0} pts
                  </span>
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
