import { describe, expect, it } from "vitest"
import {
  formatPersonalMatchScore,
  getPersonalMatchOriginBadgeClass,
  getPersonalMatchOriginLabel,
  getPersonalMatchOutcome,
  getPersonalMatchOverallScore,
  getPersonalMatchSetWins,
  getPersonalMatchTeamNames,
  getPersonalMatchTeamPlayers,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

const match: PersonalMatchItem = {
  id: "match-1",
  origin: "friendly",
  status: "finished",
  scheduledAt: "2026-08-08T08:00:00.000Z",
  resultRecordedAt: "2026-08-08T10:00:00.000Z",
  locationName: "Padel Indoor",
  sets: [
    { a: 6, b: 4 },
    { a: 3, b: 6 },
    { a: 6, b: 2 },
  ],
  participants: [
    { team: 1, slot: 2, displayName: "Álvaro", isCurrentUser: false },
    { team: 2, slot: 2, displayName: "Joseba", isCurrentUser: false },
    { team: 1, slot: 1, displayName: "Davo", isCurrentUser: true },
    { team: 2, slot: 1, displayName: "Unai", isCurrentUser: false },
  ],
  canManage: true,
  canDelete: true,
  leagueId: null,
  leagueName: null,
  seasonId: null,
  round: null,
}

describe("personal matches", () => {
  it("keeps participant order while exposing a compact overall score", () => {
    expect(getPersonalMatchTeamPlayers(match.participants, 1).map((player) => player.displayName)).toEqual([
      "Davo",
      "Álvaro",
    ])
    expect(getPersonalMatchTeamNames(match.participants, 2)).toBe("Unai / Joseba")
    expect(formatPersonalMatchScore(match.sets)).toBe("6-4 · 3-6 · 6-2")
    expect(getPersonalMatchOverallScore(match.sets)).toBe("2-1")
  })

  it("calculates the result only for finished matches", () => {
    expect(getPersonalMatchSetWins(match.sets)).toEqual({ a: 2, b: 1 })
    expect(getPersonalMatchOutcome(match)).toBe("win")
    expect(getPersonalMatchOutcome({ ...match, status: "scheduled", sets: [] })).toBe("unknown")
    expect(
      getPersonalMatchOutcome({
        ...match,
        participants: match.participants.map((participant) => ({
          ...participant,
          isCurrentUser: participant.team === 2 && participant.slot === 1,
        })),
      }),
    ).toBe("loss")
  })

  it("labels friendlies and leagues distinctly with stable badge styling", () => {
    expect(getPersonalMatchOriginLabel(match)).toBe("Amistoso")
    expect(getPersonalMatchOriginBadgeClass(match)).toContain("neutral")

    const leagueMatch: PersonalMatchItem = {
      ...match,
      origin: "league",
      leagueId: "league-1",
      leagueName: "Smash & Lob Pro League",
      canManage: false,
      canDelete: false,
    }
    expect(getPersonalMatchOriginLabel(leagueMatch)).toBe("Smash & Lob Pro League")
    expect(getPersonalMatchOriginBadgeClass(leagueMatch)).toBe(
      getPersonalMatchOriginBadgeClass({ ...leagueMatch }),
    )
  })

  it("does not invent a result when the current account is absent", () => {
    expect(
      getPersonalMatchOutcome({
        ...match,
        participants: match.participants.map((participant) => ({
          ...participant,
          isCurrentUser: false,
        })),
      }),
    ).toBe("unknown")
  })
})
