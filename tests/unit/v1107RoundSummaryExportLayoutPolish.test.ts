import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.10.7 round summary export layout polish", () => {
  it("renders player avatars inside round result cards and keeps them compact", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")
    const image = await readFile("src/lib/roundSummaryImage.ts", "utf8")

    expect(page).toContain('function teamImagePeople(')
    expect(page).toContain('teamA: teamImagePeople(match.teamA, players)')
    expect(page).toContain('teamB: teamImagePeople(match.teamB, players)')
    expect(image).toContain('const avatarSize = 22')
    expect(image).toContain('drawResultCard(context, result, PADDING + column * (resultCardWidth + GRID_GAP), y + row * (resultHeight() + 12), resultCardWidth, images)')
    expect(image).toContain('return 146')
  })

  it("adds section divider lines, reactive height and the MVP card inside highlights", async () => {
    const image = await readFile("src/lib/roundSummaryImage.ts", "utf8")

    expect(image).toContain('context.fillRect(PADDING + 212, y - 1, CONTENT_WIDTH - 212, 2)')
    expect(image).toContain('return Math.ceil(height)')
    expect(image).not.toContain('return Math.max(1440, Math.ceil(height))')
    expect(image).toContain('if (item.variant === "mvp") {')
    expect(image).toContain('const displayHighlights = buildDisplayHighlights(data)')
  })

  it("lifts the result divider in the season calendar cards", async () => {
    const seasonImages = await readFile("src/lib/seasonExportImages.ts", "utf8")

    expect(seasonImages).toContain('context.fillRect(x + 24, y + 62, width - 48, 1)')
    expect(seasonImages).not.toContain('context.fillRect(x + 24, y + 68, width - 48, 1)')
  })
})
