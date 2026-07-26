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
  seasons: SeasonOption[]
  selectedSeason: SeasonOption
  onSeasonChange: (seasonId: string) => void
  fallbackHref?: string
}) {
  return (
    <>
      <header className="pt-2">
        <BackButton fallbackHref={fallbackHref} label="Volver" />
        <p className="mt-1 text-xs font-bold text-neutral-500">{leagueName}</p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">{title}</h1>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          {description}
        </p>
      </header>

      {seasons.length > 1 ? (
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
