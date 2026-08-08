import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("personal matches navigation", () => {
  it("uses a compact three-destination nav and keeps Back only on subpages", async () => {
    const [shell, nav, rootPage, newPage, detailPage] = await Promise.all([
      readFile("src/components/layout/AppShell.tsx", "utf8"),
      readFile("src/components/personal/PersonalMatchesNav.tsx", "utf8"),
      readFile("src/app/personal-matches/page.tsx", "utf8"),
      readFile("src/app/personal-matches/new/page.tsx", "utf8"),
      readFile("src/app/personal-matches/[id]/page.tsx", "utf8"),
    ])

    expect(nav).toContain('aria-label="Navegación de Mis partidos"')
    expect(nav).toContain('href: "/personal-matches"')
    expect(nav).toContain('href: "/personal-matches/new"')
    expect(nav).toContain('href: "/leagues"')
    expect(nav).toContain('label: "Mis partidos"')
    expect(nav).toContain('label: "+ Partido"')
    expect(nav).toContain('label: "Ligas"')
    expect(shell).toContain("shouldShowPersonalMatchesNav")
    expect(shell).toContain("<PersonalMatchesNav")
    expect(rootPage).not.toContain("<BackButton")
    expect(newPage).toContain("<BackButton")
    expect(detailPage).toContain("<BackButton")
  })
})
