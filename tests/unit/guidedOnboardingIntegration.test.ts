import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("guided onboarding integration", () => {
  it("mounts the provider and help control in the authenticated shell", async () => {
    const boundary = await readFile("src/components/layout/AppRouteBoundary.tsx", "utf8")
    const shell = await readFile("src/components/layout/AppShell.tsx", "utf8")
    const provider = await readFile("src/features/onboarding/OnboardingProvider.tsx", "utf8")
    const overlay = await readFile("src/components/onboarding/GuidedTourOverlay.tsx", "utf8")
    expect(boundary).toContain("<OnboardingProvider>")
    expect(boundary).toContain("<GuidedTourOverlay />")
    expect(shell).toContain("<FloatingHelpButton")
    expect(shell).toContain('data-tour="floating-settings"')
    expect(shell).toContain('data-tour="floating-notifications"')
    expect(provider).toContain("includeFirstRunOnly")
    expect(provider).toContain('progress["app-introduction"]')
    expect(overlay).toContain('width: "min(432px, calc(100vw - 16px))"')
  })

  it("marks every first-release screen with stable tour selectors", async () => {
    const files = await Promise.all([
      readFile("src/app/page.tsx", "utf8"),
      readFile("src/app/matches/page.tsx", "utf8"),
      readFile("src/app/ranking/page.tsx", "utf8"),
      readFile("src/app/statistics/page.tsx", "utf8"),
      readFile("src/app/admin/season/page.tsx", "utf8"),
      readFile("src/components/settings/GlobalSettingsSearch.tsx", "utf8"),
      readFile("src/app/settings/page.tsx", "utf8"),
      readFile("src/components/invite/FloatingInviteShareButton.tsx", "utf8"),
      readFile("src/components/spectator/FloatingSpectatorShareButton.tsx", "utf8"),
      readFile("src/components/match/MatchActionsMenu.tsx", "utf8"),
    ])
    const source = files.join("\n")
    for (const marker of [
      "home-header",
      "home-next-match",
      "matches-scope",
      "matches-round-list",
      "ranking-table",
      "statistics-navigation",
      "season-admin-navigation",
      "settings-search",
      "floating-invite-players",
      "floating-share-spectators",
      "match-chat-access",
    ]) {
      expect(source).toContain(`data-tour="${marker}"`)
    }

    const settingsSource = files[6]
    for (const marker of [
      "settings-profile",
      "settings-appearance",
      "settings-notifications",
      "settings-context-switcher",
      "settings-suggestions",
    ]) {
      expect(settingsSource).toContain(`tour="${marker}"`)
    }
  })

  it("persists progress behind an authenticated API and a locked-down table", async () => {
    const route = await readFile("src/app/api/onboarding/progress/route.ts", "utf8")
    const migration = await readFile("supabase/migrations/20260806221500_add_guided_onboarding_progress.sql", "utf8")
    expect(route).toContain("requireAuthenticatedAppUser")
    expect(route).toContain("enforceRequestRateLimit")
    expect(route).toContain('from("user_onboarding_progress")')
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY")
    expect(migration).toContain("REVOKE ALL ON TABLE public.user_onboarding_progress")
  })
})
