import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import {
  formatBestWinStreakRoundRange,
  getBestWinStreakRoundRange,
} from "@/lib/playerStreak"

function match(seasonId: string, round: number, win: boolean) {
  return {
    seasonId,
    round,
    status: "finished",
    teamA: ["me", "mate"],
    teamB: ["rival-1", "rival-2"],
    pointsA: win ? 3 : 0,
    pointsB: win ? 0 : 3,
    sets: [],
  }
}

describe("v1.6.9 profile streak detail and HOME round accent", () => {
  it("returns the rounds occupied by the best winning streak", () => {
    const matches = [
      match("s1", 1, false),
      match("s1", 2, true),
      match("s1", 3, true),
      match("s1", 4, true),
      match("s1", 5, false),
    ]

    expect(getBestWinStreakRoundRange(matches, "me")).toEqual({
      length: 3,
      startRound: 2,
      endRound: 4,
    })
    expect(formatBestWinStreakRoundRange(matches, "me")).toBe(
      "Jornada 2 – Jornada 4",
    )
  })

  it("does not join winning streaks from different seasons", () => {
    const matches = [
      match("s1", 6, true),
      match("s1", 7, true),
      match("s2", 1, true),
      match("s2", 2, false),
    ]

    expect(formatBestWinStreakRoundRange(matches, "me")).toBe(
      "Jornada 6 – Jornada 7",
    )
  })

  it("renders the round range as the third line in MEJOR RACHA", async () => {
    const panel = await readFile(
      "src/components/player/PlayerStatsPanel.tsx",
      "utf8",
    )

    expect(panel).toContain("data-best-streak-round-range")
    expect(panel).toContain(
      "formatBestWinStreakRoundRange(matches, playerId) ?? emptyValue",
    )
  })

  it("adds the accent specifically to the HOME JORNADAS slot", async () => {
    const [home, css] = await Promise.all([
      readFile("src/app/page.tsx", "utf8"),
      readFile("src/app/globals.css", "utf8"),
    ])

    expect(home).toContain(
      'className="home-leader-round-grid grid grid-cols-2 gap-3"',
    )
    expect(css).toContain(
      ".home-leader-round-grid > :nth-child(2) > .app-stat-card::before",
    )
    expect(css).toContain("background: var(--app-card-accent-gradient)")
  })
})
