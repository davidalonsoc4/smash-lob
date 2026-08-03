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
  it("uses the global image of the linked account in every league", () => {
    expect(
      resolvePlayerAvatarUrl({
        linkedUserId: "user-1",
        users,
      }),
    ).toBe("https://example.com/account.png")
  })

  it("returns the default avatar when the player is not linked", () => {
    expect(
      resolvePlayerAvatarUrl({
        linkedUserId: null,
        users,
      }),
    ).toBeNull()
  })

  it("returns the default avatar when the linked account has no image", () => {
    const usersWithoutImage = buildUserAvatarLookup([
      { id: "user-2", avatarUrl: null },
    ])

    expect(
      resolvePlayerAvatarUrl({
        linkedUserId: "user-2",
        users: usersWithoutImage,
      }),
    ).toBeNull()
  })

  it("rejects unsafe account image values", () => {
    const unsafeUsers = buildUserAvatarLookup([
      { id: "user-3", avatarUrl: "javascript:alert(1)" },
    ])

    expect(
      resolvePlayerAvatarUrl({
        linkedUserId: "user-3",
        users: unsafeUsers,
      }),
    ).toBeNull()
  })
})
