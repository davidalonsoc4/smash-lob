import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

describe("v1.15.4 account capability separation", () => {
  it("keeps create-league visible in player experience mode", async () => {
    const source = await readFile("src/app/settings/page.tsx", "utf8")
    expect(source).toContain("const canCreateLeaguesInCurrentView = canCreateLeagues")
    expect(source).not.toContain("canCreateLeagues && canAccessAdmin")
  })
})
