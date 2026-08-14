import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.10 direct date proposal UX", () => {
  it("selects proposal times directly without the old add-and-list step", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("toggleDateOption")
    expect(page).toContain("selectManualDateOption")
    expect(page).toContain("aria-pressed={chosen}")
    expect(page).toContain("selectedCount")
    expect(page).toContain("Proponer esta fecha")
    expect(page).toContain("Proponer ${dateOptions.length} fechas")
    expect(page).not.toContain('>Añadir</button>')
    expect(page).not.toContain('aria-label="Quitar fecha"')
    expect(page).toContain("current.length < 4")
  })

  it("makes the send glyph larger and optically shifts it left without resizing its button", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950')
    expect(page).toContain('className="h-[23px] w-[23px]"')
    expect(page).toContain('rotate(25deg)')
  })
})
