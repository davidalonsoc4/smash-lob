import { expect, it } from "vitest"
import { calculateSeasonRanking, type RankingPlayer } from "@/lib/ranking"
import { calculateSeasonStatistics, getRankingPosition } from "@/lib/seasonStatistics"
import { getRankingDisplayPosition } from "@/lib/rankingOrder"
import { buildRankingExportRows } from "@/lib/csvExport"
import { hasMatchResultWinner } from "@/lib/matchResultValidity"
import type { PlayerProfile, SeasonPlayer } from "@/data/fakeData"
import type { MatchData } from "@/context/MatchDataProvider"

it("uses the same competition positions for ties in detail, statistics and spreadsheet exports", () => {
  const rows = [{ id: "a", points: 10, gamesDiff: 4, gamesFor: 20 }, { id: "b", points: 10, gamesDiff: 4, gamesFor: 20 }, { id: "c", points: 9, gamesDiff: 5, gamesFor: 25 }] as RankingPlayer[]
  expect(rows.map((row) => getRankingDisplayPosition(rows, row.id))).toEqual([1, 1, 3])
  expect(rows.map((row) => getRankingPosition(rows, row.id))).toEqual([1, 1, 3])
  expect(buildRankingExportRows(rows).slice(1).map((row) => row[0])).toEqual([1, 1, 3])
  expect(getRankingDisplayPosition(rows, "absent")).toBeNull()
})

it("does not award points or losses for legacy tied results in either calculation", () => {
  const playerProfiles = ["a", "b", "c", "d"].map((id) => ({ id, displayName: id, leagueId: "fixture" })) as PlayerProfile[]
  const seasonPlayers = playerProfiles.map((player) => ({ playerId: player.id, seasonId: "season", status: "active" })) as SeasonPlayer[]
  const match = { id: "match", leagueId: "fixture", seasonId: "season", round: 1, status: "finished", teamA: ["a", "b"], teamB: ["c", "d"], pointsA: 1, pointsB: 1, sets: [{ a: 6, b: 0 }, { a: 0, b: 6 }], resultCounts: true } as MatchData
  const input = { seasonId: "season", playerProfiles, seasonPlayers, matches: [match] }
  expect(calculateSeasonRanking(input).every((row) => row.matchesPlayed === 0 && row.points === 0 && row.losses === 0)).toBe(true)
  expect(calculateSeasonStatistics({ ...input, includeProgress: false }).countedMatches).toBe(0)
})

it("requires a winner while retaining one-set, two-set and three-set results", () => {
  expect(hasMatchResultWinner([{ a: 6, b: 0 }])).toBe(true)
  expect(hasMatchResultWinner([{ a: 6, b: 0 }, { a: 6, b: 1 }])).toBe(true)
  expect(hasMatchResultWinner([{ a: 6, b: 0 }, { a: 0, b: 6 }])).toBe(false)
  expect(hasMatchResultWinner([{ a: 6, b: 0 }, { a: 0, b: 6 }, { a: 7, b: 5 }])).toBe(true)
  expect(hasMatchResultWinner([])).toBe(false)
})
