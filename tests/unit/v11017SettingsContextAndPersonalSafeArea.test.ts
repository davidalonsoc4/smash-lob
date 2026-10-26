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
    expect(shell).toContain('!isSettingsContextRoute &&\n    !isPublicAccessRoute')
    expect(shell).toContain('href={`/settings?returnTo=${encodeURIComponent(pathname)}`}')
    expect(shell).toContain("const settingsOpenedFromCompetition =")
    expect(settings).toContain('fallbackHref="/"')
    expect(settings).toContain('returnToParam="returnTo"')
    expect(backButton).toContain("getSafeInternalReturnTo")
    expect(backButton).toContain("router.replace(explicitReturnTo)")
    expect(shell).toContain("hasBottomNav={shouldShowBottomNav}")
    expect(settingsSearch).toContain("hasBottomNav = true")
    expect(settingsSearch).toContain("<FloatingSearchButton")
    expect(settingsSearch).toContain("hasBottomNav={hasBottomNav}")
    const floatingButton = await read("src/components/ui/FloatingSearchButton.tsx")
    expect(floatingButton).toContain('max(14px, env(safe-area-inset-bottom, 0px))')
  })

  it("uses competition-only settings and exposes tournament management inside general Settings", async () => {
    const [settings, tournamentSettings, tournamentRoute] = await Promise.all([
      read("src/app/settings/page.tsx"),
      read("src/components/tournament/RapidTournamentSettings.tsx"),
      read("src/app/tournaments/[id]/settings/page.tsx"),
    ])

    expect(settings).toContain('returnTo === "/leagues" || returnTo === "/leagues/all" || returnTo === "/tournaments"')
    expect(settings).toContain('return <CompetitionSettingsPage allowCreation={returnTo === "/leagues"} />')
    expect(settings).toContain("return <PlayerSettingsPage tournamentId={tournamentId} />")
    expect(settings).toContain("TournamentManagementSettingsSection")
    expect(settings).toContain('id="manage-tournament"')
    expect(tournamentSettings).toContain('data.access.role === "creator"')
    expect(tournamentSettings).toContain('data.tournament.status === "finished"')
    expect(tournamentSettings).toContain('method: "DELETE"')
    expect(tournamentRoute).toContain("RapidTournamentSettings")
  })

  it("keeps the same four-action toolbar visible in league and friendly chats", async () => {
    const shell = await read("src/components/layout/AppShell.tsx")

    expect(shell).toContain("const shouldShowActionBar = !isPublicAccessRoute")
    expect(shell).toContain("const shouldShowSettingsButton = shouldShowActionBar")
    expect(shell).toContain("const shouldShowHelpButton = shouldShowActionBar")
    expect(shell).toContain("const shouldShowNotificationsButton = shouldShowActionBar")
    expect(shell).toContain("const shouldShowSpectatorShareButton = shouldShowActionBar")
    expect(shell).toContain('pathname.startsWith("/match/")')
    expect(shell).toContain('pathname.startsWith("/personal-matches/")')
    expect(shell).toContain('pathname.endsWith("/chat")')
  })
})
