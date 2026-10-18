import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("player profile shared layout", () => {
  it("uses one shared profile screen for own and public player routes", async () => {
    const [ownProfile, playerProfile, sharedProfile, identityCard] = await Promise.all([
      readFile("src/app/profile/page.tsx", "utf8"),
      readFile("src/app/player/[id]/page.tsx", "utf8"),
      readFile("src/components/player/PlayerProfileScreen.tsx", "utf8"),
      readFile("src/components/player/PlayerProfileIdentityCard.tsx", "utf8"),
    ])

    expect(ownProfile).toContain('<PlayerProfileScreen mode="self" />')
    expect(ownProfile).not.toContain('"use client"')
    expect(playerProfile).toContain('<PlayerProfileScreen playerIdOrSlug={id} mode="public" />')
    expect(playerProfile).not.toContain('"use client"')
    expect(playerProfile).toContain('params: Promise<{ id: string }>')
    expect(sharedProfile).toContain('import { useCurrentUser } from "@/context/CurrentUserProvider"')
    expect(sharedProfile).toContain('const resolvedPlayerIdOrSlug = isSelf ? currentUserId : playerIdOrSlug')
    expect(sharedProfile).toContain('<header className="app-page-header">')
    expect(sharedProfile).toContain("<PlayerProfileIdentityCard")
    expect(identityCard).toContain('<PlayerAvatar player={player} size="md" previewable />')
    expect(identityCard).not.toContain("AppCard")

    const avatarIndex = identityCard.indexOf('<PlayerAvatar player={player} size="md" previewable />')
    const titleIndex = identityCard.indexOf("{player.displayName}", avatarIndex)
    const contextIndex = identityCard.indexOf("{contextDetails ?", titleIndex)
    expect(titleIndex).toBeGreaterThan(avatarIndex)
    expect(contextIndex).toBeGreaterThan(titleIndex)
    expect(sharedProfile).toContain("<SeasonContextLine seasonName={latestSeason.name}")

    expect(sharedProfile).toMatch(/const historyHref = isSelf\s*\?\s*"\/personal-matches"/)
    expect(sharedProfile).toMatch(/\{isSelf\s*&&\s*section\s*===\s*"summary"\s*&&\s*latestSeasonSettings\?\.availabilityRecommendationsEnabled\s*\?\s*\(/)
    expect(sharedProfile).toContain('<Link href="/availability" className="block">')
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

  it("uses the current accent for form while keeping wins and losses distinct", async () => {
    const form = await readFile("src/components/player/ProfileFormResults.tsx", "utf8")
    expect(form).toContain("bg-[var(--app-accent)]")
    expect(form).toContain("text-xs font-black uppercase tracking-[0.14em] text-[var(--competition-accent-contrast)]")
    expect(form).toContain('tx("Racha")')
    expect(form).toContain('tx("Racha reciente")')
    expect(form).toContain("bg-emerald-600")
    expect(form).toContain("bg-rose-600")
    expect(form).toContain("border-2 border-white shadow-md ring-1 ring-black/10")
    expect(form).toContain("text-white")
    expect(form).toContain("text-sm font-black text-white drop-shadow-sm")
    expect(form).not.toContain("bg-amber-300")
  })
})
