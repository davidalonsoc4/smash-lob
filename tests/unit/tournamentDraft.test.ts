import { describe, expect, it } from "vitest"
import { tournamentDraftFromCopy } from "@/lib/tournamentDraft"

describe("independent tournament copy", () => {
  it("does not silently convert an unknown format to Americana", () => {
    expect(() => tournamentDraftFromCopy({ tournament: { id: "x", name: "x", description: "", courtNames: [], configuration: { format: "future_format" } }, players: [] })).toThrow("unsupported_tournament_copy_format")
  })
  it("preserves explicit fixed pairs when copying the tournament", () => {
    const draft = tournamentDraftFromCopy({ tournament: { id: "original", name: "Parejas", description: "", courtNames: ["Pista"], configuration: { format: "balanced_americana", pairing: "fixed" } }, players: [{name:"A",pairNumber:2},{name:"B",pairNumber:1},{name:"C",pairNumber:1},{name:"D",pairNumber:2}] })
    expect(draft).toMatchObject({ pairing: "fixed", pairNumbers: [2,1,1,2] })
  })
  it("copies roster/settings but excludes identity, results, clock, invites and source season", () => {
    const source = {
      tournament: { id: "original", name: "Americana", description: "Prueba", courtNames: ["Club · Pista 1", "Club · Pista 2"],
        configuration: { format: "dynamic_mexicano", reservationMinutes: 90, preparationMinutes: 3 }, status: "finished", startedAt: "old", sourceSeasonId: "season" },
      players: [{ name: "Ana", userId: "user-ana" }, { name: "Pepe" }], matches: [{ scoreA: 12, scoreB: 10 }],
    }
    const draft = tournamentDraftFromCopy(source)
    expect(draft).toEqual({ duplicateOf: "original", name: "Americana", description: "Prueba", courtNames: ["Club · Pista 1", "Club · Pista 2"], format: "dynamic_mexicano", pairing: "rotating", pairNumbers: [1,1], reservationMinutes: 90, preparationMinutes: 3, rounds: 6, roundMinutes: 16, transitionMinutes: 3, breakMinutes: 0, breakEveryRounds: 0, logoUrl: null, accentColor: null, players: ["Ana", "Pepe"], playerUserIds: ["user-ana", null] })
    draft.courtNames[0] = "Otra pista"
    expect(source.tournament.courtNames[0]).toBe("Club · Pista 1")
  })
})
