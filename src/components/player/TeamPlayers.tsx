import { PlayerNameLink } from "./PlayerNameLink"
import type { PlayerProfile } from "@/data/fakeData"

type TeamPlayersProps = {
  playerIds: string[]
  players?: PlayerProfile[]
  highlightedPlayerIds?: string[]
  className?: string
}

export function TeamPlayers({
  playerIds,
  players,
  highlightedPlayerIds = [],
  className = "flex flex-wrap gap-x-1 gap-y-1 text-lg font-black",
}: TeamPlayersProps) {
  return (
    <div className={className}>
      {playerIds.map((playerId, index) => {
        const isHighlighted = highlightedPlayerIds.includes(playerId)

        return (
          <span key={playerId} className="inline-flex items-center gap-x-1">
            <PlayerNameLink playerId={playerId} players={players} />
            {isHighlighted ? (
              <span aria-label="MVP de jornada" title="MVP de jornada" className="text-yellow-500">
                ★
              </span>
            ) : null}
            {index < playerIds.length - 1 ? <span>/</span> : null}
          </span>
        )
      })}
    </div>
  )
}
