import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  auditSeasonCalendar,
  generateBalancedCalendar,
  getSeasonCalendarAuditChecks,
  inferSeasonScheduleMode,
  isValidSeasonScheduleTarget,
} from "@/lib/calendar"

function players(playerCount: number) {
  return Array.from({ length: playerCount }, (_, index) => `player-${index + 1}`)
}

describe("v1.12.4 custom calendar audit and creation UX", () => {
  it("audits an 11-player 13-round custom season with the same point-by-point rules used by generation", () => {
    const playerIds = players(11)
    const matches = generateBalancedCalendar({
      leagueId: "league-v1124",
      seasonId: "season-11-13",
      playerIds,
      scheduleMode: "extended",
      targetRoundCount: 13,
    })

    expect(isValidSeasonScheduleTarget({
      playerCount: 11,
      mode: "extended",
      targetRoundCount: 13,
    })).toBe(true)
    expect(inferSeasonScheduleMode({ matches, playerCount: 11, totalRounds: 13 })).toBe("extended")

    const audit = auditSeasonCalendar({
      matches,
      playerIds,
      mode: "extended",
      expectedRoundCount: 13,
    })
    const checks = getSeasonCalendarAuditChecks(audit)

    expect(audit.roundCount).toBe(13)
    expect(audit.expectedMatchesPerRound).toBe(2)
    expect(audit.expectedByesPerRound).toBe(3)
    expect(audit.byeCountMax - audit.byeCountMin).toBeLessThanOrEqual(1)
    expect(audit.consecutiveByeCount).toBe(0)
    expect(audit.repeatedMatchCount).toBe(0)
    expect(checks.map((check) => check.key)).toEqual(expect.arrayContaining([
      "matchStructure",
      "roundMatchCount",
      "roundAppearanceCount",
      "byeRoundCount",
      "byePlayerCount",
      "consecutiveByes",
      "quartets",
      "partners",
      "opponents",
      "durationBalance",
      "modeStructure",
    ]))
  })

  it("keeps audit and reroll visible for every valid custom duration and separates creation decisions into independent cards", () => {
    const adminSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/admin/season/page.tsx"),
      "utf8",
    )

    expect(adminSource).toContain('mode: "extended",\n      targetRoundCount: activeSeason.totalRounds')
    expect(adminSource).toContain('matches.some((match) => match.seasonId === activeSeason.id)')
    expect(adminSource).not.toContain('[getSeasonBaseRoundCount(players.length), getSeasonBaseRoundCount(players.length) * 2].includes(activeSeason.totalRounds)')
    expect(adminSource).toContain("<BalancedCalendarAuditPanel")
    expect(adminSource).toContain("onClick={rerollCalendar}")
    expect(adminSource).toContain("data-season-calendar-type")
    expect(adminSource).toContain("data-season-duration")
    expect(adminSource).toContain("data-season-calendar-visibility")
  })
})
