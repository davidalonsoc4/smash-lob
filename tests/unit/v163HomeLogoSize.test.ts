import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("HOME league logo geometry", () => {
  it("uses a profile-sized logo and leaves the functional row to Refresh", async () => {
    const [globals, home] = await Promise.all([
      readFile("src/app/globals.css", "utf8"),
      readFile("src/app/page.tsx", "utf8"),
    ])

    expect(globals).toContain('top: max(10px, calc(var(--app-safe-top) + 8px))')
    expect(globals).not.toContain(".app-home-top-logo")
    expect(globals).not.toContain("grid-template-columns: 6.25rem minmax(0, 1fr)")
    expect(home).toContain('visualStyle === "competition" ? "flex items-center gap-2" : "flex items-start gap-3"')
    expect(home).toContain('<LeagueLogo league={activeLeague} size="md" previewable />')
    expect(home).toContain('scale-[1.3]"} data-home-league-logo-scale')
    expect(home).toContain('visualStyle === "competition"')
    expect(home).toContain('<Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500">')
    expect(home).toContain('{tx("Mis ligas")}')
  })
})
