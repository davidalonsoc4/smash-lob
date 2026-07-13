"use client"

import { useI18n } from "@/i18n/I18nProvider"
import { getMatchDisplayStatus } from "@/lib/matchLifecycle"
import { getMatchStatusBadgeClassName } from "@/lib/statusStyles"

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

  return (
    <p className={`${getMatchStatusBadgeClassName(displayStatus)} ml-auto text-right`}>
      {labelByStatus[displayStatus] ?? displayStatus}
    </p>
  )
}
