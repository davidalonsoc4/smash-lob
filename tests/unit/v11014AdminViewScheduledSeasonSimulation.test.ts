import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { isScheduledSeasonHomeLocked } from "@/lib/seasonScheduling"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.14 admin/player scheduled-season simulation", () => {
  it("distinguishes real admin role from the active admin-view mode", async () => {
    const access = await read("src/context/LeagueAccessProvider.tsx")

    expect(access).toContain("getLeagueExperienceMode")
    expect(access).toContain("usesPlayerExperience")
    expect(access).toContain(
      'mode === "admin" || (mode === "player_experience" && adminSnapshotContext)',
    )

    const scheduled = "2026-09-26T08:00:00.000Z"

    // Admin experience => the UI passes true and bypasses the player lock.
    expect(isScheduledSeasonHomeLocked("upcoming", scheduled, true)).toBe(false)

    // Player/player-experience competition view => false and behaves as a normal player.
    expect(isScheduledSeasonHomeLocked("upcoming", scheduled, false)).toBe(true)

    // A normal player also passes false and remains locked.
    expect(isScheduledSeasonHomeLocked("upcoming", scheduled, false)).toBe(true)
  })

  it("uses the effective competition-admin experience for scheduled-season client bypasses", async () => {
    const [home, shell, matches, detail, chat, currentData] = await Promise.all([
      read("src/app/page.tsx"),
      read("src/components/layout/AppShell.tsx"),
      read("src/app/matches/page.tsx"),
      read("src/app/match/[id]/page.tsx"),
      read("src/app/match/[id]/chat/page.tsx"),
      read("src/hooks/useCurrentLeagueData.ts"),
    ])

    expect(home).toContain(
      "isPlayerSeasonLocked = isSeasonUpcoming && !canManageSeason",
    )
    expect(matches).toContain(
      "isPlayerSeasonLocked = isSeasonUpcoming && !canManageSeason",
    )
    expect(detail).toContain(
      "isPlayerSeasonLocked = isSeasonUpcoming && !isAdmin",
    )
    expect(shell).toContain(
      "activeRoundSettings.scheduledStartAt,\n        competitionAdmin,",
    )
    expect(chat).toContain(
      'activeSeason.status === "upcoming" && !isLeagueAdmin(activeLeague.id)',
    )
    expect(currentData).toContain(
      "canManageLeague = isLeagueAdmin(activeLeague.id)",
    )

    expect(home).not.toContain(
      "isPlayerSeasonLocked = isSeasonUpcoming && !hasAdminRole",
    )
    expect(matches).not.toContain(
      "isPlayerSeasonLocked = isSeasonUpcoming && !hasAdminRole",
    )
    expect(detail).not.toContain(
      "isPlayerSeasonLocked = isSeasonUpcoming && !hasAdminRole",
    )
    expect(chat).not.toContain(
      'activeSeason.status === "upcoming" && !hasLeagueAdminRole(activeLeague.id)',
    )
  })

  it("still shows the scheduled countdown in HOME in both admin and simulated-player views", async () => {
    const home = await read("src/app/page.tsx")

    expect(home).toContain(
      'isSeasonScheduled && scheduledHomeStage === "countdown"',
    )
    expect(home).toContain(
      "scheduledStartAt={roundSettings.scheduledStartAt}",
    )
    expect(home).toContain(
      "{isSeasonScheduled && !showScheduledCountdownHero ? (",
    )
  })
})
