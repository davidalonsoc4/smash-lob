"use client"

import { FloatingStatisticsSelector } from "@/components/statistics/FloatingStatisticsSelector"
import { AppCard } from "@/components/ui/AppCard"
import type { RankingPlayer } from "@/lib/ranking"
import type {
  PlayerComparison,
  PlayerComparisonOpponentPerformance,
  PlayerRecentForm,
} from "@/lib/seasonStatistics"

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function getWinRate(wins: number, matchesPlayed: number) {
  return matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0
}

function getCompactPlayerName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || displayName
}

function RecentForm({ form }: { form: PlayerRecentForm }) {
  if (form.matches.length === 0) {
    return (
      <p className="type-caption font-semibold text-neutral-500">
        Sin partidos contabilizados
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {form.matches.map((match) => (
        <span
          key={match.matchId}
          title={`${match.roundLabel ?? `J${match.round}`} · Dif. ${formatSigned(match.gamesDiff)}`}
          className={`grid h-6 w-6 place-items-center rounded-full type-caption font-black ${
            match.outcome === "win"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-red-100 text-red-700"
          }`}
        >
          {match.outcome === "win" ? "V" : "D"}
        </span>
      ))}
      <span className="ml-1 type-caption font-bold text-neutral-500">
        {form.wins}V · {form.losses}D
        {form.currentStreakOutcome && form.currentStreak > 0
          ? ` · Racha ${form.currentStreak}${form.currentStreakOutcome === "win" ? "V" : "D"}`
          : ""}
      </span>
    </div>
  )
}

function CommonOpponentSummary({
  playerName,
  performance,
}: {
  playerName: string
  performance: PlayerComparisonOpponentPerformance
}) {
  return (
    <div className="min-w-0 rounded-xl bg-neutral-50 px-3 py-2.5">
      <p className="type-player-name truncate">{playerName}</p>
      <p className="mt-1 text-lg font-black">
        {formatPercent(getWinRate(performance.wins, performance.matchesPlayed))}
      </p>
      <p className="type-caption font-semibold text-neutral-500">
        {performance.wins}V · {performance.losses}D · Dif. {formatSigned(performance.gamesDiff)}
      </p>
    </div>
  )
}

type PlayerComparisonPanelProps = {
  players: RankingPlayer[]
  playerAId: string
  playerBId: string
  comparison: PlayerComparison | null
  isLeagueWide?: boolean
  onPlayerAChange: (playerId: string) => void
  onPlayerBChange: (playerId: string) => void
}

export function PlayerComparisonPanel({
  players,
  playerAId,
  playerBId,
  comparison,
  isLeagueWide = false,
  onPlayerAChange,
  onPlayerBChange,
}: PlayerComparisonPanelProps) {
  if (players.length < 2) {
    return (
      <AppCard>
        <p className="font-black">Cara a cara no disponible</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Se necesitan al menos dos jugadores con estadísticas.
        </p>
      </AppCard>
    )
  }

  const playerAPosition = comparison
    ? players.findIndex((player) => player.id === comparison.playerA.id) + 1
    : 0
  const playerBPosition = comparison
    ? players.findIndex((player) => player.id === comparison.playerB.id) + 1
    : 0

  return (
    <div className="space-y-2">
      <FloatingStatisticsSelector>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
          <label className="min-w-0">
            <span className="type-caption font-black uppercase tracking-wide text-neutral-500">
              Jugador 1
            </span>
            <select
              value={playerAId}
              onChange={(event) => onPlayerAChange(event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-bold"
            >
              {players
                .filter((player) => player.id !== playerBId)
                .map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.displayName}
                  </option>
                ))}
            </select>
          </label>

          <span className="pb-2 type-caption font-black uppercase text-neutral-400">
            VS
          </span>

          <label className="min-w-0">
            <span className="type-caption font-black uppercase tracking-wide text-neutral-500">
              Jugador 2
            </span>
            <select
              value={playerBId}
              onChange={(event) => onPlayerBChange(event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-bold"
            >
              {players
                .filter((player) => player.id !== playerAId)
                .map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.displayName}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </FloatingStatisticsSelector>

      {comparison ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                player: comparison.playerA,
                position: playerAPosition,
                form: comparison.playerAForm,
              },
              {
                player: comparison.playerB,
                position: playerBPosition,
                form: comparison.playerBForm,
              },
            ].map(({ player, position, form }) => (
              <AppCard key={player.id} className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate font-black">{player.displayName}</p>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 type-caption font-black">
                    {position}º
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-center">
                  <div className="rounded-lg bg-neutral-50 px-1.5 py-2">
                    <p className="type-caption font-black uppercase text-neutral-400">Puntos</p>
                    <p className="mt-0.5 text-base font-black">{player.points}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 px-1.5 py-2">
                    <p className="type-caption font-black uppercase text-neutral-400">Victorias</p>
                    <p className="mt-0.5 text-base font-black">
                      {formatPercent(getWinRate(player.wins, player.matchesPlayed))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 px-1.5 py-2">
                    <p className="type-caption font-black uppercase text-neutral-400">Balance</p>
                    <p className="mt-0.5 text-sm font-black">{player.wins}V/{player.losses}D</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 px-1.5 py-2">
                    <p className="type-caption font-black uppercase text-neutral-400">Dif. juegos</p>
                    <p className="mt-0.5 text-sm font-black">{formatSigned(player.gamesDiff)}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="mb-1 type-caption font-black uppercase tracking-wide text-neutral-400">
                    Últimos partidos
                  </p>
                  <RecentForm form={form} />
                </div>
              </AppCard>
            ))}
          </div>

          <AppCard>
            <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-400">
              Enfrentamientos directos
            </p>
            {comparison.rivalry.matchesPlayed > 0 ? (
              <>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-neutral-50 px-2 py-2">
                    <p className="truncate type-caption font-bold text-neutral-500">
                      {comparison.playerA.displayName}
                    </p>
                    <p className="mt-0.5 text-xl font-black">
                      {comparison.rivalry.playerAWins}
                    </p>
                    <p className="type-caption font-semibold text-neutral-500">victorias</p>
                  </div>
                  <div className="rounded-xl bg-neutral-100 px-2 py-2">
                    <p className="type-caption font-bold text-neutral-500">Duelos</p>
                    <p className="mt-0.5 text-xl font-black">
                      {comparison.rivalry.matchesPlayed}
                    </p>
                    <p className="type-caption font-semibold text-neutral-500">
                      {isLeagueWide ? "en la liga" : "esta temporada"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 px-2 py-2">
                    <p className="truncate type-caption font-bold text-neutral-500">
                      {comparison.playerB.displayName}
                    </p>
                    <p className="mt-0.5 text-xl font-black">
                      {comparison.rivalry.playerBWins}
                    </p>
                    <p className="type-caption font-semibold text-neutral-500">victorias</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-neutral-100 px-3 py-2">
                    <p className="type-caption font-black uppercase text-neutral-400">Sets ganados</p>
                    <p className="mt-0.5 font-black">
                      {comparison.rivalry.playerASets} – {comparison.rivalry.playerBSets}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-100 px-3 py-2">
                    <p className="type-caption font-black uppercase text-neutral-400">Juegos ganados</p>
                    <p className="mt-0.5 font-black">
                      {comparison.rivalry.playerAGames} – {comparison.rivalry.playerBGames}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {isLeagueWide
                  ? "Todavía no se han enfrentado como rivales en ninguna temporada."
                  : "Todavía no se han enfrentado como rivales esta temporada."}
              </p>
            )}
          </AppCard>

          <AppCard>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-400">
                  Contra rivales comunes
                </p>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
                  Compara cómo rinde cada jugador frente a los mismos oponentes.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 type-caption font-black">
                {comparison.commonOpponents.rows.length} rivales
              </span>
            </div>

            {comparison.commonOpponents.rows.length > 0 ? (
              <>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <CommonOpponentSummary
                    playerName={comparison.playerA.displayName}
                    performance={comparison.commonOpponents.playerA}
                  />
                  <CommonOpponentSummary
                    playerName={comparison.playerB.displayName}
                    performance={comparison.commonOpponents.playerB}
                  />
                </div>
                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 px-3 type-caption font-black uppercase tracking-wide text-neutral-400">
                  <span>Rival</span>
                  <span
                    className="max-w-[72px] truncate text-right"
                    title={comparison.playerA.displayName}
                  >
                    {getCompactPlayerName(comparison.playerA.displayName)}
                  </span>
                  <span
                    className="min-w-[48px] max-w-[72px] truncate text-right"
                    title={comparison.playerB.displayName}
                  >
                    {getCompactPlayerName(comparison.playerB.displayName)}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1.5">
                  {comparison.commonOpponents.rows.map((opponent) => (
                    <div
                      key={opponent.playerId}
                      className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-xl border border-neutral-100 px-3 py-2"
                    >
                      <p className="min-w-0 truncate text-xs font-black">
                        {opponent.displayName}
                      </p>
                      <div className="text-right">
                        <p className="type-caption font-black">
                          {opponent.playerA.wins}V/{opponent.playerA.losses}D
                        </p>
                        <p className="type-caption font-semibold text-neutral-500">
                          {formatSigned(opponent.playerA.gamesDiff)} juegos
                        </p>
                      </div>
                      <div className="min-w-[48px] text-right">
                        <p className="type-caption font-black">
                          {opponent.playerB.wins}V/{opponent.playerB.losses}D
                        </p>
                        <p className="type-caption font-semibold text-neutral-500">
                          {formatSigned(opponent.playerB.gamesDiff)} juegos
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
                Aún no hay suficientes enfrentamientos contra los mismos rivales para comparar este apartado.
              </p>
            )}
          </AppCard>
        </>
      ) : null}
    </div>
  )
}
