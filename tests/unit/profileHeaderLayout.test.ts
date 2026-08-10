import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("player profile header layout", () => {
  it("keeps season context under the player name with a normal avatar in own and public profiles", async () => {
    const [ownProfile, playerProfile] = await Promise.all([
      readFile("src/app/profile/page.tsx", "utf8"),
      readFile("src/app/player/[id]/page.tsx", "utf8"),
    ])

    for (const source of [ownProfile, playerProfile]) {
      expect(source).toContain('<PlayerAvatar player={player} size="md" previewable />')
      const avatarIndex = source.indexOf('<PlayerAvatar player={player} size="md" previewable />')
      const titleIndex = source.indexOf("{player.displayName}", avatarIndex)
      const contextIndex = source.indexOf("<SeasonContextLine", titleIndex)
      const textColumnEnd = source.indexOf("</div>\n        </div>", contextIndex)
      expect(titleIndex).toBeGreaterThan(avatarIndex)
      expect(contextIndex).toBeGreaterThan(titleIndex)
      expect(textColumnEnd).toBeGreaterThan(contextIndex)
    }

    expect(playerProfile).not.toContain("getSeasonStatusBadgeClassName")
    expect(playerProfile).not.toContain("<span>{activeLeague.name}</span>")
  })
})
