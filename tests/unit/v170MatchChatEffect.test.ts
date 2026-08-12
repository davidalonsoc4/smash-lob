import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.7.0 match chat polling effect", () => {
  it("defers the initial fetch instead of calling a state-updating loader synchronously in the effect", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("const initialTimer = window.setTimeout")
    expect(page).toContain("void load()")
    expect(page).toContain("}, 0)")
    expect(page).toContain("const pollingTimer = window.setInterval")
    expect(page).toContain("2500")
    expect(page).toContain("if (!document.hidden) void load()")
    expect(page).toContain("window.clearTimeout(initialTimer)")
    expect(page).toContain("window.clearInterval(pollingTimer)")
    expect(page).not.toContain("useEffect(() => { void load();")
  })
})
