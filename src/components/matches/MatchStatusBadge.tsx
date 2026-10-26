"use client"

import { StatusHelp } from "@/components/ui/StatusHelp"
import { StatusDot } from "@/components/ui/StatusDot"

import { useI18n } from "@/i18n/I18nProvider"
import { getMatchDisplayStatus } from "@/lib/matchLifecycle"
import { getMatchStatusBadgeClassName, softStatusBadgeClassName } from "@/lib/statusStyles"

type MatchStatusBadgeProps = {
  status: string
  scheduledAt?: string | null
  resultRecordedAt?: string | null
  coordinationStatus?: "coordinating" | "awaiting_booking" | null
  isParticipant?: boolean
  canRecordResult?: boolean
  variant?: "text" | "dot" | "soft"
}

export function MatchStatusBadge({
  status,
  scheduledAt,
  resultRecordedAt,
  coordinationStatus = null,
  isParticipant = false,
  canRecordResult = false,
  variant = "text",
}: MatchStatusBadgeProps) {
  const { t, tx } = useI18n()
  const baseStatus = getMatchDisplayStatus({
    status,
    scheduledAt,
    resultRecordedAt,
  })
  const displayStatus =
    baseStatus === "scheduling" && coordinationStatus
      ? coordinationStatus
      : baseStatus

  const labelByStatus: Record<string, string> = {
    finished: t.matches.finished,
    scheduled: t.matches.scheduled,
    scheduling: t.matches.unscheduled,
    postponed: t.matches.postponed,
    in_progress: t.matches.inProgress,
    result_pending: t.matches.resultPending,
    coordinating: tx("Coordinando"),
    awaiting_booking: tx("Pendiente de reserva"),
  }

  const kind = isParticipant ? "match-participant" : "match"
  const helpStatus = displayStatus === "result_pending" && isParticipant && canRecordResult ? "record_result" : displayStatus
  if (variant === "dot") return <StatusDot status={displayStatus} kind={kind} helpStatus={helpStatus} label={labelByStatus[displayStatus] ?? displayStatus} />
  return (
    <StatusHelp kind={kind} status={helpStatus} label={labelByStatus[displayStatus] ?? displayStatus} className={`${getMatchStatusBadgeClassName(displayStatus)} ml-auto text-right ${variant === "soft" ? softStatusBadgeClassName : ""}`}>
      {labelByStatus[displayStatus] ?? displayStatus}
    </StatusHelp>
  )
}
