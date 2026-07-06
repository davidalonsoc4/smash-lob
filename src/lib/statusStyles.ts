export const badgeBaseClassName =
  "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide leading-none"

export const compactBadgeBaseClassName =
  "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] leading-none"

type MatchDisplayStatus =
  | "finished"
  | "scheduled"
  | "scheduling"
  | "postponed"
  | "in_progress"
  | "result_pending"

type RoundDisplayStatus = "upcoming" | "active" | "completed" | "finished"

type SeasonDisplayStatus = "none" | "upcoming" | "active" | "finished"

export function getStatusToneClassName(tone: string) {
  const classNameByTone: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/70",
    dark: "bg-neutral-950 text-white ring-1 ring-neutral-950",
    blue: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80",
    green: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
    amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
    orange: "bg-orange-50 text-orange-800 ring-1 ring-orange-200/80",
    red: "bg-red-50 text-red-700 ring-1 ring-red-200/80",
    gold: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200/80",
  }

  return classNameByTone[tone] ?? classNameByTone.neutral
}

export function getBadgeClassName(tone: string, baseClassName = badgeBaseClassName) {
  return `${baseClassName} ${getStatusToneClassName(tone)}`
}

export function getMatchStatusBadgeClassName(status: string) {
  const toneByStatus: Record<MatchDisplayStatus, string> = {
    finished: "dark",
    scheduled: "blue",
    scheduling: "neutral",
    postponed: "orange",
    in_progress: "green",
    result_pending: "amber",
  }

  return getBadgeClassName(
    toneByStatus[status as MatchDisplayStatus] ?? "neutral",
    "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-black leading-none"
  )
}

export function getRoundStatusBadgeClassName(status: string) {
  const toneByStatus: Record<RoundDisplayStatus, string> = {
    upcoming: "blue",
    active: "green",
    completed: "dark",
    finished: "dark",
  }

  return getBadgeClassName(toneByStatus[status as RoundDisplayStatus] ?? "neutral")
}

export function getSeasonStatusBadgeClassName(status: string, totalRounds?: number) {
  const normalizedStatus: SeasonDisplayStatus =
    totalRounds === 0
      ? "none"
      : status === "finished"
        ? "finished"
        : status === "upcoming"
          ? "upcoming"
          : status === "active"
            ? "active"
            : "active"

  const toneByStatus: Record<SeasonDisplayStatus, string> = {
    none: "neutral",
    upcoming: "blue",
    active: "green",
    finished: "red",
  }

  return getBadgeClassName(toneByStatus[normalizedStatus], compactBadgeBaseClassName)
}

export function getBookingStatusBadgeClassName(isReserved: boolean) {
  return getBadgeClassName(isReserved ? "green" : "neutral")
}

export function getPaymentStatusBadgeClassName(isPaid: boolean) {
  return getBadgeClassName(isPaid ? "green" : "amber")
}

export function getWinnerBadgeClassName() {
  return getBadgeClassName("gold")
}
