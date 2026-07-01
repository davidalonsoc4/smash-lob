"use client"

import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

type MatchScheduleBoxProps = {
  status: string
  dateLabel: string | null
  location: string | null
}

export function MatchScheduleBox({
  status,
  dateLabel,
  location,
}: MatchScheduleBoxProps) {
  const { t } = useI18n()
  const isScheduling = status === "scheduling"

  return (
    <AppCard>
      <p className="text-sm font-semibold text-neutral-500">
        {t.matchDetail.schedule}
      </p>

      {isScheduling ? (
        <div className="mt-3 rounded-xl border border-dashed border-neutral-300 p-3">
          <p className="font-bold">{t.matchDetail.pendingSchedule}</p>

          <p className="mt-1 text-sm text-neutral-500">
            {t.matchDetail.pendingScheduleDescription}
          </p>

          <button className="mt-3 w-full rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-bold text-white">
            {t.matchDetail.addScheduleButton}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="font-bold">{dateLabel}</p>
          <p className="text-sm text-neutral-500">{location}</p>
        </div>
      )}
    </AppCard>
  )
}