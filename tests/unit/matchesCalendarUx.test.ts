import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { getActiveCalendarRoundId } from "@/lib/matchesCalendar"

const rounds = [
  { id: "round-1", status: "completed" },
  { id: "round-2", status: "active" },
  { id: "round-3", status: "upcoming" },
]

describe("calendar screen usability", () => {
  it("focuses only the active round of an active season", () => {
    expect(getActiveCalendarRoundId("active", rounds)).toBe("round-2")
    expect(getActiveCalendarRoundId("finished", rounds)).toBeNull()
    expect(getActiveCalendarRoundId("upcoming", rounds)).toBeNull()
  })

  it("keeps the view selector compact and marks the active round", () => {
    const source = readFileSync("src/app/matches/page.tsx", "utf8")

    expect(source).toContain('className="flex items-center gap-2 overflow-x-auto"')
    expect(source).toContain(
      'data-active-round={round.id === activeRoundId ? "true" : undefined}',
    )
    expect(source).toContain('activeRoundRef.current?.scrollIntoView({')
    expect(source).not.toContain("Solo tus partidos en esta temporada.")
    expect(source).not.toContain("Todos los partidos de la liga.")
  })
})
