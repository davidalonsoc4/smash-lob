"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { SeasonContextLine } from "@/components/layout/SeasonContextLine"
import { MatchDetailPairingPanel } from "@/components/match/MatchDetailPairingPanel"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { RoundSummaryShareButton } from "@/components/round/RoundSummaryShareButton"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useMvp } from "@/context/MvpProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { calculateSeasonRanking, type RankingPlayer } from "@/lib/ranking"
import {
  getMatchMvpSelection,
  getPlayersByIds,
  getRoundMvpSelection,
} from "@/lib/mvp"
import {
  buildRoundSummaryHighlights,
  getRoundRankingMovements,
  getRoundSummaryMetrics,
} from "@/lib/roundSummary"
import { formatShortDate } from "@/lib/rounds"
import type { RoundSummaryImageData } from "@/lib/roundSummaryImage"
import { getRoundStatusBadgeClassName } from "@/lib/statusStyles"

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

function getRoundStatusLabel(status: string) {
  if (status === "completed") return "Completada"
  if (status === "active") return "En curso"
  if (status === "overdue") return "Fuera de plazo"
  return "Próxima"
}

function teamName(playerIds: string[], players: RankingPlayer[]) {
  return playerIds
    .map((playerId) => players.find((player) => player.id === playerId)?.displayName ?? "Jugador")
    .join(" / ")
}

function teamPlayerNames(playerIds: string[], players: RankingPlayer[]) {
  return playerIds.map(
    (playerId) =>
      players.find((player) => player.id === playerId)?.displayName ?? "Jugador",
  )
}

function MvpPlayers({
  playerIds,
  players,
}: {
  playerIds: string[]
  players: RankingPlayer[]
}) {
  const selectedPlayers = getPlayersByIds(players, playerIds)

  if (selectedPlayers.length === 0) {
    return <p className="text-sm font-semibold text-neutral-500">Pendiente</p>
  }

  return (
    <div className="space-y-2">
      {selectedPlayers.map((player) => (
        <Link
          key={player.id}
          href={`/player/${player.slug ?? player.id}`}
          className="flex items-center gap-2 rounded-xl bg-neutral-50 px-2.5 py-2 transition active:bg-neutral-100"
        >
          <PlayerAvatar player={player} size="sm" />
          <p className="min-w-0 flex-1 truncate text-sm font-black text-neutral-950">
            {player.displayName}
          </p>
        </Link>
      ))}
    </div>
  )
}

