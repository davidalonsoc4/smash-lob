import type { League } from "@/data/fakeData"

type LeagueLogoProps = {
  league?: Pick<League, "name" | "logoUrl"> | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-xl",
}

const imagePaddingClasses = {
  sm: "p-0.5",
  md: "p-1",
  lg: "p-1.5",
  xl: "p-2",
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
        className={`${sizeClasses[size]} ${imagePaddingClasses[size]} flex shrink-0 items-center justify-center overflow-visible rounded-2xl bg-transparent ${className}`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={league.logoUrl}
          alt=""
          className="max-h-full max-w-full object-contain drop-shadow-sm"
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
