import { describe, expect, it } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import type { RankingPlayer } from "@/lib/ranking"
import { buildRoundSummaryHighlights } from "@/lib/roundSummary"

function rankingPlayer(id: string): RankingPlayer {
  return {
    id, slug: id, leagueId: "league-1", displayName: id.toUpperCase(),
    avatarInitials: id.slice(0, 1).toUpperCase(), avatarUrl: null, userId: null,
    preferredSide: null, dominantHand: null, seasonId: "season-1", playerId: id,
    seasonPlayerStatus: "active", joinedFromRound: null, replacedFromRound: null,
    points: 3, gamesDiff: 0, gamesFor: 0, gamesAgainst: 0, matchesPlayed: 1, wins: 1, losses: 0,
  }
}

function match(id: string, sets: MatchData["sets"]): MatchData {
  return {
    id, leagueId: "league-1", seasonId: "season-1", round: 2, status: "finished",
    teamA: ["a", "b"], teamB: ["c", "d"],
    pointsA: sets.filter((set) => set.a > set.b).length,
    pointsB: sets.filter((set) => set.b > set.a).length,
    sets, scheduledAt: null, dateLabel: null, location: null, resultRecordedAt: null,
    resultReportedByPlayerId: null, resultLocked: false, rankingCounts: true, resultCounts: true,
    coordinationStatus: null, incidentType: null, incidentStatus: null, incidentReason: null,
    incidentNotes: null, incidentCreatedAt: null, incidentResolvedAt: null, resolutionType: null,
    substitutions: [],
    courtBooking: { isReserved: false, reservations: [], ballPurchases: [], transfers: [], updatedAt: null },
  }
}

const ranking = [rankingPlayer("a"), rankingPlayer("b"), rankingPlayer("c"), rankingPlayer("d")]

describe("v1.9.4 deciding tie-break round highlight", () => {
  it("highlights an exact 7-6 third set with a direct tie-break comparison", () => {
    const decided = match("tb-76", [{ a: 6, b: 3 }, { a: 4, b: 6 }, { a: 7, b: 6 }])
    const highlight = buildRoundSummaryHighlights({
      round: 2, matches: [decided], roundMatches: [decided], previousRanking: ranking, currentRanking: ranking,
    }).find((item) => item.id === "deciding-tiebreak-tb-76")

    expect(highlight).toMatchObject({
      eyebrow: "Decidido en tie-break",
      title: "El tercer set se decidió en el desempate",
      matchId: "tb-76",
      comparison: { leftLabel: "3.er set", leftValue: "7", centerValue: "Tie-break", rightLabel: "3.er set", rightValue: "6" },
    })
  })

  it("also detects 6-7 but not a tie-break in another set or a 6-4 deciding set", () => {
    const reverse = match("tb-67", [{ a: 6, b: 4 }, { a: 6, b: 7 }, { a: 6, b: 7 }])
    const secondSetOnly = match("second-only", [{ a: 6, b: 4 }, { a: 7, b: 6 }, { a: 6, b: 4 }])
    const normalThird = match("normal-third", [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 6, b: 4 }])
    const highlights = buildRoundSummaryHighlights({
      round: 2, matches: [reverse, secondSetOnly, normalThird], roundMatches: [reverse, secondSetOnly, normalThird],
      previousRanking: ranking, currentRanking: ranking,
    })

    expect(highlights.find((item) => item.id === "deciding-tiebreak-tb-67")?.comparison).toMatchObject({ leftValue: "6", centerValue: "Tie-break", rightValue: "7" })
    expect(highlights.some((item) => item.id === "deciding-tiebreak-second-only")).toBe(false)
    expect(highlights.some((item) => item.id === "deciding-tiebreak-normal-third")).toBe(false)
  })

  it("does not repeat a tie-break-decided match as the closest match", () => {
    const decided = match("tb", [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 7, b: 6 }])
    const other = match("other", [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 6, b: 4 }])
    const highlights = buildRoundSummaryHighlights({
      round: 2, matches: [decided, other], roundMatches: [decided, other], previousRanking: ranking, currentRanking: ranking,
    })

    expect(highlights.find((item) => item.id === "deciding-tiebreak-tb")?.matchId).toBe("tb")
    expect(highlights.find((item) => item.id === "closest-match")?.matchId).toBe("other")
  })
})
