import { describe, expect, it } from "vitest"
import { getHomeMatchPreviewScopes } from "@/lib/homeMatchPreview"

const match = { id: "a", round: 1, teamA: ["p1", "p2"], teamB: ["p3", "p4"] }
describe("home match preview availability", () => {
  it("shows a shared personal/league encounter only once", () => {
    expect(getHomeMatchPreviewScopes(match, { ...match })).toEqual(["mine"])
    expect(getHomeMatchPreviewScopes(match, { ...match, id: "copy" })).toEqual(["mine"])
  })
  it("keeps personal before league when they are different matches", () => {
    expect(getHomeMatchPreviewScopes(match, { ...match, id: "b", round: 2 })).toEqual(["mine", "league"])
  })
  it("does not create empty or duplicate panels when one context has no match", () => {
    expect(getHomeMatchPreviewScopes(null, match)).toEqual(["league"])
    expect(getHomeMatchPreviewScopes(match, null)).toEqual(["mine"])
    expect(getHomeMatchPreviewScopes(null, null)).toEqual([])
  })
})
