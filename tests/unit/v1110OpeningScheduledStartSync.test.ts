import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { formatNextScheduledStartForInput } from "@/lib/seasonScheduling"

const read = (path: string) => readFile(path, "utf8")

describe("v1.11.0 opening round and scheduled start synchronization", () => {
  it("uses scheduled start as the single opening datetime when both features are enabled", async () => {
    const [admin, settingsApi, createApi, mutations, scheduledPanel, spanish] = await Promise.all([
      read("src/app/admin/season/page.tsx"),
      read("src/app/api/leagues/[id]/seasons/[seasonId]/settings/route.ts"),
      read("src/app/api/leagues/[id]/seasons/route.ts"),
      read("src/lib/serverSeasonMutations.ts"),
      read("src/components/season/ScheduledStartSettingsPanel.tsx"),
      read("src/i18n/locales/es.ts"),
    ])

    expect(admin).toContain("const effectiveOpeningRoundIso = scheduledStartIso ?? openingRoundIso")
    expect(admin).toContain("const effectiveOpeningRoundIso = scheduledOpeningRoundIso ?? openingRoundIso")
    expect(admin).toContain("roundSettings.scheduledStartAt ? (")
    expect(admin).toContain("scheduledStartAt ? (")
    expect(admin).toContain("t.adminSeason.openingRoundScheduledStartHelp")
    expect(admin).toContain("openingRoundAt: openingRoundEnabled ? effectiveOpeningRoundIso : null")

    expect(settingsApi).toContain(
      "openingRoundEnabled && scheduledStartAt ? scheduledStartAt : openingRoundAt",
    )
    expect(settingsApi).toContain(
      "openingRoundAt: openingRoundEnabled ? effectiveOpeningRoundAt : null",
    )
    expect(createApi).toContain(
      "openingRoundEnabled && scheduledStartAt ? scheduledStartAt : openingRoundAt",
    )
    expect(createApi).toContain(
      "openingRoundAt: openingRoundEnabled ? effectiveOpeningRoundAt : null",
    )

    expect(mutations).toContain("scheduled_start_at: settings.scheduledStartAt")
    expect(mutations).not.toContain(
      'scheduled_start_at:\n      seasonStatus === "upcoming" && settings.openingRoundEnabled',
    )
    expect(scheduledPanel).toContain("roundSettings.openingRoundEnabled && scheduledStartIso")
    expect(spanish).toContain(
      "la Jornada de Apertura usará automáticamente esa misma fecha y hora",
    )
  })

  it("keeps standalone opening datetimes on a full hour by default", async () => {
    const admin = await read("src/app/admin/season/page.tsx")

    expect(formatNextScheduledStartForInput(new Date("2026-08-24T19:01:24.000Z"))).toBe(
      "2026-08-24T22:00",
    )
    expect(admin).toContain("if (checked && !roundSettings.scheduledStartAt && !openingRoundAt)")
    expect(admin).toContain("setOpeningRoundAt(formatNextScheduledStartForInput())")
    expect(admin.match(/step=\{3600\}/g)?.length ?? 0).toBeGreaterThanOrEqual(3)
  })
})
