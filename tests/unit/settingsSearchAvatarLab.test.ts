import { describe, expect, it } from "vitest"
import { buildSettingsSearchEntries, searchSettingsEntries } from "@/lib/settingsSearch"

const baseCapabilities = {
  isSpectator: false,
  hasAdminRole: false,
  canAccessAdmin: false,
  canCreateLeague: false,
  canSelfUnlink: false,
  qaEnabled: false,
  isSuperuser: false,
}

describe("Avatar Lab settings search isolation", () => {
  it("finds shared tournament audio preferences for players and spectators in all languages", () => {
    for (const locale of ["es", "en", "eu"] as const) for (const isSpectator of [true, false]) {
      const entries = buildSettingsSearchEntries(locale, { ...baseCapabilities, isSpectator, avatarLabEnabled: false })
      expect(entries.find((entry) => entry.id === "sounds")?.href).toBe("/settings/sounds")
      expect(searchSettingsEntries(entries, locale === "es" ? "sonido torneos" : locale === "en" ? "tournament sound" : "soinua", locale).some((entry) => entry.id === "sounds")).toBe(true)
    }
  })
  it("omits Avatar Lab when the environment capability is disabled", () => {
    const entries = buildSettingsSearchEntries("es", {
      ...baseCapabilities,
      avatarLabEnabled: false,
    })

    expect(entries.some((entry) => entry.id === "avatarLab")).toBe(false)
    expect(entries.some((entry) => entry.href === "/experimental/avatar-lab")).toBe(false)
  })

  it("includes Avatar Lab in PRE", () => {
    const entries = buildSettingsSearchEntries("es", {
      ...baseCapabilities,
      avatarLabEnabled: true,
    })

    expect(entries.some((entry) => entry.id === "avatarLab")).toBe(true)
  })
})
