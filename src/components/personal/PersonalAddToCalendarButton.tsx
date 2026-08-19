"use client"

import { useMemo } from "react"
import { toCalendarFloatingDate } from "@/lib/matchScheduleTime"
import {
  getPersonalMatchTeamNames,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

const eventDurationMinutes = 120
const calendarTimeZone = "Europe/Madrid"

export function PersonalAddToCalendarButton({
  match,
  className,
}: {
  match: PersonalMatchItem
  className?: string
}) {
  const calendarUrl = useMemo(() => {
    if (!match.scheduledAt) return null
    const start = new Date(match.scheduledAt)
    if (Number.isNaN(start.getTime())) return null

    const end = new Date(start.getTime() + eventDurationMinutes * 60 * 1000)
    const teamA = getPersonalMatchTeamNames(match.participants, 1)
    const teamB = getPersonalMatchTeamNames(match.participants, 2)
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `Amistoso: ${teamA} vs ${teamB}`,
      dates: `${toCalendarFloatingDate(start)}/${toCalendarFloatingDate(end)}`,
      ctz: calendarTimeZone,
      details: `Amistoso registrado en Smash & Lob\n${teamA} vs ${teamB}`,
    })

    if (match.locationName) params.set("location", match.locationName)
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }, [match])

  if (!calendarUrl) return null

  return (
    <a
      href={calendarUrl}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex w-full rounded-lg border border-neutral-950 bg-neutral-950 px-2.5 py-2 text-center text-xs font-black text-white transition active:scale-[0.99] items-center justify-center ${className ?? ""}`}
    >
      Añadir al calendario
    </a>
  )
}
