import { describe, expect, it } from "vitest"
import {
  buildUserAvatarLookup,
  resolvePlayerAvatarUrl,
} from "@/lib/avatarResolution"

const users = buildUserAvatarLookup([
  {
    id: "user-1",
    displayName: "Jugador Uno",
    avatarUrl: "https://example.com/account.png",
  },
])

describe("resolvePlayerAvatarUrl", () => {
  it("prioritizes the custom avatar for the active league", () => {
    expect(
      resolvePlayerAvatarUrl({
        leagueAvatarUrl: "https://example.com/league.png",
        linkedUserId: "user-1",
        playerAvatarUrl: "https://example.com/player.png",
        users,
      }),
    ).toBe("https://example.com/league.png")
  })

  it("falls back to the linked account avatar when the league avatar is removed", () => {
    expect(
      resolvePlayerAvatarUrl({
        leagueAvatarUrl: null,
        linkedUserId: "user-1",
        playerAvatarUrl: "https://example.com/player.png",
        users,
      }),
    ).toBe("https://example.com/account.png")
  })

  it("uses the player avatar only when there is no linked account avatar", () => {
    expect(
      resolvePlayerAvatarUrl({
        leagueAvatarUrl: null,
        linkedUserId: null,
        playerAvatarUrl: "https://example.com/player.png",
        users,
      }),
    ).toBe("https://example.com/player.png")
  })

  it("does not infer an account image from a matching display name after unlinking", () => {
    expect(
      resolvePlayerAvatarUrl({
        leagueAvatarUrl: null,
        linkedUserId: null,
        playerAvatarUrl: null,
        users,
      }),
    ).toBeNull()
  })
})
