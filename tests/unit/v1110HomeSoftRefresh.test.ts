import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.11.0 HOME soft refresh", () => {
  it("keeps the top-left HOME control focused on league navigation", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")

    expect(home).toContain('<Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500">')
    expect(home).toContain('{tx("Mis ligas")}')
  })

  it("refreshes MVP state on demand instead of only on provider mount", async () => {
    const provider = await readFile("src/context/MvpProvider.tsx", "utf8")

    expect(provider).toContain("refreshMvpData: () => Promise<boolean>")
    expect(provider).toContain("const refreshMvpData = useCallback(async () =>")
    expect(provider).toContain("fetchSupabaseMvpData(supabaseLeagueIds)")
  })

  it("links the HOME control to the league list", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")

    expect(home).toContain('<Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500">')
    expect(home).toContain('{tx("Mis ligas")}')
  })
})
