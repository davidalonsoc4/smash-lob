import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("Avatar Lab isolation", () => {
  it("gates the route to PRE and prevents indexing", async () => {
    const page = await readFile("src/app/experimental/avatar-lab/page.tsx", "utf8")
    expect(page).toContain("isPreproductionApp()")
    expect(page).toContain("notFound()")
    expect(page).toContain("index: false")
    expect(page).toContain("follow: false")
  })

  it("uses an isolated provider branch without league or match providers", async () => {
    const boundary = await readFile("src/components/layout/AppRouteBoundary.tsx", "utf8")
    const start = boundary.indexOf("if (isAvatarLabRoute)")
    const end = boundary.indexOf("\n\n  return (", start)
    const block = boundary.slice(start, end)
    expect(boundary).toContain('pathname === "/experimental/avatar-lab"')
    expect(block).not.toContain("LeagueAccessProvider")
    expect(block).not.toContain("MatchDataProvider")
    expect(block).not.toContain("AppShell")
  })

  it("uses versioned localStorage and no API or Supabase writes", async () => {
    const storage = await readFile("src/features/avatar-lab/storage.ts", "utf8")
    const client = await readFile("src/features/avatar-lab/components/AvatarLabClient.tsx", "utf8")
    expect(storage).toContain("smash-lob-avatar-lab-recipe-v1")
    expect(storage).toContain("smash-lob-avatar-lab-world-v1")
    expect(client).not.toContain("supabase")
    expect(client).not.toContain("/api/")
    expect(client).not.toContain("fetch(")
  })

  it("keeps the mobile editor within the app phone width and safe areas", async () => {
    const client = await readFile("src/features/avatar-lab/components/AvatarLabClient.tsx", "utf8")
    const preview = await readFile("src/features/avatar-lab/components/AvatarPreview.tsx", "utf8")
    expect(client).toContain("max-w-md")
    expect(client).toContain("env(safe-area-inset-bottom)")
    expect(client).toContain("grid grid-cols-2")
    expect(preview).toContain("aspect-[4/5]")
    expect(preview).toContain("max-w-[360px]")
  })
})
