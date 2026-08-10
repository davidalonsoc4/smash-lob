import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.6.3 HOME league logo geometry", () => {
  it("fills the useful HOME header height while matching floating-control top margin", async () => {
    const [globals, home] = await Promise.all([
      readFile("src/app/globals.css", "utf8"),
      readFile("src/app/page.tsx", "utf8"),
    ])

    expect(globals).toContain("grid-template-columns: 6.25rem minmax(0, 1fr)")
    expect(globals).toContain("top: -52px")
    expect(globals).toContain("width: 6.25rem !important")
    expect(globals).toContain("height: 6.25rem !important")
    expect(globals).toContain("top: max(10px, calc(env(safe-area-inset-top, 0px) + 8px))")
    expect(home).toContain('activeLeague.logoUrl ? "app-home-identity" : "block"')
    expect(home).toContain('activeLeague.logoUrl ? "app-home-identity-copy min-w-0" : "min-w-0"')
    expect(home).toContain('className="app-home-top-logo"')
  })
})
