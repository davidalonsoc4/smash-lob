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
      className={`min-w-0 rounded-xl bg-white px-2.5 py-2.5 shadow-sm ring-1 ring-neutral-100 ${
        alignment === "right" ? "text-right" : "text-left"
      }`}
    >
      <div className="line-clamp-2 min-w-0">
        {linkPlayers && player ? (
          <Link
            href={`/player/${player.slug}`}
            className="block min-w-0 underline-offset-4 active:underline"
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </div>

      {position ? (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
          #{position} en liga
        </p>
      ) : null}

      {substituteLabel ? (
        <p className="mt-1 text-[9px] font-bold leading-3 text-red-700">
          Suplente · por {substituteLabel}
        </p>
      ) : null}
    </div>
  )
}

function PairColumn({
  label,
  playerIds,
  players,
  points,
  positions,
  highlightedPlayerIds,
  substituteLabels,
  linkPlayers,
  alignment,
  showAvatars,
}: {
  label: string
  playerIds: string[]
  players?: PlayerProfile[]
  points?: number | null
  positions: Record<string, number | null | undefined>
  highlightedPlayerIds: string[]
  substituteLabels: Record<string, string>
  linkPlayers: boolean
  alignment: "left" | "right"
  showAvatars: boolean
}) {
  const pairPlayers = playerIds.map((playerId) => ({
    id: playerId,
    player: getPlayerById(playerId, players),
  }))

  return (
    <section className="min-w-0 rounded-2xl bg-neutral-50 p-2.5 ring-1 ring-neutral-100">
      <div className="relative flex min-h-8 min-w-0 items-center justify-center px-8">
        <p className="truncate text-center text-[12px] font-black uppercase tracking-[0.12em] text-neutral-600">
          {label}
        </p>
        {points !== null && points !== undefined ? (
          <span className="absolute right-0 flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-950 px-2 text-base font-black text-white">
            {points}
          </span>
        ) : null}
      </div>

      {showAvatars ? (
        <div className="mt-3 flex min-w-0 items-center justify-center gap-2">
          {pairPlayers.map(({ id, player }) => (
            <PlayerAvatar
              key={id}
              player={player}
              size="md"
              previewable={Boolean(player?.avatarUrl)}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
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
    </section>
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

      <div className="grid grid-cols-[minmax(0,1fr)_42px_minmax(0,1fr)] items-stretch gap-2 p-3 sm:gap-3 sm:p-4">
        <PairColumn
          label="Pareja A"
          playerIds={teamA}
          players={players}
          points={pointsA}
          positions={rankingPositions}
          highlightedPlayerIds={highlightedPlayerIds}
          substituteLabels={substituteLabels}
          linkPlayers={linkPlayers}
          alignment="left"
          showAvatars={showAvatars}
        />

        <div className="flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-[11px] font-black uppercase tracking-wide text-white shadow-sm">
            VS
          </span>
        </div>

        <PairColumn
          label="Pareja B"
          playerIds={teamB}
          players={players}
          points={pointsB}
          positions={rankingPositions}
          highlightedPlayerIds={highlightedPlayerIds}
          substituteLabels={substituteLabels}
          linkPlayers={linkPlayers}
          alignment="right"
          showAvatars={showAvatars}
        />
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
