"use client"

import Link from "next/link"
import { Fragment, type ReactNode } from "react"
import { SetGameScore } from "@/components/matches/SetGameScore"
import type { PlayerProfile } from "@/data/fakeData"
import { getPlayerById, getPlayerDisplayName } from "@/lib/players"
import { getPreferredPlayerSideLabel, getDominantHandLabel } from "@/lib/accountProfile"
import type { MatchSubstitution } from "@/lib/substitutes"
import { getMatchSubstituteLabels } from "@/lib/substitutes"
import { useI18n } from "@/i18n/I18nProvider"
import { StatusHelp } from "@/components/ui/StatusHelp"
import { FitText } from "@/components/ui/FitText"
import { recommendPairSides, type RecommendedSide, type SideStatistics } from "@/lib/matchSideRecommendations"

type MatchDetailPairingPanelProps = {
  teamA: string[]
  teamB: string[]
  players?: PlayerProfile[]
  pointsA?: number | null
  pointsB?: number | null
  sets?: { a: number; b: number }[]
  substitutions?: MatchSubstitution[]
  highlightedPlayerIds?: string[]
  rankingPositions?: Record<string, number | null | undefined>
  sideStatistics?: Record<string, SideStatistics>
  linkPlayers?: boolean
  showPlayerMetadata?: boolean
  showPendingPlayerMetadata?: boolean
  showFinishedPlayerMetadata?: boolean
  showPositionHelp?: boolean
}

