import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { describe, expect, it } from "vitest"
async function walk(dir: string): Promise<string[]> { const entries = await readdir(dir, { withFileTypes: true }); const out: string[] = []; for (const entry of entries) { const file = path.join(dir, entry.name); if (entry.isDirectory()) out.push(...await walk(file)); else if (/\.(ts|tsx)$/.test(entry.name)) out.push(file) } return out }
describe("v1.8.0 date and player-name contracts", () => {
  it("uses ellipsis instead of wrapping semantic player names", async () => { const css = await readFile("src/app/globals.css", "utf8"); expect(css).toContain("text-overflow: ellipsis"); expect(css).toContain("white-space: nowrap"); const ranking = await readFile("src/components/ranking/RankingTable.tsx", "utf8"); expect(ranking).not.toContain("[overflow-wrap:anywhere]") })
  it("includes year in every visible day/month formatter except the opening poster", async () => {
    const misses: string[] = []
    for (const file of await walk("src")) {
      const source = await readFile(file, "utf8")
      const normalizedFile = file.replaceAll("\\", "/")
      const openingFormatterStart = source.indexOf("function openingDateLabels")
      const openingFormatterEnd = source.indexOf("type MatchdayDraft")
      for (const pattern of [/(?:new Intl\.DateTimeFormat\([^,]+,\s*|toLocaleDateString\([^,]+,\s*)\{([\s\S]*?)\}\)/g, /toLocaleString\([^,]+,\s*\{([\s\S]*?)\}\)/g]) {
        for (const match of source.matchAll(pattern)) {
          const body = match[1]
          const isOpeningPosterDate = normalizedFile === "src/app/admin/media-kit/page.tsx"
            && openingFormatterStart >= 0
            && (match.index ?? -1) >= openingFormatterStart
            && (match.index ?? -1) < openingFormatterEnd
          if (body.includes("day:") && body.includes("month:") && !body.includes("year:") && !isOpeningPosterDate) {
            misses.push(normalizedFile)
          }
        }
      }
    }
    expect([...new Set(misses)], misses.join("\n")).toEqual([])
  })
})
