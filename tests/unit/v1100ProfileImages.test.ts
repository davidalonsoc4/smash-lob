import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { buildUserAvatarLookup, resolvePlayerAvatarUrl } from "@/lib/avatarResolution"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.0 profile and competitive player images", () => {
  it("makes the profile image optional during profile completion and reuses the account image pipeline", async () => {
    const gate = await read("src/components/auth/ProfileCompletionGate.tsx")

    expect(gate).toContain("ImageCropDialog")
    expect(gate).toContain("saveAvatar")
    expect(gate).toContain("outputSize={256}")
    expect(gate).toContain('outputType="image/webp"')
    expect(gate).toContain("maxOutputBytes={160 * 1024}")
    expect(gate).toContain("Opcional · si no subes una imagen")
    expect(gate).toContain("googleAvatarUrl")
  })

  it("keeps the superadmin override separate from the global account identity", async () => {
    const [migration, route, admin] = await Promise.all([
      read("supabase/migrations/20260816173000_add_competitive_player_images_and_scheduled_seasons.sql"),
      read("src/app/api/application-admin/players/[playerId]/avatar/route.ts"),
      read("src/components/application-admin/ApplicationAdminManagement.tsx"),
    ])

    expect(migration).toContain("competitive_avatar_url")
    expect(route).toContain("isSuperuser")
    expect(route).toContain("isValidAccountAvatarUrl")
    expect(route).toContain('.update({ competitive_avatar_url: avatarUrl })')
    expect(route).not.toContain('.from("app_users")')
    expect(admin).toContain("Imágenes competitivas de jugadores")
    expect(admin).toContain("Sin cuenta vinculada")
    expect(admin).toContain("CompetitivePlayerAvatarEditor")
  })

  it("prioritizes the competitive override over the linked global account image", () => {
    const users = buildUserAvatarLookup([
      { id: "user-1", avatarUrl: "https://example.com/global.webp" },
    ])

    expect(resolvePlayerAvatarUrl({
      competitiveAvatarUrl: "https://example.com/competitive.webp",
      linkedUserId: "user-1",
      users,
    })).toBe("https://example.com/competitive.webp")

    expect(resolvePlayerAvatarUrl({
      competitiveAvatarUrl: null,
      linkedUserId: "user-1",
      users,
    })).toBe("https://example.com/global.webp")
  })

  it("returns every player to the superadmin catalog and uses the override in league-facing lists", async () => {
    const [usersApi, leagueUsers] = await Promise.all([
      read("src/app/api/application-admin/users/route.ts"),
      read("src/app/api/leagues/[id]/users/route.ts"),
    ])

    expect(usersApi).toContain("const playerItems = players")
    expect(usersApi).toContain("players: playerItems")
    expect(usersApi).toContain("accountAvatarUrl")
    expect(usersApi).toContain("competitiveAvatarUrl")
    expect(leagueUsers).toContain("competitive_avatar_url")
    expect(leagueUsers).toContain("player.competitive_avatar_url")
  })
})
