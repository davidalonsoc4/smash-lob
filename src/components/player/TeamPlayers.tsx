import { PlayerNameLink } from "./PlayerNameLink"

type TeamPlayersProps = {
  playerIds: string[]
}

export function TeamPlayers({ playerIds }: TeamPlayersProps) {
  return (
    <div className="flex flex-wrap gap-x-1 gap-y-1 text-lg font-black">
      {playerIds.map((playerId, index) => (
        <span key={playerId} className="inline-flex items-center gap-x-1">
          <PlayerNameLink playerId={playerId} />
          {index < playerIds.length - 1 ? <span>/</span> : null}
        </span>
      ))}
    </div>
  )
}