export default function RoundSummaryPage() {
  const { t } = useI18n()
  const params = useParams<{ id: string }>()
  const round = Number(params.id)
  const { votes } = useMvp()
  const { playerProfiles, seasonPlayers } = useSeasonSettings()
  const {
    activeLeague,
    activeSeason,
    roundSettings,
    rounds,
    matches,
    players,
  } = useCurrentLeagueData()

  const roundData = rounds.find((item) => item.round === round) ?? null
  const roundMatches = matches
    .filter((match) => match.round === round)
    .sort((first, second) => first.id.localeCompare(second.id))
  const metrics = getRoundSummaryMetrics(roundMatches)
  const isCompleted = roundData?.status === "completed"

  const rankingThroughRound = calculateSeasonRanking({
    seasonId: activeSeason.id,
    playerProfiles,
    seasonPlayers,
    matches: matches.map((match) =>
      match.round <= round ? match : { ...match, resultCounts: false },
    ),
  })
  const rankingBeforeRound = calculateSeasonRanking({
    seasonId: activeSeason.id,
    playerProfiles,
    seasonPlayers,
    matches: matches.map((match) =>
      match.round < round ? match : { ...match, resultCounts: false },
    ),
  })
  const movementByPlayerId = new Map(
    getRoundRankingMovements({
      previousRanking: rankingBeforeRound,
      currentRanking: rankingThroughRound,
    }).map((movement) => [movement.playerId, movement]),
  )
  const highlights = isCompleted
    ? buildRoundSummaryHighlights({
        round,
        matches,
        roundMatches,
        previousRanking: rankingBeforeRound,
        currentRanking: rankingThroughRound,
      })
    : []

  const roundMvp =
    roundSettings.mvpSystem === "none" || roundSettings.mvpSystem === "voting"
      ? null
      : getRoundMvpSelection({
          votes,
          leagueId: activeLeague.id,
          seasonId: activeSeason.id,
          round,
          matches,
          mvpSystem: roundSettings.mvpSystem,
        })

  if (!Number.isFinite(round) || roundMatches.length === 0 || !roundData) {
    return (
      <div className="space-y-4">
        <header className="app-page-header">
          <BackButton fallbackHref="/matches" label="Volver" />
          <h1 className="type-page-title text-2xl font-black tracking-tight">
            Resumen de jornada
          </h1>
        </header>
        <AppCard>
          <p className="font-black text-neutral-950">Jornada no disponible</p>
          <p className="mt-1 text-sm font-semibold text-neutral-500">
            No hay partidos para esta jornada en la temporada activa.
          </p>
        </AppCard>
      </div>
    )
  }

  const statusLabel = getRoundStatusLabel(roundData.status)
  const statusSummary = isCompleted
    ? "Jornada completada"
    : roundData.status === "overdue"
      ? "Jornada fuera de plazo"
      : roundData.status === "upcoming"
        ? "Jornada pendiente"
        : "Jornada en curso"
  const seasonStatusLabel =
    activeSeason.status === "finished"
      ? t.common.finishedSeasonBadge
      : activeSeason.status === "upcoming"
        ? t.rounds.statusUpcoming
        : t.rounds.statusActive

  const imagePerson = (playerId: string) => {
    const player = players.find((item) => item.id === playerId)
    return {
      name: player?.displayName ?? "Jugador",
      avatarUrl: player?.avatarUrl ?? null,
      avatarInitials: player?.avatarInitials ?? null,
    }
  }
  const imageMvp: RoundSummaryImageData["mvp"] =
    roundSettings.mvpSystem === "none"
      ? null
      : roundSettings.mvpSystem === "voting"
        ? {
            title: "MVPs de los partidos",
            items: roundMatches.map((match) => {
              const selection = getMatchMvpSelection({ votes, match })
              return {
                label: `${teamName(match.teamA, players)} vs ${teamName(match.teamB, players)}`,
                players: selection ? selection.playerIds.map(imagePerson) : [],
                pendingText:
                  match.status === "finished"
                    ? "Pendiente de completar la votación"
                    : "Disponible al finalizar el partido",
              }
            }),
          }
        : {
            title: "MVP de jornada",
            items: [
              {
                players: roundMvp ? roundMvp.playerIds.map(imagePerson) : [],
                pendingText: isCompleted
                  ? "No hay MVP computable en esta jornada."
                  : "Se calculará al completar la jornada.",
                detail: roundMvp
                  ? roundSettings.mvpSystem === "automatic_advanced"
                    ? `Selección automática avanzada · ${formatSigned(roundMvp.gamesDiff ?? 0)} dif. juegos`
                    : `${roundMvp.setsFor ?? 0}-${roundMvp.setsAgainst ?? 0} sets · ${formatSigned(roundMvp.gamesDiff ?? 0)} dif. juegos`
                  : undefined,
              },
            ],
          }

  const roundSummaryImageData: RoundSummaryImageData = {
    leagueName: activeLeague.name,
    seasonName: activeSeason.name,
    leagueLogoUrl: activeLeague.logoUrl ?? null,
    round,
    statusSummary,
    statusLabel,
    dateRange:
      roundData.startsAt && roundData.endsAt
        ? `${formatShortDate(roundData.startsAt)} · ${formatShortDate(roundData.endsAt)}`
        : null,
    metrics: {
      finishedMatches: metrics.finishedMatches,
      totalMatches: metrics.totalMatches,
      totalSets: metrics.totalSets,
      totalGames: metrics.totalGames,
    },
    results: roundMatches.map((match) => ({
      teamA: teamPlayerNames(match.teamA, players),
      teamB: teamPlayerNames(match.teamB, players),
      pointsA: match.pointsA,
      pointsB: match.pointsB,
      sets: match.sets,
      statusLabel: match.status === "finished" ? "Finalizado" : "Pendiente",
    })),
    mvp: imageMvp,
    highlights: highlights.map((highlight) => {
      const highlightedMatch = highlight.matchId
        ? roundMatches.find((match) => match.id === highlight.matchId) ?? null
        : null
      const pointsA = highlightedMatch
        ? highlightedMatch.pointsA ?? highlightedMatch.sets.filter((set) => set.a > set.b).length
        : null
      const pointsB = highlightedMatch
        ? highlightedMatch.pointsB ?? highlightedMatch.sets.filter((set) => set.b > set.a).length
        : null

      return {
        eyebrow: highlight.eyebrow,
        title: highlight.title,
        leftLabel: highlight.comparison.leftLabel,
        leftValue: highlight.comparison.leftValue,
        centerValue: highlight.comparison.centerValue,
        rightLabel: highlight.comparison.rightLabel,
        rightValue: highlight.comparison.rightValue,
        teamA: highlightedMatch ? teamPlayerNames(highlightedMatch.teamA, players) : undefined,
        teamB: highlightedMatch ? teamPlayerNames(highlightedMatch.teamB, players) : undefined,
        score: highlightedMatch && pointsA !== null && pointsB !== null ? `${pointsA}–${pointsB}` : undefined,
      }
    }),
    highlightsPendingText: isCompleted
      ? "No hay un dato destacado adicional para esta jornada."
      : "Los destacados se calcularán cuando la jornada esté completada.",
    rankingTitle: isCompleted ? "Clasificación tras la jornada" : "Clasificación provisional",
    ranking: rankingThroughRound.map((player, index) => {
      const movement = movementByPlayerId.get(player.id)
      const movementLabel =
        round === 1 || !movement || movement.from === null || movement.delta === 0
          ? "—"
          : movement.delta > 0
            ? `▲${movement.delta}`
            : `▼${Math.abs(movement.delta)}`
      return {
        position: index + 1,
        name: player.displayName,
        avatarUrl: activeLeague.showRankingAvatars === false ? null : player.avatarUrl ?? null,
        avatarInitials: player.avatarInitials,
        movement: movementLabel,
        gamesDiff: player.gamesDiff,
        points: player.points,
      }
    }),
  }

  return (
    <div className="space-y-4">
      <header className="app-page-header">
        <BackButton fallbackHref="/matches" label="Volver" />
        <h1 className="type-page-title text-2xl font-black tracking-tight">
          Resumen · Jornada {round}
        </h1>
        <SeasonContextLine
          seasonName={activeSeason.name}
          statusLabel={seasonStatusLabel}
          className="mt-0.5"
        />
      </header>

      <AppCard accentStrip className="overflow-hidden !p-0">
        <div className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="type-panel-title font-black text-neutral-950">{statusSummary}</p>
              {roundData.startsAt && roundData.endsAt ? (
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  {formatShortDate(roundData.startsAt)} · {formatShortDate(roundData.endsAt)}
                </p>
              ) : null}
            </div>
            <span className={getRoundStatusBadgeClassName(roundData.status)}>{statusLabel}</span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-neutral-50 px-2 py-2.5 text-center">
              <p className="text-lg font-black leading-none text-neutral-950">
                {metrics.finishedMatches}/{metrics.totalMatches}
              </p>
              <p className="mt-1 type-caption font-bold text-neutral-500">Partidos</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-2 py-2.5 text-center">
              <p className="text-lg font-black leading-none text-neutral-950">{metrics.totalSets}</p>
              <p className="mt-1 type-caption font-bold text-neutral-500">Sets</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-2 py-2.5 text-center">
              <p className="text-lg font-black leading-none text-neutral-950">{metrics.totalGames}</p>
              <p className="mt-1 type-caption font-bold text-neutral-500">Juegos</p>
            </div>
          </div>
        </div>
      </AppCard>

      <section className="space-y-2.5">
        <h2 className="type-section-title">Resultados</h2>
        <div className="space-y-2.5">
          {roundMatches.map((match) => (
            <Link key={match.id} href={`/match/${match.id}`} className="block transition active:scale-[0.99]">
              <MatchDetailPairingPanel
                teamA={match.teamA}
                teamB={match.teamB}
                players={players}
                pointsA={match.pointsA}
                pointsB={match.pointsB}
                sets={match.sets}
                substitutions={match.substitutions}
                linkPlayers={false}
              />
            </Link>
          ))}
        </div>
      </section>

      {roundSettings.mvpSystem !== "none" ? (
        <section className="space-y-2.5">
          <h2 className="type-section-title">
            {roundSettings.mvpSystem === "voting" ? "MVPs de los partidos" : "MVP de jornada"}
          </h2>

          {roundSettings.mvpSystem === "voting" ? (
            <div className="space-y-2.5">
              {roundMatches.map((match) => {
                const selection = getMatchMvpSelection({ votes, match })
                return (
                  <AppCard key={match.id}>
                    <p className="type-caption font-black uppercase tracking-[0.12em] text-neutral-500">
                      {teamName(match.teamA, players)} vs {teamName(match.teamB, players)}
                    </p>
                    <div className="mt-2">
                      {selection ? (
                        <MvpPlayers playerIds={selection.playerIds} players={players} />
                      ) : (
                        <p className="rounded-xl bg-neutral-50 px-2.5 py-2 text-sm font-semibold text-neutral-500">
                          {match.status === "finished" ? "Pendiente de completar la votación" : "Disponible al finalizar el partido"}
                        </p>
                      )}
                    </div>
                  </AppCard>
                )
              })}
            </div>
          ) : (
            <AppCard>
              {roundMvp ? (
                <>
                  <MvpPlayers playerIds={roundMvp.playerIds} players={players} />
                  <p className="mt-2 type-caption font-semibold text-neutral-500">
                    {roundSettings.mvpSystem === "automatic_advanced"
                      ? `Selección automática avanzada · ${formatSigned(roundMvp.gamesDiff ?? 0)} dif. juegos`
                      : `${roundMvp.setsFor ?? 0}-${roundMvp.setsAgainst ?? 0} sets · ${formatSigned(roundMvp.gamesDiff ?? 0)} dif. juegos`}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-neutral-500">
                  {isCompleted ? "No hay MVP computable en esta jornada." : "Se calculará al completar la jornada."}
                </p>
              )}
            </AppCard>
          )}
        </section>
      ) : null}

      <section className="space-y-2.5">
        <h2 className="type-section-title">Lo más destacado</h2>
        {isCompleted ? (
          highlights.length > 0 ? (
            <div className="grid gap-2.5">
              {highlights.map((highlight) => {
                const highlightedMatch = highlight.matchId
                  ? roundMatches.find((match) => match.id === highlight.matchId) ?? null
                  : null

                const comparison = (
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 border-t border-neutral-100 pt-2">
                    <div className="min-w-0">
                      <p className="type-caption font-bold uppercase tracking-wide text-neutral-400">
                        {highlight.comparison.leftLabel}
                      </p>
                      <p className="mt-0.5 truncate text-sm font-black tabular-nums text-neutral-950">
                        {highlight.comparison.leftValue}
                      </p>
                    </div>
                    <span className="pb-0.5 type-caption font-black uppercase tracking-wide text-neutral-400">
                      {highlight.comparison.centerValue}
                    </span>
                    <div className="min-w-0 text-right">
                      <p className="type-caption font-bold uppercase tracking-wide text-neutral-400">
                        {highlight.comparison.rightLabel}
                      </p>
                      <p className="mt-0.5 truncate text-sm font-black tabular-nums text-neutral-950">
                        {highlight.comparison.rightValue}
                      </p>
                    </div>
                  </div>
                )

                if (highlightedMatch) {
                  const pointsA =
                    highlightedMatch.pointsA ??
                    highlightedMatch.sets.filter((set) => set.a > set.b).length
                  const pointsB =
                    highlightedMatch.pointsB ??
                    highlightedMatch.sets.filter((set) => set.b > set.a).length

                  return (
                    <Link
                      key={highlight.id}
                      href={`/match/${highlightedMatch.id}`}
                      className="block transition active:opacity-70"
                    >
                      <AppCard className="py-2.5">
                        <p className="type-caption font-black uppercase tracking-[0.12em] text-neutral-500">
                          {highlight.eyebrow}
                        </p>
                        <p className="mt-1 text-sm font-black text-neutral-950">{highlight.title}</p>
                        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                          <div className="min-w-0 space-y-0.5">
                            {teamPlayerNames(highlightedMatch.teamA, players).map((name, index) => (
                              <p key={`${highlightedMatch.id}-a-${index}`} className="truncate text-xs font-bold text-neutral-700">
                                {name}
                              </p>
                            ))}
                          </div>
                          <span className="rounded-full bg-neutral-950 px-2 py-1 text-xs font-black tabular-nums text-white">
                            {pointsA}–{pointsB}
                          </span>
                          <div className="min-w-0 space-y-0.5 text-right">
                            {teamPlayerNames(highlightedMatch.teamB, players).map((name, index) => (
                              <p key={`${highlightedMatch.id}-b-${index}`} className="truncate text-xs font-bold text-neutral-700">
                                {name}
                              </p>
                            ))}
                          </div>
                        </div>
                        {comparison}
                      </AppCard>
                    </Link>
                  )
                }

                return (
                  <AppCard key={highlight.id} className="py-2.5">
                    <p className="type-caption font-black uppercase tracking-[0.12em] text-neutral-500">
                      {highlight.eyebrow}
                    </p>
                    <div className="mt-1 flex min-w-0 items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-black text-neutral-950">
                        {highlight.title}
                      </p>
                      <p className="shrink-0 whitespace-nowrap text-sm font-black tabular-nums text-neutral-700">
                        {highlight.comparison.leftValue}
                        <span className="mx-1 text-neutral-400">{highlight.comparison.centerValue}</span>
                        {highlight.comparison.rightValue}
                      </p>
                    </div>
                  </AppCard>
                )
              })}
            </div>
          ) : (
            <AppCard>
              <p className="text-sm font-semibold text-neutral-500">
                No hay un dato destacado adicional para esta jornada.
              </p>
            </AppCard>
          )
        ) : (
          <AppCard className="bg-neutral-50/80">
            <p className="text-sm font-semibold text-neutral-500">
              Los destacados se calcularán cuando la jornada esté completada.
            </p>
          </AppCard>
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="type-section-title">
          {isCompleted ? "Clasificación tras la jornada" : "Clasificación provisional"}
        </h2>

        <AppCard accentStrip className="overflow-hidden !p-0">
          <div className="grid grid-cols-[2rem_minmax(0,1fr)_2.5rem_2.5rem_2.5rem] items-center gap-1 border-b border-neutral-100 px-3 py-2 type-caption font-black uppercase tracking-[0.1em] text-neutral-500">
            <span className="text-center">Pos</span>
            <span>Jugador</span>
            <span className="text-center">Mov</span>
            <span className="text-right">Dif</span>
            <span className="text-right">Pts</span>
          </div>
          <div>
            {rankingThroughRound.map((player, index) => {
              const movement = movementByPlayerId.get(player.id)
              const movementLabel =
                round === 1 || !movement || movement.from === null || movement.delta === 0
                  ? "—"
                  : movement.delta > 0
                    ? `▲${movement.delta}`
                    : `▼${Math.abs(movement.delta)}`
              const movementClass =
                movement?.delta && movement.delta > 0
                  ? "text-emerald-700"
                  : movement?.delta && movement.delta < 0
                    ? "text-red-600"
                    : "text-neutral-400"

              return (
                <Link
                  key={player.id}
                  href={`/player/${player.slug ?? player.id}`}
                  className="grid grid-cols-[2rem_minmax(0,1fr)_2.5rem_2.5rem_2.5rem] items-center gap-1 px-3 py-2 transition active:bg-neutral-50"
                >
                  <span className="text-center text-sm font-black tabular-nums text-neutral-700">
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 items-center gap-2">
                    {activeLeague.showRankingAvatars !== false ? (
                      <PlayerAvatar player={player} size="sm" />
                    ) : null}
                    <p className="min-w-0 truncate type-player-name text-neutral-950">
                      {player.displayName}
                    </p>
                  </div>
                  <span className={`text-center type-caption font-black ${movementClass}`}>
                    {movementLabel}
                  </span>
                  <span className="text-right text-sm font-black text-neutral-800">
                    {formatSigned(player.gamesDiff)}
                  </span>
                  <span className="text-right text-base font-black text-neutral-950">
                    {player.points}
                  </span>
                </Link>
              )
            })}
          </div>
        </AppCard>
      </section>

      <div className="pt-1">
        <RoundSummaryShareButton data={roundSummaryImageData} />
      </div>
    </div>
  )
}
