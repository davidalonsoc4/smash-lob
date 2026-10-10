import { expect, it } from "vitest"
import { auditSeasonCalendar, generateBalancedCalendar, getSeasonMaxRoundCount, isOptimizedCustomSeasonCalendar } from "@/lib/calendar"
import { getSeasonBaseRoundCount } from "@/lib/seasonPlayerCount"

it("supports advertised extended boundaries independently of the lexical player IDs", () => {
  for (let count = 8; count <= 24; count++) {
    const playerIds = Array.from({ length: count }, (_, i) => `qa-p-${i}`)
    const base = getSeasonBaseRoundCount(count), maximum = getSeasonMaxRoundCount(count)
    for (const targetRoundCount of new Set([1, base - 1, base + 1, maximum - 1, maximum])) {
      const matches = generateBalancedCalendar({ leagueId: "fixture", seasonId: `fixture-${count}-${targetRoundCount}`, playerIds, scheduleMode: "extended", targetRoundCount })
      const audit = auditSeasonCalendar({ matches, playerIds, mode: "extended", expectedRoundCount: targetRoundCount })
      expect(audit.isBalanced || isOptimizedCustomSeasonCalendar(audit), `${count} players / ${targetRoundCount} rounds`).toBe(true)
      expect(audit.roundCount).toBe(targetRoundCount)
      expect(audit.repeatedMatchCount).toBe(0)
      expect(matches.every((match) => [...match.teamA, ...match.teamB].every((id) => playerIds.includes(id)))).toBe(true)
    }
  }
}, 120_000)
