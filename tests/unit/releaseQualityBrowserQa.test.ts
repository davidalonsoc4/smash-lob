import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("release quality browser QA", () => {
  it("runs authenticated accessibility and visuals per screen", async () => {
    const source = await readFile("tests/e2e/authenticated-screens.spec.ts", "utf8")

    expect(source).toContain("for (const screen of screens)")
    expect(source).toContain("@a11y authenticated ${screen.name} has no serious Axe violations")
    expect(source).toContain("@visual authenticated ${screen.name} remains stable")
    expect(source).not.toContain("@a11y authenticated screens have no serious Axe violations")
    expect(source).not.toContain("@visual authenticated screens remain stable")
  })

  it("keeps public accessibility and visual baselines independently targetable", async () => {
    const source = await readFile("tests/e2e/public-access.spec.ts", "utf8")

    expect(source).toContain("@a11y ${screen.name} has no serious Axe violations")
    expect(source).toContain('@visual anonymous home remains stable')
    expect(source).toContain('@visual authentication error remains stable')
  })
  it("keeps inactive bottom navigation labels on the accessible text tier", async () => {
    const bottomNav = await readFile("src/components/layout/BottomNav.tsx", "utf8")
    const globals = await readFile("src/app/globals.css", "utf8")

    expect(bottomNav).toContain("app-bottom-nav-item")
    expect(bottomNav).toContain("text-neutral-600")
    expect(bottomNav).not.toContain("app-bottom-nav-item flex flex-col items-center justify-center bg-transparent text-center font-black text-neutral-500")
    expect(globals).toContain(".app-bottom-nav-item {\n  color: #525252;")
    expect(globals).toContain("html.colorful .app-bottom-nav-item {\n  color: var(--colorful-text-600) !important;")
  })

})
