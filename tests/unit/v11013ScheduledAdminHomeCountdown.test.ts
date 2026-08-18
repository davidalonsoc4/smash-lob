import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.13 scheduled admin HOME countdown", () => {
  it("keeps scheduled HOME presentation independent from whether VISTA ADMIN bypasses navigation", async () => {
    const [home, shell] = await Promise.all([
      read("src/app/page.tsx"),
      read("src/components/layout/AppShell.tsx"),
    ])

    expect(home).toContain(
      'isPlayerSeasonLocked = isSeasonUpcoming && !canManageSeason',
    )
    expect(shell).toContain("isScheduledSeasonHomeLocked(")
    expect(shell).toContain("canAccessAdmin")

    expect(home).toContain(
      'isSeasonScheduled && scheduledHomeStage === "countdown"',
    )
    expect(home).toContain(
      'isSeasonScheduled && scheduledHomeStage === "registration"',
    )
    expect(home).toContain(
      'isSeasonScheduled && scheduledHomeStage === "roster"',
    )
    expect(home).toContain(
      "{isSeasonScheduled && !showScheduledCountdownHero ? (",
    )
    expect(home).toContain(
      "<SeasonStartCountdown scheduledStartAt={roundSettings.scheduledStartAt} hero />",
    )

    expect(home).not.toContain(
      'isPlayerSeasonLocked && isSeasonScheduled && scheduledHomeStage === "countdown"',
    )
    expect(home).not.toContain(
      "{isPlayerSeasonLocked && isSeasonScheduled && !showScheduledCountdownHero ? (",
    )

    expect(home).toContain(
      "{!isSeasonClosed && !isPlayerSeasonLocked ? (",
    )
  })
})
