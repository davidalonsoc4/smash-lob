import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import type { RankingPlayer } from "@/lib/ranking"
import {
  getRoundRankingMovements,
  getRoundSummaryMetrics,
} from "@/lib/roundSummary"

function rankingPlayer(id: string, points: number): RankingPlayer {
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
    matchesPlayed: points > 0 ? 1 : 0,
    wins: points > 0 ? 1 : 0,
    losses: 0,
  }
}

function summaryMatch(overrides: Partial<MatchData> = {}): MatchData {
  return {
    id: "match-1",
    leagueId: "league-1",
    seasonId: "season-1",
    round: 2,
    status: "finished",
    teamA: ["a", "b"],
    teamB: ["c", "d"],
    pointsA: 2,
    pointsB: 1,
    sets: [
      { a: 6, b: 4 },
      { a: 4, b: 6 },
      { a: 6, b: 3 },
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
    ...overrides,
  }
}

describe("v1.9.0 round summary", () => {
  it("opens the round summary from the full Calendar round header", async () => {
    const calendar = await readFile("src/app/matches/page.tsx", "utf8")
    expect(calendar).toContain('href={`/round/${round.round}`}')
    expect(calendar).toContain('aria-label={`Abrir resumen de ${round.name}`}')
  })

  it("builds the round summary screen sections", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")
    expect(page).toContain("Resumen · Jornada {round}")
    expect(page).toContain("Resultados")
    expect(page).toContain('"MVPs de los partidos" : "MVP de jornada"')
    expect(page).toContain("Lo más destacado")
    expect(page).toContain('isCompleted ? "Clasificación tras la jornada" : "Clasificación provisional"')
  })

  it("tracks ranking movement against the previous round", () => {
    const previous = [rankingPlayer("a", 6), rankingPlayer("b", 5)]
    const current = [rankingPlayer("b", 8), rankingPlayer("a", 6)]

    expect(
      getRoundRankingMovements({ previousRanking: previous, currentRanking: current }),
    ).toEqual([
      { playerId: "b", from: 2, to: 1, delta: 1 },
      { playerId: "a", from: 1, to: 2, delta: -1 },
    ])
  })

  it("counts only ranking-valid finished results in round metrics", () => {
    const metrics = getRoundSummaryMetrics([
      summaryMatch(),
      summaryMatch({ id: "match-2", resultCounts: false, sets: [{ a: 6, b: 0 }] }),
      summaryMatch({ id: "match-3", status: "scheduled", sets: [] }),
    ])

    expect(metrics).toEqual({
      totalMatches: 3,
      finishedMatches: 2,
      countedMatches: 1,
      totalSets: 3,
      totalGames: 29,
    })
  })
})
