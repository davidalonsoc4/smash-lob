import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("Avatar Lab dependency cleanup", () => {
  it("keeps only the dependencies required by the two viable editors", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8"))
    const lock = await readFile("package-lock.json", "utf8")
    expect(packageJson.version).toBe("1.2.7")
    expect(packageJson.dependencies).not.toHaveProperty("@avatune/react")
    expect(packageJson.dependencies).not.toHaveProperty("@avatune/pacovqzz-theme")
    expect(packageJson.dependencies).not.toHaveProperty("react-notion-avatar")
    expect(lock).not.toContain('node_modules/@avatune/')
    expect(lock).not.toContain('node_modules/react-notion-avatar')
  })

  it("uses sanitized and cached server renderers", async () => {
    const bigSmile = await readFile("src/app/api/experimental/avatar-lab/dicebear-big-smile/route.ts", "utf8")
    const notion = await readFile("src/app/api/experimental/avatar-lab/notion-avatar/route.ts", "utf8")
    for (const route of [bigSmile, notion]) {
      expect(route).toContain("sanitizeSvg")
      expect(route).toContain("Cache-Control")
      expect(route).toContain("X-Content-Type-Options")
    }
    expect(notion).toContain("raw.githubusercontent.com/Mayandev/notion-avatar")
    expect(notion).not.toContain("/is,")
    expect(notion).toContain("[\\s\\S]*?<svg")
  })

  it("avoids synchronous editor state resets inside effects", async () => {
    const bigSmile = await readFile(
      "src/features/avatar-lab/components/BigSmileEditorClient.tsx",
      "utf8",
    )
    const notion = await readFile(
      "src/features/avatar-lab/components/NotionAvatarEditorClient.tsx",
      "utf8",
    )

    expect(bigSmile).toContain("previewResult?.url === avatarUrl")
    expect(notion).toContain("previewResult?.key === previewKey")
    expect(bigSmile).not.toContain('setPreviewState("loading")')
    expect(notion).not.toContain('setPreviewState("loading")')
    expect(notion).toContain("onClick={() => selectPart(part)}")
  })
})
