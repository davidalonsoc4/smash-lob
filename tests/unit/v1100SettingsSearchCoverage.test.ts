import { describe, expect, it } from "vitest"
import {
  buildSettingsSearchEntries,
  searchSettingsEntries,
} from "@/lib/settingsSearch"

const adminCapabilities = {
  isSpectator: false,
  hasAdminRole: true,
  canAccessAdmin: true,
  canCreateLeague: true,
  canSelfUnlink: true,
  qaEnabled: false,
  isSuperuser: false,
  avatarLabEnabled: false,
  availabilityRecommendationsEnabled: true,
}

describe("v1.10.0 settings search coverage", () => {
  it("finds every new season/admin setting from its natural Spanish terms", () => {
    const entries = buildSettingsSearchEntries("es", adminCapabilities)

    expect(searchSettingsEntries(entries, "inicio programado", "es")[0]?.id).toBe("scheduledStart")
    expect(searchSettingsEntries(entries, "fecha de inicio", "es")[0]?.id).toBe("scheduledStart")
    expect(searchSettingsEntries(entries, "cuenta atrás", "es")[0]?.id).toBe("scheduledStart")
    expect(searchSettingsEntries(entries, "centro de difusión", "es")[0]?.id).toBe("mediaKit")
    expect(searchSettingsEntries(entries, "imagen cuenta atrás", "es")[0]?.id).toBe("mediaKit")
    expect(searchSettingsEntries(entries, "activar inscripción", "es")[0]?.id).toBe("registration")
    expect(searchSettingsEntries(entries, "gastos temporada", "es")[0]?.id).toBe("seasonFinances")
    expect(searchSettingsEntries(entries, "saldo", "es")[0]?.id).toBe("seasonFinances")
    expect(searchSettingsEntries(entries, "sin inscripción", "es")[0]?.id).toBe("registration")
    expect(searchSettingsEntries(entries, "vista admin", "es")[0]?.id).toBe("adminView")
    expect(searchSettingsEntries(entries, "foto perfil", "es").some((entry) => entry.id === "account")).toBe(true)
  })

  it("finds superadmin competitive-player images directly", () => {
    const entries = buildSettingsSearchEntries("es", {
      ...adminCapabilities,
      isSuperuser: true,
    })

    expect(searchSettingsEntries(entries, "imagen competitiva", "es")[0]?.id).toBe(
      "competitivePlayerImages",
    )
  })

  it("keeps the new searchable settings translated in all supported locales", () => {
    for (const locale of ["es", "en", "eu"] as const) {
      const entries = buildSettingsSearchEntries(locale, {
        ...adminCapabilities,
        isSuperuser: true,
      })

      expect(entries.some((entry) => entry.id === "scheduledStart")).toBe(true)
      expect(entries.some((entry) => entry.id === "registration")).toBe(true)
      expect(entries.some((entry) => entry.id === "seasonFinances")).toBe(true)
      expect(entries.some((entry) => entry.id === "mediaKit")).toBe(true)
      expect(entries.some((entry) => entry.id === "competitivePlayerImages")).toBe(true)
    }
  })
})
