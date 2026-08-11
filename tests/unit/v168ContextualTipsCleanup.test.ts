import { access, readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

async function exists(path: string) {
  try { await access(path); return true } catch { return false }
}

describe("v1.6.8 legacy contextual help cleanup", () => {
  it("removes the old ContextualTip surfaces", async () => {
    for (const file of [
      "src/app/settings/page.tsx",
      "src/app/match/[id]/page.tsx",
      "src/app/admin/season/page.tsx",
      "src/app/availability/page.tsx",
    ]) {
      expect(await readFile(file, "utf8")).not.toContain("<ContextualTip")
    }
  })

  it("keeps GuidedTourLibrary and removes the obsolete tip reset", async () => {
    const help = await readFile("src/app/help/page.tsx", "utf8")
    expect(help).toContain("<GuidedTourLibrary")
    expect(help).not.toContain("<OnboardingTipsReset")
  })

  it("removes the dead legacy implementation", async () => {
    expect(await exists("src/components/onboarding/ContextualTip.tsx")).toBe(false)
    expect(await exists("src/lib/onboardingTips.ts")).toBe(false)
  })

  it("keeps functional status and warning UI unrelated to contextual tips", async () => {
    const friendly = await readFile("src/app/personal-matches/new/page.tsx", "utf8")
    expect(friendly).toContain("text-amber-700")
    expect(friendly).toContain("bg-red-50")
    expect(friendly).not.toContain("<ContextualTip")
  })
})
