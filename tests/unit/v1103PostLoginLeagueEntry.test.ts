import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.10.3 post-login league entry", () => {
  it("waits for the real league snapshot before showing onboarding", async () => {
    const source = await readFile("src/components/auth/LeagueEntryGate.tsx", "utf8")
    expect(source).toContain("isAccessHydrated")
    expect(source).toContain("return <AppBootSkeleton />")
    expect(source.indexOf("if (!isAccessHydrated")).toBeLessThan(source.indexOf("if (userLeagues.length > 0)"))
  })

  it("opens Mis ligas after login but keeps the active HOME on a document reload", async () => {
    const source = await readFile("src/components/auth/LeagueEntryGate.tsx", "utf8")
    expect(source).toContain("initialLeagueEntryResolved")
    expect(source).toContain("setInitialLeagueEntryResolved")
    expect(source).not.toContain("useRef")
    expect(source).toContain("function isDocumentReload()")
    expect(source).toContain('getEntriesByType(\n    "navigation",')
    expect(source).toContain('navigationEntry.type === "reload"')
    expect(source).toContain('window.performance.navigation?.type === 1')
    expect(source).toContain('!isDocumentReload()')
    expect(source).toContain('router.replace("/leagues")')
  })

  it("keeps the existing one-league and zero-league destinations", async () => {
    const source = await readFile("src/components/auth/LeagueEntryGate.tsx", "utf8")
    expect(source).toContain("if (userLeagues.length > 0)")
    expect(source).toContain("{t.onboarding.title}")
    expect(source).toContain("isAccessInviteRoute")
  })
})
