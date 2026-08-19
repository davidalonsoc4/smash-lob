import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.17 settings context and personal safe area", () => {
  it("gives Mis partidos the same mobile gesture-area treatment as league navigation", async () => {
    const [personalNav, css] = await Promise.all([
      read("src/components/personal/PersonalMatchesNav.tsx"),
      read("src/app/globals.css"),
    ])

    expect(personalNav).toContain('root.dataset.bottomNavVisible = "true"')
    expect(personalNav).toContain('className="personal-matches-bottom-nav')
    expect(personalNav).toContain('paddingBottom: "env(safe-area-inset-bottom)"')
    expect(css).toContain('data-bottom-nav-visible="true"')
    expect(css).toContain("--app-bottom-nav-safe-surface")
    expect(css).toContain('.personal-matches-bottom-nav')
  })

  it("keeps Settings neutral and returns to the exact screen that opened it", async () => {
    const [shell, settings, backButton, settingsSearch] = await Promise.all([
      read("src/components/layout/AppShell.tsx"),
      read("src/app/settings/page.tsx"),
      read("src/components/ui/BackButton.tsx"),
      read("src/components/settings/GlobalSettingsSearch.tsx"),
    ])

    expect(shell).toContain('const isSettingsRoute =')
    expect(shell).toContain('pathname === "/settings" || pathname.startsWith("/settings/")')
    expect(shell).toContain('!isSettingsRoute &&\n    !isPublicAccessRoute')
    expect(shell).toContain('href={`/settings?returnTo=${encodeURIComponent(pathname)}`}')
    expect(settings).toContain('fallbackHref="/"')
    expect(settings).toContain('returnToParam="returnTo"')
    expect(backButton).toContain("getSafeInternalReturnTo")
    expect(backButton).toContain("router.replace(explicitReturnTo)")
    expect(shell).toContain("hasBottomNav={shouldShowBottomNav}")
    expect(settingsSearch).toContain("hasBottomNav = true")
    expect(settingsSearch).toContain('max(14px, env(safe-area-inset-bottom, 0px))')
  })

  it("removes the global Settings bubble from both league and friendly chats", async () => {
    const shell = await read("src/components/layout/AppShell.tsx")

    const settingsGate = shell.slice(
      shell.indexOf("const shouldShowSettingsButton"),
      shell.indexOf("const shouldShowHelpButton"),
    )

    expect(settingsGate).toContain("!isMatchChatRoute")
    expect(settingsGate).toContain("!isSettingsRoute")
    expect(shell).toContain('pathname.startsWith("/match/")')
    expect(shell).toContain('pathname.startsWith("/personal-matches/")')
    expect(shell).toContain('pathname.endsWith("/chat")')
  })
})
