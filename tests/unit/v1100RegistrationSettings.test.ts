import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.0 pending-season registration settings", () => {
  it("lets admins enable or disable registration before the season starts", async () => {
    const adminPage = await read("src/app/admin/season/page.tsx")
    const rulesPanel = await read("src/components/admin/season/SeasonRulesSettings.tsx")
    const source = `${adminPage}\n${rulesPanel}`

    expect(adminPage).toContain('id="inscripcion"')
    expect(adminPage).toContain("<RegistrationFeeSettingsPanel")
    expect(adminPage).toContain("canToggleEnabled")
    expect(source).toContain("Cobrar inscripción esta temporada")
    expect(source).toContain('type="checkbox"')
    expect(source).toContain("Puedes cambiar esta decisión hasta que la temporada empiece.")
    expect(source).toContain("Precio por jugador")
    expect(source).toContain("Concepto")
  })

  it("preserves registration payment state when toggling the fee", async () => {
    const adminPage = await read("src/app/admin/season/page.tsx")
    const rulesPanel = await read("src/components/admin/season/SeasonRulesSettings.tsx")
    const source = `${adminPage}\n${rulesPanel}`

    expect(source).toContain("...roundSettings.registrationFee")
    expect(source).toContain("enabled: canToggleEnabled")
    expect(source).not.toContain("payments: []")
  })

  it("locks registration enable/disable server-side after the season starts", async () => {
    const route = await read(
      "src/app/api/leagues/[id]/seasons/[seasonId]/settings/route.ts",
    )

    expect(route).toContain('access.season.status !== "upcoming"')
    expect(route).toContain('.select("registration_fee,opening_round_enabled,opening_round_at,opening_round_location,scheduled_start_at")')
    expect(route).toContain("currentRegistrationFee.enabled !== registrationFee.enabled")
    expect(route).toContain("registration_state_locked_after_start")
  })

  it("allows unrelated settings changes while preserving a past start date on an active season", async () => {
    const route = await read(
      "src/app/api/leagues/[id]/seasons/[seasonId]/settings/route.ts",
    )

    expect(route).toContain('access.season.status === "upcoming"')
    expect(route).toContain("hasScheduledStartChanged(currentScheduledStartAt, scheduledStartAt)")
    expect(route).toContain("scheduled_start_locked_after_start")
  })
})
