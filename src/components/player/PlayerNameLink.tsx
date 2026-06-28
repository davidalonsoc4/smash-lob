import Link from "next/link"
import { getPlayerById, getPlayerDisplayName } from "@/lib/players"

type PlayerNameLinkProps = {
  playerId: string
}

export function PlayerNameLink({ playerId }: PlayerNameLinkProps) {
  const player = getPlayerById(playerId)
  const href = player ? `/player/${player.slug}` : `/player/${playerId}`

  return (
    <Link
      href={href}
      className="font-black underline-offset-4 active:underline"
    >
      {getPlayerDisplayName(playerId)}
    </Link>
  )
}