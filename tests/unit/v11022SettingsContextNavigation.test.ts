import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

function source(path: string) {
  return readFileSync(path, "utf8")
}

describe("v1.10.22 settings context navigation", () => {
  it("hides the league bottom navbar across settings-derived routes", () => {
    const appShell = source("src/components/layout/AppShell.tsx")

    expect(appShell).toContain("const isSettingsContextRoute =")
    for (const route of [
      "/availability",
      "/leagues",
      "/payments",
      "/activity",
      "/help",
      "/changelog",
      "/admin",
      "/application-admin",
      "/experimental/avatar-lab",
    ]) {
      expect(appShell).toContain(`pathname === "${route}"`)
    }
    expect(appShell).toContain('pathname.startsWith("/admin/")')
    expect(appShell).toContain('pathname.startsWith("/application-admin/")')
    expect(appShell).toContain('pathname.startsWith("/experimental/avatar-lab/")')
    expect(appShell).toContain("!isSettingsContextRoute")
  })

  it("adds deterministic back navigation to the remaining settings descendants", () => {
    const activity = source("src/app/activity/page.tsx")
    expect(activity).toContain('fallbackHref={requestedScope === "admin" ? "/admin" : "/settings"}')
    expect(activity).toContain("label={t.common.back}")

    const publicLayout = source("src/components/legal/PublicSiteLayout.tsx")
    expect(publicLayout).toContain('<BackButton fallbackHref="/" label="Volver" />')
    expect(publicLayout).toContain("[&_.app-top-back-control]:!text-white")
  })

  it("keeps back controls in the settings descendants that already had them", () => {
    const required = [
      ["src/app/availability/page.tsx", 'fallbackHref="/settings"'],
      ["src/app/leagues/page.tsx", 'fallbackHref="/settings"'],
      ["src/app/payments/page.tsx", 'fallbackHref="/settings"'],
      ["src/app/admin/page.tsx", 'fallbackHref="/settings"'],
      ["src/app/help/page.tsx", 'fallbackHref="/settings"'],
      ["src/components/changelog/ChangelogPageContent.tsx", 'fallbackHref="/settings"'],
      ["src/features/avatar-lab/components/AvatarLabClient.tsx", 'fallbackHref="/settings"'],
      ["src/components/season/SeasonFinanceScreen.tsx", 'fallbackHref="/admin/season'],
      ["src/components/application-admin/ApplicationAdminManagement.tsx", 'fallbackHref="/application-admin"'],
    ] as const

    for (const [path, marker] of required) {
      expect(source(path)).toContain(marker)
    }
  })
})
