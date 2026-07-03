"use client"

import { useI18n } from "@/i18n/I18nProvider"
import { getMatchDisplayStatus } from "@/lib/matchLifecycle"

type MatchStatusBadgeProps = {
  status: string
  scheduledAt?: string | null
  resultRecordedAt?: string | null
}

export function MatchStatusBadge({
  status,
  scheduledAt,
  resultRecordedAt,
}: MatchStatusBadgeProps) {
  const { t } = useI18n()
  const displayStatus = getMatchDisplayStatus({
    status,
    scheduledAt,
    resultRecordedAt,
  })

  const labelByStatus: Record<string, string> = {
    finished: t.matches.finished,
    scheduled: t.matches.scheduled,
    scheduling: t.matches.unscheduled,
    postponed: t.matches.postponed,
    in_progress: t.matches.inProgress,
    result_pending: t.matches.resultPending,
  }

  const classNameByStatus: Record<string, string> = {
    finished: "bg-neutral-950 text-white",
    scheduled: "bg-neutral-100 text-neutral-800",
    scheduling: "bg-neutral-100 text-neutral-800",
    postponed: "bg-orange-100 text-orange-900",
    in_progress: "bg-emerald-100 text-emerald-800",
    result_pending: "bg-amber-100 text-amber-900",
  }

  return (
    <p
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        classNameByStatus[displayStatus] ?? "bg-neutral-100 text-neutral-800"
      }`}
    >
      {labelByStatus[displayStatus] ?? displayStatus}
    </p>
  )
}
