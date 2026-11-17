"use client"

import { useI18n } from "@/i18n/I18nProvider"

/** Dashed call to action shown on a match that still has no date, time or place. */
export function MatchScheduleHint({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const { t, tx } = useI18n()
  return (
    <div data-match-schedule-hint className={`rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-2 ${compact ? "flex min-h-10 items-center justify-center text-center" : ""} ${className}`}>
      <p className="match-schedule-action flex w-full items-center justify-center gap-2 text-xs font-black text-neutral-800">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-4 w-4 shrink-0"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-6 4v4m-2-2h4" /></svg>
        <span>{t.dashboard.addSchedule}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0"><path d="m9 5 7 7-7 7" /></svg>
      </p>
      {!compact ? <p className="mt-0.5 type-caption font-semibold text-neutral-500">{tx("Coordínalo desde el chat")}</p> : null}
    </div>
  )
}
