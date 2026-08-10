import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("top functional header row", () => {
  it("reserves vertical space instead of shrinking page headings", async () => {
    const [shell, globals, home, ranking, matches, ownProfile, playerProfile, backButton, invite, help, spectatorShare, typographyChecker] = await Promise.all([
      readFile("src/components/layout/AppShell.tsx", "utf8"),
      readFile("src/app/globals.css", "utf8"),
      readFile("src/app/page.tsx", "utf8"),
      readFile("src/app/ranking/page.tsx", "utf8"),
      readFile("src/app/matches/page.tsx", "utf8"),
      readFile("src/app/profile/page.tsx", "utf8"),
      readFile("src/app/player/[id]/page.tsx", "utf8"),
      readFile("src/components/ui/BackButton.tsx", "utf8"),
      readFile("src/components/invite/FloatingInviteShareButton.tsx", "utf8"),
      readFile("src/components/onboarding/FloatingHelpButton.tsx", "utf8"),
      readFile("src/components/spectator/FloatingSpectatorShareButton.tsx", "utf8"),
      readFile("scripts/check-typography-system.mjs", "utf8"),
    ])

    expect(shell).toContain('max(46px, calc(env(safe-area-inset-top, 0px) + 44px))')
    expect(shell).not.toContain("--app-floating-top-reserved-width")
    expect(globals).toContain('.app-main[data-has-floating-top-controls="true"] .app-top-back-control')
    expect(globals).not.toContain("max-width: calc(100% - var(--app-floating-top-reserved-width")
    expect(backButton).toContain("app-top-back-control")
    expect(globals).toContain(".app-shell-frame:has(.app-top-back-control) .app-preproduction-badge")
    expect(home).not.toContain('type-page-title truncate text-2xl')
    expect(shell).toContain('data-home-route={pathname === "/"}')
    expect(globals).toContain(".app-home-top-logo")
    expect(globals).toContain("top: -36px")
    expect(globals).toContain("position: absolute")
    expect(globals).toContain("left: 0")
    expect(globals).toContain("grid-template-columns: 5rem minmax(0, 1fr)")
    expect(home).toContain('size="xl"')
    expect(home).toContain("app-home-identity-copy")
    expect(globals).toContain(".app-home-identity-copy")
    expect(globals).toContain(".app-page-header")
    expect(globals).toContain("padding-top: 0.5rem !important")
    expect(globals).toContain("grid-column: 2")
    expect(globals).toContain("align-self: end")
    expect(ranking).toContain('<header data-tour="ranking-header" className="app-page-header">')
    expect(matches).toContain('<header data-tour="matches-header" className="app-page-header">')
    expect(ownProfile).toContain('<header className="app-page-header">')
    expect(playerProfile).toContain('<header className="app-page-header">')
    expect(typographyChecker).toContain('file.replace(/\\\\/g, "/")')
    expect(typographyChecker).toContain('normalizedAppPath(file) === "src/app/page.tsx"')
    for (const control of [invite, help, spectatorShare]) {
      expect(control).toContain('max(10px, calc(env(safe-area-inset-top, 0px) + 8px))')
      expect(control).not.toContain('max(16px, calc(env(safe-area-inset-top, 0px) + 12px))')
    }
  })
})
