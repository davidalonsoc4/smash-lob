"use client"

import { useMemo, useState } from "react"
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
  className?: string
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

function toCalendarFloatingDate(value: Date) {
  return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(
    value.getDate()
  )}T${pad(value.getHours())}${pad(value.getMinutes())}${pad(
    value.getSeconds()
  )}`
}

function toUtcCalendarDate(value: Date) {
  return `${value.getUTCFullYear()}${pad(value.getUTCMonth() + 1)}${pad(
    value.getUTCDate()
  )}T${pad(value.getUTCHours())}${pad(value.getUTCMinutes())}${pad(
    value.getUTCSeconds()
  )}Z`
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

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

  const start = parseScheduleAsLocalDate(scheduledAt)

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

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smash & Lob//Match Calendar//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${encodeURIComponent(`${leagueName}-${seasonName}-${round}-${teamAName}-${teamBName}`)}@smash-lob`,
    `DTSTAMP:${toUtcCalendarDate(new Date())}`,
    `DTSTART;TZID=${calendarTimeZone}:${toCalendarFloatingDate(start)}`,
    `DTEND;TZID=${calendarTimeZone}:${toCalendarFloatingDate(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => Boolean(line))

  return {
    googleUrl: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
    icsUrl: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsLines.join("\r\n"))}`,
    fileName: `smash-lob-jornada-${round}.ics`,
  }
}

export function AddToCalendarButton(props: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const calendarData = useMemo(() => getCalendarData(props), [props])

  if (!calendarData) {
    return null
  }

  return (
    <div className={props.className ?? "mt-2"}>
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-black text-neutral-800 transition active:scale-[0.99]"
      >
        <span>Añadir al calendario</span>
        <span aria-hidden="true" className="text-sm leading-none">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen ? (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a
            href={calendarData.googleUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-center text-xs font-black text-neutral-800 transition active:scale-[0.99]"
          >
            Google
          </a>
          <a
            href={calendarData.icsUrl}
            download={calendarData.fileName}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-center text-xs font-black text-neutral-800 transition active:scale-[0.99]"
          >
            Móvil / iCal
          </a>
        </div>
      ) : null}
    </div>
  )
}
