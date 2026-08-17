import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.10.8 round summary actions", () => {
  it("shows share and download side by side", async () => {
    const source = await readFile("src/components/round/RoundSummaryShareButton.tsx", "utf8")
    expect(source).toContain('className="grid grid-cols-2 gap-2"')
    expect(source).toContain('"Compartir resumen"')
    expect(source).toContain('"Descargar resumen"')
  })

  it("uses the real round image generator for both actions", async () => {
    const source = await readFile("src/components/round/RoundSummaryShareButton.tsx", "utf8")
    expect(source).toContain("createRoundSummaryImage(data)")
    expect(source).toContain("navigator.canShare?.({ files: [file] })")
    expect(source).toContain("downloadRoundSummaryImage(await createBlob(), filename)")
  })
})
