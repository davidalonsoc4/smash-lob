"use client"

import { AppCard } from "@/components/ui/AppCard"
import type {
  PlayerSeasonDetail,
  SeasonRecords,
} from "@/lib/seasonStatistics"
import {
  formatFriendlyMatchLine,
  formatGamesDifference,
  getFriendlyMatchSummary,
} from "@/lib/statisticsPresentation"
import { useI18n } from "@/i18n/I18nProvider"

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

function RecordCard({
  eyebrow,
  headline,
  description,
  matchLine,
}: {
  eyebrow: string
  headline: string
  description: string
  matchLine?: string
}) {
  return (
    <AppCard className="min-w-0">
      <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-400">
        {eyebrow}
      </p>
      <p className="mt-1 text-base font-black leading-5">{headline}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
        {description}
      </p>
      {matchLine ? (
        <p className="mt-2 rounded-lg bg-neutral-50 px-2.5 py-2 type-caption font-bold leading-4 text-neutral-500">
          {matchLine}
        </p>
      ) : null}
    </AppCard>
  )
}

export function SeasonRecordsPanel({
  records,
  playersById,
  isLeagueWide = false,
}: {
  records: SeasonRecords
  playersById: Map<string, string>
  isLeagueWide?: boolean
}) {
  const { tx } = useI18n()
  const comeback = records.biggestComeback
    ? getFriendlyMatchSummary(records.biggestComeback.match, playersById)
    : null
  const closest = records.closestMatch
    ? getFriendlyMatchSummary(records.closestMatch, playersById)
    : null
  const biggestWin = records.biggestWin
    ? getFriendlyMatchSummary(records.biggestWin, playersById)
    : null

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 type-caption font-black uppercase tracking-[0.2em] text-neutral-400">
          {tx("Récord individual")}{" "}</p>
        <RecordCard
          eyebrow={tx("Mejor racha de victorias")}
          headline={records.longestWinStreak?.displayName ?? tx("Todavía sin récord")}
          description={
            records.longestWinStreak
              ? tx(`${records.longestWinStreak.wins} victorias consecutivas sin perder.`)
              : tx("La racha aparecerá cuando se contabilicen victorias consecutivas.")
          }
        />
      </div>

      <div>
        <p className="mb-2 type-caption font-black uppercase tracking-[0.2em] text-neutral-400">
          {isLeagueWide
            ? tx("Partidos que marcaron la liga")
            : tx("Partidos que marcaron la temporada")}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <RecordCard
            eyebrow="Mayor remontada"
            headline={
              comeback && records.biggestComeback
                ? tx(`${comeback.winnerNames} remontaron el partido`)
                : tx("No hubo remontadas")
            }
            description={
              comeback && records.biggestComeback
                ? tx(`Ganaron después de perder el primer set por ${records.biggestComeback.firstSetDeficit} ${records.biggestComeback.firstSetDeficit === 1 ? "juego" : "juegos"}.`)
                : tx("Ningún ganador tuvo que levantar un primer set perdido.")
            }
            matchLine={comeback ? formatFriendlyMatchLine(comeback) : undefined}
          />
          <RecordCard
            eyebrow={tx("Partido más igualado")}
            headline={
              closest
                ? formatGamesDifference(closest.gamesMargin)
                : tx("Sin partido destacado")
            }
            description={
              closest
                ? tx(`${closest.winnerNames} se llevaron el duelo con el margen total más pequeño.`)
                : tx("Se necesita al menos un resultado válido.")
            }
            matchLine={closest ? formatFriendlyMatchLine(closest) : undefined}
          />
          <RecordCard
            eyebrow={tx("Victoria más contundente")}
            headline={
              biggestWin
                ? tx(`${biggestWin.winnerNames} ganaron por ${biggestWin.gamesMargin} ${biggestWin.gamesMargin === 1 ? "juego" : "juegos"}`)
                : tx("Sin victoria destacada")
            }
            description={
              biggestWin
                ? tx(`Fue el resultado con mayor diferencia total de juegos ${isLeagueWide ? "de la liga" : "de la temporada"}.`)
                : tx("Se necesita al menos un resultado válido.")
            }
            matchLine={biggestWin ? formatFriendlyMatchLine(biggestWin) : undefined}
          />
        </div>
      </div>
    </div>
  )
}

