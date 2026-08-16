import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import type { RankingPlayer } from "@/lib/ranking"
import { buildRoundSummaryHighlights } from "@/lib/roundSummary"

function rankingPlayer(id: string): RankingPlayer {
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
    points: 3,
    gamesDiff: 0,
    gamesFor: 0,
    gamesAgainst: 0,
    matchesPlayed: 1,
    wins: 1,
    losses: 0,
  }
}

function finishedMatch(): MatchData {
  return {
    id: "match-close",
    leagueId: "league-1",
    seasonId: "season-1",
    round: 1,
    status: "finished",
    teamA: ["a", "b"],
    teamB: ["c", "d"],
    pointsA: 2,
    pointsB: 1,
    sets: [
      { a: 7, b: 6 },
      { a: 4, b: 6 },
      { a: 6, b: 4 },
    ],
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
    courtBooking: {
      isReserved: false,
      reservations: [],
      ballPurchases: [],
      transfers: [],
      updatedAt: null,
    },
  }
}

describe("v1.9.2 editorial round highlights", () => {
  it("keeps full PARTIDO panels only in results and uses a compact editorial match row in highlights", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")
    const pairingUsages = page.match(/<MatchDetailPairingPanel/g) ?? []

    expect(pairingUsages).toHaveLength(1)
    expect(page).toContain('grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]')
    expect(page).toContain("{pointsA}–{pointsB}")
    expect(page).not.toContain("Ver partido →")
    expect(page).toContain("{highlight.title}")
    expect(page).toContain("highlight.comparison.leftValue")
    expect(page).toContain("highlight.comparison.rightValue")
  })

  it("explains why the closest match is notable instead of repeating the team names as its headline", () => {
    const match = finishedMatch()
    const ranking = [
      rankingPlayer("a"),
      rankingPlayer("b"),
      rankingPlayer("c"),
      rankingPlayer("d"),
    ]
    const highlights = buildRoundSummaryHighlights({
      round: 1,
      matches: [match],
      roundMatches: [match],
      previousRanking: ranking.map((player) => ({ ...player, matchesPlayed: 0, wins: 0, points: 0 })),
      currentRanking: ranking,
    })
    const closest = highlights.find((highlight) => highlight.id === "closest-match")

    expect(closest).toEqual({
      id: "closest-match",
      eyebrow: "Partido más igualado",
      title: "Solo 1 juego separó a las parejas",
      comparison: {
        leftLabel: "Juegos",
        leftValue: "17",
        centerValue: "Dif. 1",
        rightLabel: "Juegos",
        rightValue: "16",
      },
      matchId: "match-close",
    })
  })
})
