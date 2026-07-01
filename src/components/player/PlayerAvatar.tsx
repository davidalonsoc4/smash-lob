import type { PlayerProfile } from "@/data/fakeData"

type PlayerAvatarProps = {
  player?: Pick<PlayerProfile, "displayName" | "avatarUrl"> & {
    avatarInitials?: string | null
  } | null
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-10 w-10",
  lg: "h-14 w-14",
}

const iconSizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
}

function hasImage(player?: PlayerAvatarProps["player"]) {
  return typeof player?.avatarUrl === "string" && player.avatarUrl.trim().length > 0
}

function GenericUserIcon({ size }: { size: NonNullable<PlayerAvatarProps["size"]> }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${iconSizeClasses[size]} text-neutral-500`}
      aria-hidden="true"
    >
      <path
        d="M12 12.25c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z"
        fill="currentColor"
      />
      <path
        d="M5.25 19.5c.78-3.06 3.5-5.25 6.75-5.25s5.97 2.19 6.75 5.25c.16.62-.35 1.25-1.02 1.25H6.27c-.67 0-1.18-.63-1.02-1.25Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function PlayerAvatar({
  player,
  size = "md",
  className = "",
}: PlayerAvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200 ${className}`}
      aria-hidden="true"
    >
      {hasImage(player) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player?.avatarUrl ?? ""}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <GenericUserIcon size={size} />
      )}
    </div>
  )
}
