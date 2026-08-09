import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("personal matches navigation", () => {
  it("uses a compact four-destination nav with a global profile and keeps Back only on subpages", async () => {
    const [shell, nav, rootPage, profilePage, newPage, detailPage] = await Promise.all([
      readFile("src/components/layout/AppShell.tsx", "utf8"),
      readFile("src/components/personal/PersonalMatchesNav.tsx", "utf8"),
      readFile("src/app/personal-matches/page.tsx", "utf8"),
      readFile("src/app/personal-matches/profile/page.tsx", "utf8"),
      readFile("src/app/personal-matches/new/page.tsx", "utf8"),
      readFile("src/app/personal-matches/[id]/page.tsx", "utf8"),
    ])

    expect(nav).toContain('aria-label="Navegación de Mis partidos"')
    expect(nav).toContain('href: "/personal-matches"')
    expect(nav).toContain('href: "/personal-matches/profile"')
    expect(nav).toContain('href: "/personal-matches/new"')
    expect(nav).toContain('href: "/leagues"')
    expect(nav).toContain('label: "Mis partidos"')
    expect(nav).toContain('label: "Mi perfil"')
    expect(nav).toContain('label: "+ Partido"')
    expect(nav).toContain('label: "Ligas"')
    expect(nav).toContain("grid-cols-4")
    expect(profilePage).toContain("Perfil global")
    expect(profilePage).toContain("Todos los partidos")
    expect(profilePage).toContain("Partidos de liga")
    expect(profilePage).toContain("Todas las temporadas")
    expect(shell).toContain("shouldShowPersonalMatchesNav")
    expect(shell).toContain("<PersonalMatchesNav")
    expect(rootPage).not.toContain("<BackButton")
    expect(newPage).toContain("<BackButton")
    expect(detailPage).toContain("<BackButton")
  })
})
