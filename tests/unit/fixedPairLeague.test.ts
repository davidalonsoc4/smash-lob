import { describe, expect, it } from "vitest"
import { generateBalancedCalendar, getSeasonScheduleRoundCount, isValidSeasonScheduleTarget } from "@/lib/calendar"
import { auditFixedPairLeagueCalendar, fixedPairBaseRounds, generateFixedPairLeagueCalendar, validateLeaguePairs, type LeaguePair } from "@/lib/fixedPairLeague"
import { calculateLeaguePairRanking } from "@/lib/leaguePairRanking"
import { pairsFromRoster } from "@/lib/serverLeagueModality"
import { buildPublicSpectatorRanking } from "@/lib/publicSpectator"

const pairsFor = (count: number): LeaguePair[] => Array.from({ length: count }, (_, i) => [`p-${i * 2}`, `p-${i * 2 + 1}`])

describe("fixed pair leagues, 2–16 teams", () => {
  it.each(Array.from({ length: 15 }, (_, i) => i + 2))("keeps %i teams intact for every supported season length", count => {
    const pairs = pairsFor(count), playerIds = pairs.flat(), base = fixedPairBaseRounds(playerIds.length)
    for (const target of [base, base * 2, base * 6, Math.max(1, base - 1), base + 1]) {
      const scheduleMode = target === base ? "single" : target === base * 2 ? "double" : "extended"
      const matches = generateBalancedCalendar({ leagueId: "league", seasonId: "season", fixedPairs: pairs, playerIds, scheduleMode, targetRoundCount: target })
      expect(matches).toHaveLength(target * Math.floor(count / 2))
      expect(auditFixedPairLeagueCalendar(matches, pairs, target)).toMatchObject({ valid: true })
      for (const pair of pairs) {
        const appearances = matches.filter(match => match.teamA.includes(pair[0]) || match.teamB.includes(pair[0]))
        for (const match of appearances) expect([match.teamA, match.teamB]).toContainEqual(pair)
      }
      if (target === base) {
        for (const pair of pairs) expect(matches.filter(match => [...match.teamA, ...match.teamB].includes(pair[0]))).toHaveLength(count - 1)
      }
    }
  })
  it("32 players mean 16 pairs, 15 rounds and 120 matches per leg", () => {
    expect(getSeasonScheduleRoundCount({ playerCount: 32, mode: "single", modality: "fixed_pairs" })).toBe(15)
    expect(getSeasonScheduleRoundCount({ playerCount: 32, mode: "double", modality: "fixed_pairs" })).toBe(30)
    expect(generateFixedPairLeagueCalendar({ leagueId: "l", seasonId: "s", pairs: pairsFor(16) })).toHaveLength(120)
    expect(getSeasonScheduleRoundCount({ playerCount: 32, mode: "single" })).toBe(31)
  })
  it("rejects duplicates, incomplete rosters, 17 pairs and incompatible lengths", () => {
    expect(validateLeaguePairs([["a", "a"], ["b", "c"]], ["a", "b", "c", "d"])).toBe(false)
    expect(() => generateFixedPairLeagueCalendar({ leagueId: "l", seasonId: "s", pairs: pairsFor(17) })).toThrow()
    expect(isValidSeasonScheduleTarget({ playerCount: 9, mode: "single", targetRoundCount: 5, modality: "fixed_pairs" })).toBe(false)
    expect(isValidSeasonScheduleTarget({ playerCount: 32, mode: "single", targetRoundCount: 31, modality: "fixed_pairs" })).toBe(false)
    expect(isValidSeasonScheduleTarget({ playerCount: 32, mode: "extended", targetRoundCount: 91, modality: "fixed_pairs" })).toBe(false)
  })
  it("reads pairs by identity even when Postgres returns roster rows in a different order", () => {
    expect(pairsFromRoster([{ player_id: "c", pair_number: 2 }, { player_id: "b", pair_number: 1 }, { player_id: "a", pair_number: 1 }, { player_id: "d", pair_number: 2 }])).toEqual([["b", "a"], ["c", "d"]])
  })
  it("flags an altered partner or repeated round appearance", () => {
    const pairs = pairsFor(4), matches = generateFixedPairLeagueCalendar({ leagueId: "l", seasonId: "s", pairs })
    expect(auditFixedPairLeagueCalendar([{ ...matches[0], teamA: ["p-0", "p-2"] }, ...matches.slice(1)], pairs, 3).valid).toBe(false)
    expect(auditFixedPairLeagueCalendar([matches[0], ...matches], pairs, 3).valid).toBe(false)
  })
  it("counts team results once, recalculates corrections and preserves history after a replacement", () => {
    const pairs = pairsFor(2), ids = pairs.flat()
    const playerProfiles = [...ids, "replacement"].map(id => ({ id, leagueId: "l", slug: id, displayName: id, avatarInitials: id }))
    const seasonPlayers = ids.map((playerId, index) => ({ seasonId: "s", playerId, pairNumber: Math.floor(index / 2) + 1, status: playerId === "p-0" ? "withdrawn" as const : "active" as const }))
    const roster = [...seasonPlayers, { seasonId: "s", playerId: "replacement", pairNumber: 1, status: "active" as const }]
    const matches = generateFixedPairLeagueCalendar({ leagueId: "l", seasonId: "s", pairs, scheduleMode: "double" }).map((match, index) => ({ ...match, status: "finished", teamA: index ? ["p-2", "p-3"] : match.teamA, teamB: index ? ["replacement", "p-1"] : match.teamB, pointsA: 2, pointsB: 1, sets: [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 6, b: 3 }] }))
    const result = calculateLeaguePairRanking({ seasonId: "s", playerProfiles, seasonPlayers: roster, matches })
    expect(result).toHaveLength(2)
    expect(result.map(row => row.matchesPlayed)).toEqual([2, 2])
    expect(result.reduce((total, row) => total + row.points, 0)).toBe(6)
    expect(result.find(row => row.id === "pair-1")?.members.map(member => member.id)).toEqual(["p-1", "replacement"])
    const corrected = calculateLeaguePairRanking({ seasonId: "s", playerProfiles, seasonPlayers: roster, matches: matches.map(match => ({ ...match, pointsA: 1, pointsB: 2 })) })
    expect(corrected.reduce((total, row) => total + row.points, 0)).toBe(6)
    expect(calculateLeaguePairRanking({ seasonId: "s", playerProfiles, seasonPlayers: roster, matches: matches.map(match => ({ ...match, resultCounts: false })) }).every(row => row.matchesPlayed === 0)).toBe(true)
  })
  it("retains pair points if both players are authorized temporary substitutes", () => {
    const pairs = pairsFor(2)
    const ids = pairs.flat()
    const playerProfiles = ids.map(id => ({ id, leagueId: "l", slug: id, displayName: id, avatarInitials: id }))
    const seasonPlayers = ids.map((playerId, i) => ({ seasonId: "s", playerId, pairNumber: Math.floor(i / 2) + 1 }))
    const matches = [{ ...generateFixedPairLeagueCalendar({ leagueId: "l", seasonId: "s", pairs })[0], teamA: ["sub-0", "sub-1"], status: "finished", pointsA: 2, pointsB: 1, sets: [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 6, b: 3 }], substitutions: [{ originalPlayerId: "p-0", substitutePlayerId: "sub-0" }, { originalPlayerId: "p-1", substitutePlayerId: "sub-1" }] }]
    const ranking = calculateLeaguePairRanking({ seasonId: "s", playerProfiles, seasonPlayers, matches })
    expect(ranking[0]).toMatchObject({ id: "pair-1", matchesPlayed: 1, points: 2, wins: 1 })
  })
  it("retains the names of a withdrawn pair in the season history", () => {
    const ids = pairsFor(2).flat()
    const playerProfiles = ids.map(id => ({ id, leagueId: "l", slug: id, displayName: id, avatarInitials: id }))
    const seasonPlayers = ids.map((playerId, i) => ({ seasonId: "s", playerId, pairNumber: Math.floor(i / 2) + 1, status: i < 2 ? "withdrawn" as const : "active" as const }))
    const pair = calculateLeaguePairRanking({ seasonId: "s", playerProfiles, seasonPlayers, matches: [] }).find(row => row.id === "pair-1")
    expect(pair?.displayName).toBe("p-0 · p-1")
    expect(pair?.seasonPlayerStatus).toBe("withdrawn")
  })
  it("publishes one row per pair without exposing player identities", () => {
    const ids = pairsFor(2).flat()
    const players = ids.map((id, i) => ({ id, leagueId: "l", slug: id, displayName: `Fixture ${i}`, avatarInitials: "" }))
    const seasonPlayers = ids.map((playerId, i) => ({ seasonId: "s", playerId, pairNumber: Math.floor(i / 2) + 1 }))
    const matches = [{ ...generateFixedPairLeagueCalendar({ leagueId: "l", seasonId: "s", pairs: pairsFor(2) })[0], status: "finished", pointsA: 2, pointsB: 1, sets: [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 6, b: 3 }] }]
    const result = buildPublicSpectatorRanking({ modality: "fixed_pairs", seasonId: "s", players, seasonPlayers, matches: matches as never })
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ members: ["Fixture 0", "Fixture 1"], points: 2, matchesPlayed: 1 })
    expect(JSON.stringify(result)).not.toMatch(/pair-1|p-0|playerId|leagueId/)
  })
})
