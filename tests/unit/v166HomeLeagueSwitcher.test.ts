import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

describe("v1.6.6 HOME quick league switcher", () => {
  it("keeps the league title as the visible trigger and uses the real active league provider", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")

    expect(home).toContain('import { useActiveLeague } from "@/context/ActiveLeagueProvider"')
    expect(home).toContain("const { activateLeague } = useActiveLeague()")
    expect(home).toContain('data-tour="home-league-switcher"')
    expect(home).toContain('aria-haspopup="menu"')
    expect(home).toContain('aria-expanded={isLeaguePickerOpen}')
    expect(home).toContain("{activeLeague.name}</button>")
    expect(home).toContain("activateLeague(league.id)")
  })

  it("offers every accessible league, marks the active one and includes MIS PARTIDOS", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")

    expect(home).toContain("const accessibleHomeLeagues = leagues.filter")
    expect(home).toContain("canAccessLeague(league.id) || isLeagueSpectator(league.id)")
    expect(home).toContain("accessibleHomeLeagues.map")
    expect(home).toContain('role="menuitemradio"')
    expect(home).toContain("aria-checked={league.id === activeLeague.id}")
    expect(home).toContain('href="/personal-matches"')
    expect(home).toContain(">MIS PARTIDOS</Link>")
    expect(home).not.toContain("Cambiar liga ▼")
    expect(home).not.toContain("Cambiar liga ▾")
  })

  it("teaches the invisible interaction in every supported locale", async () => {
    const tours = await readFile("src/features/onboarding/tours.ts", "utf8")
    const checker = await readFile("scripts/check-guided-onboarding.mjs", "utf8")

    expect(tours).toContain("[data-tour='home-league-switcher']")
    expect(tours).toContain("Cambia de liga rápidamente")
    expect(tours).toContain("Switch leagues quickly")
    expect(tours).toContain("Aldatu liga azkar")
    expect(tours).toContain("Mis partidos")
    expect(tours).toContain("My matches")
    expect(tours).toContain("Nire partidak")
    expect(checker).toContain("home-league-switcher")
  })

  it("keeps all visible release surfaces aligned with the current app version", async () => {
    const [pkg, lock, version, sw, changelog] = await Promise.all([
      readFile("package.json", "utf8"),
      readFile("package-lock.json", "utf8"),
      readFile("src/lib/appVersion.ts", "utf8"),
      readFile("public/sw.js", "utf8"),
      readFile("src/lib/changelog.ts", "utf8"),
    ])

    const currentVersion = JSON.parse(pkg).version as string
    expect(lock).toContain(`"version": "${currentVersion}"`)
    expect(version).toContain(`APP_VERSION = "${currentVersion}"`)
    expect(sw).toContain(`CACHE_VERSION = "smash-lob-v${currentVersion}"`)
    expect(changelog).toContain(`version: "v${currentVersion}"`)
  })
})
