import { describe, expect, it } from "vitest"
import {
  getAdvancedAutomaticMvpRatings,
  getRoundMvpSelection,
  getSeasonMvpSelection,
  type MvpMatch,
} from "@/lib/mvp"

function match({
  id,
  round,
  teamA,
  teamB,
  sets,
}: {
  id: string
  round: number
  teamA: string[]
  teamB: string[]
  sets: { a: number; b: number }[]
}): MvpMatch {
  const setsA = sets.filter((set) => set.a > set.b).length
  const setsB = sets.filter((set) => set.b > set.a).length

  return {
    id,
    leagueId: "league",
    seasonId: "season",
    round,
    status: "finished",
    teamA,
    teamB,
    pointsA: setsA,
    pointsB: setsB,
    sets,
    resultCounts: true,
  }
}

const matches: MvpMatch[] = [
  match({
    id: "r1-main",
    round: 1,
    teamA: ["a", "b"],
    teamB: ["c", "d"],
    sets: [{ a: 6, b: 1 }, { a: 6, b: 2 }, { a: 6, b: 3 }],
  }),
  match({
    id: "r1-other",
    round: 1,
    teamA: ["e", "f"],
    teamB: ["g", "h"],
    sets: [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 6, b: 4 }],
  }),
  match({
    id: "r2-main",
    round: 2,
    teamA: ["a", "c"],
    teamB: ["b", "d"],
    sets: [{ a: 6, b: 2 }, { a: 6, b: 2 }, { a: 6, b: 3 }],
  }),
  match({
    id: "r2-other",
    round: 2,
    teamA: ["e", "g"],
    teamB: ["f", "h"],
    sets: [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 6, b: 4 }],
  }),
  match({
    id: "r3-main",
    round: 3,
    teamA: ["a", "b"],
    teamB: ["c", "d"],
    sets: [{ a: 6, b: 1 }, { a: 6, b: 1 }, { a: 6, b: 2 }],
  }),
  match({
    id: "r3-other",
    round: 3,
    teamA: ["e", "f"],
    teamB: ["g", "h"],
    sets: [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 6, b: 4 }],
  }),
  match({
    id: "future-r4",
    round: 4,
    teamA: ["b", "c"],
    teamB: ["a", "d"],
    sets: [{ a: 6, b: 0 }, { a: 6, b: 0 }, { a: 6, b: 1 }],
  }),
]

describe("advanced automatic MVP", () => {
  it("keeps the legacy automatic mode awarding the whole dominant pair", () => {
    const result = getRoundMvpSelection({
      leagueId: "league",
      seasonId: "season",
      round: 3,
      matches,
      mvpSystem: "automatic",
    })

    expect(result?.playerIds).toEqual(["a", "b"])
    expect(result?.source).toBe("automatic")
  })

  it("uses adjusted partner/opponent performance to choose one player from the dominant pair", () => {
    const ratings = getAdvancedAutomaticMvpRatings({
      leagueId: "league",
      seasonId: "season",
      round: 3,
      matches,
    })
    const ratingA = ratings.find((row) => row.playerId === "a")?.rating ?? 0
    const ratingB = ratings.find((row) => row.playerId === "b")?.rating ?? 0
    const result = getRoundMvpSelection({
      leagueId: "league",
      seasonId: "season",
      round: 3,
      matches,
      mvpSystem: "automatic_advanced",
    })

    expect(ratingA).toBeGreaterThan(ratingB)
    expect(result?.playerIds).toEqual(["a"])
    expect(result?.source).toBe("automatic_advanced")
    expect(result?.adjustedRating).toBe(ratingA)
    expect(result?.candidateRatings?.map((row) => row.playerId)).toEqual(["a", "b"])
  })

  it("shares the MVP when the available results cannot distinguish the two partners", () => {
    const result = getRoundMvpSelection({
      leagueId: "league",
      seasonId: "season",
      round: 1,
      matches,
      mvpSystem: "automatic_advanced",
    })

    expect(result?.playerIds).toEqual(["a", "b"])
    expect(result?.tied).toBe(true)
    expect(result?.ratingGap).toBe(0)
  })

  it("does not use future rounds when calculating a past round", () => {
    const withFuture = getRoundMvpSelection({
      leagueId: "league",
      seasonId: "season",
      round: 3,
      matches,
      mvpSystem: "automatic_advanced",
    })
    const withoutFuture = getRoundMvpSelection({
      leagueId: "league",
      seasonId: "season",
      round: 3,
      matches: matches.filter((item) => item.round <= 3),
      mvpSystem: "automatic_advanced",
    })

    expect(withFuture?.playerIds).toEqual(withoutFuture?.playerIds)
    expect(withFuture?.candidateRatings).toEqual(withoutFuture?.candidateRatings)
  })

  it("builds the season MVP from advanced round MVP awards", () => {
    const result = getSeasonMvpSelection({
      leagueId: "league",
      seasonId: "season",
      matches: matches.filter((item) => item.round <= 3),
      mvpSystem: "automatic_advanced",
    })

    expect(result?.source).toBe("automatic_advanced")
    expect(result?.playerIds).toContain("a")
    expect(result?.votes).toBeGreaterThan(0)
  })
})
