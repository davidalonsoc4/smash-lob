import { describe, expect, it } from "vitest"
import { applyLeagueChatReaction, isLeagueChatReactionKey, LEAGUE_CHAT_REACTIONS, sortLeagueChatReactions } from "@/lib/leagueChatReactions"

describe("league chat reactions", () => {
  it("offers exactly the six agreed reactions", () => {
    expect(LEAGUE_CHAT_REACTIONS.map((reaction) => reaction.key)).toEqual(["thumbs_up", "heart", "laugh", "surprised", "ball", "fire"])
    expect(isLeagueChatReactionKey("fire")).toBe(true)
    expect(isLeagueChatReactionKey("🔥")).toBe(false)
    expect(isLeagueChatReactionKey(null)).toBe(false)
  })

  it("adds the viewer's reaction and joins an existing one", () => {
    expect(applyLeagueChatReaction(undefined, "fire")).toEqual([{ key: "fire", count: 1, mine: true }])
    expect(applyLeagueChatReaction([{ key: "heart", count: 2, mine: false }], "heart")).toEqual([{ key: "heart", count: 3, mine: true }])
  })

  it("keeps a single reaction per person: choosing another one replaces it", () => {
    const next = applyLeagueChatReaction([{ key: "heart", count: 1, mine: true }, { key: "fire", count: 1, mine: false }], "fire")
    expect(next).toEqual([{ key: "fire", count: 2, mine: true }])
  })

  it("withdraws the viewer's reaction and drops empty chips", () => {
    expect(applyLeagueChatReaction([{ key: "heart", count: 1, mine: true }], null)).toEqual([])
    expect(applyLeagueChatReaction([{ key: "heart", count: 2, mine: true }], null)).toEqual([{ key: "heart", count: 1, mine: false }])
  })

  it("sorts by count and then by the order of the picker", () => {
    const sorted = sortLeagueChatReactions([{ key: "fire", count: 1, mine: false }, { key: "thumbs_up", count: 1, mine: false }, { key: "heart", count: 3, mine: false }])
    expect(sorted.map((reaction) => reaction.key)).toEqual(["heart", "thumbs_up", "fire"])
  })
})
