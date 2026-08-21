import { describe, expect, it } from "vitest"
import {
  filterPersonalProfileMatches,
  getPersonalProfileHeadToHead,
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
    sets: [{ a: 6, b: 4 }, { a: 6, b: 3 }],
    participants: [
      { team: 1, slot: 1, displayName: "Davo", isCurrentUser: true, personKey: "user:self" },
      { team: 1, slot: 2, displayName: "Álvaro", isCurrentUser: false, personKey: "user:alvaro", profilePlayerId: "player-alvaro", profileLeagueId: "league-a" },
      { team: 2, slot: 1, displayName: "Unai", isCurrentUser: false, personKey: "user:unai" },
      { team: 2, slot: 2, displayName: "Joseba", isCurrentUser: false, personKey: "player:joseba" },
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

const items = [
  match(),
  match({
    id: "match-2",
    scheduledAt: "2026-08-02T18:00:00.000Z",
    sets: [{ a: 4, b: 6 }, { a: 6, b: 3 }, { a: 3, b: 6 }],
    participants: [
      { team: 1, slot: 1, displayName: "Davo", isCurrentUser: true, personKey: "user:self" },
      { team: 1, slot: 2, displayName: "Álvaro", isCurrentUser: false, personKey: "user:alvaro" },
      { team: 2, slot: 1, displayName: "Unai", isCurrentUser: false, personKey: "user:unai" },
      { team: 2, slot: 2, displayName: "Joseba", isCurrentUser: false, personKey: "player:joseba" },
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
    round: null,
    scheduledAt: "2026-08-03T18:00:00.000Z",
    sets: [{ a: 2, b: 6 }, { a: 6, b: 2 }, { a: 6, b: 3 }],
    participants: [
      { team: 1, slot: 1, displayName: "Davo", isCurrentUser: true, personKey: "user:self" },
      { team: 1, slot: 2, displayName: "Unai", isCurrentUser: false, personKey: "user:unai" },
      { team: 2, slot: 1, displayName: "Álvaro", isCurrentUser: false, personKey: "user:alvaro" },
      { team: 2, slot: 2, displayName: "Alex", isCurrentUser: false, personKey: "external:alex" },
    ],
  }),
]

describe("personal global profile statistics", () => {
  it("filters friendlies, leagues and a specific league season", () => {
    expect(filterPersonalProfileMatches(items, { origin: "friendly", leagueId: null, seasonId: null }).map((item) => item.id)).toEqual(["friendly-1"])
    expect(filterPersonalProfileMatches(items, { origin: "league", leagueId: "league-a", seasonId: "season-a2" }).map((item) => item.id)).toEqual(["match-2"])
  })

  it("calculates performance, streaks, deciding sets and relation rankings", () => {
    const stats = getPersonalProfileStats(items)

    expect(stats.matchesPlayed).toBe(3)
    expect(stats.wins).toBe(2)
    expect(stats.losses).toBe(1)
    expect(stats.decidingSetMatches).toBe(2)
    expect(stats.decidingSetWins).toBe(1)
    expect(stats.comebackWins).toBe(1)
    expect(stats.leagueMatches).toBe(2)
    expect(stats.friendlyMatches).toBe(1)
    expect(stats.uniqueTeammates).toBe(2)
    expect(stats.uniqueRivals).toBe(4)
    expect(stats.mostFrequentTeammate?.name).toBe("Álvaro")
    expect(stats.mostFrequentTeammate?.matches).toBe(2)
    expect(stats.bestTeammate?.key).toBe("user:alvaro")
    expect(stats.mostFrequentRival?.key).toBe("player:joseba")
    expect(
      stats.rivalRelations.slice(0, 2).map((relation) => [relation.key, relation.matches]),
    ).toEqual([
      ["player:joseba", 2],
      ["user:unai", 2],
    ])
    expect(stats.currentForm).toEqual(["win", "loss", "win"])
  })

  it("builds direct rivalry and partnership head-to-head from stable person keys", () => {
    const comparison = getPersonalProfileHeadToHead(items, "user:alvaro")

    expect(comparison?.person.name).toBe("Álvaro")
    expect(comparison?.person.profilePlayerId).toBe("player-alvaro")
    expect(comparison?.person.profileLeagueId).toBe("league-a")
    expect(comparison?.sharedMatches).toBe(3)
    expect(comparison?.teammateMatches).toBe(2)
    expect(comparison?.rivalMatches).toBe(1)
    expect(comparison?.teammate?.wins).toBe(1)
    expect(comparison?.teammate?.losses).toBe(1)
    expect(comparison?.rivalry?.wins).toBe(1)
    expect(comparison?.recentRivalry).toEqual(["win"])
  })

  it("preserves a known head-to-head avatar when a later match has no avatar", () => {
    const first = match({
      participants: [
        { team: 1, slot: 1, displayName: "Davo", isCurrentUser: true, personKey: "user:self" },
        { team: 1, slot: 2, displayName: "Álvaro", isCurrentUser: false, personKey: "user:alvaro", avatarUrl: "/avatar-alvaro.png" },
        { team: 2, slot: 1, displayName: "Unai", isCurrentUser: false, personKey: "user:unai" },
        { team: 2, slot: 2, displayName: "Joseba", isCurrentUser: false, personKey: "player:joseba" },
      ],
    })
    const later = match({ id: "match-later", scheduledAt: "2026-08-04T18:00:00.000Z" })

    const comparison = getPersonalProfileHeadToHead([first, later], "user:alvaro")

    expect(comparison?.person.avatarUrl).toBe("/avatar-alvaro.png")
  })
})
