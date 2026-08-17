import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.10.6 round summary export fine polish", () => {
  it("keeps calendar-style match metadata without a finished-state badge", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")
    const image = await readFile("src/lib/roundSummaryImage.ts", "utf8")

    expect(page).toContain('getScheduleLocationDisplayText(location)')
    expect(page).toContain('meta: formatRoundExportMatchMeta(match.scheduledAt, match.location)')
    expect(image).toContain('drawText(context, result.meta ?? "Fecha y lugar pendientes"')
    expect(image).not.toContain('drawText(context, (result.statusLabel ?? "Pendiente").toUpperCase()')
    expect(image).not.toContain('statusLabel?: string')
  })

  it("keeps scores out of black chips, moves MVP into highlights and trims the footer whitespace", async () => {
    const image = await readFile("src/lib/roundSummaryImage.ts", "utf8")

    expect(image).toContain('variant?: "stat" | "mvp"')
    expect(image).toContain('buildDisplayHighlights(data)')
    expect(image).toContain('color: palette.success')
    expect(image).toContain('const y = canvasHeight - 84')
    expect(image).not.toContain('sectionTitle(context, data.mvp.title')
  })
})
