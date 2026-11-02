"use client"

import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { MvpResultPanel, AdjustedIndexHelp } from "./MvpResultPanel"
import {
  getCompletedRoundNumbers,
  getPlayersByIds,
  getRoundMvpSelection,
  getSeasonMvpSelection,
  type MvpMatch,
  type MvpPlayer,
  type MvpSystem,
  type MvpVote,
} from "@/lib/mvp"
import { useI18n } from "@/i18n/I18nProvider"

type DashboardMvpCardProps = {
  leagueId: string
  seasonId: string
  isSeasonClosed: boolean
  canManage: boolean
  players: MvpPlayer[]
  matches: MvpMatch[]
  votes: MvpVote[]
  mvpSystem: MvpSystem
}

function formatSignedDiff(value: number) {
  return `${value > 0 ? "+" : ""}${value} Dif.`
}

function formatPlayerNames(players: MvpPlayer[]) {
  return players.map((player) => player.displayName).join(" / ")
}

export function DashboardMvpCard({
  leagueId,
  seasonId,
  isSeasonClosed,
  canManage,
  players,
  matches,
  votes,
  mvpSystem,
}: DashboardMvpCardProps) {
  const { tx, locale } = useI18n()
  const completedRounds = getCompletedRoundNumbers(matches, leagueId, seasonId)
  const latestRoundWithMvp = [...completedRounds].reverse().find((round) =>
    Boolean(
      getRoundMvpSelection({
        votes,
        leagueId,
        seasonId,
        round,
        matches,
        mvpSystem,
      })
    )
  ) ?? null
  const latestRoundMvp = latestRoundWithMvp
    ? getRoundMvpSelection({
        votes,
        leagueId,
        seasonId,
        round: latestRoundWithMvp,
        matches,
        mvpSystem,
      })
    : null
  const seasonMvp = isSeasonClosed
    ? getSeasonMvpSelection({
        votes,
        leagueId,
        seasonId,
        matches,
        mvpSystem,
      })
    : null
  const latestRoundMvpPlayers = getPlayersByIds(
    players,
    latestRoundMvp?.playerIds ?? []
  )
  const seasonMvpPlayers = getPlayersByIds(players, seasonMvp?.playerIds ?? [])

  if (mvpSystem === "none" || (!latestRoundMvp && !seasonMvp)) {
    return null
  }

  const advancedRating = latestRoundMvp?.adjustedRating
  const advancedDetail = typeof advancedRating === "number"
    ? `${tx("Índice ajustado")} ${new Intl.NumberFormat(locale === "en" ? "en-GB" : locale === "eu" ? "eu-ES" : "es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(advancedRating * 100)}`
    : tx("Índice ajustado pendiente")
  const advanced = mvpSystem === "automatic_advanced"
  const roundDetail = latestRoundMvp ? <>{tx("Jornada")} {latestRoundWithMvp} · {mvpSystem === "voting"
    ? `${latestRoundMvp.votes} ${tx("votos")}${latestRoundMvp.tied ? ` · ${tx("empate")}` : ""}`
    : advanced
      ? <>{tx("Automático avanzado")} · {typeof advancedRating === "number" ? <AdjustedIndexHelp>{advancedDetail}</AdjustedIndexHelp> : advancedDetail}</>
      : `${tx("Automático")} · ${formatSignedDiff(latestRoundMvp.gamesDiff ?? 0)}`}</> : null

  const manageAction = canManage ? <Link href="/admin/mvp" className="inline-flex shrink-0 rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700 items-center justify-center text-center">{tx("Gestionar")}</Link> : null

  return (
    <section>
          {latestRoundMvp ? <MvpResultPanel title={`${tx("MVP de la jornada")}${advanced && latestRoundMvp.tied ? ` · ${tx("Empate técnico")}` : ""}`} players={latestRoundMvpPlayers} detail={roundDetail} action={manageAction} /> : seasonMvp ? <MvpResultPanel title={tx("MVP final")} players={seasonMvpPlayers} detail={`${seasonMvp.votes} ${tx("MVPs de jornada")}${seasonMvp.tied ? ` · ${tx("empate")}` : ""}`} action={manageAction} /> : null}
      {isSeasonClosed && seasonMvp && latestRoundMvp ? <AppCard className="mt-3 p-3"><p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-500">{tx("MVP final")}</p><p className="mt-1 truncate text-sm font-black text-neutral-950">{formatPlayerNames(seasonMvpPlayers)}</p><p className="text-xs font-semibold text-neutral-500">{seasonMvp.votes} {tx("jornadas")}{seasonMvp.tied ? ` · ${tx("empate")}` : ""}</p></AppCard> : null}
    </section>
  )
}
