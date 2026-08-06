import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import {
  ACCOUNT_AVATAR_MAX_BYTES,
  isValidAccountAvatarUrl,
} from "@/lib/serverImageValidation"

describe("global account image storage", () => {
  it("stores uploaded images on app_users", async () => {
    const source = await readFile("src/app/api/account/profile/route.ts", "utf8")

    expect(source).toContain("export async function PATCH")
    expect(source).toContain('.from("app_users")')
    expect(source).toContain(".update({ avatar_url: avatarUrl })")
    expect(source).toContain("isValidAccountAvatarUrl")
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

  it("keeps new account images within the mobile payload budget", async () => {
    const profile = await readFile(
      "src/components/settings/AccountProfileSettings.tsx",
      "utf8",
    )
    const validation = await readFile(
      "src/lib/serverImageValidation.ts",
      "utf8",
    )
    const clientImages = await readFile("src/lib/clientImages.ts", "utf8")

    expect(profile).toContain("outputSize={256}")
    expect(profile).toContain('outputType="image/webp"')
    expect(profile).toContain("maxOutputBytes={160 * 1024}")
    expect(validation).toContain("ACCOUNT_AVATAR_MAX_BYTES = 160 * 1024")
    expect(validation).toContain("LEGACY_STORED_IMAGE_MAX_BYTES = 512 * 1024")
    expect(clientImages).not.toContain('preferredType !== "image/png"')
    expect(clientImages).toContain("fallbackType")
  })

  it("accepts the new image budget and rejects larger data images", () => {
    const withinBudget = `data:image/webp;base64,${Buffer.alloc(ACCOUNT_AVATAR_MAX_BYTES).toString("base64")}`
    const overBudget = `data:image/webp;base64,${Buffer.alloc(ACCOUNT_AVATAR_MAX_BYTES + 1).toString("base64")}`

    expect(isValidAccountAvatarUrl(withinBudget)).toBe(true)
    expect(isValidAccountAvatarUrl(overBudget)).toBe(false)
    expect(isValidAccountAvatarUrl("https://example.com/avatar.webp")).toBe(true)
    expect(isValidAccountAvatarUrl("javascript:alert(1)")).toBe(false)
  })
})
