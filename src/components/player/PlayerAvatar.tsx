import type { PlayerProfile } from "@/data/fakeData"

type PlayerAvatarProps = {
  player?: Pick<PlayerProfile, "displayName" | "avatarUrl"> & {
    avatarInitials?: string | null
  } | null
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-xl",
}

function getInitials(player?: PlayerAvatarProps["player"]) {
  if (!player) {
    return "SL"
  }

  return (
    player.avatarInitials ||
    player.displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ||
    "JG"
  )
}

export function PlayerAvatar({
  player,
  size = "md",
  className = "",
}: PlayerAvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-950 font-black text-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      {player?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.avatarUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{getInitials(player)}</span>
      )}
    </div>
  )
}
