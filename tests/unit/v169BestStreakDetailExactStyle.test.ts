import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.6.9 best streak detail exact style", () => {
  it("uses the neighboring-detail style only on Jornada X – Jornada Y", async () => {
    const panel = await readFile(
      "src/components/player/PlayerStatsPanel.tsx",
      "utf8",
    )

    const marker = panel.indexOf("data-best-streak-round-range")
    expect(marker).toBeGreaterThanOrEqual(0)

    const tagStart = panel.lastIndexOf("<p", marker)
    const tagEnd = panel.indexOf(">", marker)
    const openingTag = panel.slice(tagStart, tagEnd + 1)

    expect(openingTag).toContain(
      'className="mt-1 text-xs text-neutral-500"',
    )
    expect(openingTag).not.toContain("font-semibold")

    // El título "Mejor racha" conserva su peso; no debe confundirse con el detalle.
    expect(panel).toContain(
      '<p className="text-xs font-semibold text-neutral-500">Mejor racha</p>',
    )
  })
})
