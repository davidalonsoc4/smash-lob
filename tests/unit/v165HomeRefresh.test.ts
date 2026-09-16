import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.6.5 HOME refresh and compact season sharing", () => {
  it("uses a normal league logo beside the HOME title", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")
    expect(home).toContain('<LeagueLogo league={activeLeague} size="md" previewable />')
    expect(home).toContain('className={activeLeague.logoUrl ? "flex items-start gap-3" : "block"}')
    expect(home).not.toContain("app-home-top-logo")
  })

  it("opens the league list from HOME", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")
    expect(home).toContain('<Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500">')
    expect(home).toContain('{tx("Mis ligas")}')
  })

  it("shortens the finished-season share action in every locale", async () => {
    const [es, en, eu] = await Promise.all([
      readFile("src/i18n/locales/es.ts", "utf8"),
      readFile("src/i18n/locales/en.ts", "utf8"),
      readFile("src/i18n/locales/eu.ts", "utf8"),
    ])
    expect(es).toContain('shareSeasonSummary: "Compartir resumen"')
    expect(en).toContain('shareSeasonSummary: "Share summary"')
    expect(eu).toContain('shareSeasonSummary: "Laburpena partekatu"')
  })
})
