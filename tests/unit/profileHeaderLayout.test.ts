import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("player profile shared layout", () => {
  it("uses one shared profile screen for own and public player routes", async () => {
    const [ownProfile, playerProfile, sharedProfile] = await Promise.all([
      readFile("src/app/profile/page.tsx", "utf8"),
      readFile("src/app/player/[id]/page.tsx", "utf8"),
      readFile("src/components/player/PlayerProfileScreen.tsx", "utf8"),
    ])

    expect(ownProfile).toContain('<PlayerProfileScreen mode="self" />')
    expect(ownProfile).not.toContain('"use client"')
    expect(playerProfile).toContain('<PlayerProfileScreen playerIdOrSlug={id} mode="public" />')
    expect(playerProfile).not.toContain('"use client"')
    expect(playerProfile).toContain('params: Promise<{ id: string }>')
    expect(sharedProfile).toContain('import { useCurrentUser } from "@/context/CurrentUserProvider"')
    expect(sharedProfile).toContain('const resolvedPlayerIdOrSlug = isSelf ? currentUserId : playerIdOrSlug')
    expect(sharedProfile).toContain('<header className="app-page-header">')
    expect(sharedProfile).toContain('<PlayerAvatar player={player} size="md" previewable />')

    const avatarIndex = sharedProfile.indexOf('<PlayerAvatar player={player} size="md" previewable />')
    const titleIndex = sharedProfile.indexOf("{player.displayName}", avatarIndex)
    const contextIndex = sharedProfile.indexOf("<SeasonContextLine", titleIndex)
    expect(titleIndex).toBeGreaterThan(avatarIndex)
    expect(contextIndex).toBeGreaterThan(titleIndex)

    expect(sharedProfile).toMatch(/const historyHref = isSelf\s*\?\s*"\/profile\/matches"/)
    expect(sharedProfile).toMatch(/\{isSelf\s*\?\s*\(\s*<Link href="\/availability">/)
    expect(sharedProfile).not.toContain("getSeasonStatusBadgeClassName")
  })

  it("keeps the strongest teammate label on one line", async () => {
    const stats = await readFile("src/components/player/PlayerStatsPanel.tsx", "utf8")
    const labelIndex = stats.indexOf("{t.playerStats.strongestTeammate}")
    const classStart = stats.lastIndexOf('className="', labelIndex)
    const classEnd = stats.indexOf('"', classStart + 11)
    const className = stats.slice(classStart, classEnd)

    expect(className).toContain("whitespace-nowrap")
  })
})
