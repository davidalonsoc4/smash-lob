import { describe, expect, it } from "vitest"
import { buildSettingsSearchEntries } from "@/lib/settingsSearch"

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
