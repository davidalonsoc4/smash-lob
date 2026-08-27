import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  auditSeasonCalendar,
  generateBalancedCalendar,
  getSeasonCalendarAuditChecks,
  getSeasonScheduleRoundCount,
} from "@/lib/calendar"
import {
  getDefaultSeasonPlayerCount,
  getSeasonBaseRoundCount,
  getSeasonByeCountPerRound,
  getSeasonMatchesPerRound,
  isSeasonPlayerCountInRange,
  seasonRequiresByes,
} from "@/lib/seasonPlayerCount"

const flexiblePlayerCounts = [9, 10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 23]

function playerIds(playerCount: number) {
  return Array.from({ length: playerCount }, (_, index) => `player-${index + 1}`)
}

describe("v1.12.1 balanced seasons with byes", () => {
  it("keeps the current roster size as the default instead of jumping to the next multiple of four", () => {
    expect(getDefaultSeasonPlayerCount(3)).toBe(8)
    expect(getDefaultSeasonPlayerCount(9)).toBe(9)
    expect(getDefaultSeasonPlayerCount(14)).toBe(14)
    expect(getDefaultSeasonPlayerCount(24)).toBe(24)
    expect(getDefaultSeasonPlayerCount(30)).toBe(24)
  })

  it.each(flexiblePlayerCounts)("accepts %i players and derives its balanced round structure", (playerCount) => {
    expect(isSeasonPlayerCountInRange(playerCount)).toBe(true)
    expect(seasonRequiresByes(playerCount)).toBe(true)
    expect(getSeasonBaseRoundCount(playerCount)).toBe(playerCount)
    expect(getSeasonMatchesPerRound(playerCount)).toBe(Math.floor(playerCount / 4))
    expect(getSeasonByeCountPerRound(playerCount)).toBe(playerCount % 4)
  })

  it.each(flexiblePlayerCounts)("generates a balanced single leg for %i players", (playerCount) => {
    const players = playerIds(playerCount)
    const matches = generateBalancedCalendar({
      leagueId: "league-v1121",
      seasonId: `season-${playerCount}`,
      playerIds: players,
      scheduleMode: "single",
    })
    const audit = auditSeasonCalendar({ matches, playerIds: players, mode: "single" })

    expect(matches).toHaveLength(playerCount * Math.floor(playerCount / 4))
    expect(audit.hasByes).toBe(true)
    expect(audit.roundCount).toBe(playerCount)
    expect(audit.expectedByesPerRound).toBe(playerCount % 4)
    expect(audit.expectedByesPerPlayer).toBe(playerCount % 4)
    expect(audit.invalidByeRoundCount).toBe(0)
    expect(audit.invalidByePlayerCount).toBe(0)
    expect(audit.consecutiveByeCount).toBe(0)
    expect(audit.repeatedTeammatePairCount).toBe(0)
    expect(audit.maxTeammatePairCount).toBe(1)
    expect(audit.maxOpponentPairCount).toBeLessThanOrEqual(3)
    expect(audit.repeatedQuartetCount).toBe(0)
    expect(audit.isBalanced).toBe(true)
    expect(audit.isPerfectlyBalanced).toBe(false)

    for (let round = 1; round <= playerCount; round += 1) {
      const appearances = new Set(
        matches.filter((match) => match.round === round).flatMap((match) => [...match.teamA, ...match.teamB]),
      )
      expect(players.filter((playerId) => !appearances.has(playerId))).toHaveLength(playerCount % 4)
    }
  })

  it.each(flexiblePlayerCounts)("keeps double and extended schedules balanced for %i players", (playerCount) => {
    const players = playerIds(playerCount)

    for (const mode of ["double", "extended"] as const) {
      const matches = generateBalancedCalendar({
        leagueId: "league-v1121",
        seasonId: `season-${playerCount}-${mode}`,
        playerIds: players,
        scheduleMode: mode,
      })
      const audit = auditSeasonCalendar({ matches, playerIds: players, mode })

      expect(audit.roundCount).toBe(getSeasonScheduleRoundCount({ playerCount, mode }))
      expect(audit.expectedByesPerPlayer).toBe((playerCount % 4) * 2)
      expect(audit.consecutiveByeCount).toBe(0)
      expect(audit.firstLegBalanced).toBe(true)
      expect(audit.secondLegBalanced).toBe(true)
      expect(audit.modeStructureCorrect).toBe(true)
      expect(audit.isBalanced).toBe(true)
    }
  })

  it("adapts the audit panel rules to seasons with and without byes", () => {
    const eightPlayers = playerIds(8)
    const eightAudit = auditSeasonCalendar({
      matches: generateBalancedCalendar({
        leagueId: "league-v1122",
        seasonId: "season-8-audit",
        playerIds: eightPlayers,
        scheduleMode: "single",
      }),
      playerIds: eightPlayers,
      mode: "single",
    })
    expect(getSeasonCalendarAuditChecks(eightAudit).map((check) => check.key)).toEqual([
      "matchStructure",
      "roundStructure",
      "partners",
      "opponents",
      "firstLeg",
    ])

    const tenPlayers = playerIds(10)
    const tenAudit = auditSeasonCalendar({
      matches: generateBalancedCalendar({
        leagueId: "league-v1122",
        seasonId: "season-10-audit",
        playerIds: tenPlayers,
        scheduleMode: "single",
      }),
      playerIds: tenPlayers,
      mode: "single",
    })
    expect(tenAudit.expectedOpponentCount).toBe(2)
    expect(getSeasonCalendarAuditChecks(tenAudit).map((check) => check.key)).toEqual([
      "matchStructure",
      "roundMatchCount",
      "roundAppearanceCount",
      "byeRoundCount",
      "byePlayerCount",
      "consecutiveByes",
      "quartets",
      "partners",
      "opponents",
      "firstLeg",
    ])
    expect(getSeasonCalendarAuditChecks(tenAudit).every((check) => check.ok)).toBe(true)
  })

  it("uses the player-count-specific opponent limit in flexible calendars", () => {
    for (const [playerCount, expectedLimit] of [[9, 3], [10, 2], [11, 2]] as const) {
      const players = playerIds(playerCount)
      const audit = auditSeasonCalendar({
        matches: generateBalancedCalendar({
          leagueId: "league-v1122",
          seasonId: `season-${playerCount}-opponents`,
          playerIds: players,
          scheduleMode: "single",
        }),
        playerIds: players,
        mode: "single",
      })
      expect(audit.expectedOpponentCount).toBe(expectedLimit)
    }
  })

  it("uses the flexible round-count rule in finished labels and the local initial-season fallback", () => {
    const adminSeasonSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/admin/season/page.tsx"),
      "utf8",
    )
    const seasonProviderSource = fs.readFileSync(
      path.join(process.cwd(), "src/context/SeasonSettingsProvider.tsx"),
      "utf8",
    )

    expect(adminSeasonSource).toContain(
      "const baseRoundCount = getSeasonBaseRoundCount(playerCount);",
    )
    expect(seasonProviderSource).toContain(
      "playerCount: cleanPlayerNames.length",
    )
    expect(seasonProviderSource).not.toContain(
      "totalRounds: Math.max(cleanPlayerNames.length - 1, 1)",
    )
  })

})
