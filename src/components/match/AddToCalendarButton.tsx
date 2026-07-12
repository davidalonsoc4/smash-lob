"use client"

import { useMemo } from "react"
import { getTeamDisplayName } from "@/lib/players"
import { parseMatchScheduleDate, toCalendarFloatingDate } from "@/lib/matchScheduleTime"
import type { PlayerProfile } from "@/data/fakeData"

type AddToCalendarButtonProps = {
  leagueName: string
  seasonName: string
  round: number
  teamA: string[]
  teamB: string[]
  players: PlayerProfile[]
  scheduledAt: string | null
  location: string | null
  className?: string
}

const eventDurationMinutes = 120
const calendarTimeZone = "Europe/Madrid"

function getCalendarData({
  leagueName,
  seasonName,
  round,
  teamA,
  teamB,
  players,
  scheduledAt,
  location,
}: AddToCalendarButtonProps) {
  if (!scheduledAt) {
    return null
  }

  const start = parseMatchScheduleDate(scheduledAt)

  if (!start) {
    return null
  }

  const end = new Date(start.getTime() + eventDurationMinutes * 60 * 1000)
  const teamAName = getTeamDisplayName(teamA, players)
  const teamBName = getTeamDisplayName(teamB, players)
  const title = `${leagueName}: ${teamAName} vs ${teamBName}`
  const description = `${leagueName} - ${seasonName}\nJornada ${round}\n${teamAName} vs ${teamBName}`
  const googleParams = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toCalendarFloatingDate(start)}/${toCalendarFloatingDate(end)}`,
    ctz: calendarTimeZone,
    details: description,
  })

  if (location) {
    googleParams.set("location", location)
  }

  return {
    googleUrl: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
  }
}

export function AddToCalendarButton(props: AddToCalendarButtonProps) {
  const calendarData = useMemo(() => getCalendarData(props), [props])

  if (!calendarData) {
    return null
  }

  return (
    <div className={props.className ?? "mt-2"}>
      <a
        href={calendarData.googleUrl}
        target="_blank"
        rel="noreferrer"
        className="block w-full rounded-xl border border-neutral-950 bg-neutral-950 px-2.5 py-2 text-center text-xs font-black text-white transition active:scale-[0.99]"
      >
        Añadir al calendario
      </a>
    </div>
  )
}
