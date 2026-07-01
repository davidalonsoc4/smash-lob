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
    finished: "border-neutral-300 bg-neutral-50 text-neutral-700",
    scheduled: "border-emerald-200 bg-emerald-50 text-emerald-800",
    scheduling: "border-neutral-200 bg-neutral-50 text-neutral-600",
    postponed: "border-orange-200 bg-orange-50 text-orange-900",
  }

  return (
    <p
      className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${
        classNameByStatus[status] ?? "border-neutral-200 bg-neutral-50 text-neutral-600"
      }`}
    >
      {labelByStatus[status] ?? status}
    </p>
  )
}
