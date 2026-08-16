import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import type { RankingPlayer } from "@/lib/ranking"
import { buildRoundSummaryHighlights } from "@/lib/roundSummary"

function rankingPlayer(id: string, points = 3): RankingPlayer {
  return {
    id,
    slug: id,
    leagueId: "league-1",
    displayName: id.toUpperCase(),
    avatarInitials: id.slice(0, 1).toUpperCase(),
    avatarUrl: null,
    userId: null,
    preferredSide: null,
    dominantHand: null,
    seasonId: "season-1",
    playerId: id,
    seasonPlayerStatus: "active",
    joinedFromRound: null,
    replacedFromRound: null,
    points,
    gamesDiff: 0,
    gamesFor: 0,
    gamesAgainst: 0,
    matchesPlayed: 1,
    wins: 1,
    losses: 0,
  }
}

function match(id: string, round: number, teamA: string[], teamB: string[], sets: MatchData["sets"]): MatchData {
  const pointsA = sets.filter((set) => set.a > set.b).length
  const pointsB = sets.filter((set) => set.b > set.a).length
  return {
    id,
    leagueId: "league-1",
    seasonId: "season-1",
    round,
    status: "finished",
    teamA,
    teamB,
    pointsA,
    pointsB,
    sets,
    scheduledAt: null,
    dateLabel: null,
    location: null,
    resultRecordedAt: null,
    resultReportedByPlayerId: null,
    resultLocked: false,
    rankingCounts: true,
    resultCounts: true,
    coordinationStatus: null,
    incidentType: null,
    incidentStatus: null,
    incidentReason: null,
    incidentNotes: null,
    incidentCreatedAt: null,
    incidentResolvedAt: null,
    resolutionType: null,
    substitutions: [],
    courtBooking: { isReserved: false, reservations: [], ballPurchases: [], transfers: [], updatedAt: null },
  }
}

describe("v1.9.3 round highlight direct comparisons", () => {
  it("shows the metric that proves a highlighted match without an explicit view-match CTA", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")

    expect(page).toContain("highlight.comparison.leftLabel")
    expect(page).toContain("highlight.comparison.leftValue")
    expect(page).toContain("highlight.comparison.centerValue")
    expect(page).toContain("highlight.comparison.rightValue")
    expect(page).not.toContain("Ver partido →")
    expect(page).toContain('href={`/match/${highlightedMatch.id}`}')
  })

  it("compares total games directly for the closest match", () => {
    const close = match("close", 2, ["a", "b"], ["c", "d"], [
      { a: 6, b: 4 },
      { a: 4, b: 6 },
      { a: 5, b: 3 },
    ])
    const ranking = [rankingPlayer("a"), rankingPlayer("b"), rankingPlayer("c"), rankingPlayer("d")]
    const closest = buildRoundSummaryHighlights({
      round: 2,
      matches: [close],
      roundMatches: [close],
      previousRanking: ranking,
      currentRanking: ranking,
    }).find((highlight) => highlight.id === "closest-match")

    expect(closest?.comparison).toEqual({
      leftLabel: "Juegos",
      leftValue: "15",
      centerValue: "Dif. 2",
      rightLabel: "Juegos",
      rightValue: "13",
    })
  })

  it("compares old and new positions for leader changes and climbs", () => {
    const previous = [rankingPlayer("a", 6), rankingPlayer("b", 5), rankingPlayer("c", 4)]
    const current = [rankingPlayer("b", 8), rankingPlayer("c", 7), rankingPlayer("a", 6)]
    const highlights = buildRoundSummaryHighlights({
      round: 2,
      matches: [],
      roundMatches: [],
      previousRanking: previous,
      currentRanking: current,
    })

    expect(highlights.find((highlight) => highlight.id === "new-leader")?.comparison).toEqual({
      leftLabel: "Antes",
      leftValue: "2º",
      centerValue: "→",
      rightLabel: "Ahora",
      rightValue: "1º",
    })
    expect(highlights.find((highlight) => highlight.id === "biggest-climb")?.comparison).toEqual({
      leftLabel: "Antes",
      leftValue: "2º",
      centerValue: "→",
      rightLabel: "Ahora",
      rightValue: "1º",
    })
  })

  it("shows only the current winning streak", () => {
    const first = match("first", 1, ["a", "b"], ["c", "d"], [{ a: 6, b: 3 }, { a: 6, b: 4 }])
    const second = match("second", 2, ["a", "b"], ["c", "d"], [{ a: 6, b: 4 }, { a: 6, b: 4 }])
    const ranking = [rankingPlayer("a", 6), rankingPlayer("b", 6), rankingPlayer("c"), rankingPlayer("d")]
    const streak = buildRoundSummaryHighlights({
      round: 2,
      matches: [first, second],
      roundMatches: [],
      previousRanking: ranking,
      currentRanking: ranking,
    }).find((highlight) => highlight.id === "win-streak")

    expect(streak?.comparison).toEqual({
      leftLabel: "Racha actual",
      leftValue: "2 victorias",
      centerValue: "",
      rightLabel: "",
      rightValue: "",
    })
  })
})
