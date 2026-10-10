"use client"

import { StatusHelp } from "@/components/ui/StatusHelp"

import type { Season } from "@/data/fakeData"
import { useI18n } from "@/i18n/I18nProvider"
import { getSeasonStatusBadgeClassName } from "@/lib/statusStyles"

type LeagueSeasonEyebrowProps = {
  leagueName: string
  seasonName: string
  seasonStatus: Season["status"]
}

const eyebrowClassName =
  "app-eyebrow text-xs font-bold uppercase leading-4 tracking-[0.14em] text-neutral-500"

export function LeagueSeasonEyebrow({
  leagueName,
  seasonName,
  seasonStatus,
}: LeagueSeasonEyebrowProps) {
  const { t } = useI18n()

  return (
    <div className="min-w-0 space-y-0.5">
      <p className={`${eyebrowClassName} break-words`}>{leagueName}</p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className={eyebrowClassName}>{seasonName}</p>
        {seasonStatus === "finished" ? (
          <StatusHelp kind="season" status={"finished"} className={getSeasonStatusBadgeClassName("finished")}>
            {t.common.finishedSeasonBadge}
          </StatusHelp>
        ) : null}
      </div>
    </div>
  )
}
