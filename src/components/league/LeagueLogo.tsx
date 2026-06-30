import type { League } from "@/data/fakeData"

type LeagueLogoProps = {
  league?: Pick<League, "name" | "logoUrl"> | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "h-10 w-10 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-[72px] w-[72px] text-lg",
  xl: "h-24 w-24 text-xl",
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
  if (league?.logoUrl) {
    return (
      <div
        className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm ${className}`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={league.logoUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-950 font-black text-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      <span>{getLeagueInitials(league?.name)}</span>
    </div>
  )
}
