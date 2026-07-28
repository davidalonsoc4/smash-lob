"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import type { PlayerRoundProgress } from "@/lib/seasonStatistics"

type ChartMode = "position" | "points" | "gamesDiff"

const HEIGHT = 286
const PADDING = { top: 22, right: 18, bottom: 46, left: 44 }
const VISIBLE_ROUNDS_WITHOUT_SCROLL = 7

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

function getMetricValue(row: PlayerRoundProgress, mode: ChartMode) {
  if (mode === "position") return row.position
  if (mode === "points") return row.points
  return row.gamesDiff
}

function getMetricLabel(mode: ChartMode, value: number) {
  if (mode === "position") return `${value}º`
  if (mode === "points") return `${value} puntos`
  return `${formatSigned(value)} juegos`
}

function getChangeLabel(
  mode: ChartMode,
  value: number,
  previousValue: number | undefined,
) {
  if (previousValue === undefined) return "Inicio del seguimiento"
  const rawChange = value - previousValue
  const change = mode === "position" ? -rawChange : rawChange
  if (change === 0) return "Sin cambio respecto a la jornada anterior"
  if (mode === "position") {
    return `${change > 0 ? "Sube" : "Baja"} ${Math.abs(change)} ${
      Math.abs(change) === 1 ? "posición" : "posiciones"
    }`
  }
  return `${change > 0 ? "+" : ""}${change} respecto a la jornada anterior`
}

export function PlayerProgressChart({
  displayName,
  progress,
}: {
  displayName: string
  progress: PlayerRoundProgress[]
}) {
  const [mode, setMode] = useState<ChartMode>("position")
  const spansMultipleSeasons =
    new Set(progress.map((row) => row.seasonId).filter(Boolean)).size > 1
  const chart = useMemo(() => {
    const values = progress.map((row) => getMetricValue(row, mode))
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
    const width = Math.max(410, 86 + Math.max(1, progress.length - 1) * 54)
    const chartWidth = width - PADDING.left - PADDING.right
    const chartHeight = HEIGHT - PADDING.top - PADDING.bottom
    const points = progress.map((row, index) => {
      const value = getMetricValue(row, mode)
      const x =
        PADDING.left +
        (progress.length <= 1
          ? chartWidth / 2
          : (index / (progress.length - 1)) * chartWidth)
      const normalized =
        mode === "position"
          ? maxValue === minValue
            ? 0.5
            : (maxValue - value) / range
          : (value - minValue) / range
      const y = PADDING.top + (1 - normalized) * chartHeight
      return {
        row,
        value,
        x,
        y,
        previousValue:
          index > 0 &&
          (!row.seasonId ||
            !progress[index - 1].seasonId ||
            progress[index - 1].seasonId === row.seasonId)
            ? getMetricValue(progress[index - 1], mode)
            : undefined,
      }
    })

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
    const seasonBoundaries = points
      .map((point, index) => {
        const previousPoint = points[index - 1]
        if (
          !previousPoint?.row.seasonId ||
          !point.row.seasonId ||
          previousPoint.row.seasonId === point.row.seasonId
        ) {
          return null
        }
        return (previousPoint.x + point.x) / 2
      })
      .filter((x): x is number => x !== null)

    return {
      width,
      chartHeight,
      minValue,
      maxValue,
      points,
      segments,
      seasonBoundaries,
      minWidthPercent: Math.max(
        100,
        (progress.length / VISIBLE_ROUNDS_WITHOUT_SCROLL) * 100,
      ),
    }
  }, [mode, progress])

  if (progress.length === 0) return null

  const ticks =
    mode === "position"
      ? Array.from(
          { length: chart.maxValue - chart.minValue + 1 },
          (_, index) => {
            const value = chart.minValue + index
            const ratio =
              chart.maxValue === chart.minValue
                ? 0.5
                : (value - chart.minValue) /
                  (chart.maxValue - chart.minValue)
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
            value:
              chart.maxValue - ratio * (chart.maxValue - chart.minValue),
          }
        })

  return (
    <AppCard>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-black">Evolución</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            Consulta cómo ha cambiado {displayName} después de cada jornada contabilizada.
            {spansMultipleSeasons
              ? " Cada temporada aparece separada y reinicia sus métricas."
              : ""}
          </p>
        </div>
        <div className="flex rounded-xl bg-neutral-100 p-1 text-[10px] font-black">
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
      </div>

      <p className="mt-2 text-[10px] font-semibold text-neutral-500">
        Pulsa o mantén el cursor sobre un punto para ver partido, resultado y cambio.
      </p>

      <div className="mt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${chart.width} ${HEIGHT}`}
          className="w-full"
          style={{ minWidth: `${chart.minWidthPercent}%` }}
          role="img"
          aria-label={`Evolución de ${displayName} por ${
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
                  ? `${Math.max(1, Math.round(tick.value))}º`
                  : mode === "gamesDiff"
                    ? formatSigned(Math.round(tick.value))
                    : Math.round(tick.value)}
              </text>
            </g>
          ))}

          {chart.points.map(({ row, x }) => (
            <text
              key={`label-${row.round}`}
              x={x}
              y={HEIGHT - 15}
              textAnchor="middle"
              className="statistics-chart-label"
            >
              {row.shortLabel ?? `J${row.round}`}
            </text>
          ))}

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

          {chart.segments.map((segment, index) => (
            <polyline
              key={`segment-${index}`}
              points={segment
                .map((point) => `${point.x},${point.y}`)
                .join(" ")}
              fill="none"
              stroke="var(--statistics-series-1)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {chart.points.map(({ row, value, x, y, previousValue }) => {
            const detail = [
              row.label ?? row.shortLabel ?? `Jornada ${row.round}`,
              getMetricLabel(mode, value),
              getChangeLabel(mode, value, previousValue),
              row.teammateNames ? `Compañero: ${row.teammateNames}` : null,
              row.opponentNames ? `Rivales: ${row.opponentNames}` : null,
              row.resultLabel
                ? `Resultado: ${row.outcome === "win" ? "Victoria" : "Derrota"} · ${row.resultLabel}`
                : null,
            ]
              .filter(Boolean)
              .join("\n")

            return (
              <circle
                key={`point-${row.round}`}
                cx={x}
                cy={y}
                r="5"
                fill="var(--statistics-series-1)"
                stroke="var(--background)"
                strokeWidth="2"
              >
                <title>{detail}</title>
              </circle>
            )
          })}
        </svg>
      </div>

      <div className="sr-only">
        {progress.map((row, index) => {
          const value = getMetricValue(row, mode)
          const previousValue =
            index > 0 &&
            (!row.seasonId ||
              !progress[index - 1].seasonId ||
              progress[index - 1].seasonId === row.seasonId)
              ? getMetricValue(progress[index - 1], mode)
              : undefined
          return (
            <p key={row.round}>
              {row.label ?? `Jornada ${row.round}`}: {getMetricLabel(mode, value)}. {getChangeLabel(mode, value, previousValue)}.
              {row.teammateNames ? ` Compañero: ${row.teammateNames}.` : ""}
              {row.opponentNames ? ` Rivales: ${row.opponentNames}.` : ""}
              {row.resultLabel ? ` Resultado: ${row.resultLabel}.` : ""}
            </p>
          )
        })}
      </div>
    </AppCard>
  )
}
