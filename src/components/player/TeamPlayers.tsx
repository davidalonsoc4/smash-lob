import { PlayerNameLink } from "./PlayerNameLink"
import type { PlayerProfile } from "@/data/fakeData"

type TeamPlayersProps = {
  playerIds: string[]
  players?: PlayerProfile[]
}

export function TeamPlayers({ playerIds, players }: TeamPlayersProps) {
  return (
    <div className="flex flex-wrap gap-x-1 gap-y-1 text-lg font-black">
      {playerIds.map((playerId, index) => (
        <span key={playerId} className="inline-flex items-center gap-x-1">
          <PlayerNameLink playerId={playerId} players={players} />
          {index < playerIds.length - 1 ? <span>/</span> : null}
        </span>
      ))}
    </div>
  )
}
