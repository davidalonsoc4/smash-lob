import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.7.0 type contracts", () => {
  it("uses the real BackButton contract through the shared match chat frame", async () => {
    const [page, shared] = await Promise.all([
      readFile("src/app/match/[id]/chat/page.tsx", "utf8"),
      readFile("src/components/match/chat/MatchChatShared.tsx", "utf8"),
    ])
    expect(page).toContain('backHref={`/match/${id}`}')
    expect(shared).toContain('<BackButton fallbackHref={backHref} label={tx("Volver")} />')
    expect(shared).not.toContain("<BackButton href=")
  })

  it("does not use the unsupported feature changelog category", async () => {
    const changelog = await readFile("src/lib/changelog.ts", "utf8")
    const start = changelog.indexOf('{ version: "v1.7.0"')
    const end = changelog.indexOf(" },", start)
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThan(start)
    const release = changelog.slice(start, end + 2)
    expect(release).toContain("category:")
    expect(release).not.toContain('category: "feature"')
  })
})
