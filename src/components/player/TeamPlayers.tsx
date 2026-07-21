import { PlayerNameLink } from "./PlayerNameLink"
import type { PlayerProfile } from "@/data/fakeData"

type TeamPlayersProps = {
  playerIds: string[]
  players?: PlayerProfile[]
  highlightedPlayerIds?: string[]
  highlightedPlayerLabel?: string
  substituteLabels?: Record<string, string>
  className?: string
  keepNamesOnOneLine?: boolean
  stackPlayers?: boolean
}

export function TeamPlayers({
  playerIds,
  players,
  highlightedPlayerIds = [],
  highlightedPlayerLabel = "MVP de jornada",
  substituteLabels = {},
  className = "flex flex-wrap gap-x-1 gap-y-1 text-lg font-black",
  keepNamesOnOneLine = false,
  stackPlayers = false,
}: TeamPlayersProps) {
  return (
    <div className={className}>
      {playerIds.map((playerId, index) => {
        const isHighlighted = highlightedPlayerIds.includes(playerId)

        return (
          <span
            key={playerId}
            className={`inline-flex min-w-0 items-center gap-x-1 ${
              stackPlayers ? "w-full" : ""
            } ${keepNamesOnOneLine ? "flex-wrap" : ""}`}
          >
            <PlayerNameLink
              playerId={playerId}
              players={players}
              className={keepNamesOnOneLine ? "whitespace-nowrap" : ""}
            />
            {isHighlighted ? (
              <span
                aria-label={highlightedPlayerLabel}
                title={highlightedPlayerLabel}
                className="text-yellow-500"
              >
                ★
              </span>
            ) : null}
            {substituteLabels[playerId] ? (
              <span
                title={`Suplente por ${substituteLabels[playerId]}`}
                className="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-red-700"
              >
                Suplente · por {substituteLabels[playerId]}
              </span>
            ) : null}
            {!stackPlayers && index < playerIds.length - 1 ? <span>/</span> : null}
          </span>
        )
      })}
    </div>
  )
}
