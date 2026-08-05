import { access, readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

async function exists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

describe("Avatar Lab PRE isolation", () => {
  it("keeps the complete route in PRE and out of search engines", async () => {
    const layout = await readFile("src/app/experimental/avatar-lab/layout.tsx", "utf8")
    expect(layout).toContain("isPreproductionApp()")
    expect(layout).toContain("notFound()")
    expect(layout).toContain("index: false")
    expect(layout).toContain("follow: false")
  })

  it("uses the normal authenticated app shell", async () => {
    const boundary = await readFile("src/components/layout/AppRouteBoundary.tsx", "utf8")
    expect(boundary).toContain("<AuthGate>")
    expect(boundary).toContain("<AppShell>{children}</AppShell>")
    expect(boundary).not.toContain('pathname.startsWith("/experimental/avatar-lab")')
  })

  it("exposes exactly the two viable editors", async () => {
    const hub = await readFile("src/features/avatar-lab/components/AvatarLabClient.tsx", "utf8")
    expect(hub).toContain('/experimental/avatar-lab/big-smile')
    expect(hub).toContain('/experimental/avatar-lab/notion-avatar')
    expect(hub).not.toContain("ready-player-me")
    expect(hub).not.toContain("Pacovqzz")
  })

  it("adds the laboratory to Settings for players and spectators", async () => {
    const settings = await readFile("src/app/settings/page.tsx", "utf8")
    const search = await readFile("src/lib/settingsSearch.ts", "utf8")
    expect(settings.match(/href="\/experimental\/avatar-lab"/g)).toHaveLength(2)
    expect(search).toContain('avatarLab: "/experimental/avatar-lab"')
    expect(search.match(/"avatarLab"/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it("keeps the editors mobile-first and browser-only", async () => {
    const files = [
      "src/features/avatar-lab/components/AvatarLabClient.tsx",
      "src/features/avatar-lab/components/BigSmileEditorClient.tsx",
      "src/features/avatar-lab/components/NotionAvatarEditorClient.tsx",
    ]
    for (const file of files) {
      const source = await readFile(file, "utf8")
      expect(source).toContain("compact-page")
      expect(source).toContain("env(safe-area-inset-bottom)")
      expect(source.toLowerCase()).not.toContain("supabase")
      expect(source).not.toContain("fetch(")
    }

    const notion = await readFile(
      "src/features/avatar-lab/components/NotionAvatarEditorClient.tsx",
      "utf8",
    )
    expect(notion).toContain("h-[calc(100dvh-8rem)]")
    expect(notion).toContain("min-h-[510px]")
    expect(notion).toContain("max-h-[760px]")
  })

  it("removes discarded worlds and their assets", async () => {
    await expect(exists("docs/avatars")).resolves.toBe(false)
    await expect(exists("public/avatars")).resolves.toBe(false)
    await expect(exists("public/experimental")).resolves.toBe(false)
    await expect(exists("src/app/experimental/avatar-lab/pacovqzz")).resolves.toBe(false)
    await expect(exists("src/app/experimental/avatar-lab/ready-player-me")).resolves.toBe(false)
  })
})
