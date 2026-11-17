import { describe, expect, it } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import {
  getEffectiveRevealedThroughRound,
  getLockedProgressiveRounds,
  isMatchClosedForAdvance,
  redactProgressiveMatch,
  roundHasOfficialStartDate,
} from "@/lib/progressiveCalendar"

function match(id: string, round: number, status: MatchData["status"]): MatchData {
  return {
    id, leagueId: "league", seasonId: "season", round,
    teamA: ["a", "b"], teamB: ["c", "d"], pointsA: null, pointsB: null, sets: [], status,
    scheduledAt: null, dateLabel: null, location: null, resultRecordedAt: null, resultReportedByPlayerId: null,
    resultLocked: false, rankingCounts: true, resultCounts: true, coordinationStatus: null,
    incidentType: null, incidentStatus: null, incidentReason: null, incidentNotes: null, incidentCreatedAt: null,
    incidentResolvedAt: null, resolutionType: null, substitutions: [],
    courtBooking: { isReserved: false, reservations: [], ballPurchases: [], transfers: [], updatedAt: null },
  } as MatchData
}

const noDates = {
  calendarVisibilityMode: "progressive" as const,
  revealedThroughRound: 0,
  openingRoundEnabled: false,
  openingRoundAt: null,
  roundWindowMode: "none" as const,
  seasonStartsAt: null,
  roundWindowDays: null,
}
const withWindows = { ...noDates, roundWindowMode: "fixed-days" as const, seasonStartsAt: "2026-11-02", roundWindowDays: 7 }
const reveal = (matches: MatchData[], settings = noDates) =>
  getEffectiveRevealedThroughRound({ seasonStatus: "active", totalRounds: 4, settings, matches, now: new Date("2026-11-03T10:00:00Z") })

describe("progressive unlock: what closes a round", () => {
  it("only finished matches and out-of-date postponements close a match for advancing", () => {
    expect(isMatchClosedForAdvance({ status: "finished" })).toBe(true)
    expect(isMatchClosedForAdvance({ status: "postponed" })).toBe(true)
    expect(isMatchClosedForAdvance({ status: "scheduled" })).toBe(false)
    expect(isMatchClosedForAdvance({ status: "scheduling" })).toBe(false)
  })

  it("keeps the next round locked while any match of the round is still open", () => {
    const matches = [match("1a", 1, "finished"), match("1b", 1, "scheduled"), match("2a", 2, "scheduling")]
    expect(reveal(matches)).toBe(1)
  })

  it("does not reveal the next round just because one player finished their own match", () => {
    const matches = [match("1a", 1, "finished"), match("1b", 1, "scheduling"), match("2a", 2, "scheduling")]
    expect(reveal(matches)).toBe(1)
  })

  it("reveals the next round for everyone when the previous one is completed", () => {
    const matches = [match("1a", 1, "finished"), match("1b", 1, "finished"), match("2a", 2, "scheduling")]
    expect(reveal(matches)).toBe(2)
  })

  it("a match postponed out of date stops blocking the next round", () => {
    const matches = [match("1a", 1, "finished"), match("1b", 1, "postponed"), match("2a", 2, "scheduling"), match("3a", 3, "scheduling")]
    expect(reveal(matches)).toBe(2)
  })

  it("does not skip rounds: the round after the next one stays locked", () => {
    const matches = [match("1a", 1, "finished"), match("1b", 1, "postponed"), match("2a", 2, "scheduling"), match("3a", 3, "scheduling")]
    expect(reveal(matches)).toBeLessThan(3)
  })

  it("a postponed match that is still pending is not complete for scoring", () => {
    expect(isMatchClosedForAdvance({ status: "postponed" })).toBe(true)
    expect(match("1b", 1, "postponed").sets).toEqual([])
    expect(match("1b", 1, "postponed").pointsA).toBeNull()
  })
})

describe("progressive unlock: locked rounds in lists", () => {
  it("lists the rounds whose pairings are hidden, without any player data", () => {
    const matches = [match("1a", 1, "finished"), redactProgressiveMatch(match("2a", 2, "scheduling")), redactProgressiveMatch(match("2b", 2, "scheduling")), redactProgressiveMatch(match("3a", 3, "scheduling"))]
    expect(getLockedProgressiveRounds({ seasonStatus: "active", calendarVisibilityMode: "progressive", matches })).toEqual([2, 3])
  })

  it("shows nothing for a full calendar, a finished season, or an administrator who sees every round", () => {
    const hidden = [redactProgressiveMatch(match("2a", 2, "scheduling"))]
    expect(getLockedProgressiveRounds({ seasonStatus: "active", calendarVisibilityMode: "full", matches: hidden })).toEqual([])
    expect(getLockedProgressiveRounds({ seasonStatus: "finished", calendarVisibilityMode: "progressive", matches: hidden })).toEqual([])
    expect(getLockedProgressiveRounds({ seasonStatus: "active", calendarVisibilityMode: "progressive", matches: [match("2a", 2, "scheduling")] })).toEqual([])
  })

  it("a locked round does not reveal whether the player has a match in it", () => {
    const hidden = redactProgressiveMatch(match("2a", 2, "scheduling"))
    expect(hidden.teamA).toEqual([])
    expect(hidden.teamB).toEqual([])
  })
})

describe("progressive unlock: the date in the locked text", () => {
  it("only mentions the start date when the round has an official start", () => {
    expect(roundHasOfficialStartDate({ round: 2, settings: noDates })).toBe(false)
    expect(roundHasOfficialStartDate({ round: 2, settings: withWindows })).toBe(true)
  })

  it("an opening round date counts for round 1 only", () => {
    const opening = { ...noDates, openingRoundEnabled: true, openingRoundAt: "2026-11-02T18:00:00Z" }
    expect(roundHasOfficialStartDate({ round: 1, settings: opening })).toBe(true)
    expect(roundHasOfficialStartDate({ round: 2, settings: opening })).toBe(false)
  })
})
