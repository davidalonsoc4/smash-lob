import { describe, expect, it } from "vitest"
import type { Season } from "@/data/fakeData"
import { getNewestLeagueSeasons } from "@/lib/seasonSelection"

const season = (id: string, name: string, createdAt?: string): Season => ({
  id, name, createdAt, leagueId: "league", status: "finished", totalRounds: 1, completedRounds: 1,
})
describe("season picker creation order", () => {
  it("ignores names, input order and status while isolating the league", () => {
    const input = [
      season("newest", "Temporada 1", "2026-10-08T12:00:00Z"),
      season("oldest", "Z verano", "2025-01-01T00:00:00Z"),
      { ...season("other", "Otra liga", "2027-01-01T00:00:00Z"), leagueId: "other" },
      { ...season("middle", "Temporada 99", "2026-02-01T00:00:00Z"), status: "upcoming" as const },
    ]
    expect(getNewestLeagueSeasons(input, "league").map(s => s.id)).toEqual(["newest", "middle", "oldest"])
    expect(input[0].id).toBe("newest")
  })
  it("retains newest first creation order in older snapshots without dates", () => {
    expect(getNewestLeagueSeasons([season("first", "Z"), season("last", "A")], "league").map(s => s.id)).toEqual(["last", "first"])
  })
})
