import { describe, expect, it } from "vitest"
import { buildLogoAccentPalette } from "@/lib/logoAccentPalette"

function pixels(colors: Array<[number, number, number, number?]>) {
  return new Uint8ClampedArray(colors.flatMap(([red, green, blue, alpha = 255]) => [red, green, blue, alpha]))
}

describe("logo accent palette", () => {
  it("prioritizes the dominant logo color and derives four distinct suggestions", () => {
    const source = pixels([
      ...Array.from({ length: 80 }, () => [83, 180, 1, 255] as [number, number, number, number]),
      ...Array.from({ length: 20 }, () => [30, 90, 210, 255] as [number, number, number, number]),
      ...Array.from({ length: 20 }, () => [220, 50, 40, 20] as [number, number, number, number]),
    ])

    const palette = buildLogoAccentPalette(source)
    const dominant = palette[0].slice(1).match(/.{2}/g)?.map((value) => Number.parseInt(value, 16)) ?? []

    expect(palette).toHaveLength(4)
    expect(new Set(palette).size).toBe(4)
    expect(dominant[1]).toBeGreaterThan(dominant[0])
    expect(dominant[1]).toBeGreaterThan(dominant[2])
  })

  it("ignores transparent, white, black and grayscale pixels", () => {
    expect(buildLogoAccentPalette(pixels([
      [255, 255, 255],
      [0, 0, 0],
      [120, 120, 120],
      [83, 180, 1, 20],
    ]))).toEqual([])
  })
})
