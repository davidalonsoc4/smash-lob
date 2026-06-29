"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { allMatches } from "@/data/fakeData"

export type MatchStatus = "finished" | "scheduling" | "scheduled" | "postponed"

export type MatchData = {
  id: string
  leagueId: string
  seasonId: string
  round: number
  status: MatchStatus
  teamA: string[]
  teamB: string[]
  pointsA: number | null
  pointsB: number | null
  sets: { a: number; b: number }[]
  scheduledAt: string | null
  dateLabel: string | null
  location: string | null
  resultRecordedAt: string | null
}

type MatchScheduleInput = {
  scheduledAt: string
  location: string
}

type MatchResultInput = {
  sets: { a: number; b: number }[]
}

type MatchDataContextValue = {
  matches: MatchData[]
  updateMatchSchedule: (matchId: string, schedule: MatchScheduleInput) => void
  postponeMatch: (matchId: string) => void
  finishMatch: (matchId: string, result: MatchResultInput) => void
}

type MatchDataProviderProps = {
  children: React.ReactNode
}

const MatchDataContext = createContext<MatchDataContextValue | null>(null)

const storageKey = "smash-lob-matches"

function normalizeMatch(match: (typeof allMatches)[number]): MatchData {
  return {
    id: match.id,
    leagueId: match.leagueId,
    seasonId: match.seasonId,
    round: match.round,
    status: match.status as MatchStatus,
    teamA: [...match.teamA],
    teamB: [...match.teamB],
    pointsA: match.pointsA,
    pointsB: match.pointsB,
    sets: match.sets.map((set) => ({ ...set })),
    scheduledAt: match.scheduledAt,
    dateLabel: match.dateLabel,
    location: match.location,
    resultRecordedAt: match.resultRecordedAt ?? null,
  }
}

function getInitialMatches() {
  return allMatches.map(normalizeMatch)
}

function formatScheduleDateLabel(scheduledAt: string) {
  const date = new Date(scheduledAt)

  if (Number.isNaN(date.getTime())) {
    return scheduledAt
  }

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function sanitizePostponedMatch(match: MatchData): MatchData {
  if (match.status !== "postponed") {
    return match
  }

  return {
    ...match,
    scheduledAt: null,
    dateLabel: null,
    location: null,
  }
}

function calculateResultPoints(sets: { a: number; b: number }[]) {
  const pointsA = sets.filter((set) => set.a > set.b).length
  const pointsB = sets.filter((set) => set.b > set.a).length

  return {
    pointsA,
    pointsB,
  }
}

function parseStoredMatches(value: string | null): MatchData[] | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return null
    }

    const initialMatches = getInitialMatches()

    return initialMatches.map((initialMatch) => {
      const storedMatch = parsed.find(
        (item: Partial<MatchData>) => item.id === initialMatch.id
      ) as Partial<MatchData> | undefined

      if (!storedMatch) {
        return initialMatch
      }

      const mergedMatch = {
        ...initialMatch,
        ...storedMatch,
        scheduledAt: storedMatch.scheduledAt ?? initialMatch.scheduledAt,
        dateLabel: storedMatch.dateLabel ?? initialMatch.dateLabel,
        location: storedMatch.location ?? initialMatch.location,
        resultRecordedAt:
          storedMatch.resultRecordedAt ?? initialMatch.resultRecordedAt,
      }

      return sanitizePostponedMatch(mergedMatch)
    })
  } catch {
    return null
  }
}

export function MatchDataProvider({ children }: MatchDataProviderProps) {
  const [matches, setMatches] = useState<MatchData[]>(getInitialMatches)

  useEffect(() => {
    const storedMatches = parseStoredMatches(
      window.localStorage.getItem(storageKey)
    )

    if (storedMatches) {
      window.setTimeout(() => {
        setMatches(storedMatches)
        window.localStorage.setItem(storageKey, JSON.stringify(storedMatches))
      }, 0)
    }
  }, [])

  function updateMatchSchedule(matchId: string, schedule: MatchScheduleInput) {
    setMatches((currentMatches) => {
      const nextMatches = currentMatches.map((match) => {
        if (match.id !== matchId) {
          return match
        }

        return {
          ...match,
          status:
            match.status === "finished"
              ? "finished"
              : ("scheduled" as MatchStatus),
          scheduledAt: schedule.scheduledAt,
          dateLabel: formatScheduleDateLabel(schedule.scheduledAt),
          location: schedule.location,
        }
      })

      window.localStorage.setItem(storageKey, JSON.stringify(nextMatches))

      return nextMatches
    })
  }

  function postponeMatch(matchId: string) {
    setMatches((currentMatches) => {
      const nextMatches = currentMatches.map((match) => {
        if (match.id !== matchId || match.status === "finished") {
          return match
        }

        return {
          ...match,
          status: "postponed" as MatchStatus,
          scheduledAt: null,
          dateLabel: null,
          location: null,
        }
      })

      window.localStorage.setItem(storageKey, JSON.stringify(nextMatches))

      return nextMatches
    })
  }

  function finishMatch(matchId: string, result: MatchResultInput) {
    setMatches((currentMatches) => {
      const nextMatches = currentMatches.map((match) => {
        if (match.id !== matchId) {
          return match
        }

        const points = calculateResultPoints(result.sets)

        return {
          ...match,
          status: "finished" as MatchStatus,
          sets: result.sets,
          pointsA: points.pointsA,
          pointsB: points.pointsB,
          resultRecordedAt: new Date().toISOString(),
        }
      })

      window.localStorage.setItem(storageKey, JSON.stringify(nextMatches))

      return nextMatches
    })
  }

  const value = useMemo(
    () => ({
      matches,
      updateMatchSchedule,
      postponeMatch,
      finishMatch,
    }),
    [matches]
  )

  return (
    <MatchDataContext.Provider value={value}>
      {children}
    </MatchDataContext.Provider>
  )
}

export function useMatchData() {
  const context = useContext(MatchDataContext)

  if (!context) {
    throw new Error("useMatchData must be used inside MatchDataProvider")
  }

  return context
}
