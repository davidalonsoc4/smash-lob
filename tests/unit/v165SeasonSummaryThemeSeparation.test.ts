import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

describe("v1.6.5 season summary light/dark separation", () => {
  it("preserves the original light award palette without dark utilities in JSX", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")
    const start = home.indexOf("function SeasonSummaryAwardRow(")
    const end = home.indexOf("\nexport default function Home", start)
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThan(start)
    const award = home.slice(start, end)

    expect(award).toContain("border-amber-200 bg-gradient-to-r from-amber-100/80 via-amber-50 to-white")
    expect(award).toContain("border-violet-200 bg-gradient-to-r from-violet-100/75 via-violet-50 to-white")
    expect(award).toContain("bg-amber-200 text-amber-900 ring-amber-300")
    expect(award).toContain("bg-violet-200 text-violet-900 ring-violet-300")
    expect(award).not.toMatch(/\bdark:/)
  })

  it("isolates the dark redesign under html.dark semantic selectors", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")
    const globals = await readFile("src/app/globals.css", "utf8")

    for (const hook of [
      "season-summary-panel",
      "season-summary-award-row",
      "season-summary-award-name",
      "season-summary-award-badge",
      "season-summary-actions",
      "season-summary-action-secondary",
      "season-summary-action-primary",
    ]) {
      expect(home).toContain(hook)
    }

    expect(globals).toContain("/* v1.6.5 season-summary dark-only contrast */")
    expect(globals).toContain('html.dark .season-summary-award-row[data-season-summary-award="winner"]')
    expect(globals).toContain('html.dark .season-summary-award-row[data-season-summary-award="mvp"]')
    expect(globals).toContain("html.dark .season-summary-award-name{color:#fff!important}")
    expect(globals).toContain("html.dark .season-summary-action-secondary")
    expect(globals).toContain("html.dark .season-summary-action-primary")
  })
})
