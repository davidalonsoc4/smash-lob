import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  auditSeasonCalendar,
  generateBalancedCalendar,
  getSeasonMaxBalancedLegCount,
  getSeasonMaxRoundCount,
  inferSeasonScheduleMode,
  isOptimizedCustomSeasonCalendar,
  isValidSeasonScheduleTarget,
} from "@/lib/calendar"
import { getSeasonBaseRoundCount } from "@/lib/seasonPlayerCount"

function players(playerCount: number) {
  return Array.from({ length: playerCount }, (_, index) => `player-${index + 1}`)
}

describe("v1.12.3 flexible season duration", () => {
  it("supports arbitrary custom durations inside the calculated balanced ceiling", () => {
    const playerCount = 10
    const maximum = getSeasonMaxRoundCount(playerCount)

    expect(getSeasonBaseRoundCount(playerCount)).toBe(10)
    expect(getSeasonMaxBalancedLegCount(playerCount)).toBe(7)
    expect(maximum).toBe(70)
    expect(isValidSeasonScheduleTarget({ playerCount, mode: "extended", targetRoundCount: 1 })).toBe(true)
    expect(isValidSeasonScheduleTarget({ playerCount, mode: "extended", targetRoundCount: 16 })).toBe(true)
    expect(isValidSeasonScheduleTarget({ playerCount, mode: "extended", targetRoundCount: 70 })).toBe(true)
    expect(isValidSeasonScheduleTarget({ playerCount, mode: "extended", targetRoundCount: 71 })).toBe(false)
    expect(isValidSeasonScheduleTarget({ playerCount, mode: "single", targetRoundCount: 16 })).toBe(false)
    expect(isValidSeasonScheduleTarget({ playerCount, mode: "double", targetRoundCount: 20 })).toBe(true)
  })

  it.each([
    [14, 10],
    [10, 16],
  ] as const)("generates a fully balanced custom calendar for %i players and %i rounds", (playerCount, targetRoundCount) => {
    const playerIds = players(playerCount)
    const matches = generateBalancedCalendar({
      leagueId: "league-v1123",
      seasonId: `season-${playerCount}-${targetRoundCount}`,
      playerIds,
      scheduleMode: "extended",
      targetRoundCount,
    })
    const audit = auditSeasonCalendar({
      matches,
      playerIds,
      mode: "extended",
      expectedRoundCount: targetRoundCount,
    })

    expect(audit.roundCount).toBe(targetRoundCount)
    expect(audit.isBalanced).toBe(true)
    expect(audit.playerMatchCountMax - audit.playerMatchCountMin).toBeLessThanOrEqual(1)
    expect(audit.byeCountMax - audit.byeCountMin).toBeLessThanOrEqual(1)
    expect(audit.consecutiveByeCount).toBe(0)
    expect(audit.repeatedMatchCount).toBe(0)
  })

  it("recognizes an exact custom multiple as two complete remixed balanced legs", () => {
    const playerIds = players(10)
    const matches = generateBalancedCalendar({
      leagueId: "league-v1123",
      seasonId: "season-10-20",
      playerIds,
      scheduleMode: "extended",
      targetRoundCount: 20,
    })
    const audit = auditSeasonCalendar({ matches, playerIds, mode: "extended", expectedRoundCount: 20 })

    expect(audit.isBalanced).toBe(true)
    expect(audit.completeLegCount).toBe(2)
    expect(audit.partialRoundCount).toBe(0)
    expect(audit.repeatedMatchCount).toBe(0)
    expect(inferSeasonScheduleMode({ matches, playerCount: 10, totalRounds: 20 })).toBe("extended")
  })

  it("accepts a structurally optimal custom duration when perfect bye equality is not achievable by the selected partial leg", () => {
    const playerIds = players(23)
    const matches = generateBalancedCalendar({
      leagueId: "league-v1123",
      seasonId: "season-23-11",
      playerIds,
      scheduleMode: "extended",
      targetRoundCount: 11,
    })
    const audit = auditSeasonCalendar({ matches, playerIds, mode: "extended", expectedRoundCount: 11 })

    expect(audit.isBalanced).toBe(false)
    expect(isOptimizedCustomSeasonCalendar(audit)).toBe(true)
    expect(audit.consecutiveByeCount).toBe(0)
    expect(audit.repeatedMatchCount).toBe(0)
    expect(audit.invalidTeammatePairCount).toBe(0)
    expect(audit.invalidOpponentPairCount).toBe(0)
  })

  it.each([
    [8, 5], [9, 7], [10, 7], [11, 8], [12, 7], [13, 6], [14, 7], [15, 10],
    [16, 8], [17, 9], [18, 11], [19, 9], [20, 9], [21, 9], [22, 11], [23, 12], [24, 9],
  ] as const)("keeps the verified maximum of %i players at x%i complete legs", (playerCount, maxLegs) => {
    expect(getSeasonMaxBalancedLegCount(playerCount)).toBe(maxLegs)
    expect(getSeasonMaxRoundCount(playerCount)).toBe(getSeasonBaseRoundCount(playerCount) * maxLegs)
  })

  it("generates a complete balanced calendar at every advertised maximum", () => {
    for (let playerCount = 8; playerCount <= 24; playerCount += 1) {
      const playerIds = players(playerCount)
      const targetRoundCount = getSeasonMaxRoundCount(playerCount)
      const matches = generateBalancedCalendar({
        leagueId: "league-v1123-max",
        seasonId: `season-${playerCount}-max`,
        playerIds,
        scheduleMode: "extended",
        targetRoundCount,
      })
      const audit = auditSeasonCalendar({
        matches,
        playerIds,
        mode: "extended",
        expectedRoundCount: targetRoundCount,
      })

      expect(audit.roundCount).toBe(targetRoundCount)
      expect(audit.partialRoundCount).toBe(0)
      expect(audit.isBalanced).toBe(true)
      expect(audit.repeatedMatchCount).toBe(0)
    }
  }, 30_000)

  it("wires custom duration, expansion and the atomic resize migration through the product flow", () => {
    const adminSource = fs.readFileSync(path.join(process.cwd(), "src/app/admin/season/page.tsx"), "utf8")
    const apiSource = fs.readFileSync(path.join(process.cwd(), "src/app/api/leagues/[id]/seasons/route.ts"), "utf8")
    const repairSource = fs.readFileSync(path.join(process.cwd(), "src/app/api/leagues/[id]/seasons/[seasonId]/repair-calendar/route.ts"), "utf8")
    const migration = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/20260826002000_resize_balanced_season_calendar.sql"), "utf8")

    expect(adminSource).toContain('type SeasonDurationMode = "complete" | "custom"')
    expect(adminSource).toContain("expandToDoubleRound")
    expect(adminSource).toContain("expandToLongSeason")
    expect(apiSource).toContain("targetRoundCount")
    expect(repairSource).toContain("targetRoundCount")
    expect(migration).toContain("resize_season_calendar_matches")
    expect(migration).toContain("season_calendar_resize_has_results")
    expect(migration).toContain("update public.seasons")
    expect(migration).toContain("update public.season_settings")
  })
})
