import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.9.5 match result score focus", () => {
  it("advances after entering a score but never moves backwards when deleting", async () => {
    const source = await readFile("src/components/match/MatchResultForm.tsx", "utf8")

    expect(source).toContain("if (cleanValue) {")
    expect(source).toContain("focusNextScoreInput(fieldIndex)")
    expect(source).not.toContain("focusPreviousScoreInput")
    expect(source).not.toContain("handleScoreKeyDown")
    expect(source).not.toContain('event.key !== "Backspace"')
    expect(source).not.toContain("onKeyDown={(event) =>")
  })
})
