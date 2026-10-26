"use client"

import { StatusHelp } from "@/components/ui/StatusHelp"

const colors: Record<string, string> = {
  finished: "bg-neutral-400",
  readonly: "bg-neutral-400",
  scheduled: "bg-sky-500",
  scheduling: "bg-neutral-400",
  postponed: "bg-orange-500",
  in_progress: "bg-emerald-500",
  result_pending: "bg-amber-500",
  coordinating: "bg-violet-500",
  awaiting_booking: "bg-indigo-500",
}

export function StatusDot({ status, kind = "match", label, helpStatus = status }: {
  status: string; kind?: string; label: string; helpStatus?: string
}) {
  return <StatusHelp kind={kind} status={helpStatus} label={label} className="relative z-10 ml-auto flex h-5 w-5 shrink-0 self-start items-start justify-end rounded-full">
    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${colors[status] ?? colors.scheduling}`} />
  </StatusHelp>
}
