import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import type { Season } from "@/data/fakeData"
import { getNewSeasonToOffer } from "@/lib/seasonSelection"

const season = (id: string, createdAt: string, leagueId = "l1"): Season => ({ id, leagueId, name: id, status: "active", totalRounds: 4, completedRounds: 0, createdAt })
const seasons = [season("s1", "2026-01-01T00:00:00Z"), season("s2", "2026-06-01T00:00:00Z"), season("x1", "2026-09-01T00:00:00Z", "l2")]

describe("first visit to a new season", () => {
  it("offers the newest season the player takes part in when it is not the last one seen", () => {
    expect(getNewSeasonToOffer({ seasons, leagueId: "l1", participatingSeasonIds: new Set(["s1", "s2"]), canManage: false, seenSeasonId: "s1" })).toBe("s2")
    expect(getNewSeasonToOffer({ seasons, leagueId: "l1", participatingSeasonIds: new Set(["s1", "s2"]), canManage: false, seenSeasonId: null })).toBe("s2")
  })

  it("does nothing once the newest season was already offered, so the player keeps the season they choose", () => {
    expect(getNewSeasonToOffer({ seasons, leagueId: "l1", participatingSeasonIds: new Set(["s1", "s2"]), canManage: false, seenSeasonId: "s2" })).toBeNull()
  })

  it("ignores seasons the player does not take part in, but not for who manages the league", () => {
    expect(getNewSeasonToOffer({ seasons, leagueId: "l1", participatingSeasonIds: new Set(["s1"]), canManage: false, seenSeasonId: "s1" })).toBeNull()
    expect(getNewSeasonToOffer({ seasons, leagueId: "l1", participatingSeasonIds: new Set(), canManage: true, seenSeasonId: "s1" })).toBe("s2")
  })

  it("ignores the seasons of other leagues and returns null when there are none", () => {
    expect(getNewSeasonToOffer({ seasons, leagueId: "l3", participatingSeasonIds: new Set(["x1"]), canManage: true, seenSeasonId: null })).toBeNull()
  })

  it("is wired in the app shell, skipping spectators and invite routes", () => {
    const shell = readFileSync("src/components/layout/AppShell.tsx", "utf8")
    expect(shell).toContain("getNewSeasonToOffer")
    expect(shell).toContain("writeSelectedSeasonId(activeLeagueId, offered)")
    expect(shell).toMatch(/spectatorMode \|\| !activeLeagueId \|\| isInviteRoute \|\| isSpectateRoute/)
  })
})