function DetailPlayer({
  playerId,
  players,
  position,
  highlighted,
  substituteLabel,
  linkPlayers,
  alignment,
  metadataPlacement,
  showMetadata,
  showRankingPosition,
  recommendedSide,
}: {
  playerId: string
  players?: PlayerProfile[]
  position?: number | null
  highlighted: boolean
  substituteLabel?: string
  linkPlayers: boolean
  alignment: "left" | "right"
  metadataPlacement: "before-name" | "after-name"
  showMetadata: boolean
  showRankingPosition: boolean
  recommendedSide?: RecommendedSide | null
}) {
  const { tx } = useI18n()
  const player = getPlayerById(playerId, players)
  const displayName = getPlayerDisplayName(playerId, players)
  const name = (
    <span className="flex min-w-0 items-center gap-1" title={displayName}>
      <FitText noWrap minFontSize={10} className="app-match-player-name min-w-0 flex-1 truncate whitespace-nowrap type-player-name-prominent text-neutral-950">{displayName}</FitText>
      {highlighted ? (
        <span className="ml-1 text-yellow-500" aria-label={tx("MVP de jornada")} title={tx("MVP de jornada")}>
          ★
        </span>
      ) : null}
    </span>
  )
  const changedSide = Boolean(recommendedSide && player?.preferredSide && player.preferredSide !== "versatile" && recommendedSide !== player.preferredSide)
  const sideLabel = getPreferredPlayerSideLabel(recommendedSide ?? player?.preferredSide)
  const handLabel = getDominantHandLabel(player?.dominantHand)
  const playerPositionLabel = [sideLabel, handLabel].filter((label): label is string => Boolean(label)).map(label => tx(label)).join(" · ")
  const metadataClass = `min-h-4 type-micro font-medium leading-4 tracking-normal text-neutral-500 ${
    alignment === "right" ? "text-right" : "text-left"
  }`
  const metadataText = [showRankingPosition && position ? `#${position}` : null, playerPositionLabel].filter(Boolean).join(" · ")
  const metadataLine = <p className={`${metadataClass} truncate`} title={metadataText}>
    {showRankingPosition && position ? <>#{position}{sideLabel || handLabel ? " · " : ""}</> : null}
    {sideLabel ? changedSide ? (
      <MatchSideHelp className="inline align-baseline font-semibold text-red-700" label={`${tx("Lado recomendado")}: ${tx(sideLabel)}. ${tx("Preferencia")}: ${tx(getPreferredPlayerSideLabel(player?.preferredSide) ?? "")}`}>
        <span data-recommended-side={recommendedSide ?? undefined} className="inline-flex items-baseline gap-0.5 align-baseline"><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="relative top-[3px] h-3 w-3 shrink-0 align-baseline"><path d="M3 10h14M7 6l-4 4 4 4m6-8 4 4-4 4" /></svg>{tx(sideLabel)}</span>
      </MatchSideHelp>
    ) : <span data-recommended-side={recommendedSide ?? undefined}>{tx(sideLabel)}</span> : null}
    {handLabel ? <>{sideLabel ? " · " : ""}{tx(handLabel)}</> : null}
    {!metadataText ? "\u00a0" : null}
  </p>
  const nameLine = (
    <div className={`flex min-w-0 items-center gap-1.5 ${alignment === "right" ? "flex-row-reverse" : ""}`}>
      <div className="min-w-0 flex-1 overflow-hidden">
      {linkPlayers && player ? (
        <Link
          href={`/player/${player.slug}`}
          className={`block min-w-0 underline-offset-4 active:underline ${
            alignment === "right" ? "text-right" : "text-left"
          }`}
        >
          {name}
        </Link>
      ) : (
        name
      )}
      </div>
    </div>
  )

  return (
    <div className={`min-w-0 ${alignment === "right" ? "text-right" : "text-left"}`}>
      {showMetadata ? (
        <div className="space-y-0.5">
          {metadataPlacement === "before-name" ? (
            <>
              {metadataLine}
              {nameLine}
            </>
          ) : (
            <>
              {nameLine}
              {metadataLine}
            </>
          )}
        </div>
      ) : (
        nameLine
      )}

      {substituteLabel ? (
        <p
          className={`mt-1 type-caption font-bold leading-3 text-red-700 ${
            alignment === "right" ? "text-right" : "text-left"
          }`}
        >
          {tx("Suplente · por")}{" "}{substituteLabel}
        </p>
      ) : null}
    </div>
  )
}

function PairDetails({
  playerIds,
  players,
  positions,
  highlightedPlayerIds,
  substituteLabels,
  linkPlayers,
  alignment,
  showMetadata,
  showRankingPosition,
  recommendSides,
  statistics,
}: {
  playerIds: string[]
  players?: PlayerProfile[]
  positions: Record<string, number | null | undefined>
  highlightedPlayerIds: string[]
  substituteLabels: Record<string, string>
  linkPlayers: boolean
  alignment: "left" | "right"
  showMetadata: boolean
  showRankingPosition: boolean
  recommendSides: boolean
  statistics: Record<string, SideStatistics>
}) {
  const recommendations = recommendSides ? recommendPairSides(playerIds.map(playerId => ({ preferredSide: getPlayerById(playerId, players)?.preferredSide, rankingPosition: positions[playerId], statistics: statistics[playerId] }))) : [null, null]
  const displayPlayers = playerIds.map((playerId, index) => ({ playerId, recommendedSide: recommendations[index] }))
  if (recommendSides && recommendations[0] && recommendations[1] && recommendations[0] !== recommendations[1]) {
    const topSide = alignment === "left" ? "reves" : "drive"
    if (displayPlayers[0].recommendedSide !== topSide) displayPlayers.reverse()
  }
  return (
    <div
      className={`app-match-pair-surface rounded-xl border border-neutral-200 bg-white px-3 py-4 ${
        alignment === "right" ? "text-right" : "text-left"
      }`}
    >
      {displayPlayers.map(({ playerId, recommendedSide }, index) => (
        <div key={playerId} className={index === 0 ? "pb-1.5" : "pt-1"}>
          {index > 0 ? (
            <div
              className={`mb-1.5 border-t border-neutral-300 ${
                alignment === "right" ? "ml-4" : "mr-4"
              }`}
            />
          ) : null}

          <DetailPlayer
            playerId={playerId}
            players={players}
            position={positions[playerId]}
            highlighted={highlightedPlayerIds.includes(playerId)}
            substituteLabel={substituteLabels[playerId]}
            linkPlayers={linkPlayers}
            alignment={alignment}
            metadataPlacement="after-name"
            showMetadata={showMetadata}
            showRankingPosition={showRankingPosition}
            recommendedSide={recommendedSide}
          />
        </div>
      ))}
    </div>
  )
}

function FinishedPlayerName({
  playerId,
  players,
  highlighted,
  substituteLabel,
  linkPlayers,
  showPlayerMetadata,
}: {
  playerId: string
  players?: PlayerProfile[]
  highlighted: boolean
  substituteLabel?: string
  linkPlayers: boolean
  showPlayerMetadata: boolean
}) {
  const { tx } = useI18n()
  const player = getPlayerById(playerId, players)
  const displayName = getPlayerDisplayName(playerId, players)
  const playerPositionLabel = [getPreferredPlayerSideLabel(player?.preferredSide), getDominantHandLabel(player?.dominantHand)].filter((label): label is string => Boolean(label)).map(label => tx(label)).join(" · ")
  const name = (
    <span className="flex min-w-0 items-center gap-1" title={displayName}>
      <FitText noWrap minFontSize={10} className="app-match-player-name min-w-0 flex-1 truncate whitespace-nowrap type-player-name-prominent text-neutral-950">{displayName}</FitText>
      {highlighted ? (
        <span className="ml-1 text-yellow-500" aria-label={tx("MVP de jornada")} title={tx("MVP de jornada")}>
          ★
        </span>
      ) : null}
    </span>
  )

  return (
    <div className="min-w-0 text-left">
      <div className="min-w-0 overflow-hidden">
        {linkPlayers && player ? (
          <Link
            href={`/player/${player.slug}`}
            className="block min-w-0 text-left underline-offset-4 active:underline"
          >
            {name}
          </Link>
        ) : (
          name
        )}
      </div>

      {showPlayerMetadata && playerPositionLabel ? (
        <p title={playerPositionLabel} className="mt-0.5 truncate type-micro font-medium leading-4 tracking-normal text-neutral-500">
          {playerPositionLabel}
        </p>
      ) : null}

      {substituteLabel ? (
        <p className="mt-1 type-caption font-bold leading-3 text-red-700">
          {tx("Suplente · por")}{" "}{substituteLabel}
        </p>
      ) : null}
    </div>
  )
}

function FinishedPairRow({
  side,
  playerIds,
  players,
  points,
  sets,
  highlightedPlayerIds,
  substituteLabels,
  linkPlayers,
  showPlayerMetadata,
  won,
}: {
  side: "a" | "b"
  playerIds: string[]
  players?: PlayerProfile[]
  points?: number | null
  sets: { a: number; b: number }[]
  highlightedPlayerIds: string[]
  substituteLabels: Record<string, string>
  linkPlayers: boolean
  showPlayerMetadata: boolean
  won: boolean
}) {
  const { tx } = useI18n()
  return (
    <div className="app-match-result-row col-span-full grid items-center gap-x-1 py-2" style={{ gridTemplateColumns: "subgrid" }} data-winner={won || undefined} aria-label={won ? tx("Ganadores:") : undefined}>
        <div className="app-match-result-names relative grid min-w-0 text-left" style={{ gridTemplateRows: playerIds.map(() => "minmax(0,1fr)").join(" 1px ") }}>
          {playerIds.map((playerId, index) => (
            <Fragment key={playerId}>
              {index > 0 ? (
                <div className="app-match-result-divider relative mr-2 h-px">
                  <span aria-hidden="true" className={`absolute inset-y-0 left-0 border-t border-neutral-300 ${won ? "right-5" : "right-0"}`} />
                  {won ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="app-match-winner-trophy absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2">
                      <path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v5m-4 3h8m-7-3h6v3H9z" />
                    </svg>
                  ) : null}
                </div>
              ) : null}
              <div className={index === 0 ? "flex items-end pb-2" : "flex items-start pt-2"}>
              <FinishedPlayerName
                playerId={playerId}
                players={players}
                highlighted={highlightedPlayerIds.includes(playerId)}
                substituteLabel={substituteLabels[playerId]}
                linkPlayers={linkPlayers}
                showPlayerMetadata={showPlayerMetadata}
              />
              </div>
            </Fragment>
          ))}
        </div>
          {sets.map((set, index) => {
            const ownScore = side === "a" ? set.a : set.b
            const rivalScore = side === "a" ? set.b : set.a
            return (
              <div key={index} className="app-match-result-set flex items-center justify-center">
                <SetGameScore value={ownScore} won={ownScore > rivalScore} />
              </div>
            )
          })}
          {points !== null && points !== undefined ? (
            <div className="flex items-center justify-center text-neutral-950">
              <span className="app-match-result-total relative text-3xl font-black leading-none tabular-nums">
                {points}
              </span>
            </div>
          ) : null}
    </div>
  )
}

