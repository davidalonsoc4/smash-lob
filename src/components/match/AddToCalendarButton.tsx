"use client"

import { AppCard } from "@/components/ui/AppCard"
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

function toGoogleCalendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
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

  const start = new Date(scheduledAt)

  if (Number.isNaN(start.getTime())) {
    return null
  }

  const end = new Date(start.getTime() + 90 * 60 * 1000)
  const teamAName = getTeamDisplayName(teamA, players)
  const teamBName = getTeamDisplayName(teamB, players)
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${leagueName}: ${teamAName} vs ${teamBName}`,
    dates: `${toGoogleCalendarDate(start)}/${toGoogleCalendarDate(end)}`,
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
    <AppCard>
      <p className="font-bold">Añadir al calendario</p>
      <p className="mt-2 text-sm text-neutral-500">
        Crea el evento en Google Calendar con la fecha, hora, ubicación y parejas del partido.
      </p>

      <a
        href={calendarUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 block w-full rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white"
      >
        Añadir a Google Calendar
      </a>
    </AppCard>
  )
}
