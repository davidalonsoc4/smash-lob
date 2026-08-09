import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import {
  APP_FONT_SIZE_ADJUSTMENTS,
  APP_FONT_SIZE_CHANGE_EVENT,
  APP_FONT_SIZE_STORAGE_KEY,
  getServerAppFontSize,
  normalizeAppFontSize,
} from "@/lib/fontSizePreference"

describe("font size preference", () => {
  it("offers three bounded global font sizes with a stable device key", () => {
    expect(APP_FONT_SIZE_STORAGE_KEY).toBe("smash-lob-font-size")
    expect(APP_FONT_SIZE_CHANGE_EVENT).toBe("smash-lob-font-size-change")
    expect(getServerAppFontSize()).toBe("normal")
    expect(APP_FONT_SIZE_ADJUSTMENTS).toEqual({
      small: "-2px",
      normal: "0px",
      large: "2px",
    })
    expect(normalizeAppFontSize("small")).toBe("small")
    expect(normalizeAppFontSize("large")).toBe("large")
    expect(normalizeAppFontSize("unexpected")).toBe("normal")
    expect(normalizeAppFontSize(null)).toBe("normal")
  })

  it("keeps the control compact and reapplies the saved value globally", async () => {
    const [appearance, appShell, globals] = await Promise.all([
      readFile("src/app/settings/appearance/page.tsx", "utf8"),
      readFile("src/components/layout/AppShell.tsx", "utf8"),
      readFile("src/app/globals.css", "utf8"),
    ])

    expect(appearance).toContain('glyph: "A−"')
    expect(appearance).toContain('glyph: "A"')
    expect(appearance).toContain('glyph: "A+"')
    expect(appearance).toContain("<FontSizeControl")
    expect(appearance).toContain("useSyncExternalStore(")
    expect(appearance).toContain("subscribeAppFontSize")
    expect(appearance).not.toContain("setFontSize(stored)")
    expect(appShell).toContain("applyAppFontSize(readStoredAppFontSize())")
    expect(globals).toContain("font-size: calc(16px + var(--app-font-size-adjust))")
    expect(globals).toContain(".app-bottom-nav-item")
    expect(globals).toContain("font-size: 11px")
    expect(globals).toContain("width: 16px")
  })
})
