"use client"

import { useI18n } from "@/i18n/I18nProvider"

type MatchStatusBadgeProps = {
  status: string
}

export function MatchStatusBadge({ status }: MatchStatusBadgeProps) {
  const { t } = useI18n()

  const labelByStatus: Record<string, string> = {
    finished: t.matches.finished,
    scheduled: t.matches.scheduled,
    scheduling: t.matches.unscheduled,
    postponed: t.matches.postponed,
  }

  const classNameByStatus: Record<string, string> = {
    finished: "bg-neutral-950 text-white",
    scheduled: "bg-neutral-100 text-neutral-800",
    scheduling: "bg-neutral-100 text-neutral-800",
    postponed: "bg-orange-100 text-orange-900",
  }

  return (
    <p
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        classNameByStatus[status] ?? "bg-neutral-100 text-neutral-800"
      }`}
    >
      {labelByStatus[status] ?? status}
    </p>
  )
}