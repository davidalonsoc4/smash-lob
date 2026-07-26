"use client"

import { AppCard } from "@/components/ui/AppCard"
import type { RankingPlayer } from "@/lib/ranking"
import type {
  PlayerComparison,
  PlayerRecentForm,
} from "@/lib/seasonStatistics"

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

function RecentForm({ form }: { form: PlayerRecentForm }) {
  if (form.matches.length === 0) {
    return (
      <p className="text-[11px] font-semibold text-neutral-500">
        Sin partidos contabilizados
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {form.matches.map((match) => (
        <span
          key={match.matchId}
          title={`Jornada ${match.round} · Dif. ${formatSigned(match.gamesDiff)}`}
          className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-black ${
            match.outcome === "win"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-red-100 text-red-700"
          }`}
        >
          {match.outcome === "win" ? "V" : "D"}
        </span>
      ))}
      <span className="ml-1 text-[10px] font-bold text-neutral-500">
        {form.wins}V · {form.losses}D
        {form.currentStreakOutcome && form.currentStreak > 0
          ? ` · Racha ${form.currentStreak}${form.currentStreakOutcome === "win" ? "V" : "D"}`
          : ""}
      </span>
    </div>
  )
}

type PlayerComparisonPanelProps = {
  players: RankingPlayer[]
  playerAId: string
  playerBId: string
  comparison: PlayerComparison | null
  onPlayerAChange: (playerId: string) => void
  onPlayerBChange: (playerId: string) => void
}

export function PlayerComparisonPanel({
  players,
  playerAId,
  playerBId,
  comparison,
  onPlayerAChange,
  onPlayerBChange,
}: PlayerComparisonPanelProps) {
  if (players.length < 2) {
    return (
      <AppCard>
        <p className="font-black">Comparativa no disponible</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Se necesitan al menos dos jugadores en la temporada.
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
      <AppCard className="p-2.5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
          <label className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
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

          <span className="pb-2 text-[10px] font-black uppercase text-neutral-400">
            VS
          </span>

          <label className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
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
      </AppCard>

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
                <p className="truncate font-black">{player.displayName}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                  {position}º · {player.points} pts · {player.wins}V/{player.losses}D
                </p>
                <div className="mt-2">
                  <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-neutral-400">
                    Últimos partidos
                  </p>
                  <RecentForm form={form} />
                </div>
              </AppCard>
            ))}
          </div>

          <AppCard>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
              Como rivales
            </p>
            {comparison.rivalry.matchesPlayed > 0 ? (
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-neutral-50 px-2 py-2">
                  <p className="truncate text-[10px] font-bold text-neutral-500">
                    {comparison.playerA.displayName}
                  </p>
                  <p className="mt-0.5 text-xl font-black">
                    {comparison.rivalry.playerAWins}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-100 px-2 py-2">
                  <p className="text-[10px] font-bold text-neutral-500">Duelos</p>
                  <p className="mt-0.5 text-xl font-black">
                    {comparison.rivalry.matchesPlayed}
                  </p>
                  <p className="text-[9px] font-semibold text-neutral-500">
                    Dif. {formatSigned(comparison.rivalry.gamesDiffA)} para J1
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 px-2 py-2">
                  <p className="truncate text-[10px] font-bold text-neutral-500">
                    {comparison.playerB.displayName}
                  </p>
                  <p className="mt-0.5 text-xl font-black">
                    {comparison.rivalry.playerBWins}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                Todavía no se han enfrentado como rivales esta temporada.
              </p>
            )}
          </AppCard>

          <AppCard>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
                  Como pareja
                </p>
                <p className="mt-1 truncate text-sm font-black">
                  {comparison.playerA.displayName} / {comparison.playerB.displayName}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                  {comparison.partnership.matchesPlayed > 0
                    ? `${comparison.partnership.matchesPlayed} partidos · ${comparison.partnership.wins}V · ${comparison.partnership.losses}D · Dif. ${formatSigned(comparison.partnership.gamesDiff)}`
                    : "Todavía no han jugado juntos esta temporada"}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-black text-neutral-800">
                {comparison.partnership.matchesPlayed > 0
                  ? formatPercent(comparison.partnership.winRate)
                  : "—"}
              </span>
            </div>
          </AppCard>
        </>
      ) : null}
    </div>
  )
}
