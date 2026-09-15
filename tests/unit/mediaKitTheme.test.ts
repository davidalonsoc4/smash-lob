import { describe, expect, it } from "vitest"
import { MEDIA_KIT_ACCENT_OPTIONS, normalizeMediaKitAccentColor } from "@/lib/mediaKitTheme"

describe("Media Kit shared theme", () => {
  it("keeps the original Media Kit preset palette", () => {
    expect(MEDIA_KIT_ACCENT_OPTIONS).toEqual(["#d7a544", "#53B401", "#bb9448", "#d4643c", "#3d9d86", "#477bd1", "#8b5fc0"])
  })

  it("normalizes shared accent colors", () => {
    expect(normalizeMediaKitAccentColor("#53b401")).toBe("#53B401")
    expect(normalizeMediaKitAccentColor("invalid")).toBe("#D7A544")
  })
})
