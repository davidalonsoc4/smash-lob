"use client"

import { getTeamDisplayName } from "@/lib/players"
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
}

const eventDurationMinutes = 120
const calendarTimeZone = "Europe/Madrid"

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function parseScheduleAsLocalDate(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/
  )

  if (!match) {
    return null
  }

  const [, year, month, day, hour, minute, second = "00"] = match
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  )

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function toGoogleCalendarFloatingDate(value: Date) {
  return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(
    value.getDate()
  )}T${pad(value.getHours())}${pad(value.getMinutes())}${pad(
    value.getSeconds()
  )}`
}

function getGoogleCalendarUrl({
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

  const start = parseScheduleAsLocalDate(scheduledAt)

  if (!start) {
    return null
  }

  const end = new Date(start.getTime() + eventDurationMinutes * 60 * 1000)
  const teamAName = getTeamDisplayName(teamA, players)
  const teamBName = getTeamDisplayName(teamB, players)
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${leagueName}: ${teamAName} vs ${teamBName}`,
    dates: `${toGoogleCalendarFloatingDate(start)}/${toGoogleCalendarFloatingDate(
      end
    )}`,
    ctz: calendarTimeZone,
    details: `${leagueName} - ${seasonName}\nJornada ${round}\n${teamAName} vs ${teamBName}`,
  })

  if (location) {
    params.set("location", location)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function AddToCalendarButton(props: AddToCalendarButtonProps) {
  const calendarUrl = getGoogleCalendarUrl(props)

  if (!calendarUrl) {
    return null
  }

  return (
    <a
      href={calendarUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-4 block w-full rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white"
    >
      Añadir a Google Calendar
    </a>
  )
}
