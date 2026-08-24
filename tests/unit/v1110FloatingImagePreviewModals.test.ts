import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.11.0 floating generated-image previews", () => {
  it("provides one reusable modal with blur, close, download and share", async () => {
    const modal = await read("src/components/images/GeneratedImagePreviewModal.tsx")

    expect(modal).toContain("fixed inset-0 z-[120]")
    expect(modal).toContain("backdrop-blur-sm")
    expect(modal).toContain('aria-label={tx("Cerrar")}')
    expect(modal).toContain('tx("Descargar")')
    expect(modal).toContain('tx("Compartir")')
    expect(modal).toContain('event.key === "Escape"')
  })

  it("uses the shared modal for all generated images outside the media kit", async () => {
    const round = await read("src/components/round/RoundSummaryShareButton.tsx")
    const seasonExports = await read("src/components/statistics/SeasonShareExportsCard.tsx")
    const seasonSummary = await read("src/components/statistics/SeasonSummaryCard.tsx")
    const finance = await read("src/components/season/SeasonFinanceScreen.tsx")

    expect(round).toContain("GeneratedImagePreviewModal")
    expect(seasonExports).toContain("GeneratedImagePreviewModal")
    expect(seasonSummary).toContain("GeneratedImagePreviewModal")
    expect(finance).toContain("data-season-finance-report-preview")
    expect(finance).toContain("data-season-finance-preview-download")
    expect(finance).toContain("data-season-finance-preview-share")
  })

  it("leaves the editable media kit workflow unchanged", async () => {
    const mediaKit = await read("src/app/admin/media-kit/page.tsx")

    expect(mediaKit).toContain("createLeagueMediaKitImage")
    expect(mediaKit).not.toContain("GeneratedImagePreviewModal")
  })

  it("does not keep the old embedded generated preview in migrated flows", async () => {
    const round = await read("src/components/round/RoundSummaryShareButton.tsx")
    const seasonExports = await read("src/components/statistics/SeasonShareExportsCard.tsx")

    expect(round).not.toContain('from "@/components/images/GeneratedImagePreview"')
    expect(seasonExports).not.toContain('from "@/components/images/GeneratedImagePreview"')
  })
})
