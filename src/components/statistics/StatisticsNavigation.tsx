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
  isLeagueWide?: boolean
}

type StatisticsSectionIconName =
  | "standings"
  | "compare"
  | "player"
  | "evolution"
  | "records"
  | "season"

type StatusBadge = {
  label: string
  tone?: "neutral" | "warning" | "error" | "success"
}

function getStatusBadgeClassName(tone: StatusBadge["tone"] = "neutral") {
  if (tone === "warning") return "bg-amber-100 text-amber-800"
  if (tone === "error") return "bg-red-100 text-red-800"
  if (tone === "success") return "bg-emerald-100 text-emerald-800"
  return "bg-neutral-100 text-neutral-700"
}

export function StatisticsSectionIcon({
  name,
}: {
  name: StatisticsSectionIconName
}) {
  const commonProps = {
    width: 18,
    height: 18,
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
    <span className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
      <svg {...commonProps}>{paths[name]}</svg>
    </span>
  )
}

export function StatisticsPageHeader({
  title,
  description,
  seasons,
  selectedSeason,
  onSeasonChange,
  fallbackHref = "/statistics",
  statusBadge,
}: {
  title: string
  description: string
  seasons?: SeasonOption[]
  selectedSeason: SeasonOption
  onSeasonChange?: (seasonId: string) => void
  fallbackHref?: string
  statusBadge?: StatusBadge
}) {
  const canChooseSeason = Boolean(
    seasons && seasons.length > 1 && onSeasonChange,
  )
  const includesLeagueWideScope = Boolean(
    seasons?.some((season) => season.isLeagueWide),
  )

  return (
    <>
      <header className="app-page-header">
        <BackButton fallbackHref={fallbackHref} label="Volver" />
        <h1 className="type-page-title font-black tracking-tight">{title}</h1>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {!canChooseSeason ? (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 type-caption font-black text-neutral-700">
              {selectedSeason.name}
            </span>
          ) : null}
          {statusBadge ? (
            <span
              className={`rounded-full px-2.5 py-1 type-caption font-black ${getStatusBadgeClassName(statusBadge.tone)}`}
            >
              {statusBadge.label}
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
            <span className="shrink-0 type-caption font-black text-neutral-700">
              {includesLeagueWideScope ? "Ámbito" : "Temporada"}
            </span>
            <select
              value={selectedSeason.id}
              onChange={(event) => onSeasonChange(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm font-bold"
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.isLeagueWide
                    ? season.name
                    : `${season.name} · ${
                        season.status === "finished"
                          ? "Terminada"
                          : season.status === "active"
                            ? "Activa"
                            : "Próxima"
                      }`}
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
  leading,
}: {
  href: string
  title: string
  description: string
  leading?: ReactNode
}) {
  return (
    <Link
      href={href}
      className="statistics-section-link grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2.5 px-3 py-3 transition active:bg-neutral-50"
    >
      <span className="grid h-8 w-8 place-items-center">
        {leading ?? null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-neutral-950">{title}</span>
        <span className="mt-0.5 block text-xs font-semibold leading-5 text-neutral-500">
          {description}
        </span>
      </span>
      <ClickableChevron className="justify-self-center" />
    </Link>
  )
}
