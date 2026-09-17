import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("safe PWA update behavior", () => {
  it("applies a waiting worker silently after the safe idle check", async () => {
    const source = await readFile("src/components/layout/PwaUpdatePrompt.tsx", "utf8")

    expect(source).toContain("PWA_UPDATE_IDLE_MS")
    expect(source).toContain("PWA_UPDATE_RECHECK_MS")
    expect(source).toContain("hasEditableFocus()")
    expect(source).toContain("hasOpenDialog()")
    expect(source).toContain("document.visibilityState === \"visible\"")
    expect(source).toContain("navigator.serviceWorker.register(\"/sw.js\")")
    expect(source).not.toContain("Actualizar ahora")
    expect(source).not.toContain("sessionStorage")
  })
})