export function PlayerSeasonRecordsPanel({
  detail,
  playersById,
  isLeagueWide = false,
}: {
  detail: PlayerSeasonDetail
  playersById: Map<string, string>
  isLeagueWide?: boolean
}) {
  const { tx } = useI18n()
  const positionRange =
    detail.bestPosition !== null && detail.worstPosition !== null
      ? detail.bestPosition === detail.worstPosition
        ? tx(`${detail.bestPosition}ª posición`)
        : `${detail.bestPosition}ª–${detail.worstPosition}ª`
      : "—"
  const biggestWin = detail.biggestWin
    ? getFriendlyMatchSummary(detail.biggestWin, playersById)
    : null
  const closest = detail.closestMatch
    ? getFriendlyMatchSummary(detail.closestMatch, playersById)
    : null
  const comeback = detail.biggestComeback
    ? getFriendlyMatchSummary(detail.biggestComeback.match, playersById)
    : null

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <RecordCard
        eyebrow={isLeagueWide ? tx("Posiciones históricas") : tx("Posiciones de la temporada")}
        headline={positionRange}
        description={
          detail.bestPosition !== null
            ? `Mejor puesto: ${detail.bestPosition}ª · peor puesto: ${detail.worstPosition}ª.`
            : tx("Todavía no hay evolución suficiente para calcularlo.")
        }
      />
      <RecordCard
        eyebrow="Mejor racha personal"
        headline={
          detail.bestWinStreak > 0
            ? `${detail.bestWinStreak} victorias seguidas`
            : tx("Sin racha de victorias")
        }
        description={tx(`Mayor número de triunfos consecutivos ${isLeagueWide ? "en una misma temporada" : "durante la temporada"}.`)}
      />
      <RecordCard
        eyebrow={tx("Rival más vencido")}
        headline={detail.mostBeatenOpponent?.displayName ?? tx("Sin datos")}
        description={
          detail.mostBeatenOpponent
            ? tx(`${detail.mostBeatenOpponent.wins} victorias en ${detail.mostBeatenOpponent.matchesPlayed} enfrentamientos · Dif. ${formatSigned(detail.mostBeatenOpponent.gamesDiff)} juegos.`)
            : tx("Todavía no ha ganado a ningún rival.")
        }
      />
      <RecordCard
        eyebrow={tx("Rival que más le ganó")}
        headline={detail.mostLostOpponent?.displayName ?? tx("Sin datos")}
        description={
          detail.mostLostOpponent
            ? tx(`${detail.mostLostOpponent.losses} derrotas en ${detail.mostLostOpponent.matchesPlayed} enfrentamientos.`)
            : tx("Todavía no ha perdido contra ningún rival.")
        }
      />
      <RecordCard
        eyebrow={tx("Mayor victoria personal")}
        headline={
          biggestWin
            ? tx(`Victoria por ${biggestWin.gamesMargin} ${biggestWin.gamesMargin === 1 ? "juego" : "juegos"}`)
            : tx("Sin victoria destacada")
        }
        description={
          biggestWin
            ? tx(`${biggestWin.winnerNames} firmaron su triunfo más amplio.`)
            : tx("No hay resultados suficientes.")
        }
        matchLine={biggestWin ? formatFriendlyMatchLine(biggestWin) : undefined}
      />
      <RecordCard
        eyebrow={tx("Partido personal más igualado")}
        headline={
          closest
            ? formatGamesDifference(closest.gamesMargin)
            : tx("Sin partido destacado")
        }
        description={tx("El encuentro con el margen total de juegos más pequeño.")}
        matchLine={closest ? formatFriendlyMatchLine(closest) : undefined}
      />
      {detail.biggestComeback ? (
        <RecordCard
          eyebrow="Mayor remontada personal"
          headline={tx(`Remontada desde -${detail.biggestComeback.firstSetDeficit} juegos`)}
          description={tx("Terminó ganando después de perder el primer set.")}
          matchLine={comeback ? formatFriendlyMatchLine(comeback) : undefined}
        />
      ) : null}
    </div>
  )
}
