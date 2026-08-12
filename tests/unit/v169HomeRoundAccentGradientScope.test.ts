import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.6.9 HOME round accent gradient scope", () => {
  it("does not depend on the AppCard-scoped accent variable", async () => {
    const css = await readFile("src/app/globals.css", "utf8")
    const start = css.indexOf(
      ".home-leader-round-grid > :nth-child(2).app-stat-card::before",
    )
    expect(start).toBeGreaterThanOrEqual(0)

    const block = css.slice(start, start + 1800)
    expect(block).not.toContain(
      "background: var(--app-card-accent-gradient)",
    )
    expect(block).toContain("#262626 0%")
    expect(block).toContain("#dbe6f3 0%")
    expect(block).toContain("var(--colorful-primary)")
    expect(block).toContain("var(--colorful-warm)")
  })

  it("keeps the accent scoped to the JORNADAS slot", async () => {
    const [home, css] = await Promise.all([
      readFile("src/app/page.tsx", "utf8"),
      readFile("src/app/globals.css", "utf8"),
    ])

    expect(home).toContain(
      'className="home-leader-round-grid grid grid-cols-2 gap-3"',
    )
    expect(css).toContain(
      ".home-leader-round-grid > :nth-child(2) > .app-stat-card::before",
    )
  })
})
