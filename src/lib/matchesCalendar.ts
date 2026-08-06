type CalendarSeasonStatus = "upcoming" | "active" | "finished"

type CalendarRound = {
  id: string
  status: string
}

export function getActiveCalendarRoundId(
  seasonStatus: CalendarSeasonStatus,
  rounds: CalendarRound[],
) {
  if (seasonStatus !== "active") {
    return null
  }

  return rounds.find((round) => round.status === "active")?.id ?? null
}
