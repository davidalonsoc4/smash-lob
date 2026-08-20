import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.25 export style homogenization", () => {
  it("aligns season calendar and ranking exports with the season-summary visual language", async () => {
    const source = await read("src/lib/seasonExportImages.ts")

    for (const marker of [
      'background: "#f3f4f2"',
      'const HEADER_HEIGHT = 254',
      'context.setLineDash([10, 16])',
      'const leagueLayout = fitTextLayout({',
      'const seasonLayout = fitTextLayout({',
      'const iconSize = 52',
      'const textBlockWidth = 132',
      'drawText(context, label.toUpperCase()',
    ]) {
      expect(source).toContain(marker)
    }
  })

  it("brings round summary exports onto the same polished base", async () => {
    const source = await read("src/lib/roundSummaryImage.ts")

    for (const marker of [
      'background: "#f3f4f2"',
      'const height = 254',
      'context.setLineDash([10, 16])',
      'const leagueLayout = fitTextLayout({',
      'const seasonLayout = fitTextLayout({',
      'context.shadowColor = "rgba(23, 24, 23, 0.08)"',
      'const iconSize = 52',
      'const textBlockWidth = 132',
    ]) {
      expect(source).toContain(marker)
    }
  })
})
