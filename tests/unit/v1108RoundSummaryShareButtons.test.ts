import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.10.8 round summary actions", () => {
  it("opens one floating preview before exposing share and download", async () => {
    const source = await readFile("src/components/round/RoundSummaryShareButton.tsx", "utf8")
    const modal = await readFile("src/components/images/GeneratedImagePreviewModal.tsx", "utf8")

    expect(source).toContain('tx("Ver imagen")')
    expect(source).toContain("data-round-summary-preview")
    expect(source).toContain("<GeneratedImagePreviewModal")
    expect(modal).toContain('tx("Descargar")')
    expect(modal).toContain('tx("Compartir")')
  })

  it("uses the real round image generator and the previewed blob for both actions", async () => {
    const source = await readFile("src/components/round/RoundSummaryShareButton.tsx", "utf8")
    expect(source).toContain("createRoundSummaryImage(data)")
    expect(source).toContain("navigator.canShare?.({ files: [file] })")
    expect(source).toContain("downloadRoundSummaryImage(previewBlob, filename)")
  })
})
