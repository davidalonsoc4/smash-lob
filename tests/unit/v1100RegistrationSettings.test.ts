import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.0 pending-season registration settings", () => {
  it("lets admins enable or disable registration before the season starts", async () => {
    const adminPage = await read("src/app/admin/season/page.tsx")

    expect(adminPage).toContain('id="inscripcion"')
    expect(adminPage).toContain("<RegistrationFeeSettingsPanel")
    expect(adminPage).toContain("canToggleEnabled")
    expect(adminPage).toContain("Cobrar inscripción esta temporada")
    expect(adminPage).toContain('type="checkbox"')
    expect(adminPage).toContain("Puedes cambiar esta decisión hasta que la temporada empiece.")
    expect(adminPage).toContain("Precio por jugador")
    expect(adminPage).toContain("Concepto")
  })

  it("preserves registration payment state when toggling the fee", async () => {
    const adminPage = await read("src/app/admin/season/page.tsx")

    expect(adminPage).toContain("...roundSettings.registrationFee")
    expect(adminPage).toContain("enabled: canToggleEnabled")
    expect(adminPage).not.toContain("payments: []")
  })

  it("locks registration enable/disable server-side after the season starts", async () => {
    const route = await read(
      "src/app/api/leagues/[id]/seasons/[seasonId]/settings/route.ts",
    )

    expect(route).toContain('access.season.status !== "upcoming"')
    expect(route).toContain('.select("registration_fee,opening_round_enabled,opening_round_at,opening_round_location")')
    expect(route).toContain("currentRegistrationFee.enabled !== registrationFee.enabled")
    expect(route).toContain("registration_state_locked_after_start")
  })
})
