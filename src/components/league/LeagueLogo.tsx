import type { League } from "@/data/fakeData"
import { isSafeImageUrl, normalizeImageUrl } from "@/lib/imageUrl"

type LeagueLogoProps = {
  league?: Pick<League, "name" | "logoUrl"> | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
}

function getLeagueInitials(name?: string | null) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SL"
  )
}

export function LeagueLogo({
  league,
  size = "md",
  className = "",
}: LeagueLogoProps) {
  if (isSafeImageUrl(league?.logoUrl)) {
    return (
      <div
        className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-transparent ${className}`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={normalizeImageUrl(league?.logoUrl) ?? ""}
          alt=""
          className="h-full w-full object-contain drop-shadow-sm"
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-950 font-black text-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      <span>{getLeagueInitials(league?.name)}</span>
    </div>
  )
}
