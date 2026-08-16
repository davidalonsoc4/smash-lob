import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.10.3 post-login league entry", () => {
  it("waits for the real league snapshot before showing onboarding", async () => {
    const source = await readFile("src/components/auth/LeagueEntryGate.tsx", "utf8")
    expect(source).toContain("isAccessHydrated")
    expect(source).toContain("return <AppBootSkeleton />")
    expect(source.indexOf("if (!isAccessHydrated")).toBeLessThan(source.indexOf("if (userLeagues.length > 0)"))
  })

  it("opens Mis ligas first for a multi-league account", async () => {
    const source = await readFile("src/components/auth/LeagueEntryGate.tsx", "utf8")
    expect(source).toContain("initialLeagueEntryResolved")
    expect(source).toContain("setInitialLeagueEntryResolved")
    expect(source).not.toContain("useRef")
    expect(source).toContain('pathname === "/" && userLeagues.length > 1')
    expect(source).toContain('router.replace("/leagues")')
  })

  it("keeps the existing one-league and zero-league destinations", async () => {
    const source = await readFile("src/components/auth/LeagueEntryGate.tsx", "utf8")
    expect(source).toContain("if (userLeagues.length > 0)")
    expect(source).toContain("{t.onboarding.title}")
    expect(source).toContain("isAccessInviteRoute")
  })
})
