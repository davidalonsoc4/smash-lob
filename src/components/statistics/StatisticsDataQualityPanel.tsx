"use client"

import { AppCard } from "@/components/ui/AppCard"
import type { SeasonDataQuality } from "@/lib/seasonStatistics"
import { useI18n } from "@/i18n/I18nProvider"

function badgeClassName(tone: "ok" | "warning" | "error" | "neutral") {
  if (tone === "ok") return "bg-emerald-100 text-emerald-800"
  if (tone === "warning") return "bg-amber-100 text-amber-800"
  if (tone === "error") return "bg-red-100 text-red-800"
  return "bg-neutral-100 text-neutral-700"
}

export function StatisticsDataQualityPanel({
  quality,
  seasonStatus,
}: {
  quality: SeasonDataQuality
  seasonStatus: "upcoming" | "active" | "finished"
}) {
  const { tx } = useI18n()
  const issues = [
    quality.pendingMatches > 0
      ? {
          label: `${quality.pendingMatches} pendientes`,
          tone: "warning" as const,
        }
      : null,
    quality.excludedFinishedMatches > 0
      ? {
          label: `${quality.excludedFinishedMatches} excluidos`,
          tone: "neutral" as const,
        }
      : null,
    quality.invalidFinishedMatches > 0
      ? {
          label: tx(`${quality.invalidFinishedMatches} no válidos`),
          tone: "error" as const,
        }
      : null,
    quality.withdrawnPlayers > 0
      ? {
          label: `${quality.withdrawnPlayers} retirados`,
          tone: "neutral" as const,
        }
      : null,
    quality.replacementPlayers > 0
      ? {
          label: `${quality.replacementPlayers} movimientos de plantilla`,
          tone: "neutral" as const,
        }
      : null,
  ].filter((issue): issue is NonNullable<typeof issue> => Boolean(issue))

  const complete =
    seasonStatus === "finished" &&
    quality.pendingMatches === 0 &&
    quality.invalidFinishedMatches === 0

  return (
    <AppCard className="statistics-quality-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-panel-title">{tx("Estado de los datos")}</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            {complete
              ? tx("Temporada cerrada y estadísticas listas para su resumen final.")
              : seasonStatus === "finished"
                ? tx("La temporada está cerrada, pero conviene revisar los avisos antes de tomar los récords como definitivos.")
                : tx("Los datos se actualizarán a medida que se completen y validen los partidos.")}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 type-caption font-black uppercase tracking-wide ${badgeClassName(
            complete ? "ok" : seasonStatus === "finished" ? "warning" : "neutral",
          )}`}
        >
          {complete ? "Completo" : seasonStatus === "finished" ? "Revisar" : "En curso"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {issues.length > 0 ? (
          issues.map((issue) => (
            <span
              key={issue.label}
              className={`rounded-full px-2.5 py-1 type-caption font-black ${badgeClassName(issue.tone)}`}
            >
              {issue.label}
            </span>
          ))
        ) : (
          <span className={`rounded-full px-2.5 py-1 type-caption font-black ${badgeClassName("ok")}`}>
            {tx("Sin incidencias estadísticas")}{" "}</span>
        )}
      </div>

      {!quality.hasCountedResults ? (
        <p className="mt-2 text-xs font-semibold text-amber-700">
          {tx("Aún no hay resultados válidos para clasificación.")}{" "}</p>
      ) : null}
    </AppCard>
  )
}