export function MatchDetailPairingPanel({
  teamA,
  teamB,
  players,
  pointsA = null,
  pointsB = null,
  sets = [],
  substitutions = [],
  highlightedPlayerIds = [],
  rankingPositions = {},
  sideStatistics = {},
  linkPlayers = true,
  showPlayerMetadata = false,
  showPendingPlayerMetadata,
  showFinishedPlayerMetadata,
  showPositionHelp = false,
}: MatchDetailPairingPanelProps) {
  const { tx } = useI18n()
  const substituteLabels = getMatchSubstituteLabels({ substitutions, players: players ?? [] })
  const hasResult = sets.length > 0 || (pointsA !== null && pointsB !== null)
  const showRankingPosition = Object.keys(rankingPositions).length > 0
  const pendingPlayerMetadata =
    showPendingPlayerMetadata ?? showPlayerMetadata
  const finishedPlayerMetadata =
    showFinishedPlayerMetadata ?? showPlayerMetadata
  const showPendingMetadata = pendingPlayerMetadata || showRankingPosition

  return (
    <div className={hasResult ? "app-match-result-standalone" : "app-match-pairing-standalone relative"}>
      <div>
        {hasResult ? (
          <div className="app-match-pair-surface app-match-result-surface grid gap-x-1 rounded-2xl border bg-white px-3 py-2 sm:px-4" style={{ gridTemplateColumns: `minmax(0,1fr)${sets.length ? ` repeat(${sets.length}, 28px)` : ""}${pointsA !== null || pointsB !== null ? " 40px" : ""}` }}>
            <div className="app-match-result-head col-span-full grid items-center gap-x-1 pb-1 text-center type-micro font-medium text-neutral-500" style={{ gridTemplateColumns: "subgrid" }}>
              <span />
              {sets.map((_, index) => <span key={index}>S{index + 1}</span>)}
              {pointsA !== null || pointsB !== null ? <span>{tx(sets.length ? "Sets" : "Puntos")}</span> : null}
            </div>
            <FinishedPairRow
              side="a"
              playerIds={teamA}
              players={players}
              points={pointsA}
              sets={sets}
              highlightedPlayerIds={highlightedPlayerIds}
              substituteLabels={substituteLabels}
              linkPlayers={linkPlayers}
              showPlayerMetadata={finishedPlayerMetadata}
              won={pointsA !== null && pointsB !== null && pointsA > pointsB}
            />

            <div aria-hidden="true" className="app-match-result-pair-divider col-span-full my-1 border-t" />
            <FinishedPairRow
              side="b"
              playerIds={teamB}
              players={players}
              points={pointsB}
              sets={sets}
              highlightedPlayerIds={highlightedPlayerIds}
              substituteLabels={substituteLabels}
              linkPlayers={linkPlayers}
              showPlayerMetadata={finishedPlayerMetadata}
              won={pointsA !== null && pointsB !== null && pointsB > pointsA}
            />
          </div>
        ) : (
          <>
            <div className="relative grid grid-cols-2 items-stretch gap-3">
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 type-caption font-black uppercase tracking-wide text-white shadow-sm">
                  VS
                </span>
              </div>

              <PairDetails
                playerIds={teamA}
                players={players}
                positions={rankingPositions}
                statistics={sideStatistics}
                highlightedPlayerIds={highlightedPlayerIds}
                substituteLabels={substituteLabels}
                linkPlayers={linkPlayers}
                alignment="left"
                showMetadata={showPendingMetadata}
                showRankingPosition={showRankingPosition}
                recommendSides={showPositionHelp && !hasResult}
              />

              <PairDetails
                playerIds={teamB}
                players={players}
                positions={rankingPositions}
                statistics={sideStatistics}
                highlightedPlayerIds={highlightedPlayerIds}
                substituteLabels={substituteLabels}
                linkPlayers={linkPlayers}
                alignment="right"
                showMetadata={showPendingMetadata}
                showRankingPosition={showRankingPosition}
                recommendSides={showPositionHelp && !hasResult}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function MatchSideHelp({ children, label, className = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-500" }: { children?: ReactNode; label?: string; className?: string }) {
  const { tx } = useI18n()
  return (
    <StatusHelp
      label={label ?? tx("Información sobre posiciones recomendadas")}
      description={<span className="block space-y-2">
        <span className="block font-black">{tx("Un lado para cada uno")}</span>
        <span className="block">{tx("Respetamos las preferencias compatibles. Si uno es versátil, le sugerimos el lado contrario al de su compañero.")}</span>
        <span className="block">{tx("Si preferís el mismo lado, comparamos vuestro historial de ligas: porcentaje de victorias y después proporción de juegos ganados. Si siguen iguales, usamos la clasificación de esta temporada. El cambio se marca en rojo con ↔.")}</span>
        <span className="block">{tx("Quien todavía no tiene resultados cede la preferencia a quien sí los tiene.")}</span>
        <span className="block">{tx("Con dos versátiles, un empate o datos insuficientes, acordad los lados entre vosotros.")}</span>
        <span className="block border-t border-neutral-200 pt-2 text-xs">{tx("Es una sugerencia: vosotros decidís. Puede cambiar con los resultados antes del partido.")}</span>
      </span>}
      className={className}
    >
      {children ?? (<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none" /></svg>)}
    </StatusHelp>
  )
}
