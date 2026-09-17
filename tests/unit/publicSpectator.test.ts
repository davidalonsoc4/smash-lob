import { describe, expect, it } from "vitest"
import { sanitizePublicSpectatorMatch } from "@/lib/publicSpectator"

describe("public spectator data", () => {
  it("returns only public match fields and never includes internal identifiers or operations", () => {
    const result = sanitizePublicSpectatorMatch({
      match: {
        id: "internal-match-id",
        leagueId: "internal-league-id",
        seasonId: "internal-season-id",
        round: 2,
        status: "finished",
        teamA: ["player-a", "player-b"],
        teamB: ["player-c", "player-d"],
        pointsA: 2,
        pointsB: 1,
        sets: [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 6, b: 2 }],
        scheduledAt: "2026-09-17T18:00:00.000Z",
        location: "Padel Indoor",
        resultReportedByPlayerId: "private-reporter-id",
        incidentNotes: "private incident",
        courtBooking: { transfers: ["private payment"] },
      } as never,
      playerNameById: new Map([
        ["player-a", "Ana"], ["player-b", "Luis"],
        ["player-c", "Eva"], ["player-d", "Raúl"],
      ]),
      revealParticipants: true,
      revealSchedule: true,
    })

    expect(result).toEqual({
      round: 2,
      status: "finished",
      teams: [["Ana", "Luis"], ["Eva", "Raúl"]],
      score: {
        sets: [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 6, b: 2 }],
        pointsA: 2,
        pointsB: 1,
      },
      scheduledAt: "2026-09-17T18:00:00.000Z",
      location: "Padel Indoor",
    })
    expect(JSON.stringify(result)).not.toMatch(/internal-|private/)
  })

  it("can reveal an opening time without revealing any pairing", () => {
    const result = sanitizePublicSpectatorMatch({
      match: {
        id: "internal-match-id",
        leagueId: "internal-league-id",
        seasonId: "internal-season-id",
        round: 1,
        status: "scheduled",
        teamA: ["player-a", "player-b"],
        teamB: ["player-c", "player-d"],
        pointsA: null,
        pointsB: null,
        sets: [],
        scheduledAt: "2026-09-17T18:00:00.000Z",
        location: "Padel Indoor",
      } as never,
      playerNameById: new Map([["player-a", "Ana"]]),
      revealParticipants: false,
      revealSchedule: true,
    })

    expect(result.teams).toBeNull()
    expect(result.status).toBe("hidden")
    expect(result.scheduledAt).toBe("2026-09-17T18:00:00.000Z")
    expect(JSON.stringify(result)).not.toContain("Ana")
    expect(JSON.stringify(result)).not.toContain("player-a")
  })
})
