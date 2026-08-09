import { describe, expect, it } from "vitest"
import {
  filterPersonalProfileMatches,
  getPersonalProfileStats,
} from "@/lib/personalProfileStats"
import type { PersonalMatchItem } from "@/lib/personalMatches"

function match(overrides: Partial<PersonalMatchItem> = {}): PersonalMatchItem {
  return {
    id: "match-1",
    origin: "league",
    status: "finished",
    scheduledAt: "2026-08-01T18:00:00.000Z",
    resultRecordedAt: "2026-08-01T20:00:00.000Z",
    locationName: "Padel Norte",
    sets: [
      { a: 6, b: 4 },
      { a: 6, b: 3 },
    ],
    participants: [
      { team: 1, slot: 1, displayName: "Davo", isCurrentUser: true },
      { team: 1, slot: 2, displayName: "Álvaro", isCurrentUser: false },
      { team: 2, slot: 1, displayName: "Unai", isCurrentUser: false },
      { team: 2, slot: 2, displayName: "Joseba", isCurrentUser: false },
    ],
    canManage: false,
    canDelete: false,
    leagueId: "league-a",
    leagueName: "Liga A",
    seasonId: "season-a1",
    seasonName: "Temporada 1",
    round: 1,
    ...overrides,
  }
}

describe("personal global profile statistics", () => {
  const items = [
    match(),
    match({
      id: "match-2",
      scheduledAt: "2026-08-02T18:00:00.000Z",
      sets: [
        { a: 4, b: 6 },
        { a: 3, b: 6 },
      ],
      seasonId: "season-a2",
      seasonName: "Temporada 2",
    }),
    match({
      id: "friendly-1",
      origin: "friendly",
      leagueId: null,
      leagueName: null,
      seasonId: null,
      seasonName: null,
      scheduledAt: "2026-08-03T18:00:00.000Z",
      sets: [
        { a: 6, b: 2 },
        { a: 6, b: 2 },
      ],
    }),
  ]

  it("filters friendlies, leagues and a specific league season", () => {
    expect(
      filterPersonalProfileMatches(items, {
        origin: "friendly",
        leagueId: null,
        seasonId: null,
      }).map((item) => item.id),
    ).toEqual(["friendly-1"])

    expect(
      filterPersonalProfileMatches(items, {
        origin: "league",
        leagueId: "league-a",
        seasonId: "season-a2",
      }).map((item) => item.id),
    ).toEqual(["match-2"])
  })

  it("aggregates only comparable match, set and game statistics", () => {
    const stats = getPersonalProfileStats(items)

    expect(stats.matchesPlayed).toBe(3)
    expect(stats.wins).toBe(2)
    expect(stats.losses).toBe(1)
    expect(stats.setsFor).toBe(4)
    expect(stats.setsAgainst).toBe(2)
    expect(stats.gamesFor).toBe(31)
    expect(stats.gamesAgainst).toBe(23)
    expect(stats.gamesDiff).toBe(8)
    expect(stats.bestWinStreak).toBe(1)
    expect(stats.currentWinStreak).toBe(1)
    expect(stats.mostFrequentTeammate?.name).toBe("Álvaro")
    expect(stats.mostFrequentTeammate?.matches).toBe(3)
    expect(stats.mostFrequentRival?.matches).toBe(3)
  })
})
