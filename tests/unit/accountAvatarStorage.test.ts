import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("global account image storage", () => {
  it("stores uploaded images on app_users", async () => {
    const source = await readFile("src/app/api/account/profile/route.ts", "utf8")

    expect(source).toContain("export async function PATCH")
    expect(source).toContain('.from("app_users")')
    expect(source).toContain(".update({ avatar_url: avatarUrl })")
    expect(source).toContain("isValidStoredImageUrl")
  })

  it("uses the account endpoint from profile settings", async () => {
    const source = await readFile(
      "src/components/settings/AccountProfileSettings.tsx",
      "utf8",
    )

    expect(source).toContain("saveAvatar: saveAccountAvatar")
    expect(source).toContain("saveAccountAvatar(nextAvatarUrl)")
    expect(source).not.toContain("updateLeaguePlayerAvatar")
  })

  it("does not expose avatar writes through the league player endpoint", async () => {
    const source = await readFile(
      "src/app/api/leagues/[id]/players/[playerId]/route.ts",
      "utf8",
    )

    expect(source).not.toContain("avatarUrl")
    expect(source).not.toContain("avatar_url")
    expect(source).not.toContain("player_avatar_updated")
  })
})
