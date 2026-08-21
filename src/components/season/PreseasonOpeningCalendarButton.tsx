"use client"

import { useMemo } from "react"
import { toCalendarFloatingDate } from "@/lib/matchScheduleTime"
import type { PreseasonOpening } from "@/lib/preseasonSecrets"
import { useI18n } from "@/i18n/I18nProvider"

const calendarTimeZone = "Europe/Madrid"

export function PreseasonOpeningCalendarButton({
  leagueName,
  seasonName,
  opening,
}: {
  leagueName: string
  seasonName: string
  opening: PreseasonOpening
}) {
  const { tx } = useI18n()
  const calendarUrl = useMemo(() => {
    const start = new Date(opening.startsAt)
    const end = new Date(opening.endsAt)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${tx("Jornada 1")} · ${leagueName}`,
      dates: `${toCalendarFloatingDate(start)}/${toCalendarFloatingDate(end)}`,
      ctz: calendarTimeZone,
      details: `${leagueName} - ${seasonName}\n${tx("Jornada 1")}\n${tx("Los emparejamientos estarán disponibles cuando comience la temporada.")}`,
      location: opening.calendarLocation,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }, [leagueName, opening, seasonName, tx])

  if (!calendarUrl) return null

  return (
    <a
      href={calendarUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-4 flex w-full items-center justify-center rounded-2xl bg-white px-3 py-3 text-center text-sm font-black text-neutral-950 transition active:scale-[0.99]"
    >
      {tx("Añadir Jornada 1 al calendario")}
    </a>
  )
}
