import { AppCard } from "@/components/ui/AppCard"
import type { MatchData } from "@/context/MatchDataProvider"
import type {
  PlayerSeasonDetail,
  SeasonRecords,
} from "@/lib/seasonStatistics"

function recordCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <AppCard>
      <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-1 truncate font-black">{value}</p>
      <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
        {detail}
      </p>
    </AppCard>
  )
}

export function SeasonRecordsPanel({
  records,
  getMatchLabel,
}: {
  records: SeasonRecords
  getMatchLabel: (match: MatchData | null) => string
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {recordCard({
        label: "Mejor racha",
        value: records.longestWinStreak?.displayName ?? "—",
        detail: records.longestWinStreak
          ? `${records.longestWinStreak.wins} victorias consecutivas`
          : "Sin resultados suficientes",
      })}
      {recordCard({
        label: "Mayor remontada",
        value: records.biggestComeback
          ? records.biggestComeback.winnerPlayerIds.length > 0
            ? `Déficit de ${records.biggestComeback.firstSetDeficit} juegos`
            : "—"
          : "—",
        detail: records.biggestComeback
          ? getMatchLabel(records.biggestComeback.match)
          : "Ningún ganador perdió el primer set",
      })}
      {recordCard({
        label: "Partido más igualado",
        value: records.closestMatch ? `Jornada ${records.closestMatch.round}` : "—",
        detail: getMatchLabel(records.closestMatch),
      })}
      {recordCard({
        label: "Victoria más amplia",
        value: records.biggestWin ? `Jornada ${records.biggestWin.round}` : "—",
        detail: getMatchLabel(records.biggestWin),
      })}
    </div>
  )
}

export function PlayerSeasonRecordsPanel({
  detail,
  getMatchLabel,
}: {
  detail: PlayerSeasonDetail
  getMatchLabel: (match: MatchData | null) => string
}) {
  const positionRange =
    detail.bestPosition !== null && detail.worstPosition !== null
      ? detail.bestPosition === detail.worstPosition
        ? `${detail.bestPosition}ª posición`
        : `${detail.bestPosition}ª–${detail.worstPosition}ª`
      : "—"

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {recordCard({
        label: "Posiciones de la temporada",
        value: positionRange,
        detail:
          detail.bestPosition !== null
            ? `Mejor ${detail.bestPosition}ª · peor ${detail.worstPosition}ª`
            : "Sin evolución calculable",
      })}
      {recordCard({
        label: "Mejor racha personal",
        value:
          detail.bestWinStreak > 0
            ? `${detail.bestWinStreak} victorias`
            : "—",
        detail: "Victorias consecutivas contabilizadas",
      })}
      {recordCard({
        label: "Rival más vencido",
        value: detail.mostBeatenOpponent?.displayName ?? "—",
        detail: detail.mostBeatenOpponent
          ? `${detail.mostBeatenOpponent.wins} victorias en ${detail.mostBeatenOpponent.matchesPlayed} duelos`
          : "Sin enfrentamientos",
      })}
      {recordCard({
        label: "Rival con más derrotas",
        value: detail.mostLostOpponent?.displayName ?? "—",
        detail: detail.mostLostOpponent
          ? `${detail.mostLostOpponent.losses} derrotas en ${detail.mostLostOpponent.matchesPlayed} duelos`
          : "Sin enfrentamientos",
      })}
      {recordCard({
        label: "Mayor victoria personal",
        value: detail.biggestWin ? `Jornada ${detail.biggestWin.round}` : "—",
        detail: getMatchLabel(detail.biggestWin),
      })}
      {recordCard({
        label: "Partido personal más igualado",
        value: detail.closestMatch ? `Jornada ${detail.closestMatch.round}` : "—",
        detail: getMatchLabel(detail.closestMatch),
      })}
      {detail.biggestComeback
        ? recordCard({
            label: "Mayor remontada personal",
            value: `Déficit de ${detail.biggestComeback.firstSetDeficit} juegos`,
            detail: getMatchLabel(detail.biggestComeback.match),
          })
        : null}
    </div>
  )
}
