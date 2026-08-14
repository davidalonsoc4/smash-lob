import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("top functional header row", () => {
  it("reserves vertical space instead of shrinking page headings", async () => {
    const [shell, globals, home, ranking, matches, ownProfile, playerProfile, sharedProfile, backButton, invite, help, spectatorShare] = await Promise.all([
      readFile("src/components/layout/AppShell.tsx", "utf8"),
      readFile("src/app/globals.css", "utf8"),
      readFile("src/app/page.tsx", "utf8"),
      readFile("src/app/ranking/page.tsx", "utf8"),
      readFile("src/app/matches/page.tsx", "utf8"),
      readFile("src/app/profile/page.tsx", "utf8"),
      readFile("src/app/player/[id]/page.tsx", "utf8"),
      readFile("src/components/player/PlayerProfileScreen.tsx", "utf8"),
      readFile("src/components/ui/BackButton.tsx", "utf8"),
      readFile("src/components/invite/FloatingInviteShareButton.tsx", "utf8"),
      readFile("src/components/onboarding/FloatingHelpButton.tsx", "utf8"),
      readFile("src/components/spectator/FloatingSpectatorShareButton.tsx", "utf8"),
    ])

    expect(shell).toContain('max(54px, calc(var(--app-safe-top) + 52px))')
    expect(shell).toContain('max(20px, calc(var(--app-safe-top) + 20px))')
    expect(shell).not.toContain("--app-floating-top-reserved-width")
    expect(globals).toContain('.app-main[data-has-floating-top-controls="true"] .app-top-back-control')
    expect(globals).not.toContain("max-width: calc(100% - var(--app-floating-top-reserved-width")
    expect(backButton).toContain("app-top-back-control")
    expect(shell).toContain('top: "max(4px, calc(var(--app-safe-top) + 4px))"')
    expect(shell).toContain("left: getPreproductionBadgeLeft()")
    expect(shell).toContain("zIndex: 80")
    expect(globals).not.toContain(".app-shell-frame:has(.app-top-back-control) .app-preproduction-badge")
    expect(globals).not.toContain('.app-shell-frame[data-home-route="true"] .app-preproduction-badge')
    expect(home).not.toContain('type-page-title truncate text-2xl')
    expect(shell).toContain('data-home-route={pathname === "/"}')
    expect(globals).not.toContain(".app-home-top-logo")
    expect(globals).not.toContain(".app-home-identity")
    expect(home).toContain('size="md"')
    expect(home).toContain('<BackButton fallbackHref="/" label={t.common.refreshApp} />')
    expect(home).toContain('onClickCapture={(event) => { event.preventDefault(); event.stopPropagation(); void refreshApp(); }}')
    expect(home).toContain('className={activeLeague.logoUrl ? "flex items-start gap-3" : "block"}')
    expect(globals).toContain(".app-page-header")
    expect(globals).toContain("padding-top: 0.5rem !important")
    expect(home).toContain('<BackButton fallbackHref="/" label={t.common.refreshApp} />')
    expect(home).toContain("registration.update()")
    expect(home).toContain("requestPwaUpdate(registration.waiting ?? worker, reload)")
    expect(ranking).toContain('<header data-tour="ranking-header" className="app-page-header">')
    expect(matches).toContain('<header data-tour="matches-header" className="app-page-header">')
    expect(ownProfile).toContain('import { PlayerProfileScreen } from "@/components/player/PlayerProfileScreen"')
    expect(ownProfile).toContain('<PlayerProfileScreen mode="self" />')
    expect(playerProfile).toContain('import { PlayerProfileScreen } from "@/components/player/PlayerProfileScreen"')
    expect(playerProfile).toContain('<PlayerProfileScreen playerIdOrSlug={id} mode="public" />')
    expect(sharedProfile).toContain('<header className="app-page-header">')
    for (const control of [invite, help, spectatorShare]) {
      expect(control).toContain('max(10px, calc(var(--app-safe-top) + 8px))')
      expect(control).not.toContain('max(16px, calc(var(--app-safe-top) + 12px))')
    }
  })
})
