import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

describe("v1.6.5 personal mode back controls and compact global filters", () => {
  it("adds the standard BackButton to Personal Matches and Global Profile", async () => {
    const [matches, profile] = await Promise.all([
      readFile("src/app/personal-matches/page.tsx", "utf8"),
      readFile("src/app/personal-matches/profile/page.tsx", "utf8"),
    ])

    expect(matches).toContain('import { BackButton } from "@/components/ui/BackButton"')
    expect(matches).toContain('<BackButton fallbackHref="/leagues" label={t.common.back} alwaysFallback />')
    expect(profile).toContain('import { BackButton } from "@/components/ui/BackButton"')
    expect(profile).toContain('<BackButton fallbackHref="/personal-matches" label={t.common.back} />')
  })

  it("replaces the tall three-select filter card with compact origin chips and two selects", async () => {
    const profile = await readFile("src/app/personal-matches/profile/page.tsx", "utf8")

    expect(profile).toContain("data-personal-global-filters")
    expect(profile).toMatch(/\["all",\s*tx\("Todos"\),\s*tx\("Todos los partidos"\)\]|\["all", "Todos", "Todos los partidos"\]/)
    expect(profile).toContain('participatingLeagues.length === 1 ? "Liga" : "Ligas"')
    expect(profile).toContain('match.origin === "friendly"')
    expect(profile).toContain('items.filter((match) => match.origin === "friendly").length === 1 ? "Amistoso" : "Amistosos"')
    expect(profile).toContain('participatingLeagues.length ?')
    expect(profile).toContain('hasFriendlyMatches ?')
    expect(profile).toContain('origin === "league" ? (')
    expect(profile).toMatch(/aria-label=(?:"Liga"|\{tx\("Liga"\)\})/)
    expect(profile).toMatch(/aria-label=(?:"Temporada"|\{tx\("Temporada"\)\})/)
    expect(profile).toContain("Todas las ligas")
    expect(profile).toContain("Todas las temporadas")
    expect(profile).not.toContain("Filtrar estadísticas")
    expect(profile).not.toContain("sm:grid-cols-3")
  })

  it("keeps filter behavior and compacts the statistics section selector", async () => {
    const [profile, statistics, tabs] = await Promise.all([
      readFile("src/app/personal-matches/profile/page.tsx", "utf8"),
      readFile("src/components/personal/PersonalProfileStatistics.tsx", "utf8"),
      readFile("src/components/player/ProfileSectionTabs.tsx", "utf8"),
    ])

    for (const token of [
      'setOrigin(value)',
      'value === "friendly"',
      'setLeagueId("")',
      'setSeasonId("")',
      'const effectiveLeagueId = origin === "league" ? leagueId : ""',
      "value={effectiveLeagueId}",
      "value={effectiveSeasonId}",
      "getPersonalProfileHeadToHead",
    ]) {
      expect(profile).toContain(token)
    }

    expect(profile).not.toContain('disabled={origin === "friendly"}')
    expect(tabs).toContain("data-personal-profile-sections")
    expect(tabs).toContain('tx("Resumen")')
    expect(tabs).toContain('tx("Parejas / rivales")')
    expect(tabs).toContain('tx("Cara a cara")')
    expect(statistics).toContain("ProfileSectionTabs")
    expect(tabs).toContain("rounded-lg px-1.5 py-1.5")
  })
})
