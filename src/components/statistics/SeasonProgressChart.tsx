"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import type { PlayerRoundProgress } from "@/lib/seasonStatistics"

type ChartMode = "position" | "points"

type PlayerSeries = {
  playerId: string
  displayName: string
  progress: PlayerRoundProgress[]
}

const WIDTH = 640
const HEIGHT = 270
const PADDING = { top: 24, right: 22, bottom: 42, left: 44 }

function buildPolyline({
  progress,
  rounds,
  mode,
  minValue,
  maxValue,
}: {
  progress: PlayerRoundProgress[]
  rounds: number[]
  mode: ChartMode
  minValue: number
  maxValue: number
}) {
  const valuesByRound = new Map(
    progress.map((row) => [row.round, mode === "position" ? row.position : row.points]),
  )
  const chartWidth = WIDTH - PADDING.left - PADDING.right
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom
  const range = Math.max(1, maxValue - minValue)

  return rounds
    .map((round, index) => {
      const value = valuesByRound.get(round)
      if (value === undefined) return null
      const x =
        PADDING.left +
        (rounds.length <= 1 ? chartWidth / 2 : (index / (rounds.length - 1)) * chartWidth)
      const normalized =
        mode === "position"
          ? (maxValue - value) / range
          : (value - minValue) / range
      const y = PADDING.top + (1 - normalized) * chartHeight
      return { round, value, x, y }
    })
    .filter((point): point is NonNullable<typeof point> => Boolean(point))
}

function formatPosition(value: number) {
  return `${value}º`
}

export function SeasonProgressChart({
  playerA,
  playerB,
}: {
  playerA: PlayerSeries | null
  playerB: PlayerSeries | null
}) {
  const [mode, setMode] = useState<ChartMode>("position")
  const chart = useMemo(() => {
    const allProgress = [playerA?.progress ?? [], playerB?.progress ?? []]
    const rounds = Array.from(
      new Set(allProgress.flatMap((progress) => progress.map((row) => row.round))),
    ).sort((a, b) => a - b)
    const values = allProgress.flatMap((progress) =>
      progress.map((row) => (mode === "position" ? row.position : row.points)),
    )
    const rawMin = values.length > 0 ? Math.min(...values) : 0
    const rawMax = values.length > 0 ? Math.max(...values) : 1
    const minValue = mode === "position" ? Math.max(1, rawMin) : 0
    const maxValue = Math.max(minValue + 1, rawMax)

    return {
      rounds,
      minValue,
      maxValue,
      pointsA: buildPolyline({
        progress: playerA?.progress ?? [],
        rounds,
        mode,
        minValue,
        maxValue,
      }),
      pointsB: buildPolyline({
        progress: playerB?.progress ?? [],
        rounds,
        mode,
        minValue,
        maxValue,
      }),
    }
  }, [mode, playerA, playerB])

  if (!playerA || !playerB || chart.rounds.length === 0) {
    return (
      <AppCard>
        <p className="font-black">Evolución comparada</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          Se necesitan resultados de varias jornadas para dibujar la evolución.
        </p>
      </AppCard>
    )
  }

  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4
    const y = PADDING.top + ratio * chartHeight
    const value =
      mode === "position"
        ? chart.minValue + ratio * (chart.maxValue - chart.minValue)
        : chart.maxValue - ratio * (chart.maxValue - chart.minValue)
    return { y, value }
  })

  return (
    <AppCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black">Evolución comparada</p>
          <p className="mt-0.5 text-xs font-semibold text-neutral-500">
            Posición y puntos acumulados después de cada jornada contabilizada.
          </p>
        </div>
        <div className="flex rounded-xl bg-neutral-100 p-1 text-xs font-black">
          <button
            type="button"
            onClick={() => setMode("position")}
            className={`rounded-lg px-3 py-1.5 transition ${
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
            className={`rounded-lg px-3 py-1.5 transition ${
              mode === "points"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500"
            }`}
          >
            Puntos
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
        <span className="flex items-center gap-1.5">
          <span className="statistics-chart-dot statistics-chart-series-a" />
          {playerA.displayName}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="statistics-chart-dot statistics-chart-dot-square statistics-chart-series-b" />
          {playerB.displayName}
        </span>
      </div>

      <div className="mt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="min-w-[560px] w-full"
          role="img"
          aria-label={`Evolución de ${playerA.displayName} y ${playerB.displayName} por ${
            mode === "position" ? "posición" : "puntos"
          }`}
        >
          {ticks.map((tick, index) => (
            <g key={index}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
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
                  : Math.round(tick.value)}
              </text>
            </g>
          ))}

          {chart.rounds.map((round, index) => {
            const chartWidth = WIDTH - PADDING.left - PADDING.right
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
                J{round}
              </text>
            )
          })}

          <polyline
            points={chart.pointsA.map((point) => `${point.x},${point.y}`).join(" ")}
            className="statistics-chart-line statistics-chart-series-a"
          />
          <polyline
            points={chart.pointsB.map((point) => `${point.x},${point.y}`).join(" ")}
            className="statistics-chart-line statistics-chart-series-b"
            strokeDasharray="10 7"
          />

          {chart.pointsA.map((point) => (
            <circle
              key={`a-${point.round}`}
              cx={point.x}
              cy={point.y}
              r="5"
              className="statistics-chart-point statistics-chart-series-a"
            >
              <title>
                {playerA.displayName} · J{point.round} · {point.value}
              </title>
            </circle>
          ))}
          {chart.pointsB.map((point) => (
            <rect
              key={`b-${point.round}`}
              x={point.x - 5}
              y={point.y - 5}
              width="10"
              height="10"
              rx="2"
              className="statistics-chart-point statistics-chart-series-b"
            >
              <title>
                {playerB.displayName} · J{point.round} · {point.value}
              </title>
            </rect>
          ))}
        </svg>
      </div>

      <div className="sr-only">
        {[playerA, playerB].map((player) => (
          <p key={player.playerId}>
            {player.displayName}: {player.progress.map((row) =>
              `jornada ${row.round}, ${row.position}ª posición, ${row.points} puntos`,
            ).join("; ")}
          </p>
        ))}
      </div>
    </AppCard>
  )
}
