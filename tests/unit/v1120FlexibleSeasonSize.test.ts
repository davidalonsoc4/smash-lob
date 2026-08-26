import { describe, expect, it } from "vitest"
import { auditSeasonCalendar, generateBalancedCalendar } from "@/lib/calendar"
import {
  MAX_SEASON_PLAYER_COUNT,
  MIN_SEASON_PLAYER_COUNT,
  getNextPerfectlyBalancedSeasonPlayerCount,
  isSeasonPlayerCountInRange,
  supportsPerfectlyBalancedSeason,
} from "@/lib/seasonPlayerCount"

describe("v1.12.0 flexible season size", () => {
  it("accepts 8-24 in the selector but only multiples of four for perfectly balanced creation", () => {
    expect(MIN_SEASON_PLAYER_COUNT).toBe(8)
    expect(MAX_SEASON_PLAYER_COUNT).toBe(24)

    for (let playerCount = 8; playerCount <= 24; playerCount += 1) {
      expect(isSeasonPlayerCountInRange(playerCount)).toBe(true)
      expect(supportsPerfectlyBalancedSeason(playerCount)).toBe(playerCount % 4 === 0)
    }

    expect(isSeasonPlayerCountInRange(7)).toBe(false)
    expect(isSeasonPlayerCountInRange(25)).toBe(false)
    expect(getNextPerfectlyBalancedSeasonPlayerCount(9)).toBe(12)
    expect(getNextPerfectlyBalancedSeasonPlayerCount(20)).toBe(20)
    expect(getNextPerfectlyBalancedSeasonPlayerCount(30)).toBe(24)
  })

  it.each([8, 12, 16, 20, 24])("generates a perfectly balanced single leg for %i players", (playerCount) => {
    const playerIds = Array.from({ length: playerCount }, (_, index) => `player-${index + 1}`)
    const matches = generateBalancedCalendar({
      leagueId: "league-v1120",
      seasonId: `season-${playerCount}`,
      playerIds,
      scheduleMode: "single",
    })
    const audit = auditSeasonCalendar({ matches, playerIds, mode: "single" })

    expect(matches).toHaveLength(((playerCount - 1) * playerCount) / 4)
    expect(audit.expectedMatchesPerRound).toBe(playerCount / 4)
    expect(audit.roundCount).toBe(playerCount - 1)
    expect(audit.invalidTeammatePairCount).toBe(0)
    expect(audit.invalidOpponentPairCount).toBe(0)
    expect(audit.isPerfectlyBalanced).toBe(true)
  })

  it.each([20, 24])("keeps double and extended calendars balanced for %i players", (playerCount) => {
    const playerIds = Array.from({ length: playerCount }, (_, index) => `player-${index + 1}`)

    for (const mode of ["double", "extended"] as const) {
      const matches = generateBalancedCalendar({
        leagueId: "league-v1120",
        seasonId: `season-${playerCount}-${mode}`,
        playerIds,
        scheduleMode: mode,
      })
      const audit = auditSeasonCalendar({ matches, playerIds, mode })
      expect(audit.isPerfectlyBalanced).toBe(true)
    }
  })
})
