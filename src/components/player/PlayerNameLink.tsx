import Link from "next/link"
import { getPlayerById, getPlayerDisplayName } from "@/lib/players"
import type { PlayerProfile } from "@/data/fakeData"

type PlayerNameLinkProps = {
  playerId: string
  players?: PlayerProfile[]
  className?: string
}

export function PlayerNameLink({
  playerId,
  players,
  className = "",
}: PlayerNameLinkProps) {
  const player = getPlayerById(playerId, players)
  const href = player ? `/player/${player.slug}` : `/player/${playerId}`

  return (
    <Link
      href={href}
      className={`font-black underline-offset-4 active:underline ${className}`}
    >
      {getPlayerDisplayName(playerId, players)}
    </Link>
  )
}
