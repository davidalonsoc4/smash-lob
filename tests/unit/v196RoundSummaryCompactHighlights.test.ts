import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.9.6 compact round highlights and round navigation", () => {
  it("links Jornada X in PARTIDO to the round summary", async () => {
    const page = await read("src/app/match/[id]/page.tsx")

    expect(page).toContain('href={`/round/${match.round}`}')
    expect(page).toContain('aria-label={`Abrir resumen de la jornada ${match.round}`}')
    expect(page).toContain("{t.matches.round} {match.round}")
  })

  it("keeps match highlights detailed and keeps simple highlight content on one row below its title", async () => {
    const page = await read("src/app/round/[id]/page.tsx")

    expect(page).toContain('if (highlightedMatch)')
    expect(page).toContain('grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]')
    expect(page).toContain('type-caption font-black uppercase tracking-[0.12em] text-neutral-500')
    expect(page).toContain('mt-1 flex min-w-0 items-center justify-between gap-3')
    expect(page).toContain('{highlight.eyebrow}')
    expect(page).toContain('{highlight.title}')
    expect(page).toContain('{highlight.comparison.leftValue}')
    expect(page).toContain('{highlight.comparison.centerValue}')
    expect(page).toContain('{highlight.comparison.rightValue}')
  })
})
