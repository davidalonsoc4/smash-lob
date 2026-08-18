import { describe, expect, it } from "vitest"
import { deduplicatePersonalMatchPeople } from "@/lib/personalMatchPeople"

function person({
  key,
  displayName,
  sourceLeagueNames,
  userId,
}: {
  key: string
  displayName: string
  sourceLeagueNames: string[]
  userId: string | null
}) {
  return {
    key,
    displayName,
    avatarUrl: null,
    sourceLeagueNames,
    isSelf: false,
    userId,
  }
}

describe("personal match people", () => {
  it("merges a legacy unlinked player into the only linked account with the same name", () => {
    const result = deduplicatePersonalMatchPeople([
      person({
        key: "user:alvaro",
        displayName: "Álvaro Ruiz",
        sourceLeagueNames: ["Liga A", "Liga B", "Liga C"],
        userId: "alvaro",
      }),
      person({
        key: "player:legacy-alvaro",
        displayName: "Alvaro  Ruiz",
        sourceLeagueNames: ["Liga D"],
        userId: null,
      }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      key: "user:alvaro",
      sourceLeagueNames: ["Liga A", "Liga B", "Liga C", "Liga D"],
    })
  })

  it("keeps same-name people separate when more than one linked account exists", () => {
    const result = deduplicatePersonalMatchPeople([
      person({ key: "user:1", displayName: "Alex García", sourceLeagueNames: ["Liga A"], userId: "1" }),
      person({ key: "user:2", displayName: "Alex García", sourceLeagueNames: ["Liga B"], userId: "2" }),
      person({ key: "player:legacy", displayName: "Alex García", sourceLeagueNames: ["Liga C"], userId: null }),
    ])

    expect(result).toHaveLength(3)
  })
})
