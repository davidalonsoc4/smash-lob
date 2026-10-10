import { describe, expect, it } from "vitest"
import { compactParticipantName, groupChatProposalVoters } from "@/lib/chatProposalVoters"

it("keeps compact distinct names but expands colliding initials", () => {
  const names = ["David Alonso", "David Alvarez", "David Cano", "Ana", "Álvaro Ñuez"]
  expect(names.map((name) => compactParticipantName(name, names))).toEqual(["David Alonso", "David Alvarez", "David C.", "Ana", "Álvaro Ñ."])
})
it("compares compact names without case distinctions", () => {
  expect(compactParticipantName("David Alonso", ["David Alonso", "david alvarez"])).toBe("David Alonso")
})

describe("proposal voter visibility", () => {
  const participants = [
    { playerId: "a", userId: "u1" },
    { playerId: "b", userId: "u2" },
    { playerId: "c", userId: null },
    { playerId: "d", userId: null },
  ]
  it("shows all four players when only two have accounts", () => {
    const grouped = groupChatProposalVoters(participants, [
      { userId: "u1", optionKey: "date-1", response: "available" },
      { userId: "u2", optionKey: "date-1", response: "unavailable" },
    ], "date-1")
    expect(grouped.yes).toEqual([participants[0]])
    expect(grouped.no).toEqual([participants[1]])
    expect(grouped.pending).toEqual(participants.slice(2))
    expect([...grouped.yes, ...grouped.no, ...grouped.pending]).toHaveLength(4)
  })
  it("does not assign votes for another option or invent votes for unlinked players", () => {
    expect(groupChatProposalVoters(participants, [{ userId: "u1", optionKey: "other", response: "available" }], "date-1").pending).toEqual(participants)
  })
})
