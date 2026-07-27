"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { AppCard } from "@/components/ui/AppCard"

type SeasonOption = {
  id: string
  name: string
  status: "upcoming" | "active" | "finished"
}

type StatisticsSectionIconName =
  | "standings"
  | "compare"
  | "player"
  | "evolution"
  | "records"
  | "season"

export function StatisticsSectionIcon({
  name,
}: {
  name: StatisticsSectionIconName
}) {
  const commonProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }

  const paths: Record<StatisticsSectionIconName, ReactNode> = {
    standings: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </>
    ),
    compare: (
      <>
        <circle cx="7" cy="7" r="3" />
        <circle cx="17" cy="7" r="3" />
        <path d="M2.5 20c.5-4 2-6 4.5-6s4 2 4.5 6" />
        <path d="M12.5 20c.5-4 2-6 4.5-6s4 2 4.5 6" />
      </>
    ),
    player: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1-5 3.5-7 8-7s7 2 8 7" />
      </>
    ),
    evolution: (
      <>
        <path d="M3 18l5-6 4 3 6-9 3 2" />
        <path d="M3 5v13h18" />
      </>
    ),
    records: (
      <>
        <path d="M8 3h8v5a4 4 0 0 1-8 0V3Z" />
        <path d="M8 5H4v2a4 4 0 0 0 4 4" />
        <path d="M16 5h4v2a4 4 0 0 1-4 4" />
        <path d="M12 12v5" />
        <path d="M8 21h8" />
        <path d="M9 17h6" />
      </>
    ),
    season: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4" />
        <path d="M8 3v4" />
        <path d="M3 10h18" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
      </>
    ),
  }

  return (
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
      <svg {...commonProps}>{paths[name]}</svg>
    </span>
  )
}

export function StatisticsPageHeader({
  leagueName,
  title,
  description,
  seasons,
  selectedSeason,
  onSeasonChange,
  fallbackHref = "/statistics",
}: {
  leagueName: string
  title: string
  description: string
  seasons?: SeasonOption[]
  selectedSeason: SeasonOption
  onSeasonChange?: (seasonId: string) => void
  fallbackHref?: string
}) {
  const canChooseSeason = Boolean(
    seasons && seasons.length > 1 && onSeasonChange,
  )

  return (
    <>
      <header className="pt-2">
        <BackButton fallbackHref={fallbackHref} label="Volver" />
        <p className="mt-1 text-xs font-bold text-neutral-500">{leagueName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-black tracking-tight">{title}</h1>
          {!canChooseSeason ? (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-700">
              {selectedSeason.name}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          {description}
        </p>
      </header>

      {canChooseSeason && seasons && onSeasonChange ? (
        <AppCard className="p-2">
          <label className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] font-black text-neutral-700">
              Temporada
            </span>
            <select
              value={selectedSeason.id}
              onChange={(event) => onSeasonChange(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm font-bold"
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} · {season.status === "finished" ? "Terminada" : season.status === "active" ? "Activa" : "Próxima"}
                </option>
              ))}
            </select>
          </label>
        </AppCard>
      ) : null}
    </>
  )
}

export function StatisticsSectionLink({
  href,
  title,
  description,
  summary,
  leading,
}: {
  href: string
  title: string
  description: string
  summary?: string
  leading?: ReactNode
}) {
  return (
    <Link
      href={href}
      className="statistics-section-link flex items-center gap-3 px-3 py-3 transition active:bg-neutral-50"
    >
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-neutral-950">{title}</span>
          {summary ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-black text-neutral-700">
              {summary}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs font-semibold leading-5 text-neutral-500">
          {description}
        </span>
      </span>
      <ClickableChevron className="shrink-0" />
    </Link>
  )
}
