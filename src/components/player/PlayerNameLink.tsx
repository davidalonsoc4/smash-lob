import Link from "next/link"
import { getPlayerById, getPlayerDisplayName } from "@/lib/players"
import type { PlayerProfile } from "@/data/fakeData"

type PlayerNameLinkProps = {
  playerId: string
  players?: PlayerProfile[]
}

export function PlayerNameLink({ playerId, players }: PlayerNameLinkProps) {
  const player = getPlayerById(playerId, players)
  const href = player ? `/player/${player.slug}` : `/player/${playerId}`

  return (
    <Link
      href={href}
      className="font-black underline decoration-neutral-300 decoration-1 underline-offset-4 transition active:decoration-neutral-950"
    >
      {getPlayerDisplayName(playerId, players)}
    </Link>
  )
}
