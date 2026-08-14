import Link from "next/link"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import type { PlayerProfile } from "@/data/fakeData"
import { isSafeImageUrl } from "@/lib/imageUrl"
import { getPlayerById, getPlayerDisplayName } from "@/lib/players"
import { getPlayerSideAndHandLabel } from "@/lib/accountProfile"
import type { MatchSubstitution } from "@/lib/substitutes"
import { getMatchSubstituteLabels } from "@/lib/substitutes"

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
  linkPlayers?: boolean
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
}) {
  const player = getPlayerById(playerId, players)
  const displayName = getPlayerDisplayName(playerId, players)
  const name = (
    <span className="block max-w-full truncate whitespace-nowrap type-player-name-prominent text-neutral-950" title={displayName}>
      {displayName}
      {highlighted ? (
        <span className="ml-1 text-yellow-500" aria-label="MVP de jornada" title="MVP de jornada">
          ★
        </span>
      ) : null}
    </span>
  )
  const playerPositionLabel = getPlayerSideAndHandLabel(player?.preferredSide, player?.dominantHand)
  const metadataClass = `min-h-4 type-caption font-bold uppercase leading-4 tracking-wide text-neutral-500 ${
    alignment === "right" ? "text-right" : "text-left"
  }`
  const positionLine = <p className={metadataClass}>{position ? `#${position} en liga` : "\u00a0"}</p>
  const playLine = <p className={metadataClass}>{playerPositionLabel ?? "\u00a0"}</p>
  const nameLine = (
    <div className="min-w-0 overflow-hidden">
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
  )

  return (
    <div className={`min-w-0 ${alignment === "right" ? "text-right" : "text-left"}`}>
      {showMetadata ? (
        <div className="space-y-0.5">
          {metadataPlacement === "before-name" ? (
            <>
              {positionLine}
              {playLine}
              {nameLine}
            </>
          ) : (
            <>
              {nameLine}
              {playLine}
              {positionLine}
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
          Suplente · por {substituteLabel}
        </p>
      ) : null}
    </div>
  )
}

function PairHeader({
  label,
  points,
  alignment,
}: {
  label: string
  points?: number | null
  alignment: "left" | "right"
}) {
  return (
    <div className={`min-w-0 ${alignment === "right" ? "text-right" : "text-left"}`}>
      <div className="flex min-w-0 items-center gap-1.5">
        {points !== null && points !== undefined && alignment === "right" ? (
          <span className="mr-auto flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-950 px-2 text-sm font-black text-white">
            {points}
          </span>
        ) : null}
        <p
          className={`min-w-0 type-caption font-bold uppercase leading-none tracking-wide text-neutral-500 ${
            alignment === "right" ? "ml-auto text-right" : "text-left"
          }`}
        >
          {label}
        </p>
        {points !== null && points !== undefined && alignment === "left" ? (
          <span className="ml-auto flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-950 px-2 text-sm font-black text-white">
            {points}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function PairAvatars({
  playerIds,
  players,
  alignment,
}: {
  playerIds: string[]
  players?: PlayerProfile[]
  alignment: "left" | "right"
}) {
  const pairPlayers = playerIds.map((playerId) => ({
    id: playerId,
    player: getPlayerById(playerId, players),
  }))

  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${
        alignment === "right" ? "justify-end" : "justify-start"
      }`}
    >
      {pairPlayers.map(({ id, player }) => (
        <PlayerAvatar
          key={id}
          player={player}
          size="md"
          previewable={Boolean(player?.avatarUrl)}
        />
      ))}
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
}: {
  playerIds: string[]
  players?: PlayerProfile[]
  positions: Record<string, number | null | undefined>
  highlightedPlayerIds: string[]
  substituteLabels: Record<string, string>
  linkPlayers: boolean
  alignment: "left" | "right"
  showMetadata: boolean
}) {
  return (
    <div
      className={`rounded-lg bg-neutral-50 px-2 py-1.5 ${
        alignment === "right" ? "text-right" : "text-left"
      }`}
    >
      {playerIds.map((playerId, index) => (
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
            metadataPlacement={index === 0 ? "before-name" : "after-name"}
            showMetadata={showMetadata}
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
}: {
  playerId: string
  players?: PlayerProfile[]
  highlighted: boolean
  substituteLabel?: string
  linkPlayers: boolean
}) {
  const player = getPlayerById(playerId, players)
  const displayName = getPlayerDisplayName(playerId, players)
  const name = (
    <span className="block max-w-full truncate whitespace-nowrap type-player-name-prominent text-neutral-950" title={displayName}>
      {displayName}
      {highlighted ? (
        <span className="ml-1 text-yellow-500" aria-label="MVP de jornada" title="MVP de jornada">
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

      {substituteLabel ? (
        <p className="mt-1 type-caption font-bold leading-3 text-red-700">
          Suplente · por {substituteLabel}
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
}: {
  side: "a" | "b"
  playerIds: string[]
  players?: PlayerProfile[]
  points?: number | null
  sets: { a: number; b: number }[]
  highlightedPlayerIds: string[]
  substituteLabels: Record<string, string>
  linkPlayers: boolean
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 px-3 py-3 sm:px-4 sm:py-3.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0 text-left">
          {playerIds.map((playerId, index) => (
            <div key={playerId} className={index === 0 ? "pb-2" : "pt-0"}>
              {index > 0 ? <div className="mb-1.5 mr-1 border-t border-neutral-300" /> : null}

              <FinishedPlayerName
                playerId={playerId}
                players={players}
                highlighted={highlightedPlayerIds.includes(playerId)}
                substituteLabel={substituteLabels[playerId]}
                linkPlayers={linkPlayers}
              />
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 self-center">
          {sets.map((set, index) => {
            const ownScore = side === "a" ? set.a : set.b
            const rivalScore = side === "a" ? set.b : set.a
            const wonSet = ownScore > rivalScore
            return (
              <span
                key={index}
                className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 type-small leading-none ring-1 ring-inset ${
                  wonSet
                    ? "bg-neutral-100 font-black text-neutral-800 ring-neutral-200"
                    : "bg-neutral-50 font-bold text-neutral-500 ring-neutral-200"
                }`}
              >
                {ownScore}
              </span>
            )
          })}
          {points !== null && points !== undefined ? (
            <div className="relative -translate-y-0.5 ml-1 flex h-11 min-w-11 items-center justify-center self-center rounded-lg bg-white px-3 text-lg font-black leading-none text-neutral-950 ring-1 ring-inset ring-neutral-200 shadow-sm">
              {points}
            </div>
          ) : null}
        </div>
      </div>
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
  linkPlayers = true,
}: MatchDetailPairingPanelProps) {
  const substituteLabels = getMatchSubstituteLabels({ substitutions, players: players ?? [] })
  const showAvatars = [...teamA, ...teamB].some((playerId) =>
    isSafeImageUrl(getPlayerById(playerId, players)?.avatarUrl),
  )
  const hasResult = sets.length > 0 || (pointsA !== null && pointsB !== null)
  const showPendingMetadata = Object.keys(rankingPositions).length > 0

  return (
    <AppCard className="overflow-hidden !p-0">
      <div className="p-3 sm:p-4">
        {hasResult ? (
          <div className="space-y-2.5">
            <FinishedPairRow
              side="a"
              playerIds={teamA}
              players={players}
              points={pointsA}
              sets={sets}
              highlightedPlayerIds={highlightedPlayerIds}
              substituteLabels={substituteLabels}
              linkPlayers={linkPlayers}
            />

            <FinishedPairRow
              side="b"
              playerIds={teamB}
              players={players}
              points={pointsB}
              sets={sets}
              highlightedPlayerIds={highlightedPlayerIds}
              substituteLabels={substituteLabels}
              linkPlayers={linkPlayers}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 items-start gap-2 sm:gap-4">
              <PairHeader label="Pareja A" points={pointsA} alignment="left" />
              <PairHeader label="Pareja B" points={pointsB} alignment="right" />
            </div>

            {showAvatars ? (
              <div className="mt-1.5 grid grid-cols-2 items-start gap-2 sm:gap-4">
                <PairAvatars playerIds={teamA} players={players} alignment="left" />
                <PairAvatars playerIds={teamB} players={players} alignment="right" />
              </div>
            ) : null}

            <div className="relative mt-1.5 grid grid-cols-2 items-start gap-2 sm:gap-4">
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 type-caption font-black uppercase tracking-wide text-white shadow-sm">
                  VS
                </span>
              </div>

              <PairDetails
                playerIds={teamA}
                players={players}
                positions={rankingPositions}
                highlightedPlayerIds={highlightedPlayerIds}
                substituteLabels={substituteLabels}
                linkPlayers={linkPlayers}
                alignment="left"
                showMetadata={showPendingMetadata}
              />

              <PairDetails
                playerIds={teamB}
                players={players}
                positions={rankingPositions}
                highlightedPlayerIds={highlightedPlayerIds}
                substituteLabels={substituteLabels}
                linkPlayers={linkPlayers}
                alignment="right"
                showMetadata={showPendingMetadata}
              />
            </div>
          </>
        )}
      </div>
    </AppCard>
  )
}
