import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.10.5 season and round export polish", () => {
  it("keeps the season ranking table clipped so the bottom corners stay rounded", async () => {
    const images = await readFile("src/lib/seasonExportImages.ts", "utf8")

    expect(images).toContain('roundedRect(context, PADDING, tableY, CONTENT_WIDTH, tableHeight, 30)')
    expect(images).toContain('context.clip()')
    expect(images).toContain('strokeRoundedRect(context, PADDING, tableY, CONTENT_WIDTH, tableHeight, 30, palette.line)')
  })

  it("reduces the round ranking to players whose position changed", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")
    const image = await readFile("src/lib/roundSummaryImage.ts", "utf8")

    expect(page).toContain('.filter((player) => player.movement !== "—")')
    expect(image).toContain('"No ha habido cambios de posición tras la jornada."')
    expect(image).toContain('const resultCardWidth = (CONTENT_WIDTH - GRID_GAP) / 2')
    expect(image).toContain('const highlightCardWidth = (CONTENT_WIDTH - GRID_GAP) / 2')
    expect(image).toContain('rankingEmptyText?: string | null')
  })
})
