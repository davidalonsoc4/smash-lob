import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { buildPostAuthDestination } from "@/lib/authRedirect"
import { normalizeInternalNavigationTarget } from "@/lib/leagueNavigation"

describe("v1.10.3 post-login league entry", () => {
  it("waits for the real league snapshot before showing onboarding", async () => {
    const source = await readFile("src/components/auth/LeagueEntryGate.tsx", "utf8")
    expect(source).toContain("isAccessHydrated")
    expect(source).toContain("return <AppBootSkeleton />")
    expect(source.indexOf("if (!isAccessHydrated")).toBeLessThan(source.indexOf("if (userLeagues.length > 0)"))
  })

  it("separates ordinary login from links to a specific league", () => {
    expect(buildPostAuthDestination("/")).toBe("/leagues")
    expect(normalizeInternalNavigationTarget("/")).toBe("/league/home")
    expect(normalizeInternalNavigationTarget("/match/fixture/chat")).toBe("/match/fixture/chat")
  })

  it("keeps the fallback for direct league routes without league access", async () => {
    const source = await readFile("src/components/auth/LeagueEntryGate.tsx", "utf8")
    expect(source).toContain("if (userLeagues.length > 0)")
    expect(source).toContain("{t.onboarding.title}")
    expect(source).toContain("isAccessInviteRoute")
  })
})
