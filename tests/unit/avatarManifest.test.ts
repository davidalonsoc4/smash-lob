import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

type Manifest = {
  manifestVersion: number
  recipeSchemaVersion: number
  worlds: Array<{ id: string; available: boolean; rendererId: string | null }>
  masterTemplate: { viewBox: number[]; gridUnit: number; centerAxisX: number; groundLineY: number }
  assets: Array<{ id: string; category: string; worldVariants: Record<string, object | null> }>
}

describe("avatar asset manifest", () => {
  it("declares two worlds without illustrated fallback assets", async () => {
    const manifest = JSON.parse(await readFile("public/avatars/shared/manifest.json", "utf8")) as Manifest

    expect(manifest.manifestVersion).toBe(1)
    expect(manifest.recipeSchemaVersion).toBe(1)
    expect(manifest.worlds).toEqual([
      { id: "pixel_chibi", available: true, rendererId: "pixel-chibi-v1" },
      { id: "chibi_illustrated", available: false, rendererId: null },
    ])
    expect(manifest.masterTemplate).toMatchObject({ viewBox: [0, 0, 192, 240], gridUnit: 2, centerAxisX: 96, groundLineY: 232 })

    const keys = manifest.assets.map((asset) => `${asset.category}.${asset.id}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(manifest.assets.every((asset) => asset.worldVariants.pixel_chibi)).toBe(true)
    expect(manifest.assets.every((asset) => asset.worldVariants.chibi_illustrated === null)).toBe(true)
  })

  it("covers all minimum modular categories", async () => {
    const manifest = JSON.parse(await readFile("public/avatars/shared/manifest.json", "utf8")) as Manifest
    const categories = new Set(manifest.assets.map((asset) => asset.category))
    for (const category of ["body", "head", "hair", "beard", "eyes", "eyebrows", "cap", "headband", "shirt", "shorts", "sleeve", "wristband", "socks", "shoes", "racket"]) {
      expect(categories.has(category)).toBe(true)
    }
  })
})
