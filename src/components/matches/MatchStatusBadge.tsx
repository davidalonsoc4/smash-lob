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
    finished: "border-stone-300 bg-stone-100 text-stone-700",
    scheduled: "border-emerald-200 bg-emerald-50 text-emerald-800",
    scheduling: "border-stone-200 bg-stone-50 text-stone-600",
    postponed: "border-orange-200 bg-orange-50 text-orange-900",
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${
        classNameByStatus[status] ?? "border-stone-200 bg-stone-50 text-stone-600"
      }`}
    >
      {labelByStatus[status] ?? status}
    </span>
  )
}
