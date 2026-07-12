import type { Season } from "@/data/fakeData"
import { getSeasonStatusBadgeClassName } from "@/lib/statusStyles"

type LeagueSeasonEyebrowProps = {
  leagueName: string
  seasonName: string
  seasonStatus: Season["status"]
}

const eyebrowClassName =
  "text-xs font-bold uppercase leading-4 tracking-[0.14em] text-neutral-500"

export function LeagueSeasonEyebrow({
  leagueName,
  seasonName,
  seasonStatus,
}: LeagueSeasonEyebrowProps) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className={`${eyebrowClassName} break-words`}>{leagueName}</p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className={eyebrowClassName}>{seasonName}</p>
        {seasonStatus === "finished" ? (
          <span className={getSeasonStatusBadgeClassName("finished")}>
            Terminada
          </span>
        ) : null}
      </div>
    </div>
  )
}
