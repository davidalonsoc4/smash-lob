import { describe, expect, it } from "vitest"
import {
  formatPersonalMatchScore,
  getPersonalMatchOutcome,
  getPersonalMatchSetWins,
  getPersonalMatchTeamNames,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

const match: PersonalMatchItem = {
  id: "match-1",
  playedAt: "2026-08-08T08:00:00.000Z",
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
  canDelete: true,
}

describe("personal matches", () => {
  it("keeps team order and score compact", () => {
    expect(getPersonalMatchTeamNames(match.participants, 1)).toBe("Davo / Álvaro")
    expect(getPersonalMatchTeamNames(match.participants, 2)).toBe("Unai / Joseba")
    expect(formatPersonalMatchScore(match.sets)).toBe("6-4 · 3-6 · 6-2")
  })

  it("calculates the result from the current user's team", () => {
    expect(getPersonalMatchSetWins(match.sets)).toEqual({ a: 2, b: 1 })
    expect(getPersonalMatchOutcome(match)).toBe("win")
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
