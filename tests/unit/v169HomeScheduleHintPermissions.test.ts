import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.6.9 HOME schedule hint permissions", () => {
  it("keeps the league-wide next match while showing the scheduling hint only to participants", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")

    expect(home).toContain(
      'effectiveNextMatchScope === "mine" ? nextMatch : leagueNextMatch',
    )
    expect(home).toContain("const canShowSelectedNextMatchScheduleHint =")
    expect(home).not.toContain("canManageSeason ||\n      selectedNextMatch.teamA.includes(currentUserId)")
    expect(home).toContain("selectedNextMatch.teamA.includes(currentUserId)")
    expect(home).toContain("selectedNextMatch.teamB.includes(currentUserId)")
    expect(home).toContain(
      "showMissingScheduleHint={canShowSelectedNextMatchScheduleHint}",
    )
  })

  it("does not leave the HOME scheduling hint enabled unconditionally", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")
    expect(home).not.toMatch(/^\s*showMissingScheduleHint\s*$/m)
  })

  it("keeps the existing HOME match card instead of hiding league matches from non-participants", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")
    expect(home).toContain("{selectedNextMatch ? (")
    expect(home).toContain("match={selectedNextMatch}")
    expect(home).toContain('effectiveNextMatchScope === "league"')
  })
})
