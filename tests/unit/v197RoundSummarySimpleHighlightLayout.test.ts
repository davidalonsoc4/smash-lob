import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.9.7 simple round highlight layout", () => {
  it("keeps the highlight type as its own title and puts protagonist plus comparison on the second row", async () => {
    const page = await read("src/app/round/[id]/page.tsx")

    expect(page).toContain('type-caption font-black uppercase tracking-[0.12em] text-neutral-500')
    expect(page).toContain('{highlight.eyebrow}')
    expect(page).toContain('mt-1 flex min-w-0 items-center justify-between gap-3')
    expect(page).toContain('{highlight.title}')
    expect(page).toContain('{highlight.comparison.leftValue}')
    expect(page).toContain('{highlight.comparison.centerValue}')
    expect(page).toContain('{highlight.comparison.rightValue}')
    expect(page).not.toContain('<span className="mx-1.5 text-neutral-300">·</span>')
  })

  it("leaves match-based highlights on their existing detailed layout", async () => {
    const page = await read("src/app/round/[id]/page.tsx")

    expect(page).toContain('if (highlightedMatch)')
    expect(page).toContain('href={`/match/${highlightedMatch.id}`}')
    expect(page).toContain('grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]')
  })
})
