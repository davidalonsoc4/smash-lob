import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("leagues navigation", () => {
  it("keeps Mis ligas in the normal app navigation context", async () => {
    const [shell, bottomNav, leaguesPage] = await Promise.all([
      readFile("src/components/layout/AppShell.tsx", "utf8"),
      readFile("src/components/layout/BottomNav.tsx", "utf8"),
      readFile("src/app/leagues/page.tsx", "utf8"),
    ])

    expect(shell).toContain("const shouldShowBottomNav")
    expect(shell).toContain("!isPersonalMatchesRoute")
    expect(shell).not.toMatch(/shouldShowBottomNav[\s\S]{0,240}!shouldShowLeagueSearch/)
    expect(bottomNav).toContain('href: "/"')
    expect(bottomNav).toContain('href: "/ranking"')
    expect(bottomNav).toContain('href: "/matches"')
    expect(bottomNav).toContain('href: "/profile"')
    expect(leaguesPage).toContain('href="/personal-matches/new"')
    expect(leaguesPage).toContain("Registrar encuentro amistoso")
  })
})
