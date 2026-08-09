import Link from "next/link"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import type { PlayerProfile } from "@/data/fakeData"
import { isSafeImageUrl } from "@/lib/imageUrl"
import { getPlayerById, getPlayerDisplayName } from "@/lib/players"
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
}: {
  playerId: string
  players?: PlayerProfile[]
  position?: number | null
  highlighted: boolean
  substituteLabel?: string
  linkPlayers: boolean
  alignment: "left" | "right"
}) {
  const player = getPlayerById(playerId, players)
  const displayName = getPlayerDisplayName(playerId, players)
  const content = (
    <span className="block max-w-full text-[16px] font-black leading-[1.08rem] text-neutral-950 [overflow-wrap:anywhere]">
      {displayName}
      {highlighted ? (
        <span className="ml-1 text-yellow-500" aria-label="MVP de jornada" title="MVP de jornada">
          ★
        </span>
      ) : null}
    </span>
  )

  return (
    <div
      className={`min-w-0 rounded-lg bg-neutral-50 px-2 py-2 ${
        alignment === "right" ? "text-right" : "text-left"
      }`}
    >
      <div className="line-clamp-2 min-w-0">
        {linkPlayers && player ? (
          <Link
            href={`/player/${player.slug}`}
            className={`block min-w-0 underline-offset-4 active:underline ${
              alignment === "right" ? "text-right" : "text-left"
            }`}
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </div>

      {position ? (
        <p
          className={`mt-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500 ${
            alignment === "right" ? "text-right" : "text-left"
          }`}
        >
          #{position} en liga
        </p>
      ) : null}

      {substituteLabel ? (
        <p
          className={`mt-1 text-[9px] font-bold leading-3 text-red-700 ${
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
          className={`min-w-0 text-[10px] font-bold uppercase leading-none tracking-wide text-neutral-500 ${
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
}: {
  playerIds: string[]
  players?: PlayerProfile[]
  positions: Record<string, number | null | undefined>
  highlightedPlayerIds: string[]
  substituteLabels: Record<string, string>
  linkPlayers: boolean
  alignment: "left" | "right"
}) {
  return (
    <div className="space-y-1.5">
      {playerIds.map((playerId) => (
        <DetailPlayer
          key={playerId}
          playerId={playerId}
          players={players}
          position={positions[playerId]}
          highlighted={highlightedPlayerIds.includes(playerId)}
          substituteLabel={substituteLabels[playerId]}
          linkPlayers={linkPlayers}
          alignment={alignment}
        />
      ))}
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

  return (
    <AppCard className="overflow-hidden !p-0">
      <div className="border-b border-neutral-100 px-4 py-3.5">
        <h2 className="text-lg font-black tracking-tight text-neutral-950">
          Emparejamiento
        </h2>
      </div>

      <div className="p-3 sm:p-4">
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
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
          />

          <PairDetails
            playerIds={teamB}
            players={players}
            positions={rankingPositions}
            highlightedPlayerIds={highlightedPlayerIds}
            substituteLabels={substituteLabels}
            linkPlayers={linkPlayers}
            alignment="right"
          />
        </div>
      </div>

      {sets.length > 0 ? (
        <div className="border-t border-neutral-100 px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4">
          <div className="grid grid-cols-3 gap-2">
            {sets.map((set, index) => (
              <div key={index} className="rounded-xl bg-neutral-100 px-2 py-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                  Set {index + 1}
                </p>
                <p className="mt-0.5 text-base font-black text-neutral-950">
                  {set.a}-{set.b}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </AppCard>
  )
}
