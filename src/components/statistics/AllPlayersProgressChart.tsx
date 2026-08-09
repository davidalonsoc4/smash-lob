"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import type { PlayerRoundProgress } from "@/lib/seasonStatistics"

type ChartMode = "position" | "points" | "gamesDiff"

export type LeagueProgressSeries = {
  playerId: string
  displayName: string
  progress: PlayerRoundProgress[]
}

const SERIES_COLORS = [
  "var(--statistics-series-1)",
  "var(--statistics-series-2)",
  "var(--statistics-series-3)",
  "var(--statistics-series-4)",
  "var(--statistics-series-5)",
  "var(--statistics-series-6)",
  "var(--statistics-series-7)",
  "var(--statistics-series-8)",
  "var(--statistics-series-9)",
  "var(--statistics-series-10)",
  "var(--statistics-series-11)",
  "var(--statistics-series-12)",
]
const DASH_PATTERNS = ["", "10 6", "3 5", "14 5 3 5"]
const HEIGHT = 300
const PADDING = { top: 18, right: 18, bottom: 38, left: 42 }
const VISIBLE_ROUNDS_WITHOUT_SCROLL = 7

function getMarkerType(index: number) {
  return index % 3
}

function formatPosition(value: number) {
  return `${value}º`
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

export function AllPlayersProgressChart({
  series,
}: {
  series: LeagueProgressSeries[]
}) {
  const [mode, setMode] = useState<ChartMode>("position")
  const [hiddenPlayerIds, setHiddenPlayerIds] = useState<Set<string>>(
    () => new Set(),
  )

  const spansMultipleSeasons =
    new Set(
      series.flatMap((player) =>
        player.progress.map((row) => row.seasonId).filter(Boolean),
      ),
    ).size > 1

  const visibleSeries = useMemo(
    () => series.filter((player) => !hiddenPlayerIds.has(player.playerId)),
    [hiddenPlayerIds, series],
  )

  const chart = useMemo(() => {
    const rounds = Array.from(
      new Set(
        series.flatMap((player) => player.progress.map((row) => row.round)),
      ),
    ).sort((a, b) => a - b)
    const roundRows = new Map<number, PlayerRoundProgress>()
    series.forEach((player) => {
      player.progress.forEach((row) => {
        if (!roundRows.has(row.round)) roundRows.set(row.round, row)
      })
    })
    const width = Math.max(410, 86 + Math.max(1, rounds.length - 1) * 54)
    const values = visibleSeries.flatMap((player) =>
      player.progress.map((row) =>
        mode === "position"
          ? row.position
          : mode === "points"
            ? row.points
            : row.gamesDiff,
      ),
    )
    const rawMin = values.length > 0 ? Math.min(...values) : 0
    const rawMax = values.length > 0 ? Math.max(...values) : 1
    const minValue =
      mode === "position"
        ? Math.max(1, rawMin)
        : mode === "points"
          ? 0
          : Math.min(0, rawMin)
    const maxValue =
      mode === "position"
        ? Math.max(minValue, rawMax)
        : mode === "points"
          ? Math.max(minValue + 1, rawMax)
          : Math.max(minValue + 1, rawMax, 0)
    const range = Math.max(1, maxValue - minValue)
    const chartWidth = width - PADDING.left - PADDING.right
    const chartHeight = HEIGHT - PADDING.top - PADDING.bottom

    const playerSeries = visibleSeries.map((player) => {
      const rowsByRound = new Map<number, PlayerRoundProgress>(
        player.progress.map((row) => [row.round, row]),
      )
      const points = rounds
        .map((round, index) => {
          const row = rowsByRound.get(round)
          if (!row) return null
          const value =
            mode === "position"
              ? row.position
              : mode === "points"
                ? row.points
                : row.gamesDiff
          const x =
            PADDING.left +
            (rounds.length <= 1
              ? chartWidth / 2
              : (index / (rounds.length - 1)) * chartWidth)
          const normalized =
            mode === "position"
              ? maxValue === minValue
                ? 0.5
                : (maxValue - value) / range
              : (value - minValue) / range
          const y = PADDING.top + (1 - normalized) * chartHeight
          return { round, value, x, y, row }
        })
        .filter((point): point is NonNullable<typeof point> => Boolean(point))

      const originalIndex = series.findIndex(
        (candidate) => candidate.playerId === player.playerId,
      )

      const segments = points.reduce<(typeof points)[]>((all, point) => {
        const current = all.at(-1)
        const previousPoint = current?.at(-1)
        if (
          !current ||
          (previousPoint?.row.seasonId &&
            point.row.seasonId &&
            previousPoint.row.seasonId !== point.row.seasonId)
        ) {
          all.push([point])
        } else {
          current.push(point)
        }
        return all
      }, [])

      return {
        ...player,
        points,
        segments,
        color: SERIES_COLORS[originalIndex % SERIES_COLORS.length],
        dash: DASH_PATTERNS[originalIndex % DASH_PATTERNS.length],
        marker: getMarkerType(originalIndex),
      }
    })

    const seasonBoundaries = rounds
      .map((round, index) => {
        const previousRound = rounds[index - 1]
        const previousRow = roundRows.get(previousRound)
        const row = roundRows.get(round)
        if (
          index === 0 ||
          !previousRow?.seasonId ||
          !row?.seasonId ||
          previousRow.seasonId === row.seasonId
        ) {
          return null
        }
        const previousX =
          PADDING.left +
          ((index - 1) / Math.max(1, rounds.length - 1)) * chartWidth
        const currentX =
          PADDING.left +
          (index / Math.max(1, rounds.length - 1)) * chartWidth
        return (previousX + currentX) / 2
      })
      .filter((x): x is number => x !== null)

    return {
      rounds,
      roundRows,
      seasonBoundaries,
      width,
      minValue,
      maxValue,
      chartHeight,
      minWidthPercent: Math.max(
        100,
        (rounds.length / VISIBLE_ROUNDS_WITHOUT_SCROLL) * 100,
      ),
      playerSeries,
    }
  }, [mode, series, visibleSeries])

  if (series.length === 0 || chart.rounds.length === 0) {
    return (
      <AppCard>
        <p className="font-black">Todavía no hay evolución</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          Se necesitan resultados contabilizados en varias jornadas para
          representar la evolución.
        </p>
      </AppCard>
    )
  }

  const ticks =
    mode === "position"
      ? Array.from(
          { length: chart.maxValue - chart.minValue + 1 },
          (_, index) => {
            const value = chart.minValue + index
            const ratio =
              chart.maxValue === chart.minValue
                ? 0.5
                : (value - chart.minValue) / (chart.maxValue - chart.minValue)
            return {
              y: PADDING.top + ratio * chart.chartHeight,
              value,
            }
          },
        )
      : Array.from({ length: 5 }, (_, index) => {
          const ratio = index / 4
          return {
            y: PADDING.top + ratio * chart.chartHeight,
            value: chart.maxValue - ratio * (chart.maxValue - chart.minValue),
          }
        })

  const allPlayersVisible = visibleSeries.length === series.length
  const topThreePlayerIds = new Set(
    series.slice(0, 3).map((player) => player.playerId),
  )
  const topThreeVisible =
    visibleSeries.length === Math.min(3, series.length) &&
    visibleSeries.every((player) => topThreePlayerIds.has(player.playerId))

  function togglePlayer(playerId: string) {
    setHiddenPlayerIds((current) => {
      const next = new Set(current)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  return (
    <AppCard>
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-xl bg-neutral-100 p-1 type-caption font-black">
          <button
            type="button"
            onClick={() => setMode("position")}
            className={`rounded-lg px-2 py-1.5 transition ${
              mode === "position"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500"
            }`}
          >
            Posición
          </button>
          <button
            type="button"
            onClick={() => setMode("points")}
            className={`rounded-lg px-2 py-1.5 transition ${
              mode === "points"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500"
            }`}
          >
            Puntos
          </button>
          <button
            type="button"
            onClick={() => setMode("gamesDiff")}
            className={`rounded-lg px-2 py-1.5 transition ${
              mode === "gamesDiff"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500"
            }`}
          >
            Dif. juegos
          </button>
        </div>
        <div className="flex rounded-xl bg-neutral-100 p-1 type-caption font-black">
          <button
            type="button"
            onClick={() => setHiddenPlayerIds(new Set())}
            aria-pressed={allPlayersVisible}
            aria-label="Mostrar todos los jugadores"
            className={`rounded-lg px-2.5 py-1.5 transition ${
              allPlayersVisible
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() =>
              setHiddenPlayerIds(
                new Set(series.slice(3).map((player) => player.playerId)),
              )
            }
            aria-pressed={topThreeVisible}
            aria-label="Mostrar los tres primeros jugadores"
            className={`rounded-lg px-2.5 py-1.5 transition ${
              topThreeVisible
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500"
            }`}
          >
            Top 3
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="type-caption font-semibold text-neutral-500">
          Pulsa un jugador para mostrar u ocultar su línea.
          {spansMultipleSeasons
            ? " Las temporadas se separan y reinician sus métricas."
            : ""}
        </p>
        <span className="shrink-0 type-caption font-bold text-neutral-500">
          {visibleSeries.length}/{series.length} visibles
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {series.map((player, index) => {
          const hidden = hiddenPlayerIds.has(player.playerId)
          const color = SERIES_COLORS[index % SERIES_COLORS.length]
          return (
            <button
              key={player.playerId}
              type="button"
              onClick={() => togglePlayer(player.playerId)}
              aria-pressed={!hidden}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 type-caption font-black transition ${
                hidden
                  ? "border-neutral-200 bg-neutral-50 text-neutral-400"
                  : "border-neutral-200 bg-white text-neutral-800"
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 ${
                  getMarkerType(index) === 0
                    ? "rounded-full"
                    : getMarkerType(index) === 1
                      ? "rounded-[2px]"
                      : "rotate-45 rounded-[1px]"
                }`}
                style={{ backgroundColor: hidden ? "#a3a3a3" : color }}
              />
              {player.displayName}
            </button>
          )
        })}
      </div>

      {visibleSeries.length === 0 ? (
        <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center text-xs font-semibold text-neutral-500">
          Selecciona al menos un jugador para mostrar el gráfico.
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <svg
            viewBox={`0 0 ${chart.width} ${HEIGHT}`}
            className="w-full"
            style={{ minWidth: `${chart.minWidthPercent}%` }}
            role="img"
            aria-label={`Evolución de ${visibleSeries.length} jugadores por ${
              mode === "position"
                ? "posición"
                : mode === "points"
                  ? "puntos"
                  : "diferencia de juegos"
            }`}
          >
            {ticks.map((tick, index) => (
              <g key={index}>
                <line
                  x1={PADDING.left}
                  x2={chart.width - PADDING.right}
                  y1={tick.y}
                  y2={tick.y}
                  className="statistics-chart-grid"
                />
                <text
                  x={PADDING.left - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  className="statistics-chart-label"
                >
                  {mode === "position"
                    ? formatPosition(Math.max(1, Math.round(tick.value)))
                    : mode === "gamesDiff"
                      ? formatSigned(Math.round(tick.value))
                      : Math.round(tick.value)}
                </text>
              </g>
            ))}

            {chart.rounds.map((round, index) => {
              const chartWidth = chart.width - PADDING.left - PADDING.right
              const x =
                PADDING.left +
                (chart.rounds.length <= 1
                  ? chartWidth / 2
                  : (index / (chart.rounds.length - 1)) * chartWidth)
              return (
                <text
                  key={round}
                  x={x}
                  y={HEIGHT - 14}
                  textAnchor="middle"
                  className="statistics-chart-label"
                >
                  {chart.roundRows.get(round)?.shortLabel ?? `J${round}`}
                </text>
              )
            })}

            {chart.seasonBoundaries.map((x) => (
              <line
                key={`season-boundary-${x}`}
                x1={x}
                x2={x}
                y1={PADDING.top}
                y2={HEIGHT - PADDING.bottom}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 5"
                opacity="0.18"
              />
            ))}

            {chart.playerSeries.map((player) => (
              <g key={player.playerId}>
                {player.segments.map((segment, index) => (
                  <polyline
                    key={`segment-${index}`}
                    points={segment
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                    fill="none"
                    stroke={player.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={player.dash || undefined}
                  />
                ))}
                {player.points.map((point) => {
                  const roundLabel =
                    chart.roundRows.get(point.round)?.shortLabel ?? `J${point.round}`
                  const title = `${player.displayName} · ${roundLabel} · ${
                    mode === "position"
                      ? formatPosition(point.value)
                      : mode === "gamesDiff"
                        ? `${formatSigned(point.value)} juegos`
                        : `${point.value} puntos`
                  }`
                  if (player.marker === 1) {
                    return (
                      <rect
                        key={point.round}
                        x={point.x - 4.5}
                        y={point.y - 4.5}
                        width="9"
                        height="9"
                        rx="2"
                        fill={player.color}
                        stroke="var(--background)"
                        strokeWidth="2"
                      >
                        <title>{title}</title>
                      </rect>
                    )
                  }
                  if (player.marker === 2) {
                    return (
                      <rect
                        key={point.round}
                        x={point.x - 4}
                        y={point.y - 4}
                        width="8"
                        height="8"
                        rx="1"
                        transform={`rotate(45 ${point.x} ${point.y})`}
                        fill={player.color}
                        stroke="var(--background)"
                        strokeWidth="2"
                      >
                        <title>{title}</title>
                      </rect>
                    )
                  }
                  return (
                    <circle
                      key={point.round}
                      cx={point.x}
                      cy={point.y}
                      r="4.5"
                      fill={player.color}
                      stroke="var(--background)"
                      strokeWidth="2"
                    >
                      <title>{title}</title>
                    </circle>
                  )
                })}
              </g>
            ))}
          </svg>
        </div>
      )}

      <div className="sr-only">
        {visibleSeries.map((player) => (
          <p key={player.playerId}>
            {player.displayName}:{" "}
            {player.progress
              .map(
                (row) =>
                  `${row.label ?? `jornada ${row.round}`}, ${row.position}ª posición, ${row.points} puntos y ${formatSigned(row.gamesDiff)} de diferencia de juegos`,
              )
              .join("; ")}
          </p>
        ))}
      </div>
    </AppCard>
  )
}
